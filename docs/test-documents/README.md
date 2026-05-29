# ClaimCompass Test Documents

These files are synthetic test documents for the ClaimCompass hackathon demo and evals.

They are intentionally **not real EOBs**, **not real payer templates**, and **not PHI**. Every person, provider, member ID, claim ID, address, and dollar amount is invented for testing.

## Files

- `pdf/golden-bcbs-tx-90837-missing-modifier-eob.pdf` — primary golden-path EOB-style denial for the live OCR demo.
- `pdf/edge-aetna-90791-prior-auth-denial.pdf` — prior-authorization denial PDF for evals and non-golden testing.
- `pdf/edge-bcbs-tx-90834-pos-mismatch-denial.pdf` — place-of-service mismatch PDF for corrected-claim evals.
- `pdf/edge-uhc-90837-credentialing-denial.pdf` — credentialing/provider-eligibility PDF for non-golden bucket testing.
- `rendered/*.png` — rendered first-page previews used to visually verify PDF layout.
- `golden-bcbs-tx-90837-missing-modifier-eob.txt` — text source for the golden-path EOB-style denial.
- `golden-bcbs-tx-90837-missing-modifier-paste-fallback.txt` — same case as paste-ready text if PDF/OCR fails.
- `edge-aetna-90791-prior-auth-denial.txt` — true-appeal/prior-auth style edge case for evals.
- `edge-bcbs-tx-90834-pos-mismatch-denial.txt` — corrected-claim edge case for place-of-service mismatch.
- `edge-uhc-90837-credentialing-denial.txt` — credentialing-ish edge case for non-golden bucket testing.
- `manifest.json` — machine-readable index of the test corpus and expected buckets.

## Golden Demo Case

The live hackathon demo should use:

`pdf/golden-bcbs-tx-90837-missing-modifier-eob.pdf`

Use `golden-bcbs-tx-90837-missing-modifier-paste-fallback.txt` only if PDF upload or OCR is unavailable during the demo.

Expected result:

- payer: `bcbs_tx`
- CPT: `90837`
- CARC: `CO-45`
- RARC: `N179`
- bucket: `corrected_claim`
- next action: submit a corrected claim with telehealth modifier `95`

## Safety Rules

- Do not replace these with real payer documents unless all PHI/IP risk is cleared.
- Keep the "DEMO DATA - NOT REAL PHI" watermark on any document shown in the UI or video.
- The PDF text intentionally omits the expected bucket/action answer key so the agent must infer the right action from the document content.
