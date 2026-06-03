import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { getDemoDenial, GOLDEN_DENIAL_ID } from "@/lib/demo-records";
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
