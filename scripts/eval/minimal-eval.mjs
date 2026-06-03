import { execFileSync } from "node:child_process";
import {
  assertCase,
  assertReportPassed,
  classifyForEval,
  makeCase,
  writeEvalReport,
} from "../lib/eval-common.mjs";

function runJson(command, args, options = {}) {
  const output = execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  return JSON.parse(output);
}

function runRootSmoke() {
  return runJson("npm", ["run", "root:smoke", "--silent"], {
    env: { ...process.env, DENIAL_ID: process.env.DENIAL_ID || "demo_denial_001" },
  });
}

function makeFallbackCases() {
  const weak = classifyForEval(
    {
      cpt: "90837",
      pos: "10",
      modifiers: [],
      carc: ["CO-45"],
      rarc: ["N179"],
      missing_modifier_hint: "95",
    },
    [],
  );

  const ambiguous = classifyForEval(
    {
      cpt: "90837",
      pos: "10",
      modifiers: ["95"],
      carc: ["CO-45"],
      rarc: ["N179"],
      missing_modifier_hint: null,
    },
    [
      {
        _id: "pb_fixture_ambiguous",
        scope: { action_bucket: "corrected_claim" },
      },
    ],
  );

  return [
    makeCase("weak_playbook_retrieval_falls_back", "No retrieved chunks stay low-confidence.", [
      assertCase(weak.bucket !== "corrected_claim", "Weak retrieval does not auto-correct.", weak),
      assertCase(
        weak.bucket_confidence <= 0.5,
        "Weak retrieval stays low confidence.",
        weak,
      ),
      assertCase(
        weak.human_review_required === true,
        "Weak retrieval keeps human review required.",
        weak,
      ),
    ]),
    makeCase(
      "ambiguous_denial_codes_fall_back",
      "Golden codes without missing-modifier evidence stay review-gated.",
      [
        assertCase(
          ambiguous.bucket !== "corrected_claim",
          "Ambiguous evidence does not auto-correct.",
          ambiguous,
        ),
        assertCase(
          ambiguous.bucket_confidence <= 0.5,
          "Ambiguous evidence stays low confidence.",
          ambiguous,
        ),
        assertCase(
          ambiguous.human_review_required === true,
          "Ambiguous evidence keeps human review required.",
          ambiguous,
        ),
      ],
    ),
  ];
}

async function main() {
  const startedAt = Date.now();
  const root = runRootSmoke();

  const cases = [
    makeCase(
      "golden_denial_retrieves_and_classifies",
      "Golden denial retrieves telehealth modifier chunks and classifies corrected_claim.",
      [
        assertCase(root.ok === true, "RootAgent smoke completed.", root.ok),
        assertCase(root.bucket === "corrected_claim", "Bucket is corrected_claim.", root.bucket),
        assertCase(
          root.bucket_confidence >= 0.9,
          "Golden path confidence is high.",
          root.bucket_confidence,
        ),
        assertCase(
          root.retrieved_chunk_ids?.some((id) => String(id).includes("modifier_missing")),
          "Retrieved chunks include modifier-missing guidance.",
          root.retrieved_chunk_ids,
        ),
        assertCase(
          root.status === "triaged_pending_artifact",
          "Denial is ready for drafting.",
          root.status,
        ),
      ],
    ),
    ...makeFallbackCases(),
  ];

  const report = {
    ok: cases.every((testCase) => testCase.ok),
    system: 12,
    name: "minimal_eval_gate",
    created_at: new Date().toISOString(),
    elapsed_ms: Date.now() - startedAt,
    notes: [
      "agents-cli eval run was verified separately against the ADK scaffold.",
      "This eval gates the real ClaimCompass RootAgent/MongoDB/Gemini smoke path.",
    ],
    cases,
  };

  writeEvalReport("system-12-minimal-eval.json", report);
  assertReportPassed(report);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
