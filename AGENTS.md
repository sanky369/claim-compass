# ClaimCompass Agent Instructions

These instructions apply to the whole ClaimCompass repository unless a deeper
`AGENTS.md` file gives narrower instructions.

ClaimCompass is a Google Cloud Rapid Agent Hackathon project for the MongoDB
track. It is a denial-resolution copilot for independent healthcare providers,
focused first on one synthetic golden path: CPT `90837`, missing telehealth
modifier, denial codes `CO-45` + `N179`.

## Core Build Contract

- Follow [docs/HACKATHON_BP_IMPLEMENTATION.md](docs/HACKATHON_BP_IMPLEMENTATION.md) as the source of truth for sequence, status, and ship gates.
- Follow [.agents-cli-spec.md](.agents-cli-spec.md) for agent behavior, tool names, data model, and demo contract.
- Build the golden path first. Do not expand into credentialing, broad revenue-cycle automation, multi-payer support, or production auth until the tracker says to.
- Runtime AI must stay on Google Cloud: Gemini generation, Gemini embeddings, Document AI, ADK / Agent Runtime.
- MongoDB Atlas is the retrieval and operational data layer. Agent database reads/writes should go through the official MongoDB MCP Server in the agent path.
- Do not replace MongoDB Atlas Vector Search with Agent Builder Data Stores, RAG Engine, or Agent Platform Vector Search for v1.

## Security and Healthcare Data Rules

- Treat this repo as healthcare-adjacent even though the demo uses synthetic data.
- Never commit, paste, log, screenshot, or display real PHI, patient names, subscriber IDs, claim control numbers, payer portal screenshots, EOBs, or real payer documents.
- All claim/demo content must be synthetic and visibly marked `DEMO DATA - NOT REAL PHI`.
- Do not use real payer logos, copied payer EOB templates, or scraped payer policy text unless it is clearly public and cited in a safe way.
- Generated guidance is decision support, not legal, clinical, billing, or payer-policy advice. Keep human-review disclaimers in user-facing outputs.
- Do not invent payer addresses, policy requirements, appeal deadlines, or medical necessity facts.
- Keep citations tied to actual retrieved `payer_playbooks` documents.
- If the user provides secrets or PHI in chat, tell them it should be rotated/redacted and move to a safer local/Secret Manager workflow.

## Secrets and Credentials

- Never commit `.env`, `.env.local`, Atlas URIs, API keys, passwords, OAuth tokens, service account keys, or downloaded credential files.
- Use Google Secret Manager for deployed secrets. Current expected secrets include:
  - `mongodb-uri`
  - `documentai-processor-id`
  - `documentai-location`
  - `gcp-project-id`
- Local development may use ignored `.env.local`; keep it out of screenshots and command output.
- Do not echo full connection strings or passwords. When reporting status, say the secret exists rather than printing its value.
- Prefer least-privilege users. The Atlas app user should be scoped to `readWrite@claimcompass`, not Atlas admin.

## Cost Controls

- Ask for explicit human approval before creating, upgrading, or enabling paid infrastructure.
- Default to free or lowest-cost resources:
  - Atlas `M0` unless the user approves a paid tier.
  - Cloud Run min instances `0` unless explicitly approved.
  - Agent Runtime deployments should be short-lived during tests unless the user approves ongoing cost.
- Do not run `agents-cli deploy`, Terraform, `gcloud run deploy`, paid Atlas upgrades, or long-running jobs without confirming the cost implication first.
- Keep backups, BI Connector, always-on compute, and extra replicas off unless the user explicitly approves.
- Google Cloud budgets exist, but they do not catch MongoDB Atlas spend. Treat Atlas changes separately.
- Delete or scale down temporary deploys after proof if they would incur idle cost.
- Before adding a new Google Cloud API, Atlas feature, or third-party service, explain why it is needed and whether it can create cost.

## Current Infrastructure Expectations

- Google Cloud project: `claimcompass-497412`.
- Atlas project: `ClaimCompass`, project ID `6a184fe615d35c4c48801c17`.
- Atlas cluster: `ClaimCompassCluster`, GCP `CENTRAL_US`, tier `M0`.
- MongoDB database: `claimcompass`.
- Document AI processor exists and its ID/location are in Secret Manager.
- The hello-world Agent Runtime deployment was proven and then deleted to avoid idle cost.

Verify current state before assuming it is still true.

## MongoDB and MCP Rules

- Use the verified MCP tool names from [.agents-cli-spec.md](.agents-cli-spec.md).
- Local `mongodb-mcp-server@1.11.0` exposes `update-many`, not `update-one`; use `update-many` with a unique `denial_id` filter for v1 write-back.
- Keep agent-path reads/writes through MCP. Direct MongoDB driver scripts are allowed only for bootstrap, setup checks, migrations, and test fixtures.
- Vector retrieval later must use MCP `aggregate` with `$vectorSearch` as the first stage.
- Do not enable read-only MCP mode for the demo smoke path because the hackathon demo must prove write-back.

Useful commands:

```bash
npm run mongodb:bootstrap
npm run mongodb:mcp-tools
npm run mongodb:mcp-smoke
```

## Development and Verification

- Run targeted checks after every meaningful change.
- For repo-wide web checks, `npm run lint` should pass.
- For the ADK scaffold, run relevant tests from `claimcompass-agent/` with `uv run pytest`.
- Do not claim Systems in the tracker are `DONE` unless their acceptance checks passed.
- If blocked by credentials, cloud state, missing billing, or unavailable regions, mark the tracker honestly as `PARTIAL` or blocked rather than faking progress.
- Keep logs and trace events useful for the demo, but never include secret values or real PHI.

## Next.js Rules

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all
differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

- Before changing Next.js app code, inspect the current files and the relevant local Next docs.
- Do not redesign the whole app unless the tracker calls for frontend work.
- The demo UI should route from the landing page into a narrow hackathon demo flow, not a broad production product.

## Git and File Hygiene

- Preserve unrelated user changes. Do not revert files you did not intentionally modify.
- Keep generated caches, `.venv`, `.next`, logs, `.env*`, and secrets out of commits.
- Prefer small, tracker-aligned commits once the user asks to commit.
- Update docs when project reality changes, especially infrastructure IDs, completed systems, or tool-name discoveries.
