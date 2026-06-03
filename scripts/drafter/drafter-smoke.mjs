import { GoogleGenAI } from "@google/genai";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { callMcp, parseMcpDocuments, withMcp } from "../lib/mcp-client.mjs";
import { requireMongoEnv } from "../mongodb/env.mjs";

const denialId = process.env.DENIAL_ID || "demo_denial_001";
const generationModel = process.env.GEMINI_DRAFT_MODEL || "gemini-flash-latest";

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

async function findOne(client, database, collection, filter) {
  const { result } = await callMcp(client, "find", {
    database,
    collection,
    filter,
    limit: 1,
  });
  return parseMcpDocuments(result)[0] || null;
}

async function findMany(client, database, collection, filter, limit = 10) {
  const { result } = await callMcp(client, "find", {
    database,
    collection,
    filter,
    limit,
  });
  return parseMcpDocuments(result);
}

function requireCorrectedClaimDenial(denial) {
  if (!denial) {
    throw new Error(`Denial not found: ${denialId}`);
  }
  if (denial.bucket !== "corrected_claim") {
    throw new Error(`DrafterAgent requires corrected_claim; got ${denial.bucket}`);
  }
  const chunkIds = denial.policy_context?.chunks?.map((chunk) => chunk._id) || [];
  if (chunkIds.length === 0) {
    throw new Error("DrafterAgent requires retrieved policy_context.chunks.");
  }
  return chunkIds;
}

function normalizeChunk(chunk) {
  return {
    _id: chunk._id,
    title: chunk.title,
    body: chunk.body || chunk.chunk || "",
    source_url: chunk.source_url || null,
    scope: chunk.scope || {},
  };
}

function buildPrompt(denial, payer, chunks) {
  const sourcePack = chunks.map(normalizeChunk);
  const citationList = sourcePack.map((chunk) => `[${chunk._id}]`).join(", ");
  return [
    "You are ClaimCompass DrafterAgent for a healthcare-adjacent hackathon demo.",
    "Use only the supplied synthetic demo denial and retrieved payer playbook chunks.",
    "Do not invent payer addresses, appeal deadlines, portal names, medical necessity facts, or policy requirements.",
    "Write decision-support guidance, not legal, clinical, billing, or payer-policy advice.",
    `Every factual playbook statement must cite one of these exact ids in square brackets: ${citationList}.`,
    "Use at least two citation chips. Do not shorten, rename, or invent citation ids.",
    "Return concise Markdown with these headings only: Summary, Why This Looks Like A Corrected Claim, Corrected Claim Checklist, Citation Notes, Human Review.",
    "The Human Review section must include this exact sentence: This is decision support for demo data only, not legal, clinical, billing, or payer-policy advice.",
    "",
    "Denial:",
    JSON.stringify(
      {
        denial_id: denial.denial_id,
        payer_id: denial.payer_id,
        payer_name: denial.payer_name,
        cpt: denial.extracted?.cpt || denial.cpt,
        pos: denial.extracted?.pos || denial.place_of_service,
        modifiers: denial.extracted?.modifiers || denial.modifiers || [],
        carc: denial.extracted?.carc || denial.carc || [],
        rarc: denial.extracted?.rarc || denial.rarc || [],
        bucket: denial.bucket,
        plain_english: denial.plain_english,
        recommended_action: denial.recommended_action,
      },
      null,
      2,
    ),
    "",
    "Payer reference:",
    JSON.stringify(
      {
        payer_id: payer?.payer_id || denial.payer_id,
        display_name: payer?.display_name || denial.payer_name,
        notes: payer?.notes || "No payer contact details supplied in retrieved demo data.",
      },
      null,
      2,
    ),
    "",
    "Retrieved chunks:",
    JSON.stringify(sourcePack, null, 2),
  ].join("\n");
}

function citationIds(markdown) {
  return [...markdown.matchAll(/\[([a-z0-9_:-]+)\]/gi)].map((match) => match[1]);
}

function validateDraft(markdown, chunks) {
  const allowed = new Set(chunks.map((chunk) => chunk._id));
  const citations = [...new Set(citationIds(markdown))].filter((id) =>
    id.startsWith("pb_"),
  );
  const invalidCitations = citations.filter((id) => !allowed.has(id));
  const forbiddenPatterns = [
    /\bP\.?\s*O\.?\s*Box\b/i,
    /\bmail\s+to\b/i,
    /\bappeal\s+deadline\b/i,
    /\bwithin\s+\d+\s+(calendar\s+)?days\b/i,
    /\bmedical necessity\b/i,
  ];
  const forbiddenMatches = forbiddenPatterns
    .filter((pattern) => pattern.test(markdown))
    .map((pattern) => String(pattern));
  const hasDisclaimer =
    /human review/i.test(markdown) &&
    /not legal, clinical, billing, or payer-policy advice/i.test(markdown);

  return {
    ok:
      citations.length > 0 &&
      invalidCitations.length === 0 &&
      forbiddenMatches.length === 0 &&
      hasDisclaimer,
    citations,
    invalid_citations: invalidCitations,
    forbidden_matches: forbiddenMatches,
    has_human_review_disclaimer: hasDisclaimer,
  };
}

async function draftWithGemini(ai, prompt) {
  const response = await ai.models.generateContent({
    model: generationModel,
    contents: prompt,
    config: {
      temperature: 0.2,
      maxOutputTokens: 1200,
    },
  });
  const markdown = response.text?.trim();
  if (!markdown) {
    throw new Error("Gemini returned an empty draft.");
  }
  return markdown;
}

function repairDraftIfNeeded(markdown, denial, chunks, validation) {
  if (validation.ok) {
    return markdown;
  }

  const topChunks = chunks.slice(0, 3).map(normalizeChunk);
  const citationLine = topChunks.map((chunk) => `[${chunk._id}]`).join(" ");
  const cpt = denial.extracted?.cpt || denial.cpt || "the submitted CPT";
  const pos = denial.extracted?.pos || denial.place_of_service || "the submitted POS";
  const modifierHint = denial.extracted?.missing_modifier_hint || "the expected modifier";

  return [
    "## Summary",
    "",
    `This synthetic denial is ready for corrected-claim review because ClaimCompass classified it as a formatting/modifier issue for CPT ${cpt}, not as a proven appeal case. ${citationLine}`,
    "",
    "## Why This Looks Like A Corrected Claim",
    "",
    `The retrieved playbook context points to checking telehealth place of service ${pos} and the missing modifier ${modifierHint} before escalating to a true appeal. ${citationLine}`,
    "",
    "## Corrected Claim Checklist",
    "",
    `- Confirm the service, CPT ${cpt}, diagnosis, place of service, and rendering/provider fields against the source claim. ${citationLine}`,
    `- Add the appropriate telehealth modifier only after human billing review confirms it matches the encounter and payer rules. ${citationLine}`,
    "- Submit as a corrected claim through the provider's normal workflow; no payer address, portal name, or deadline was present in the retrieved demo sources.",
    "",
    "## Citation Notes",
    "",
    topChunks
      .map((chunk) => `- [${chunk._id}] ${chunk.title}`)
      .join("\n"),
    "",
    "## Human Review",
    "",
    "This is decision support for demo data only, not legal, clinical, billing, or payer-policy advice.",
  ].join("\n");
}

async function main() {
  const startedAt = Date.now();
  const { uri, database } = requireMongoEnv();
  const project = getProjectId();
  const location = process.env.GOOGLE_CLOUD_LOCATION || "global";
  const ai = new GoogleGenAI({ vertexai: true, project, location });

  await withMcp(uri, "claimcompass-drafter-smoke", async (client) => {
    const denial = await findOne(client, database, "denials", { denial_id: denialId });
    const chunkIds = requireCorrectedClaimDenial(denial);
    const chunks = await findMany(
      client,
      database,
      "payer_playbooks",
      { _id: { $in: chunkIds } },
      chunkIds.length,
    );
    if (chunks.length === 0) {
      throw new Error("DrafterAgent could not resolve returned playbook chunks.");
    }
    const payer = await findOne(client, database, "payers", {
      payer_id: denial.payer_id,
    });

    const generatedMarkdown = await draftWithGemini(
      ai,
      buildPrompt(denial, payer, chunks),
    );
    const generatedValidation = validateDraft(generatedMarkdown, chunks);
    const markdown = repairDraftIfNeeded(
      generatedMarkdown,
      denial,
      chunks,
      generatedValidation,
    );
    const validation = {
      ...validateDraft(markdown, chunks),
      gemini_output_required_repair: !generatedValidation.ok,
      original_validation: generatedValidation,
    };
    if (!validation.ok) {
      throw new Error(
        `Draft validation failed: ${JSON.stringify({
          validation,
          markdown_preview: markdown.slice(0, 400),
        })}`,
      );
    }

    const artifactId = `artifact_${denialId}_${Date.now()}_${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    await callMcp(client, "insert-many", {
      database,
      collection: "generated_artifacts",
      documents: [
        {
          artifact_id: artifactId,
          denial_id: denialId,
          demo_data_notice: "DEMO DATA - NOT REAL PHI",
          type: "corrected_claim_guidance",
          model: generationModel,
          markdown,
          citation_ids: validation.citations,
          validation,
          created_at: now,
          updated_at: now,
        },
      ],
    });

    await callMcp(client, "update-many", {
      database,
      collection: "denials",
      filter: { denial_id: denialId },
      update: {
        $set: {
          generated_artifact_id: artifactId,
          status: "artifact_generated",
          updated_at: now,
        },
      },
    });

    await callMcp(client, "insert-many", {
      database,
      collection: "trace_events",
      documents: [
        {
          denial_id: denialId,
          step: "drafter_artifact_generated",
          status: "done",
          tool: "gemini_generation_and_mongodb_mcp_insert-many",
          artifact_id: artifactId,
          citation_ids: validation.citations,
          created_at: now,
        },
      ],
    });

    console.log(
      JSON.stringify(
        {
          ok: true,
          denial_id: denialId,
          artifact_id: artifactId,
          status: "artifact_generated",
          model: generationModel,
          elapsed_ms: Date.now() - startedAt,
          citation_ids: validation.citations,
          validation,
          markdown_preview: markdown.slice(0, 600),
        },
        null,
        2,
      ),
    );
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
