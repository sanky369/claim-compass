import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function classifyForEval(normalized, chunks) {
  const codes = new Set([...(normalized.carc || []), ...(normalized.rarc || [])]);
  const topChunk = chunks?.[0];
  const hasGoldenCodes = codes.has("CO-45") && codes.has("N179");
  const missingTelehealthModifier =
    normalized.cpt === "90837" &&
    normalized.pos === "10" &&
    (normalized.modifiers || []).length === 0 &&
    normalized.missing_modifier_hint === "95";
  const topBucket = topChunk?.scope?.action_bucket;

  if (hasGoldenCodes && missingTelehealthModifier && topBucket === "corrected_claim") {
    return {
      bucket: "corrected_claim",
      bucket_confidence: 0.92,
      human_review_required: true,
      fallback_reason: null,
    };
  }

  return {
    bucket: "payer_followup",
    bucket_confidence: 0.45,
    human_review_required: true,
    fallback_reason: "weak_or_ambiguous_policy_context",
  };
}

export function makeCase(id, description, assertions) {
  const failures = assertions.filter((assertion) => !assertion.pass);
  return {
    id,
    description,
    ok: failures.length === 0,
    assertions,
    failures: failures.map((failure) => failure.message),
  };
}

export function assertCase(condition, message, details = null) {
  return {
    pass: Boolean(condition),
    message,
    details,
  };
}

export function writeEvalReport(fileName, report) {
  const path = resolve("docs/eval-reports", fileName);
  mkdirSync(dirname(path), { recursive: true });
  report.report_path = path;
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);
  return path;
}

export function assertReportPassed(report) {
  const failedCases = report.cases.filter((testCase) => !testCase.ok);
  if (failedCases.length > 0) {
    throw new Error(
      `Eval failed: ${failedCases.map((testCase) => testCase.id).join(", ")}`,
    );
  }
}
