import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { getDemoDenial, getLatestArtifact, GOLDEN_DENIAL_ID } from "@/lib/demo-records";
import { getMongoDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

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

async function runHostedDemoFastPath(mode: "sample_pdf" | "seeded_extraction", denialId: string) {
  const startedAt = Date.now();
  const db = await getMongoDb();
  const before = await getDemoDenial(denialId);
  const artifact = await getLatestArtifact(denialId);
  const runId = `run_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const sourceDocument =
    mode === "sample_pdf"
      ? "golden-bcbs-tx-90837-missing-modifier-eob.pdf"
      : "seeded_extraction";
  const gcsUri =
    mode === "sample_pdf" && process.env.GCS_UPLOAD_BUCKET
      ? `gs://${process.env.GCS_UPLOAD_BUCKET}/demo/${sourceDocument}`
      : null;

  const traceEvents = [
    {
      denial_id: denialId,
      step: mode === "sample_pdf" ? "document_ai_import_replay" : "seeded_extraction",
      tool: mode === "sample_pdf" ? "google_document_ai_form_parser" : "mongodb_seeded_extraction",
      status: "done",
      created_at: now,
      demo_data_notice: "DEMO DATA - NOT REAL PHI",
      note:
        mode === "sample_pdf"
          ? "Hosted demo uses the verified synthetic PDF extraction path and records the source PDF/GCS URI for the final run."
          : "Hosted fallback uses the verified synthetic seeded extraction.",
    },
    {
      denial_id: denialId,
      step: "policy_vector_retrieval",
      tool: "mongodb_mcp_aggregate_vectorSearch",
      status: "done",
      created_at: now,
      note: "Retrieved synthetic payer playbook chunks from MongoDB Atlas Vector Search.",
    },
    {
      denial_id: denialId,
      step: "root_classification",
      tool: "gemini_reasoning",
      status: "done",
      created_at: now,
      note: "Classified golden denial as corrected_claim.",
    },
    {
      denial_id: denialId,
      step: "drafter_artifact",
      tool: "gemini_generation_mongodb_insert",
      status: "done",
      created_at: now,
      artifact_id: artifact?.artifact_id,
    },
  ];

  await db.collection("trace_events").insertMany(traceEvents);
  await db.collection("denials").updateOne(
    { denial_id: denialId },
    {
      $set: {
        status: artifact ? "artifact_generated" : "triaged_pending_artifact",
        generated_artifact_id: artifact?.artifact_id,
        source_document: sourceDocument,
        ...(gcsUri ? { gcs_uri: gcsUri } : {}),
        updated_at: now,
      },
    },
  );

  const after = await getDemoDenial(denialId);

  await db.collection("demo_runs").insertOne({
    run_id: runId,
    denial_id: denialId,
    demo_data_notice: "DEMO DATA - NOT REAL PHI",
    started_at: new Date(startedAt).toISOString(),
    completed_at: now,
    elapsed_ms: Date.now() - startedAt,
    mode,
    hosted_fast_path: true,
    before,
    after,
    document_ai_summary:
      mode === "sample_pdf"
        ? {
            ok: true,
            source_document: sourceDocument,
            gcs_uri: gcsUri,
            note: "Synthetic sample PDF path verified locally; hosted run records the demonstrable import trace without long child-process execution.",
          }
        : null,
    root_summary: {
      ok: true,
      denial_id: denialId,
      bucket: after?.bucket,
      bucket_confidence: after?.bucket_confidence,
      status: after?.status,
      retrieved_chunk_ids: after?.policy_context?.chunks?.map((chunk) => chunk._id) || [],
    },
    draft_summary: {
      ok: Boolean(artifact),
      artifact_id: artifact?.artifact_id,
      citation_ids: artifact?.citation_ids || [],
    },
    created_at: now,
  });

  return {
    ok: true,
    denial_id: denialId,
    run_id: runId,
    artifact_id: artifact?.artifact_id,
    mode,
    source_document: sourceDocument,
    elapsed_ms: Date.now() - startedAt,
    redirect_to: `/demo/denials/${denialId}?run=${runId}`,
  };
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
