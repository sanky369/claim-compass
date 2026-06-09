import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { GOLDEN_DENIAL_ID } from "@/lib/demo-records";
import { callMcp, parseMcpDocuments, withMcp } from "@/lib/mongodb-mcp";
import { getMongoDatabaseName, getMongoUri } from "@/lib/mongodb";

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

  try {
    return await withMcp(getMongoUri(), "claimcompass-save-as-rule", async (client) => {
      const database = getMongoDatabaseName();
      const denialCall = await callMcp(client, "find", {
        database,
        collection: "denials",
        filter: { denial_id: denialId },
        limit: 1,
      });
      const artifactCall = await callMcp(client, "find", {
        database,
        collection: "generated_artifacts",
        filter: { denial_id: denialId, artifact_id: artifactId },
        limit: 1,
      });
      const denial = parseMcpDocuments(denialCall.result)[0];
      const artifact = parseMcpDocuments(artifactCall.result)[0];

      if (!denial || !artifact) {
        return NextResponse.json(
          {
            ok: false,
            error: "Could not find the denial/artifact pair to save as a billing rule.",
          },
          { status: 404 },
        );
      }

      const extracted =
        denial.extracted && typeof denial.extracted === "object"
          ? (denial.extracted as Record<string, unknown>)
          : {};
      const citationIds = Array.isArray(artifact.citation_ids)
        ? artifact.citation_ids.filter((item): item is string => typeof item === "string")
        : [];
      const ruleId = `rule_${Date.now()}_${randomUUID().slice(0, 8)}`;
      const now = new Date().toISOString();

      await callMcp(client, "insert-many", {
        database,
        collection: "billing_rules",
        documents: [
          {
            rule_id: ruleId,
            denial_id: denialId,
            artifact_id: artifactId,
            demo_data_notice: "DEMO DATA - NOT REAL PHI",
            payer_id: denial.payer_id,
            cpt: extracted.cpt || denial.cpt,
            action_bucket: denial.bucket,
            title: "BCBS-TX demo 90837 telehealth modifier pre-check",
            rule_summary:
              "For the synthetic golden path, check POS 10 plus modifier 95 before escalating CO-45/N179 therapy denials.",
            source_citation_ids: citationIds,
            created_at: now,
            updated_at: now,
          },
        ],
      });

      await callMcp(client, "insert-many", {
        database,
        collection: "trace_events",
        documents: [
          {
            denial_id: denialId,
            step: "ui_save_as_rule",
            status: "done",
            tool: "mongodb_mcp_insert-many_billing_rule",
            rule_id: ruleId,
            created_at: now,
          },
        ],
      });

      return NextResponse.json({
        ok: true,
        rule_id: ruleId,
        live_mcp: true,
      });
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown save-as-rule error.",
      },
      { status: 500 },
    );
  }
}
