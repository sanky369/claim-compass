# ClaimCompass Final Testing Checklist

Last updated: 2026-06-08

Use this checklist before recording or submitting to Devpost. Keep all testing
synthetic. Do not upload, paste, record, or screenshot real PHI.

## 1. Local Release Checks

Current external blocker found on 2026-06-08:

- `npm run lint`, `npm run build`, `cd claimcompass-agent && uv run pytest tests/unit`,
  and `npm run eval:agents-cli` pass.
- MongoDB-backed smokes are blocked from this machine because Atlas rejects the
  current network path with a TLS/internal-alert server selection error. Atlas
  CLI auth is also expired, so Codex cannot add the current IP allowlist entry
  non-interactively.

Before running MongoDB-backed final tests, run:

```bash
atlas auth login
```

Then either add the current IP as a `/32` Atlas Network Access entry or use the
temporary hackathon hosted-testing allowlist described in
`docs/DEPLOYMENT.md`.

Run from the repository root:

```bash
npm run lint
npm run build
npm run eval:minimal
npm run draft:smoke
npm run eval:expanded
```

If local `.env.local` has a stale Atlas URI, use Secret Manager for the smoke
scripts without printing the secret:

```bash
CLAIMCOMPASS_USE_SECRET_MANAGER=yes npm run eval:minimal
CLAIMCOMPASS_USE_SECRET_MANAGER=yes npm run draft:smoke
CLAIMCOMPASS_USE_SECRET_MANAGER=yes npm run eval:expanded
```

Run from the ADK project:

```bash
cd claimcompass-agent
uv run pytest tests/unit
```

Optional if you are comfortable with Gemini eval cost:

```bash
npm run eval:agents-cli
```

## 2. Local Browser Dress Rehearsal

Start the app:

```bash
npm run dev
```

Flow:

1. Open `http://localhost:3000`.
2. Click `Sign in` or `Decode my denial`.
3. Continue through the demo gate.
4. On `/demo/denials/new`, click `Open sample PDF`.
5. Confirm the PDF name is `golden-bcbs-tx-90837-missing-modifier-eob.pdf`.
6. Click `Import sample PDF and run`.
7. Confirm the result page shows:
   - `DEMO DATA - NOT REAL PHI`
   - source PDF filename
   - GCS URI
   - Document AI extraction context
   - MongoDB MCP / `$vectorSearch` trace
   - corrected-claim result
   - citation chip for `pb_bcbs_tx_demo_psychotherapy_90_codes_modifier_missing_01`
   - before/after MongoDB diff
   - save-as-rule action
8. Click save-as-rule once and confirm success.

Fallback:

- If Document AI, GCS, or local credentials fail during rehearsal, use
  `Run from seeded extraction`.
- Do not use pasted real text as a fallback.

## 3. Hosted Deployment Gate

Do not deploy without explicit cost approval.

Prepared deploy command:

```bash
CONFIRM_CLOUD_RUN_DEPLOY=yes scripts/deploy/cloud-run-frontend.sh
```

After deploy:

```bash
SERVICE_URL="$(gcloud run services describe claimcompass-demo \
  --region us-central1 \
  --format='value(status.url)')"

curl "$SERVICE_URL/api/health"
```

Hosted checks:

1. `/api/health` returns `ok`.
2. Cloud Run service account can read Secret Manager.
3. Cloud Run can upload the sample PDF to GCS.
4. Cloud Run can call Document AI.
5. Cloud Run can call Gemini / Vertex APIs.
6. Cloud Run can reach MongoDB Atlas.
7. Hosted `Import sample PDF and run` succeeds twice.
8. If cold start is too slow, temporarily set `min-instances=1` only for the
   recording window, then scale back to `0`.

Atlas network access:

- Fast hackathon route: temporary `0.0.0.0/0` allowlist, least-privilege DB
  user, remove after recording.
- Production-like route: static egress through Serverless VPC Access / NAT,
  only if approved.

## 4. Recording Checklist

Before recording:

- Close tabs that show secrets, billing, Atlas URI, Cloud logs with private IDs,
  or local `.env`.
- Use a clean browser window.
- Keep the browser at a laptop-friendly width where the trace and diff are
  legible.
- Open MongoDB Atlas Data Explorer only if you can avoid showing secrets or
  account-private pages.

Three-minute structure:

1. 0:00-0:15: ClaimCompass and stack.
2. 0:15-0:35: therapist denial problem.
3. 0:35-0:50: open synthetic sample PDF and start import.
4. 0:50-1:50: trace panel: Document AI, Gemini, MongoDB MCP, `$vectorSearch`.
5. 1:50-2:15: result page and corrected-claim guidance.
6. 2:15-2:40: MongoDB before/after diff.
7. 2:40-2:55: save as billing rule.
8. 2:55-3:00: close with synthetic-data safety and MongoDB track.

## 5. Cleanup After Submission

- Set Cloud Run `min-instances=0`.
- Remove any temporary Atlas `0.0.0.0/0` network access entry.
- Delete temporary Agent Runtime deployments if any were created with idle
  instances.
- Keep budgets and billing alerts active until all hackathon resources are
  confirmed idle or deleted.
