# ClaimCompass Deployment Notes

Last updated: 2026-06-03

This is the System 17 deployment integration plan for the hackathon demo.
Deployment is intentionally guarded because Cloud Run, Cloud Build, Artifact
Registry, Gemini, Document AI, and network egress can create billable usage.

## Current Target

- Project: `claimcompass-497412`
- Region: `us-central1`
- Cloud Run service: `claimcompass-demo`
- Min instances: `0` by default
- Max instances: `2` for hackathon cost control
- Frontend/API: Next.js app with server-side route handlers
- Agent execution path: server route calls the existing RootAgent and
  DrafterAgent smoke scripts, which use Gemini and MongoDB MCP.

## Required Secrets

These exist in Secret Manager and are referenced by the deployment script:

- `mongodb-uri` -> exposed as `MONGODB_URI`
- `documentai-processor-id` -> exposed as `DOCUMENT_AI_PROCESSOR_ID`
- `documentai-location` -> exposed as `DOCUMENT_AI_LOCATION`

The deployed demo route currently depends on the already-extracted synthetic
golden denial. `scripts/document-ai/process-golden-eob.mjs` still shells out to
`gcloud` for Secret Manager and access tokens, so do not rely on hosted
Document AI re-processing until that script is refactored to use first-party
Google client libraries or metadata-server credentials.

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
4. Click **Run golden demo**
5. Confirm `/demo/denials/demo_denial_001` shows:
   - Agent trace
   - Corrected-claim result
   - Citation chips
   - MongoDB before/after diff
   - Save-as-rule button

## Cost Notes

- Keep Cloud Run `min-instances=0` until the final recording window.
- Do not enable dedicated Atlas Search Nodes.
- Do not upgrade Atlas from M0.
- Do not paste real PHI or real payer documents into the hosted demo.

## Official References

- Cloud Run deploy from source:
  https://cloud.google.com/run/docs/deploying-source-code
- Cloud Run secrets:
  https://cloud.google.com/run/docs/configuring/services/secrets
- Cloud Run min instances and billing:
  https://cloud.google.com/run/docs/configuring/min-instances
