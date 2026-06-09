const now = new Date().toISOString();

const payers = [
  {
    payer_id: "bcbs_tx_demo",
    payer_name: "BCBS Texas Demo",
    short_name: "BCBS-TX",
  },
  {
    payer_id: "aetna_demo",
    payer_name: "Aetna Demo",
    short_name: "Aetna",
  },
];

const families = [
  {
    cpt_family: "psychotherapy_90_codes",
    label: "psychotherapy 90-series claims",
    example_cpts: ["90834", "90837"],
  },
  {
    cpt_family: "evaluation_90791",
    label: "initial behavioral health evaluation claims",
    example_cpts: ["90791"],
  },
  {
    cpt_family: "telehealth_modifiers",
    label: "telehealth modifier and POS claims",
    example_cpts: ["90837", "90834", "90791"],
  },
];

const themes = [
  {
    theme: "modifier_missing",
    label: "missing telehealth modifier",
    denial_codes: ["CO-45", "N179"],
    action_bucket: "corrected_claim",
    body:
      "When the service was delivered by telehealth and the claim has telehealth place of service but no telehealth modifier, treat the denial as a claim-format correction before treating it as a clinical appeal. Verify the session code, add the expected telehealth modifier when supported by the encounter documentation, and resubmit as a corrected claim with a short note that the original claim omitted the telehealth indicator.",
  },
  {
    theme: "pos_mismatch",
    label: "place of service mismatch",
    denial_codes: ["CO-45"],
    action_bucket: "fix_resubmit",
    body:
      "When the modifier and place of service tell different stories, classify the denial as a clean-claim correction. Compare the encounter location, billing system place of service, and claim modifiers. If the note supports telehealth but the claim used an office place of service, correct the place of service and resubmit rather than opening an appeal.",
  },
  {
    theme: "units_mismatch",
    label: "units or duration mismatch",
    denial_codes: ["CO-45"],
    action_bucket: "fix_resubmit",
    body:
      "For psychotherapy claims, a units or duration mismatch is usually a structured claim problem. Confirm the billed CPT matches the documented face-to-face time, remove duplicate units, and resubmit the corrected claim. Escalate only if the claim is priced incorrectly after the clean corrected claim is accepted.",
  },
  {
    theme: "prior_auth",
    label: "prior authorization review",
    denial_codes: ["CO-197", "N130"],
    action_bucket: "true_appeal",
    body:
      "If the denial states that authorization was absent or not matched, first check whether an authorization number exists in the scheduling or EHR record. If a valid authorization exists, submit a reconsideration package with the authorization number and date range. If none exists, mark the claim for human review before any appeal language is generated.",
  },
  {
    theme: "timely_filing",
    label: "timely filing review",
    denial_codes: ["CO-29"],
    action_bucket: "payer_followup",
    body:
      "For timely filing denials, the next best action depends on proof of original submission. Retrieve clearinghouse acceptance, payer acknowledgement, and any resubmission history. If proof exists inside the filing window, prepare a payer follow-up package. If proof is missing, route to human review before advising write-off.",
  },
];

function titleCase(value) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildBody({ payer, family, theme }) {
  const cpts = family.example_cpts.join(", ");
  const payerInstruction =
    payer.payer_id === "bcbs_tx_demo"
      ? "For the BCBS-TX demo path, preserve the corrected-claim framing when CPT 90837 was delivered by telehealth and the modifier is missing."
      : "For the Aetna demo path, confirm payer portal notes and avoid inventing appeal deadlines or addresses.";

  return [
    `DEMO DATA - NOT REAL PHI. This synthetic ${payer.short_name} playbook chunk covers ${family.label} for CPT examples ${cpts}.`,
    theme.body,
    payerInstruction,
    `Recommended bucket: ${theme.action_bucket}. Use this chunk as decision support only; a billing specialist must review the final action before submission.`,
  ].join(" ");
}

export function buildPlaybookChunks() {
  const chunks = [];

  for (const payer of payers) {
    for (const family of families) {
      for (const theme of themes) {
        const _id = [
          "pb",
          payer.payer_id,
          family.cpt_family,
          theme.theme,
          "01",
        ].join("_");

        chunks.push({
          _id,
          playbook_id: _id,
          demo_data_notice: "DEMO DATA - NOT REAL PHI",
          demo_only: true,
          payer_id: payer.payer_id,
          payer_name: payer.payer_name,
          title: `${payer.short_name}: ${titleCase(theme.theme)} for ${family.label}`,
          body: buildBody({ payer, family, theme }),
          source_url: `synthetic://claimcompass/playbooks/${payer.payer_id}/${family.cpt_family}/${theme.theme}`,
          scope: {
            cpt_family: family.cpt_family,
            example_cpts: family.example_cpts,
            denial_codes: theme.denial_codes,
            theme: theme.theme,
            action_bucket: theme.action_bucket,
          },
          embedding_model: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2",
          embedding_dimensions: 1536,
          embedding: null,
          created_at: now,
          updated_at: now,
        });
      }
    }
  }

  return chunks;
}
