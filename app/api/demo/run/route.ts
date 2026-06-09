import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getDemoDenial, GOLDEN_DENIAL_ID } from "@/lib/demo-records";
import { callMcp, parseMcpDocuments, withMcp } from "@/lib/mongodb-mcp";
import { getMongoDatabaseName, getMongoDb, getMongoUri } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const execFileAsync = promisify(execFile);
const embeddingModel = "gemini-embedding-001";
const embeddingDimensions = 1536;

function parseJsonOutput(stdout: string) {
  const first = stdout.indexOf("{");
  const last = stdout.lastIndexOf("}");
  if (first === -1 || last <= first) {
    throw new Error(`Script did not return JSON output: ${stdout.slice(0, 500)}`);
  }
  return JSON.parse(stdout.slice(first, last + 1)) as Record<string, unknown>;
}

async function runNpmScript(script: string, denialId: string) {
  const { stdout } = await execFileAsync("npm", ["run", script, "--silent"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DENIAL_ID: denialId,
    },
    timeout: 180_000,
    maxBuffer: 1024 * 1024 * 12,
  });
  return parseJsonOutput(stdout);
}

function isHostedCloudRun() {
  return Boolean(process.env.K_SERVICE);
}

function getProjectId() {
  const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  if (!project) {
    throw new Error("Missing GOOGLE_CLOUD_PROJECT for hosted Gemini embedding.");
  }
  return project;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function asPolicyChunks(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => asRecord(item)).filter((item) => typeof item._id === "string")
    : [];
}

function inferCptFamily(cpt: string | undefined) {
  if (cpt === "90791") return "evaluation_90791";
  if (["90832", "90834", "90837"].includes(cpt || "")) return "psychotherapy_90_codes";
  return "telehealth_modifiers";
}

function normalizeDenial(denial: Record<string, unknown>) {
  const extracted = asRecord(denial.extracted);
  const denialCodes = asStringArray(denial.denial_codes);
  const cpt =
    typeof extracted.cpt === "string"
      ? extracted.cpt
      : typeof denial.cpt === "string"
        ? denial.cpt
        : undefined;
  const payerId =
    typeof denial.payer_id === "string"
      ? denial.payer_id
      : extracted.payer_hint === "bcbs_tx"
        ? "bcbs_tx_demo"
        : undefined;
  const carc =
    asStringArray(extracted.carc).length > 0
      ? asStringArray(extracted.carc)
      : asStringArray(denial.carc).length > 0
        ? asStringArray(denial.carc)
        : denialCodes.filter((code) => code.startsWith("CO-"));
  const rarc =
    asStringArray(extracted.rarc).length > 0
      ? asStringArray(extracted.rarc)
      : asStringArray(denial.rarc).length > 0
        ? asStringArray(denial.rarc)
        : denialCodes.filter((code) => /^N\d+/i.test(code));
  return {
    payer_id: payerId,
    cpt,
    carc,
    rarc,
    modifiers:
      asStringArray(extracted.modifiers).length > 0
        ? asStringArray(extracted.modifiers)
        : asStringArray(denial.modifiers),
    pos:
      typeof extracted.pos === "string"
        ? extracted.pos
        : typeof denial.place_of_service === "string"
          ? denial.place_of_service
          : undefined,
    raw_text:
      typeof denial.raw_text === "string"
        ? denial.raw_text
        : typeof extracted.raw_text === "string"
          ? extracted.raw_text
          : typeof denial.intake_summary === "string"
            ? denial.intake_summary
            : "",
    missing_modifier_hint:
      typeof extracted.missing_modifier_hint === "string"
        ? extracted.missing_modifier_hint
        : undefined,
  };
}

async function embedHostedQuery(query: string) {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: getProjectId(),
    location: process.env.GOOGLE_CLOUD_LOCATION || "global",
  });
  const response = await ai.models.embedContent({
    model: embeddingModel,
    contents: query,
    config: {
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: embeddingDimensions,
    },
  });
  const values = response.embeddings?.[0]?.values;
  if (!Array.isArray(values) || values.length !== embeddingDimensions) {
    throw new Error(`Unexpected hosted query embedding dimensions: ${values?.length ?? "missing"}`);
  }
  return values;
}

async function runHostedDemoFastPath(mode: "sample_pdf" | "seeded_extraction", denialId: string) {
  const startedAt = Date.now();
  const runId = `run_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const sourceDocument =
    mode === "sample_pdf"
      ? "golden-bcbs-tx-90837-missing-modifier-eob.pdf"
      : "seeded_extraction";
  const gcsUri =
    mode === "sample_pdf" && process.env.GCS_UPLOAD_BUCKET
      ? `gs://${process.env.GCS_UPLOAD_BUCKET}/demo/${sourceDocument}`
      : null;

  return withMcp(getMongoUri(), "claimcompass-hosted-demo-run", async (client) => {
    const database = getMongoDatabaseName();
    const now = new Date().toISOString();

    const beforeCall = await callMcp(client, "find", {
      database,
      collection: "denials",
      filter: { denial_id: denialId },
      limit: 1,
    });
    const before = parseMcpDocuments(beforeCall.result)[0];
    if (!before) {
      throw new Error(`Denial not found: ${denialId}`);
    }

    const normalized = normalizeDenial(before);
    const queryVector = await embedHostedQuery(
      [
        `payer_id: ${normalized.payer_id}`,
        `cpt: ${normalized.cpt}`,
        `carc: ${normalized.carc.join(", ")}`,
        `rarc: ${normalized.rarc.join(", ")}`,
        normalized.raw_text,
      ].join("\n"),
    );

    const cptFamily = inferCptFamily(normalized.cpt);
    const chunkCall = await callMcp(client, "aggregate", {
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
    const carcCall = await callMcp(client, "find", {
      database,
      collection: "carc",
      filter: { code: { $in: normalized.carc } },
      limit: normalized.carc.length || 1,
    });
    const rarcCall = await callMcp(client, "find", {
      database,
      collection: "rarc",
      filter: { code: { $in: normalized.rarc } },
      limit: normalized.rarc.length || 1,
    });
    const artifactCall = await callMcp(client, "aggregate", {
      database,
      collection: "generated_artifacts",
      pipeline: [
        { $match: { denial_id: denialId } },
        { $sort: { created_at: -1 } },
        { $limit: 1 },
      ],
    });

    const chunks = parseMcpDocuments(chunkCall.result);
    const topChunk = asRecord(chunks[0]);
    const topScope = asRecord(topChunk.scope);
    const artifact = parseMcpDocuments(artifactCall.result)[0] || null;
    const artifactId = typeof artifact?.artifact_id === "string" ? artifact.artifact_id : null;
    const citationIds = asStringArray(artifact?.citation_ids);
    const hasGoldenCodes =
      normalized.carc.includes("CO-45") && normalized.rarc.includes("N179");
    const missingTelehealthModifier =
      normalized.cpt === "90837" &&
      normalized.pos === "10" &&
      normalized.modifiers.length === 0 &&
      normalized.missing_modifier_hint === "95";
    const bucket =
      hasGoldenCodes &&
      missingTelehealthModifier &&
      topScope.action_bucket === "corrected_claim"
        ? "corrected_claim"
        : "payer_followup";
    const bucketConfidence = bucket === "corrected_claim" ? 0.92 : 0.45;
    const retrievedChunks = asPolicyChunks(chunks).map((chunk) => ({
      _id: chunk._id,
      title: chunk.title,
      source_url: chunk.source_url,
      score: chunk.score,
      scope: chunk.scope,
    }));

    const traceEvents = [
      {
        denial_id: denialId,
        run_id: runId,
        step: mode === "sample_pdf" ? "document_ai_import_replay" : "seeded_extraction_replay",
        tool:
          mode === "sample_pdf"
            ? "google_document_ai_form_parser_replay"
            : "mongodb_seeded_extraction_replay",
        status: "done",
        created_at: now,
        demo_data_notice: "DEMO DATA - NOT REAL PHI",
        source_document: sourceDocument,
        ...(gcsUri ? { gcs_uri: gcsUri } : {}),
        note:
          mode === "sample_pdf"
            ? "Hosted demo reuses the verified synthetic Document AI extraction to avoid long request-time child processes."
            : "Hosted fallback reuses the verified synthetic seeded extraction.",
      },
      {
        denial_id: denialId,
        run_id: runId,
        step: "policy_vector_retrieval_live",
        tool: "gemini_embedding_and_mongodb_mcp_aggregate_vectorSearch",
        status: "done",
        created_at: now,
        embedding_model: embeddingModel,
        mcp_tools: ["aggregate", "find"],
        retrieved_chunk_ids: retrievedChunks.map((chunk) => chunk._id),
        latencies: {
          aggregate_ms: chunkCall.elapsed_ms,
          carc_find_ms: carcCall.elapsed_ms,
          rarc_find_ms: rarcCall.elapsed_ms,
        },
      },
      {
        denial_id: denialId,
        run_id: runId,
        step: "root_classification_deterministic",
        tool: "golden_path_bucket_classifier",
        status: "done",
        created_at: now,
        bucket,
        bucket_confidence: bucketConfidence,
        classifier_signals: {
          has_golden_codes: hasGoldenCodes,
          missing_telehealth_modifier: missingTelehealthModifier,
          top_policy_chunk_id: topChunk._id || null,
          top_policy_bucket: topScope.action_bucket || null,
        },
        note: "Hosted run classifies the verified golden path deterministically; local release checks prove the full RootAgent/Gemini path.",
      },
      {
        denial_id: denialId,
        run_id: runId,
        step: "drafter_artifact_reuse",
        tool: "validated_gemini_artifact_reuse",
        status: artifactId ? "done" : "skipped",
        created_at: now,
        artifact_id: artifactId,
        citation_ids: citationIds,
        note: "Hosted run reuses the latest validated DrafterAgent artifact; local release checks prove live Gemini draft generation.",
      },
    ];

    await callMcp(client, "insert-many", {
      database,
      collection: "trace_events",
      documents: traceEvents,
    });

    await callMcp(client, "update-many", {
      database,
      collection: "denials",
      filter: { denial_id: denialId },
      update: {
        $set: {
          bucket,
          bucket_confidence: bucketConfidence,
          plain_english:
            bucket === "corrected_claim"
              ? "The denial is most likely a corrected-claim issue: CPT 90837 was billed as telehealth, but the expected telehealth modifier was missing."
              : "The retrieved context was not strong enough for an automatic corrected-claim decision.",
          recommended_action:
            bucket === "corrected_claim"
              ? "Submit a corrected claim with the appropriate telehealth modifier after human billing review, and cite the retrieved payer playbook guidance."
              : "Route to human review before generating payer-specific guidance.",
          classifier_signals: {
            has_golden_codes: hasGoldenCodes,
            missing_telehealth_modifier: missingTelehealthModifier,
            top_policy_chunk_id: topChunk._id || null,
            top_policy_bucket: topScope.action_bucket || null,
          },
          policy_context: {
            chunks: retrievedChunks,
            carc_descriptions: parseMcpDocuments(carcCall.result),
            rarc_descriptions: parseMcpDocuments(rarcCall.result),
          },
          status: artifactId ? "artifact_generated" : "triaged_pending_artifact",
          generated_artifact_id: artifactId,
          source_document: sourceDocument,
          ...(gcsUri ? { gcs_uri: gcsUri } : {}),
          updated_at: now,
        },
      },
    });

    const afterCall = await callMcp(client, "find", {
      database,
      collection: "denials",
      filter: { denial_id: denialId },
      limit: 1,
    });
    const after = parseMcpDocuments(afterCall.result)[0] || null;

    await callMcp(client, "insert-many", {
      database,
      collection: "demo_runs",
      documents: [
        {
          run_id: runId,
          denial_id: denialId,
          demo_data_notice: "DEMO DATA - NOT REAL PHI",
          started_at: new Date(startedAt).toISOString(),
          completed_at: new Date().toISOString(),
          elapsed_ms: Date.now() - startedAt,
          mode,
          hosted_fast_path: true,
          hosted_live_mcp: true,
          before,
          after,
          document_ai_summary:
            mode === "sample_pdf"
              ? {
                  ok: true,
                  replay: true,
                  source_document: sourceDocument,
                  gcs_uri: gcsUri,
                  note: "Synthetic sample PDF path verified locally; hosted run labels this as replay and runs live Gemini embedding + MongoDB MCP retrieval/write-back.",
                }
              : null,
          root_summary: {
            ok: true,
            denial_id: denialId,
            bucket,
            bucket_confidence: bucketConfidence,
            status: asRecord(after).status,
            retrieved_chunk_ids: retrievedChunks.map((chunk) => chunk._id),
            live_mcp_tools: ["aggregate", "find", "insert-many", "update-many"],
            live_gemini_embedding_model: embeddingModel,
          },
          draft_summary: {
            ok: Boolean(artifactId),
            replay: true,
            artifact_id: artifactId,
            citation_ids: citationIds,
          },
          created_at: now,
        },
      ],
    });

    return {
      ok: true,
      denial_id: denialId,
      run_id: runId,
      artifact_id: artifactId,
      mode,
      source_document: sourceDocument,
      elapsed_ms: Date.now() - startedAt,
      live_mcp: true,
      live_gemini_embedding_model: embeddingModel,
      redirect_to: `/demo/denials/${denialId}?run=${runId}`,
    };
  });
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const body = await request.json().catch(() => ({}));
  const mode = body.mode === "sample_pdf" ? "sample_pdf" : "seeded_extraction";
  const denialId =
    typeof body.denialId === "string" && body.denialId.trim()
      ? body.denialId.trim()
      : GOLDEN_DENIAL_ID;

  if (denialId !== GOLDEN_DENIAL_ID) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "System 16 only supports the synthetic golden denial. Do not upload or paste real PHI.",
      },
      { status: 400 },
    );
  }

  try {
    if (isHostedCloudRun()) {
      const payload = await runHostedDemoFastPath(mode, denialId);
      return NextResponse.json(payload);
    }

    const db = await getMongoDb();
    const before = await getDemoDenial(denialId);
    const documentAi =
      mode === "sample_pdf" ? await runNpmScript("docai:golden-smoke", denialId) : null;
    const root = await runNpmScript("root:smoke", denialId);
    const draft = await runNpmScript("draft:smoke", denialId);
    const after = await getDemoDenial(denialId);
    const runId = `run_${Date.now()}_${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    await db.collection("demo_runs").insertOne({
      run_id: runId,
      denial_id: denialId,
      demo_data_notice: "DEMO DATA - NOT REAL PHI",
      started_at: new Date(startedAt).toISOString(),
      completed_at: now,
      elapsed_ms: Date.now() - startedAt,
      mode,
      before,
      after,
      document_ai_summary: documentAi,
      root_summary: root,
      draft_summary: draft,
      created_at: now,
    });

    return NextResponse.json({
      ok: true,
      denial_id: denialId,
      run_id: runId,
      artifact_id: draft.artifact_id,
      mode,
      source_document:
        mode === "sample_pdf"
          ? "golden-bcbs-tx-90837-missing-modifier-eob.pdf"
          : "seeded_extraction",
      elapsed_ms: Date.now() - startedAt,
      redirect_to: `/demo/denials/${denialId}?run=${runId}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown demo run error";
    return NextResponse.json(
      {
        ok: false,
        denial_id: denialId,
        error: message,
      },
      { status: 500 },
    );
  }
}
