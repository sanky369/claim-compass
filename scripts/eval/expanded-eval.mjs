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

function runScript(scriptName) {
  return runJson("npm", ["run", scriptName, "--silent"], {
    env: { ...process.env, DENIAL_ID: process.env.DENIAL_ID || "demo_denial_001" },
  });
}

function fixtureClassificationCases() {
  const trueAppeal = classifyForEval(
    {
      cpt: "90837",
      pos: "11",
      modifiers: [],
      carc: ["CO-50"],
      rarc: ["N130"],
      missing_modifier_hint: null,
    },
    [
      {
        _id: "pb_fixture_true_appeal",
        scope: { action_bucket: "true_appeal" },
      },
    ],
  );
  const credentialingish = classifyForEval(
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
        _id: "pb_fixture_credentialing",
        scope: { action_bucket: "credentialing" },
      },
    ],
  );
  const noChunks = classifyForEval(
    {
      cpt: "90837",
      pos: "10",
      modifiers: [],
      carc: [],
      rarc: [],
      missing_modifier_hint: null,
    },
    [],
  );

  return [
    makeCase("true_appeal_fixture_is_not_auto_corrected", "Appeal-ish fixture stays out of golden bucket.", [
      assertCase(
        trueAppeal.bucket !== "corrected_claim",
        "True appeal fixture is not auto-corrected.",
        trueAppeal,
      ),
      assertCase(
        trueAppeal.human_review_required === true,
        "True appeal fixture remains review-gated.",
        trueAppeal,
      ),
    ]),
    makeCase(
      "credentialingish_fixture_has_no_extra_agent_scope",
      "Credentialing-ish fixture falls back without invoking out-of-scope agent.",
      [
        assertCase(
          credentialingish.bucket !== "corrected_claim",
          "Credentialing-ish fixture does not become corrected_claim.",
          credentialingish,
        ),
        assertCase(
          credentialingish.bucket === "payer_followup",
          "Credentialing-ish fixture uses in-scope fallback bucket.",
          credentialingish,
        ),
      ],
    ),
    makeCase("no_playbook_chunks_safe_fallback", "No retrieved playbooks produce low-confidence fallback.", [
      assertCase(noChunks.bucket !== "corrected_claim", "No chunks do not auto-correct.", noChunks),
      assertCase(noChunks.bucket_confidence <= 0.5, "No chunks stay low confidence.", noChunks),
      assertCase(
        noChunks.fallback_reason === "weak_or_ambiguous_policy_context",
        "No chunks record fallback reason.",
        noChunks,
      ),
    ]),
  ];
}

async function main() {
  const startedAt = Date.now();
  const root = runScript("root:smoke");
  const draft = runScript("draft:smoke");

  const cases = [
    makeCase("golden_path_root_still_passes", "RootAgent still returns the golden corrected-claim bucket.", [
      assertCase(root.ok === true, "RootAgent smoke completed.", root.ok),
      assertCase(root.bucket === "corrected_claim", "Golden path bucket is corrected_claim.", root.bucket),
      assertCase(
        root.retrieved_chunk_ids?.length >= 1,
        "RootAgent returned playbook chunks.",
        root.retrieved_chunk_ids,
      ),
    ]),
    makeCase("drafter_artifact_is_grounded", "DrafterArtifact has valid citations and human review language.", [
      assertCase(draft.ok === true, "Drafter smoke completed.", draft.ok),
      assertCase(
        draft.validation?.invalid_citations?.length === 0,
        "No invalid citations.",
        draft.validation,
      ),
      assertCase(
        draft.validation?.forbidden_matches?.length === 0,
        "No invented payer address/deadline/medical necessity facts.",
        draft.validation,
      ),
      assertCase(
        draft.validation?.has_human_review_disclaimer === true,
        "Human-review disclaimer exists.",
        draft.validation,
      ),
      assertCase(
        typeof draft.artifact_id === "string" && draft.artifact_id.startsWith("artifact_"),
        "Artifact id returned.",
        draft.artifact_id,
      ),
    ]),
    ...fixtureClassificationCases(),
  ];

  const report = {
    ok: cases.every((testCase) => testCase.ok),
    system: 14,
    name: "expanded_eval_suite",
    created_at: new Date().toISOString(),
    elapsed_ms: Date.now() - startedAt,
    root_summary: {
      denial_id: root.denial_id,
      bucket: root.bucket,
      status: root.status,
      retrieved_chunk_ids: root.retrieved_chunk_ids,
    },
    draft_summary: {
      denial_id: draft.denial_id,
      artifact_id: draft.artifact_id,
      citation_ids: draft.citation_ids,
      model: draft.model,
    },
    cases,
  };

  writeEvalReport("system-14-expanded-eval.json", report);
  assertReportPassed(report);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
