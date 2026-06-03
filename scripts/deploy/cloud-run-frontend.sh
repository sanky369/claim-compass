#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-claimcompass-497412}"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-claimcompass-demo}"

if [[ "${CONFIRM_CLOUD_RUN_DEPLOY:-}" != "yes" ]]; then
  cat <<MSG
Refusing to deploy without explicit approval.

Cloud Run, Cloud Build, Artifact Registry, Gemini, Document AI, and network
egress can create billable usage. Re-run with:

  CONFIRM_CLOUD_RUN_DEPLOY=yes scripts/deploy/cloud-run-frontend.sh

Defaults:
  project: ${PROJECT_ID}
  region:  ${REGION}
  service: ${SERVICE}
  min instances: 0
MSG
  exit 1
fi

gcloud config set project "${PROJECT_ID}" >/dev/null

gcloud run deploy "${SERVICE}" \
  --source . \
  --region "${REGION}" \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 2 \
  --cpu 1 \
  --memory 1Gi \
  --timeout 300 \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GOOGLE_CLOUD_LOCATION=global,MONGODB_DATABASE=claimcompass" \
  --update-secrets "MONGODB_URI=mongodb-uri:latest,DOCUMENT_AI_PROCESSOR_ID=documentai-processor-id:latest,DOCUMENT_AI_LOCATION=documentai-location:latest"
