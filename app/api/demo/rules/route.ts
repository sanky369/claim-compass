import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { GOLDEN_DENIAL_ID } from "@/lib/demo-records";
import { getMongoDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const denialId = typeof body.denialId === "string" ? body.denialId : "";
  const artifactId = typeof body.artifactId === "string" ? body.artifactId : "";

  if (denialId !== GOLDEN_DENIAL_ID || !artifactId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Save-as-rule is only enabled for the synthetic golden demo artifact.",
      },
      { status: 400 },
    );
  }

  const db = await getMongoDb();
  const denial = await db.collection("denials").findOne({ denial_id: denialId });
  const artifact = await db
    .collection("generated_artifacts")
    .findOne({ denial_id: denialId, artifact_id: artifactId });

  if (!denial || !artifact) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not find the denial/artifact pair to save as a billing rule.",
      },
      { status: 404 },
    );
  }

  const ruleId = `rule_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  await db.collection("billing_rules").insertOne({
    rule_id: ruleId,
    denial_id: denialId,
    artifact_id: artifactId,
    demo_data_notice: "DEMO DATA - NOT REAL PHI",
    payer_id: denial.payer_id,
    cpt: denial.extracted?.cpt || denial.cpt,
    action_bucket: denial.bucket,
    title: "BCBS-TX demo 90837 telehealth modifier pre-check",
    rule_summary:
      "For the synthetic golden path, check POS 10 plus modifier 95 before escalating CO-45/N179 therapy denials.",
    source_citation_ids: artifact.citation_ids || [],
    created_at: now,
    updated_at: now,
  });

  await db.collection("trace_events").insertOne({
    denial_id: denialId,
    step: "ui_save_as_rule",
    status: "done",
    tool: "mongodb_insert_billing_rule",
    rule_id: ruleId,
    created_at: now,
  });

  return NextResponse.json({
    ok: true,
    rule_id: ruleId,
  });
}
