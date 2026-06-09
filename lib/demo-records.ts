import { getMongoDb, toPlainDocument } from "./mongodb";

export const GOLDEN_DENIAL_ID = "demo_denial_001";

export type DemoDenial = Record<string, unknown> & {
  denial_id: string;
  status?: string;
  bucket?: string;
  bucket_confidence?: number;
  generated_artifact_id?: string;
  policy_context?: {
    chunks?: Array<{
      _id: string;
      title?: string;
      source_url?: string;
      scope?: Record<string, unknown>;
      score?: number;
    }>;
  };
};

export type DemoArtifact = Record<string, unknown> & {
  artifact_id: string;
  denial_id: string;
  markdown?: string;
  citation_ids?: string[];
  validation?: Record<string, unknown>;
};

export type DemoTraceEvent = Record<string, unknown> & {
  step?: string;
  tool?: string;
  status?: string;
  created_at?: string;
};

export type DemoRunSnapshot = Record<string, unknown> & {
  run_id: string;
  denial_id: string;
  before?: DemoDenial | null;
  after?: DemoDenial | null;
};

export async function getDemoDenial(denialId: string) {
  const db = await getMongoDb();
  const denial = await db.collection("denials").findOne({ denial_id: denialId });
  return denial ? (toPlainDocument(denial) as unknown as DemoDenial) : null;
}

export async function getLatestArtifact(denialId: string) {
  const db = await getMongoDb();
  const artifact = await db
    .collection("generated_artifacts")
    .find({ denial_id: denialId })
    .sort({ created_at: -1 })
    .limit(1)
    .next();
  return artifact ? (toPlainDocument(artifact) as unknown as DemoArtifact) : null;
}

export async function getTraceEvents(denialId: string, runId?: string) {
  const db = await getMongoDb();
  const filter = runId ? { denial_id: denialId, run_id: runId } : { denial_id: denialId };
  const events = await db
    .collection("trace_events")
    .find(filter)
    .sort({ created_at: -1 })
    .limit(24)
    .toArray();
  return toPlainDocument(events).reverse() as unknown as DemoTraceEvent[];
}

export async function getDemoRun(denialId: string, runId?: string) {
  const db = await getMongoDb();
  if (runId) {
    const run = await db
      .collection("demo_runs")
      .findOne({ denial_id: denialId, run_id: runId });
    return run ? (toPlainDocument(run) as unknown as DemoRunSnapshot) : null;
  }
  const run = await db
    .collection("demo_runs")
    .find({ denial_id: denialId })
    .sort({ created_at: -1 })
    .limit(1)
    .next();
  return run ? (toPlainDocument(run) as unknown as DemoRunSnapshot) : null;
}

export async function getLatestDemoRun(denialId: string) {
  return getDemoRun(denialId);
}

export async function getBillingRuleCount(denialId: string) {
  const db = await getMongoDb();
  return db.collection("billing_rules").countDocuments({ denial_id: denialId });
}

export function summarizeDenialForDiff(denial?: DemoDenial | null) {
  if (!denial) return null;
  const chunks = denial.policy_context?.chunks || [];
  return {
    status: denial.status || null,
    bucket: denial.bucket || null,
    bucket_confidence: denial.bucket_confidence || null,
    generated_artifact_id: denial.generated_artifact_id || null,
    recommended_action: denial.recommended_action || null,
    policy_chunk_ids: chunks.map((chunk) => chunk._id),
  };
}
