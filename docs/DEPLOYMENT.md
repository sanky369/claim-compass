# ClaimCompass Deployment Notes

Last updated: 2026-06-09

This is the System 17 deployment integration plan for the hackathon demo.
Deployment is intentionally guarded because Cloud Run, Cloud Build, Artifact
Registry, Gemini, Document AI, and network egress can create billable usage.

## Current Hosted Demo

- URL: `https://claimcompass-demo-ss3fmrraoa-uc.a.run.app`
- Service: `claimcompass-demo`
- Region: `us-central1`
- Current serving revision: `claimcompass-demo-00006-n7p`
- Traffic: `100%` to latest revision
- Min instances: `0`
- Max instances: `2`
- Runtime service account:
  `834613361298-compute@developer.gserviceaccount.com`

Verified on 2026-06-09 after the live-MCP hosted refactor:

- `/api/health` returns `ok`.
- `/api/demo/sample-pdf` returns
  `golden-bcbs-tx-90837-missing-modifier-eob.pdf` as `application/pdf`.
- `/api/demo/run` with `mode: "sample_pdf"` completed from Cloud Run with run
  id `run_1781036034323_405e5753`.
- Hosted run returned `live_mcp: true` and completed in `14747ms`.
- The hosted branch performs live `gemini-embedding-001` embedding and live
  MongoDB MCP `aggregate` with `$vectorSearch`, `find`, `update-many`, and
  `insert-many`.
- Result page `/demo/denials/demo_denial_001?run=run_1781036034323_405e5753`
  renders only the fresh run-scoped trace labels, source PDF/GCS URI,
  corrected-claim guidance, citations, MongoDB write-back proof, and
  save-as-rule action.
- Save-as-rule endpoint returned `live_mcp: true` with rule id
  `rule_1781036075633_fe26ed26`.

## Current Target

- Project: `claimcompass-497412`
- Region: `us-central1`
- Cloud Run service: `claimcompass-demo`
- Min instances: `0` by default
- Max instances: `2` for hackathon cost control
- Frontend/API: Next.js app with server-side route handlers
- Agent execution path: local release checks run the full RootAgent and
  DrafterAgent smoke scripts with Gemini, Document AI, MongoDB MCP, and Atlas
  Vector Search. The hosted Cloud Run demo runs live Gemini embedding plus
  MongoDB MCP vector retrieval and write-back, while labeling Document AI
  extraction and DrafterAgent generation as replay/reuse for recording
  stability.

## Required Secrets

These exist in Secret Manager and are referenced by the deployment script:

- `mongodb-uri` -> exposed as `MONGODB_URI`
- `documentai-processor-id` -> exposed as `DOCUMENT_AI_PROCESSOR_ID`
- `documentai-location` -> exposed as `DOCUMENT_AI_LOCATION`
- `gcs-upload-bucket` -> exposed as `GCS_UPLOAD_BUCKET`

The deployed sample-PDF route uses the synthetic golden PDF committed under
`docs/test-documents/pdf/`. It uploads that known file to the configured GCS
bucket through the Google Cloud Storage JSON API, processes it with Document AI,
and then runs RootAgent/DrafterAgent. The script reads secrets from Cloud Run
environment variables first and falls back to local `gcloud` only for local
development.

## Guarded Deploy

The deploy helper refuses to run unless the operator explicitly opts in:

```bash
CONFIRM_CLOUD_RUN_DEPLOY=yes scripts/deploy/cloud-run-frontend.sh
```

The script uses Cloud Run source deployment:

```bash
gcloud run deploy claimcompass-demo --source .
```

Google's Cloud Run source deployment documentation says `gcloud run deploy`
with `--source` builds and deploys a service from local source. If a Dockerfile
is not present, Cloud Run uses Google Cloud buildpacks; source deployment can
also create/use Artifact Registry for built containers.

The script attaches secrets as environment variables using Cloud Run
`--update-secrets`, and it keeps `--min-instances 0`. Google documents that
minimum instances kept running while idle do incur billing costs, so only set
`min-instances=1` for the short recording window if the cold start is too slow.

## Post-Deploy Verification

After deploy, verify:

```bash
SERVICE_URL="$(gcloud run services describe claimcompass-demo \
  --region us-central1 \
  --format='value(status.url)')"

open "$SERVICE_URL"
curl "$SERVICE_URL/api/health"
```

Manual browser flow:

1. `/`
2. `/signin`
3. `/demo/denials/new`
4. Open the linked sample PDF.
5. Click **Import sample PDF and run**
6. Confirm `/demo/denials/demo_denial_001` shows:
   - Agent trace
   - Source PDF filename and GCS URI
   - Corrected-claim result
   - Citation chips
   - MongoDB before/after diff
   - Save-as-rule button

## Cloud Run to Atlas Connectivity

Cloud Run services do not have a stable outbound IP by default. Atlas network
access must be handled before the hosted sample-PDF run can pass.

Fast hackathon option:

- Temporarily allow `0.0.0.0/0` in Atlas Network Access for the `ClaimCompass`
  project only during final hosted testing/recording.
- Keep the Atlas app user least-privilege: `readWrite@claimcompass`, not Atlas
  admin.
- Remove the broad allowlist entry immediately after submission.

More production-like option:

- Use Serverless VPC Access plus Cloud NAT/static egress, then allowlist only
  that static egress IP in Atlas.
- This is safer, but it adds setup time and potential network/NAT cost. Do not
  add it during the hackathon unless explicitly approved.

For final testing, record which option was used in the submission checklist and
clean up any temporary broad allowlist entry after the video is captured.

Current final-recording choice:

- Temporary Atlas `0.0.0.0/0` allowlist is enabled for Cloud Run egress.
- It is marked `TEMP ClaimCompass Cloud Run final recording; remove after
  Devpost`.
- It expires automatically on `2026-06-12T00:00:00Z`.
- Remove it manually immediately after recording/submission if possible:

```bash
atlas accessLists delete 0.0.0.0/0 \
  --projectId 6a184fe615d35c4c48801c17 \
  --force
```

## Cost Notes

- Keep Cloud Run `min-instances=0` until the final recording window.
- Do not enable dedicated Atlas Search Nodes.
- Do not upgrade Atlas from M0.
- Do not paste real PHI or real payer documents into the hosted demo.
- Remove any temporary broad Atlas network allowlist entry after submission.
- Google Cloud budgets exist for project `claimcompass-497412`: `Budget for
  ClaimCompass` at INR 1000 and `ClaimCompass Hackathon Budget` at INR 4500,
  both with 50%, 90%, and 100% thresholds. These are alerts, not hard spend
  caps.

## Official References

- Cloud Run deploy from source:
  https://cloud.google.com/run/docs/deploying-source-code
- Cloud Run secrets:
  https://cloud.google.com/run/docs/configuring/services/secrets
- Cloud Run min instances and billing:
  https://cloud.google.com/run/docs/configuring/min-instances
