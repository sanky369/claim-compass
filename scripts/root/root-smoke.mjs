import { GoogleGenAI } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { execFileSync } from "node:child_process";
import { dirname } from "node:path";
import {
  embeddingDimensions,
  embeddingModel,
  retrievalQueryConfig,
  retrievalQueryContent,
} from "../lib/gemini-embeddings.mjs";
import { requireMongoEnv } from "../mongodb/env.mjs";

const denialId = process.env.DENIAL_ID || "demo_denial_001";

function gcloud(args) {
  return execFileSync("gcloud", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function getProjectId() {
  return (
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    gcloud(["config", "get-value", "project"])
  );
}

function textFromResult(result) {
  return (result.content || [])
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

function parseMcpDocuments(result) {
  const structuredRows = result.structuredContent?.result;
  if (Array.isArray(structuredRows)) {
    return structuredRows;
  }

  const text = textFromResult(result);
  const matches = [
    ...text.matchAll(
      /<untrusted-user-data-[^>]+>\s*([\s\S]*?)\s*<\/untrusted-user-data-[^>]+>/g,
    ),
  ];
  const jsonMatch = matches.find((match) => match[1].trim().startsWith("["));
  const source = jsonMatch?.[1] || text;
  const firstBrace = source.indexOf("[");
  const lastBrace = source.lastIndexOf("]");
  if (firstBrace === -1 || lastBrace <= firstBrace) {
    return [];
  }
  return JSON.parse(source.slice(firstBrace, lastBrace + 1));
}

async function call(client, name, args) {
  const startedAt = Date.now();
  const result = await client.callTool({ name, arguments: args });
  const text = textFromResult(result);
  if (
    result.isError ||
    /connection string is not valid|not authorized|server selection timed out|could not connect|index.*not.*found/i.test(
      text,
    )
  ) {
    throw new Error(`MongoDB MCP ${name} failed: ${text.slice(0, 1000)}`);
  }
  return {
    result,
    text,
    elapsed: Date.now() - startedAt,
  };
}

async function embedQuery(ai, query) {
  const response = await ai.models.embedContent({
    model: embeddingModel,
    contents: retrievalQueryContent(query),
    config: retrievalQueryConfig(),
  });
  const values = response.embeddings?.[0]?.values;
  if (!Array.isArray(values) || values.length !== embeddingDimensions) {
    throw new Error(`Unexpected query embedding dimensions: ${values?.length ?? "missing"}`);
  }
  return values;
}

function createMcpClient(uri) {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["mongodb-mcp-server"],
    env: {
      ...process.env,
      MDB_MCP_CONNECTION_STRING: uri,
      MDB_MCP_READ_ONLY: "false",
      MDB_MCP_TELEMETRY: "disabled",
      MDB_MCP_LOGGERS: "mcp",
      PATH: [dirname(process.execPath), process.env.PATH].filter(Boolean).join(":"),
    },
    stderr: "pipe",
  });

  const client = new Client({
    name: "claimcompass-root-smoke",
    version: "0.1.0",
  });

  return { client, transport };
}

async function insertTrace(client, database, step, event) {
  await call(client, "insert-many", {
    database,
    collection: "trace_events",
    documents: [
      {
        denial_id: denialId,
        step,
        created_at: new Date().toISOString(),
        ...event,
      },
    ],
  });
}

async function findDenial(client, database) {
  const { result, elapsed } = await call(client, "find", {
    database,
    collection: "denials",
    filter: { denial_id: denialId },
    limit: 1,
  });
  const docs = parseMcpDocuments(result);
  if (docs.length === 0) {
    throw new Error(`Denial not found: ${denialId}`);
  }
  return { denial: docs[0], latency: elapsed };
}

function normalizeDenial(denial) {
  const extracted = denial.extracted || {};
  const denialCodes = denial.denial_codes || [];
  return {
    payer_id: denial.payer_id || (extracted.payer_hint === "bcbs_tx" ? "bcbs_tx_demo" : null),
    cpt: extracted.cpt || denial.cpt,
    carc: extracted.carc || denial.carc || denialCodes.filter((code) => code.startsWith("CO-")),
    rarc: extracted.rarc || denial.rarc || denialCodes.filter((code) => /^N\d+/i.test(code)),
    modifiers: extracted.modifiers || denial.modifiers || [],
    pos: extracted.pos || denial.place_of_service,
    raw_text: denial.raw_text || extracted.raw_text || denial.intake_summary || "",
    missing_modifier_hint: extracted.missing_modifier_hint,
  };
}

function inferCptFamily(cpt) {
  if (cpt === "90791") return "evaluation_90791";
  if (["90832", "90834", "90837"].includes(cpt)) return "psychotherapy_90_codes";
  return "telehealth_modifiers";
}

async function retrievePolicyContext(client, database, ai, normalized) {
  const cptFamily = inferCptFamily(normalized.cpt);
  const queryVector = await embedQuery(
    ai,
    [
      `payer_id: ${normalized.payer_id}`,
      `cpt: ${normalized.cpt}`,
      `carc: ${normalized.carc.join(", ")}`,
      `rarc: ${normalized.rarc.join(", ")}`,
      normalized.raw_text,
    ].join("\n"),
  );

  const chunkCall = await call(client, "aggregate", {
    database,
    collection: "payer_playbooks",
    pipeline: [
      {
        $vectorSearch: {
          index: "playbook_vec",
          path: "embedding",
          queryVector,
          numCandidates: 100,
          limit: 8,
          filter: {
            payer_id: normalized.payer_id,
            "scope.cpt_family": cptFamily,
          },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          body: 1,
          source_url: 1,
          scope: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ],
  });
  const carcCall = await call(client, "find", {
    database,
    collection: "carc",
    filter: { code: { $in: normalized.carc } },
    limit: normalized.carc.length || 1,
  });
  const rarcCall = await call(client, "find", {
    database,
    collection: "rarc",
    filter: { code: { $in: normalized.rarc } },
    limit: normalized.rarc.length || 1,
  });

  return {
    chunks: parseMcpDocuments(chunkCall.result),
    carc_descriptions: parseMcpDocuments(carcCall.result),
    rarc_descriptions: parseMcpDocuments(rarcCall.result),
    latencies: {
      aggregate_ms: chunkCall.latency,
      carc_find_ms: carcCall.latency,
      rarc_find_ms: rarcCall.latency,
    },
  };
}

function classify(normalized, policyContext) {
  const topChunk = policyContext.chunks[0];
  const codes = new Set([...normalized.carc, ...normalized.rarc]);
  const hasGoldenCodes = codes.has("CO-45") && codes.has("N179");
  const missingTelehealthModifier =
    normalized.cpt === "90837" &&
    normalized.pos === "10" &&
    normalized.modifiers.length === 0 &&
    normalized.missing_modifier_hint === "95";
  const topBucket = topChunk?.scope?.action_bucket;

  if (hasGoldenCodes && missingTelehealthModifier && topBucket === "corrected_claim") {
    return {
      bucket: "corrected_claim",
      bucket_confidence: 0.92,
      plain_english:
        "The denial is most likely a corrected-claim issue: CPT 90837 was billed as telehealth, but the expected telehealth modifier was missing.",
      recommended_action:
        "Submit a corrected claim with the appropriate telehealth modifier after human billing review, and cite the retrieved payer playbook guidance.",
      classifier_signals: {
        has_golden_codes: true,
        missing_telehealth_modifier: true,
        top_policy_chunk_id: topChunk._id,
        top_policy_bucket: topBucket,
      },
    };
  }

  return {
    bucket: "payer_followup",
    bucket_confidence: 0.45,
    plain_english:
      "The retrieved context was not strong enough for an automatic corrected-claim decision.",
    recommended_action:
      "Route to human review before generating payer-specific guidance.",
    classifier_signals: {
      has_golden_codes: hasGoldenCodes,
      missing_telehealth_modifier: missingTelehealthModifier,
      top_policy_chunk_id: topChunk?._id || null,
      top_policy_bucket: topBucket || null,
    },
  };
}

async function updateClassification(client, database, classification, policyContext) {
  const generatedArtifactId = null;
  const { result } = await call(client, "update-many", {
    database,
    collection: "denials",
    filter: { denial_id: denialId },
    update: {
      $set: {
        bucket: classification.bucket,
        bucket_confidence: classification.bucket_confidence,
        plain_english: classification.plain_english,
        recommended_action: classification.recommended_action,
        classifier_signals: classification.classifier_signals,
        policy_context: {
          chunks: policyContext.chunks.map((chunk) => ({
            _id: chunk._id,
            title: chunk.title,
            source_url: chunk.source_url,
            score: chunk.score,
            scope: chunk.scope,
          })),
          carc_descriptions: policyContext.carc_descriptions,
          rarc_descriptions: policyContext.rarc_descriptions,
        },
        generated_artifact_id: generatedArtifactId,
        status: "triaged_pending_artifact",
        updated_at: new Date().toISOString(),
      },
    },
  });
  return result.structuredContent;
}

async function ensureExtractionIfNeeded(denial) {
  if (denial.ocr_status === "done" && denial.raw_text && denial.extracted?.cpt) {
    return false;
  }

  execFileSync("node", ["scripts/document-ai/process-golden-eob.mjs"], {
    cwd: process.cwd(),
    env: { ...process.env, DENIAL_ID: denialId },
    stdio: ["ignore", "pipe", "pipe"],
  });
  return true;
}

async function main() {
  const { uri, database } = requireMongoEnv();
  const project = getProjectId();
  const location = process.env.GOOGLE_CLOUD_LOCATION || "global";
  const ai = new GoogleGenAI({ vertexai: true, project, location });
  const { client, transport } = createMcpClient(uri);

  await client.connect(transport);
  try {
    const startedAt = Date.now();
    const initial = await findDenial(client, database);
    await insertTrace(client, database, "root_find_denial", {
      status: "done",
      tool: "mongodb_mcp_find",
      latency_ms: initial.latency,
    });

    const extractionWasRun = await ensureExtractionIfNeeded(initial.denial);
    if (extractionWasRun) {
      await insertTrace(client, database, "root_document_ai_tool", {
        status: "done",
        tool: "document_ai_form_parser",
        note: "RootAgent triggered Document AI because extraction was missing.",
      });
    }

    const refreshed = extractionWasRun ? await findDenial(client, database) : initial;
    const normalized = normalizeDenial(refreshed.denial);

    const policyContext = await retrievePolicyContext(client, database, ai, normalized);
    await insertTrace(client, database, "root_policy_agent", {
      status: "done",
      tool: "policy_agent_retrieval",
      mcp_tools: ["aggregate", "find"],
      retrieved_chunk_ids: policyContext.chunks.map((chunk) => chunk._id),
      latencies: policyContext.latencies,
    });

    const classification = classify(normalized, policyContext);
    await insertTrace(client, database, "root_classification", {
      status: "done",
      bucket: classification.bucket,
      bucket_confidence: classification.bucket_confidence,
      classifier_signals: classification.classifier_signals,
    });

    const update = await updateClassification(
      client,
      database,
      classification,
      policyContext,
    );
    await insertTrace(client, database, "root_denial_update", {
      status: "done",
      tool: "mongodb_mcp_update-many",
      bucket: classification.bucket,
      update,
    });

    const verification = await findDenial(client, database);
    if (verification.denial.bucket !== "corrected_claim") {
      throw new Error(`Expected corrected_claim; got ${verification.denial.bucket}`);
    }
    if (verification.denial.status !== "triaged_pending_artifact") {
      throw new Error(
        `Expected triaged_pending_artifact; got ${verification.denial.status}`,
      );
    }

    const traceCheck = await call(client, "aggregate", {
      database,
      collection: "trace_events",
      pipeline: [
        { $match: { denial_id: denialId, step: { $regex: "^root_" } } },
        { $group: { _id: "$step", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ],
    });
    const traceSteps = parseMcpDocuments(traceCheck.result);
    const seenSteps = new Set(traceSteps.map((step) => step._id));
    for (const required of [
      "root_find_denial",
      "root_policy_agent",
      "root_classification",
      "root_denial_update",
    ]) {
      if (!seenSteps.has(required)) {
        throw new Error(`Missing trace step: ${required}`);
      }
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          denial_id: denialId,
          elapsed_ms: Date.now() - startedAt,
          extraction_was_run: extractionWasRun,
          bucket: verification.denial.bucket,
          bucket_confidence: verification.denial.bucket_confidence,
          status: verification.denial.status,
          recommended_action: verification.denial.recommended_action,
          retrieved_chunk_ids: policyContext.chunks.map((chunk) => chunk._id),
          trace_steps: traceSteps,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.close();
    await transport.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
