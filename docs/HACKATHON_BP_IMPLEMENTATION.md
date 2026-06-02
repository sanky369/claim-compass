# ClaimCompass Hackathon Implementation Tracker

Last updated: 2026-06-02

Primary blueprint: `docs/HACKATHON_BLUEPRINT.md`

Goal: build ClaimCompass as a Gemini-powered, Google Cloud Agent Builder / ADK agent for the Google Cloud Rapid Agent Hackathon MongoDB track. The demo must prove: denied claim in, Document AI extraction, MongoDB Atlas Vector Search retrieval through MongoDB MCP, agent decision, generated guidance, MongoDB write-back, visible trace.

## Current Known Environment

| Item | Value / Status |
|---|---|
| GCP project name | `ClaimCompass` |
| GCP project ID | `claimcompass-497412` |
| GCP project number | `834613361298` |
| Active gcloud account last verified | `sanky369@gmail.com` |
| Application Default Credentials | Verified working on 2026-05-25 |
| Billing | Verified enabled on 2026-05-25 |
| Core APIs enabled | Vertex/Agent Platform, Document AI, Cloud Run, Cloud Build, Artifact Registry, Secret Manager, Storage, Logging/Monitoring/Trace |
| Agents CLI | Installed, version `0.2.0`; skills are present on disk even if `agents-cli info` reports `Installed skills: none` |
| Repo docs | Blueprints moved to `docs/` |
| Devpost deadline | June 11, 2026 at 2:00 PM PDT / 10:00 PM Europe/London |
| Internal ship target | June 10, 2026 at 12:00 PM Europe/London |
| GCP budget alerts | `ClaimCompass Hackathon Budget` at INR 4,500 with 50/90/100 thresholds; an additional existing `Budget for ClaimCompass` at INR 1,000 also alerts earlier |
| Document AI processor | `claimcompass-form-parser`, location `us`, processor ID `fbdda7c20c9e1daf`, state `ENABLED` |
| Secret Manager config | `documentai-processor-id`, `documentai-location`, `gcp-project-id` created |
| ADK scaffold | `claimcompass-agent/` created with Agents CLI on 2026-05-27 |
| Agent Runtime hello deploy | Proven on 2026-05-27 with reasoning engine `projects/834613361298/locations/us-east1/reasoningEngines/6126513974339960832`, remote query succeeded, then deployment deleted to avoid min-instance cost |
| Atlas Vector Search | `playbook_vec` on `claimcompass.payer_playbooks`, `READY`, queryable, verified on 2026-05-30 |

## Status Legend

| Status | Meaning |
|---|---|
| `DONE` | Verified in this repo or cloud project. |
| `READY` | Requirements are clear; next build step can start. |
| `TODO` | Not started. |
| `BLOCKED` | Needs external setup, credentials, account access, or a product decision. |
| `VERIFY` | Believed done, but must be checked live before depending on it. |

## Master Build Sequence

| Order | System | Status | Exit Criteria |
|---:|---|---|---|
| 0 | Project guardrails and docs | DONE | Docs exist, scope is frozen, no non-Google AI runtime dependency. |
| 1 | Cloud project and cost controls | DONE | Project, billing, budget alert, APIs, ADC, region, and secrets policy confirmed. |
| 2 | Agent implementation spec | DONE | `.agents-cli-spec.md` exists and matches the hackathon blueprint. |
| 3 | Agents CLI / ADK scaffold and hello deploy | DONE | ADK backend runs locally and a hello-world Agent Runtime deploy is proven early. |
| 4 | MongoDB Atlas foundation | DONE | Free Atlas M0 cluster, DB, collections, service user, local access list, and secrets configured. |
| 5 | MongoDB MCP integration | DONE | MCP smoke passed with `find`, `aggregate`, `insert-many`, `update-many`, and `count`. |
| 6 | Synthetic demo data | DONE | Clean synthetic EOB PDF plus paste-text fallback exist, no PHI, no payer logos/templates. |
| 7 | Document AI tool | DONE | PDF in Cloud Storage processes through Document AI and updates the denial doc through MongoDB MCP. |
| 8 | Playbook chunks and embeddings | DONE | 30 fresh payer playbook chunks embedded with `gemini-embedding-001`. |
| 9 | Atlas Vector Search | DONE | `playbook_vec` index exists and `$vectorSearch` returns sane top-k chunks. |
| 10 | PolicyAgent | DONE | Given denial context, retrieves playbook chunks and CARC/RARC descriptions through MCP. |
| 11 | RootAgent orchestration and classification | TODO | Runs extract -> retrieve -> classify and writes trace events for the golden denial. |
| 12 | Minimal eval gate | TODO | Agents CLI eval verifies golden-path retrieval/classification before drafting/UI work. |
| 13 | DrafterAgent and citation validation | TODO | Generates corrected-claim guidance with valid playbook citations and inserts artifact. |
| 14 | Expanded eval suite | TODO | Agents CLI eval covers drafting, citations, fallbacks, and edge cases. |
| 15 | Landing page to demo route | TODO | Current landing page routes into a one-button demo gate and then the upload flow. |
| 16 | Next.js agent demonstration UI | TODO | Upload/paste, trace panel, result view, citations, before/after diff, save-as-rule. |
| 17 | Deployment integration | TODO | ADK backend deployed to Agent Runtime or fallback Cloud Run; frontend deployed to Cloud Run. |
| 18 | Hosted dress rehearsal | TODO | Full timed hosted run succeeds, cold start measured, deterministic backup recording captured. |
| 19 | README and submission assets | TODO | Judge-readable README, architecture image, demo script, screenshots, public repo/license. |
| 20 | Recording and Devpost submission | TODO | Hosted URL, repo URL, MongoDB track selected, 3-minute video, written description. |

## Calendar and Pacing

External deadline: **June 11, 2026 at 2:00 PM PDT / 10:00 PM Europe/London**.

Internal target: **June 10, 2026 at 12:00 PM Europe/London**, leaving a 34-hour buffer for upload, video processing, Devpost issues, and last-minute access fixes.

| Date | Target Systems | Ship Gate |
|---|---|---|
| May 26 | Systems 1-2 | Cloud/cost state verified; `.agents-cli-spec.md` drafted. |
| May 27 | System 3 | ADK scaffold runs locally; hello-world Agent Runtime deploy proven. |
| May 28 | Systems 4-5 | Atlas foundation and MongoDB MCP smoke tests pass. |
| May 29 | Systems 6-7 | Synthetic EOB and Document AI extraction path works. |
| May 30-31 | Systems 8-9 | Playbook chunks embedded; `playbook_vec` index query returns sane results. |
| June 1 | System 10 | PolicyAgent retrieval works through MCP. |
| June 2 | System 11 | RootAgent classifies golden denial and writes trace events. |
| June 3 | System 12 | Minimal eval gate passes before drafting/UI expansion. |
| June 4 | Systems 13-14 | DrafterAgent artifact, citation validation, and expanded evals pass. |
| June 5-6 | Systems 15-16 | Landing-to-demo flow and agent demonstration UI work locally. |
| June 7 | System 17 | Hosted backend and frontend integration works. |
| June 8 | System 18 | Full hosted dress rehearsal and backup recording complete. |
| June 9 | System 19 | README, screenshots, Devpost copy, and repo polish complete. |
| June 10 | System 20 | Final video and submission uploaded by internal deadline. |
| June 11 | Buffer only | No new feature work unless submission is already safe. |

## Build Rules

- Build only the golden-path demo first: BCBS-TX / CPT 90837 / telehealth modifier missing / CO-45 + N179.
- Runtime AI must be Google Cloud only: Gemini, Gemini Embedding, Document AI.
- MongoDB Atlas Vector Search is the retrieval layer for the MongoDB track. Do not replace it with Agent Builder Data Stores, RAG Engine, or Agent Platform Vector Search.
- Every agent database read/write should go through the official MongoDB MCP Server.
- Use the real MongoDB MCP tool names. Do not invent names like `create-vector-search-index`.
- Keep secrets out of git and screenshots. Use Secret Manager or local `.env` ignored by git.
- Use Agent Studio only as a reference for terminology. The implementation path is code-first ADK + Agents CLI.
- If time slips, cut "save as billing rule" before cutting the trace panel, MongoDB vector retrieval, or MCP write-back.

## System 0: Project Guardrails and Docs

Status: `DONE`

Purpose: make sure every future chat or coding agent understands the scope, stack, and win condition.

Build / maintain:

- `docs/HACKATHON_BLUEPRINT.md`
- `docs/TECHNICAL_BLUEPRINT.md`
- `docs/README.md`
- `docs/HACKATHON_BP_IMPLEMENTATION.md`

Acceptance checks:

- Hackathon blueprint says "Google Cloud Agent Builder / ADK deployed to Agent Runtime / Vertex AI Agent Engine."
- MongoDB track fit is explicit.
- Out-of-scope list remains visible.
- No root-level duplicate blueprint files remain unless intentionally restored.

Resources:

- Hackathon overview: https://rapid-agent.devpost.com
- Hackathon general resources: https://rapid-agent.devpost.com/resources
- MongoDB resources: https://rapid-agent.devpost.com/details/mongodb-resources

## System 1: Cloud Project and Cost Controls

Status: `DONE`

Purpose: make sure we can build without surprise billing or auth drift.

Known setup:

- Project ID: `claimcompass-497412`
- Project number: `834613361298`
- Billing was verified enabled.
- ADC was verified working.
- Core APIs were enabled.
- GCP budget alerts exist:
  - `ClaimCompass Hackathon Budget`: INR 4,500, scoped to `projects/834613361298`, thresholds 50/90/100.
  - `Budget for ClaimCompass`: INR 1,000, scoped to `projects/834613361298`, thresholds 50/90/100. This stricter existing alert was left in place.
- Document AI Form Parser processor exists:
  - display name: `claimcompass-form-parser`
  - location: `us`
  - processor ID: `fbdda7c20c9e1daf`
  - endpoint: `https://us-documentai.googleapis.com/v1/projects/834613361298/locations/us/processors/fbdda7c20c9e1daf:process`
- Secret Manager config exists:
  - `documentai-processor-id`
  - `documentai-location`
  - `gcp-project-id`
- No Cloud Run services were listed during verification, so no always-on Cloud Run cost is currently present.

Next checks:

```bash
gcloud config list --format='text(core.account,core.project)'
gcloud auth application-default print-access-token >/dev/null && echo adc-ok
gcloud billing projects describe claimcompass-497412 --format='yaml(billingEnabled,billingAccountName)'
gcloud services list --enabled --project claimcompass-497412 --format='value(config.name)' | sort
```

Required APIs:

- `aiplatform.googleapis.com`
- `documentai.googleapis.com`
- `run.googleapis.com`
- `cloudbuild.googleapis.com`
- `artifactregistry.googleapis.com`
- `secretmanager.googleapis.com`
- `storage.googleapis.com`
- `logging.googleapis.com`
- `monitoring.googleapis.com`
- `cloudtrace.googleapis.com`
- `iamcredentials.googleapis.com`
- `cloudresourcemanager.googleapis.com`
- `serviceusage.googleapis.com`

Acceptance checks:

- GCP budget alert exists at **$50 USD** with email alerts at 50%, 90%, and 100%. Pub/Sub notification is not required.
- If MongoDB Atlas billing is enabled, an Atlas-side budget/alert is configured separately; Google Cloud budgets will not catch Atlas spend.
- Active gcloud project is `claimcompass-497412`.
- ADC token prints successfully.
- No unnecessary always-on compute resources are running.
- Document AI Form Parser processor exists in the chosen region, and its processor ID/region are stored in Secret Manager or local ignored `.env`.
- Cloud Run `min-instances=1` is not enabled until hosted rehearsal/recording day.

Resources:

- Cloud Billing budgets: https://cloud.google.com/billing/docs/how-to/budgets
- Service Usage: https://cloud.google.com/service-usage/docs
- Secret Manager: https://cloud.google.com/security/products/secret-manager

## System 2: Agent Implementation Spec

Status: `DONE`

Purpose: create the single file Agents CLI and any coding agent can use as the implementation contract.

Create:

- `.agents-cli-spec.md` created on 2026-05-26.

Minimum content:

- Overview: ClaimCompass revenue-recovery agent for denied claims.
- Use case: resolve `demo_denial_001`.
- Tools: MongoDB MCP, Document AI, Gemini generation, Gemini embeddings.
- Verified MongoDB MCP database tool names from the current official docs and local `mongodb-mcp-server@1.11.0` dry run:
  - `connect`
  - `find`
  - `aggregate`
  - `count`
  - `explain`
  - `insert-many`
  - `create-index`
  - `drop-index`
  - `update-many`
  - `rename-collection`
  - `create-collection`
  - `delete-many`
  - `drop-collection`
  - `drop-database`
  - `list-databases`
  - `list-collections`
  - `collection-indexes`
  - `collection-schema`
  - `collection-storage-size`
  - `db-stats`
  - `export`
  - `mongodb-logs`
  - `switch-connection`
- Local package note, 2026-05-28: `mongodb-mcp-server@1.11.0` exposes `update-many`, not `update-one`. Use `update-many` with a unique `denial_id` filter for v1 write-back unless a later MCP release exposes `update-one`.
- Sub-agents: RootAgent, PolicyAgent, DrafterAgent.
- Data sources: MongoDB Atlas collections and Cloud Storage EOB uploads.
- Safety rules: no PHI, demo data only, no payer logo use, human review disclaimer.
- Success criteria: full golden path writes `denials`, `generated_artifacts`, `trace_events`, and optionally `billing_rules`.

Acceptance checks:

- Spec matches `docs/HACKATHON_BLUEPRINT.md`.
- It explicitly says not to use Agent Builder Data Stores / RAG Engine for v1.
- It names MongoDB Atlas Vector Search as the grounding layer.
- It copies the verified MCP tool names above and states that the implementation must re-check them against the installed MCP server before coding traces.
- It defines the seven canonical buckets: `fix_resubmit`, `corrected_claim`, `payer_followup`, `credentialing`, `true_appeal`, `client_bill`, `write_off`.

Resources:

- Agents CLI workflow skill installed locally: `/Users/sanketdongre/.agents/skills/google-agents-cli-workflow/SKILL.md`
- Agents CLI scaffold skill: `/Users/sanketdongre/.agents/skills/google-agents-cli-scaffold/SKILL.md`
- ADK docs: https://adk.dev/

## System 3: Agents CLI / ADK Scaffold and Hello Deploy

Status: `DONE`

Purpose: create the code-first ADK backend that will become the actual hackathon agent, and de-risk Agent Runtime deployment before the real agent becomes complex.

Recommended shape:

- Keep the existing Next.js app as the frontend.
- Create an ADK backend folder, probably `agent/` or `claimcompass-agent/`.
- Keep config explicit and documented.

Completed shape:

- ADK backend folder: `claimcompass-agent/`
- Deployment target: `agent_runtime`
- Region: `us-east1`
- Scaffold command used:
  ```bash
  agents-cli scaffold create claimcompass-agent --agent adk --deployment-target agent_runtime --prototype --region us-east1 --agent-guidance-filename AGENTS.md --auto-approve
  ```
- Dependencies installed with:
  ```bash
  cd claimcompass-agent && agents-cli install
  ```
- Local unit smoke passed:
  ```bash
  uv run pytest tests/unit
  ```
- Local agent run passed:
  ```bash
  agents-cli run "Say hello from ClaimCompass and tell me the weather in SF."
  ```
- Hello Agent Runtime deploy succeeded:
  - resource: `projects/834613361298/locations/us-east1/reasoningEngines/6126513974339960832`
  - service account: `service-834613361298@gcp-sa-aiplatform-re.iam.gserviceaccount.com`
  - remote query succeeded through:
    ```bash
    agents-cli run "Say hello from the deployed ClaimCompass agent and tell me the weather in SF." \
      --url "https://us-east1-aiplatform.googleapis.com/v1/projects/834613361298/locations/us-east1/reasoningEngines/6126513974339960832" \
      --mode adk
    ```
- Important cost note: Agent Runtime deploy defaulted to `min_instances=1`, `max_instances=10`, CPU `4`, memory `8Gi`.
- Cleanup: hello deployment was deleted after remote proof to avoid ongoing min-instance cost.
- Verification after cleanup:
  ```bash
  agents-cli deploy --list
  # No Agent Runtime deployments found in claimcompass-497412 (us-east1).
  ```

Candidate commands:

```bash
agents-cli info
agents-cli scaffold create claimcompass-agent --agent adk --prototype --agent-guidance-filename AGENTS.md
```

If scaffolding inside an existing folder instead:

```bash
agents-cli scaffold enhance . --agent-directory agent
```

Do not run scaffold commands blindly if the repo structure has changed. Check the current tree first.

Acceptance checks:

- Agent backend has a manifest/config recognized by `agents-cli info`.
- `agents-cli run "hello"` or equivalent smoke test works.
- Agent model IDs are environment configurable.
- A trivial hello-world agent deploys to Agent Runtime / Vertex AI Agent Engine and can be called once.
- Any deployment notes, command flags, service account quirks, or region constraints are written back into this tracker or `.agents-cli-spec.md`.
- The hello deploy is cleaned up or scaled down if it creates ongoing cost.

Resources:

- Agents CLI / Starter Pack direction: https://github.com/GoogleCloudPlatform/agent-starter-pack
- ADK quickstart: https://adk.dev/get-started/quickstart/
- ADK agents: https://adk.dev/agents/
- ADK deploy to Agent Runtime: https://adk.dev/deploy/agent-runtime/

## System 4: MongoDB Atlas Foundation

Status: `DONE`

Purpose: create the MongoDB substrate that proves the MongoDB track.

Create:

- Atlas project/cluster, ideally co-located with Google Cloud region.
- Database: `claimcompass`
- Collections:
  - `denials`
  - `claims`
  - `payer_playbooks`
  - `generated_artifacts`
  - `billing_rules`
  - `trace_events`
  - `payers`
  - `carc`
  - `rarc`
- Fresh service user with least-privilege access for demo database.

Repo-side setup completed on 2026-05-28:

- Added `.env.example`.
- Added `npm run mongodb:bootstrap`.
- Added `scripts/mongodb/bootstrap-foundation.mjs`.
- Script creates the `claimcompass` collections, seeds the synthetic golden-path denial, and creates ordinary query indexes.
- Script intentionally leaves Atlas Vector Search index `playbook_vec` for System 9, after Gemini embeddings exist.

Atlas setup completed on 2026-05-28:

- Atlas org: `Tinkerbrains`
- Atlas project: `ClaimCompass`
- Atlas project ID: `6a184fe615d35c4c48801c17`
- Cluster: `ClaimCompassCluster`
- Tier: `M0`
- Cloud/region: GCP `CENTRAL_US`
- Database: `claimcompass`
- Local access list entry created for current dev IP.
- Database user: `claimcompass_app`
- Role: `readWrite@claimcompass`
- Local `.env.local` written; ignored by git.
- Google Secret Manager secret: `mongodb-uri`

Secrets:

- MongoDB connection string in Secret Manager or local ignored `.env`.
- Do not commit Atlas URI.

Acceptance checks:

- DONE: can connect from local dev.
- DONE: can insert and read a test doc.
- DONE: network access allows local development.
- DONE: service user is not a personal admin credential.

Run when Atlas URI is available:

```bash
cp .env.example .env.local
# Put MONGODB_URI in .env.local. Do not commit it.
npm run mongodb:bootstrap
```

Resources:

- MongoDB Atlas docs: https://www.mongodb.com/docs/atlas/
- MongoDB MCP Server docs: https://www.mongodb.com/docs/mcp-server/get-started/
- MongoDB MCP tools: https://www.mongodb.com/docs/mcp-server/tools/

## System 5: MongoDB MCP Integration

Status: `DONE`

Purpose: prove that database work is done through MCP, not a hidden direct driver path.

Build:

- Configure official MongoDB MCP Server.
- Wire it into ADK with `McpToolset`.
- Capture the actual installed MCP server tool list before coding agent traces. Compare it with the official docs list in System 2 and update `.agents-cli-spec.md` if the installed version differs.
- Create a RootAgent stub that calls:
  - `find`
  - `aggregate`
  - `insert-many`
  - `update-many` with a unique `denial_id` filter. `mongodb-mcp-server@1.11.0` does not expose `update-one`.
  - `count`

Repo-side setup completed on 2026-05-28:

- Installed local dev packages:
  - `mongodb-mcp-server@1.11.0`
  - `@modelcontextprotocol/sdk`
  - `mongodb`
- Added `npm run mongodb:mcp-tools`.
- Added `npm run mongodb:mcp-smoke`.
- Dry-run verified enabled tools include `find`, `aggregate`, `insert-many`, `update-many`, and `count`.

Real MCP smoke completed on 2026-05-28:

- `npm run mongodb:mcp-smoke` passed against Atlas.
- Inserted a smoke denial.
- Read the denial with MCP `find`.
- Ran a grouped aggregation with MCP `aggregate`.
- Updated the denial with MCP `update-many`.
- Counted the denial with MCP `count`.
- Inserted a smoke trace event with MCP `insert-many`.

Acceptance checks:

- DONE: installed MCP server tool names have been captured in `.agents-cli-spec.md`.
- DONE: dry-run output shows real MCP tool names.
- DONE: real MCP read/write smoke test passed.
- NEXT: wire ADK `McpToolset` in the agent path during System 10/11.

Run when Atlas URI is available:

```bash
npm run mongodb:mcp-tools
npm run mongodb:mcp-smoke
```

Important rule:

- Vector retrieval later must be MCP `aggregate` with `$vectorSearch`.

Resources:

- MongoDB MCP tools: https://www.mongodb.com/docs/mcp-server/tools/
- ADK tools: https://adk.dev/tools/
- MCP: https://modelcontextprotocol.io/

## System 6: Synthetic Demo Data

Status: `DONE`

Purpose: create an IP-clean, no-PHI golden denial sample.

Create:

- Synthetic EOB PDF:
  - payer: BCBS-TX style, but no real logo/template copying
  - CPT: `90837`
  - missing modifier: `95`
  - CARC: `CO-45`
  - RARC: `N179`
  - watermark: `DEMO DATA - NOT REAL PHI`
- Paste-text fallback with the same fields.
- Seed `denials` doc with `ocr_status: "pending"` for upload path.
- Backup sample if Document AI flakes.

Completed on 2026-05-29:

- Golden PDF: `docs/test-documents/pdf/golden-bcbs-tx-90837-missing-modifier-eob.pdf`
- Paste fallback: `docs/test-documents/golden-bcbs-tx-90837-missing-modifier-paste-fallback.txt`
- Edge-case PDFs/text are present for later eval expansion.
- Removed answer-key language from the golden text/fallback so the demo input carries facts, not the expected bucket.

Acceptance checks:

- The PDF is newly authored during contest work.
- No real patient, provider, payer logo, or payer document template.
- Paste fallback can drive the same agent flow.
- The golden path uses the seven canonical buckets, while the live demo focuses on `corrected_claim`.

Resources:

- Document AI Form Parser: https://cloud.google.com/document-ai/docs/form-parser
- Devpost rules: https://rapid-agent.devpost.com/rules

## System 7: Document AI Tool

Status: `DONE`

Purpose: turn uploaded EOB/PDF content into structured denial fields.

Build:

- Cloud Storage upload bucket.
- Document AI Form Parser processor in the chosen region.
- Store processor ID and processor region in Secret Manager or local ignored `.env`.
- ADK tool function:
  - input: `gcs_uri`
  - output: `{carc[], rarc[], cpt, modifiers, pos, dx[], payer_hint, amounts, raw_text}`
- Denial update:
  - `ocr_status: "done"`
  - extracted fields
  - `raw_text`

Completed on 2026-05-29:

- Cloud Storage bucket created: `claimcompass-497412-docai-demo`
- Secret Manager secret created: `gcs-upload-bucket`
- Script added: `npm run docai:golden-smoke`
- Synthetic PDF upload to GCS works.
- Document AI Form Parser returned extracted text and fields:
  - CPT `90837`
  - CARC `CO-45`
  - RARC `N179`
  - POS `10`
  - diagnosis `F41.1`
  - missing modifier hint `95`

Completed write-back verification on 2026-05-29:

- Refreshed Atlas auth and added current local IP to Atlas access list.
- `npm run mongodb:mcp-smoke` passed again.
- `npm run docai:golden-smoke` passed end to end.
- MongoDB MCP `update-many` matched and modified `demo_denial_001`.
- MongoDB MCP `insert-many` wrote a `document_ai_form_parser` trace event.

Acceptance checks:

- Processor ID and location are verified before writing the tool code.
- DONE: Synthetic PDF upload -> GCS -> Document AI -> extracted fields.
- DONE: Agent/tool writes extraction back through MongoDB MCP `update-many` with a unique `denial_id` filter.
- Failure state sets `ocr_status: "failed"` and UI can use paste fallback.

Resources:

- Document AI overview: https://cloud.google.com/document-ai/docs
- Form Parser: https://cloud.google.com/document-ai/docs/form-parser
- Cloud Storage docs: https://cloud.google.com/storage/docs

## System 8: Playbook Chunks and Embeddings

Status: `DONE`

Purpose: create the knowledge base the agent retrieves from MongoDB.

Create:

- 30-60 newly authored payer playbook chunks:
  - 2 payers: BCBS-TX, Aetna
  - 3 CPT families: psychotherapy 90-codes, evaluation 90791, telehealth modifiers
  - 5 themes: modifier missing, POS mismatch, units mismatch, prior auth, timely filing
  - 2-3 chunks per payer/family/theme as time allows
- Each chunk:
  - `_id`
  - `payer_id`
  - `scope`
  - `title`
  - `body`
  - `source_url`
  - `embedding: [1536]`

Embedding rule:

- Use Google `gemini-embedding-001`.
- Do not use Voyage AI embedding generation in runtime.

Acceptance checks:

- DONE: 30 newly authored synthetic chunks exist for BCBS-TX Demo and Aetna Demo.
- DONE: Coverage spans three CPT families and five denial themes.
- DONE: Gemini `gemini-embedding-001` generated 1536-dimensional embeddings.
- DONE: Chunks were inserted through MongoDB MCP `insert-many`.
- DONE: `payer_playbooks` count confirms 30 embedded demo chunks.

Verification:

```bash
npm run playbooks:seed
```

Resources:

- Gemini embeddings: https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-text-embeddings
- MongoDB Atlas Vector Search: https://www.mongodb.com/products/platform/atlas-vector-search

## System 9: Atlas Vector Search

Status: `DONE`

Purpose: prove the MongoDB track's retrieval story.

Index creation path:

- Setup path used: MongoDB Node driver `createSearchIndex` / `listSearchIndexes`.
- Reason: MongoDB MCP `create-index` is for ordinary collection indexes; Atlas Vector Search index management is setup/migration work, which this repo permits through direct driver scripts.
- Retrieval path remains MongoDB MCP `aggregate` with `$vectorSearch`.
- Do not create a parallel Google vector datastore for v1.

Create index:

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 1536, "similarity": "cosine" },
    { "type": "filter", "path": "payer_id" },
    { "type": "filter", "path": "scope.cpt_family" }
  ]
}
```

Query pattern:

```js
[
  { $vectorSearch: {
      index: "playbook_vec",
      path: "embedding",
      queryVector: "<embedding>",
      numCandidates: 100,
      limit: 8,
      filter: { payer_id: "<payer>", "scope.cpt_family": "<family>" }
  }},
  { $project: { _id: 1, title: 1, body: 1, source_url: 1, score: { $meta: "vectorSearchScore" } } }
]
```

Acceptance checks:

- DONE: `playbook_vec` exists on `claimcompass.payer_playbooks`.
- DONE: `listSearchIndexes` reports `status: READY` and `queryable: true`.
- DONE: MCP `aggregate` with `$vectorSearch` returns 5 relevant chunks for the golden denial query.
- DONE: Top result is `BCBS-TX: Modifier Missing for psychotherapy 90-series claims`.
- DONE: Top result includes CPT `90837`, denial codes `CO-45`/`N179`, and bucket `corrected_claim`.

Verification:

```bash
npm run playbooks:create-vector-index
npm run playbooks:vector-smoke
```

Resources:

- Atlas Vector Search docs: https://www.mongodb.com/docs/atlas/atlas-vector-search/
- `$vectorSearch`: https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-stage/
- Aggregation: https://www.mongodb.com/docs/manual/aggregation/

## System 10: PolicyAgent

Status: `DONE`

Purpose: retrieve policy context and denial-code explanations for RootAgent.

Input:

```json
{ "payer_id": "bcbs_tx", "cpt": "90837", "raw_text": "..." }
```

Tools:

- Gemini embedding tool.
- MongoDB MCP `aggregate` against `payer_playbooks`.
- MongoDB MCP `find` against `carc` and `rarc`.

Output:

```json
{
  "chunks": [],
  "carc_descriptions": [],
  "rarc_descriptions": []
}
```

Acceptance checks:

- DONE: PolicyAgent retrieval module exists in `claimcompass-agent/app/policy_agent.py`.
- DONE: Unit tests cover chunk mapping, citation IDs/titles, no-result fallback, and CPT-family inference.
- DONE: Live smoke uses Gemini query embedding and MongoDB MCP `aggregate` against `payer_playbooks`.
- DONE: Live smoke uses MongoDB MCP `find` against `carc` and `rarc`.
- DONE: Top chunk is `pb_bcbs_tx_demo_psychotherapy_90_codes_modifier_missing_01`.
- DONE: Top chunk includes title/source/scope fields for downstream citations.
- DONE: No direct MongoDB driver query is used in the PolicyAgent retrieval path.

Verification:

```bash
cd claimcompass-agent && uv run pytest tests/unit/test_policy_agent.py
npm run policy:smoke
```

Resources:

- ADK multi-agent patterns: https://adk.dev/agents/multi-agents/
- ADK tools: https://adk.dev/tools/

## System 11: RootAgent Orchestration and Classification

Status: `TODO`

Purpose: own the full denial-resolution workflow.

Flow:

1. MCP `find` denial by `denial_id`.
2. If needed, call Document AI tool.
3. MCP `update-many` denial with a unique `denial_id` filter and extracted fields.
4. Delegate to PolicyAgent.
5. Classify bucket:
   - `fix_resubmit`
   - `corrected_claim`
   - `payer_followup`
   - `credentialing`
   - `true_appeal`
   - `client_bill`
   - `write_off`
6. MCP `update-many` denial with a unique `denial_id` filter, classification result, and `status: "triaged_pending_artifact"` or equivalent pre-draft state.
7. MCP `insert-many` trace events throughout.

Seven canonical buckets are fixed here; do not rename them later in UI/README without updating this tracker and the blueprint.

Acceptance checks:

- Golden denial becomes `bucket: "corrected_claim"` with confidence.
- Denial status changes from `new` to a clear pre-draft triage state.
- Trace events exist for every major step.
- Errors become readable UI states, not silent failures.
- Minimal evals can run before DrafterAgent exists.

Resources:

- ADK agents: https://adk.dev/agents/
- Gemini safety settings: https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/configure-safety-filters

## System 12: Minimal Eval Gate

Status: `TODO`

Purpose: catch retrieval/classification failures before building the DrafterAgent and frontend on top of unstable behavior.

Create the first tiny Agents CLI eval set:

- Golden denial -> retrieved telehealth modifier chunks -> bucket `corrected_claim`.
- No/weak playbook retrieval -> low-confidence fallback instead of hallucinated policy.
- Ambiguous denial codes -> readable fallback with human-review flag.

Do not:

- Test exact prose wording.
- Wait for the full UI before evaluating agent behavior.

Acceptance checks:

- `agents-cli eval run` works on the minimal set.
- Golden path passes before System 13 starts.
- Any failed trajectory becomes a fix in RootAgent/PolicyAgent before drafting work continues.

Resources:

- Local skill: `/Users/sanketdongre/.agents/skills/google-agents-cli-eval/SKILL.md`
- ADK evaluation docs: https://adk.dev/evaluate/

## System 13: DrafterAgent and Citation Validation

Status: `TODO`

Purpose: generate useful corrected-claim guidance grounded in retrieved MongoDB chunks.

Input:

```json
{ "denial": {}, "playbook_chunks": [], "bucket": "corrected_claim" }
```

Tools:

- MongoDB MCP `find` for payer reference data.
- Gemini generation.
- MongoDB MCP `insert-many` into `generated_artifacts`.

Output:

- `generated_artifact_id`
- Markdown content with citation chips referencing `payer_playbooks._id`

Acceptance checks:

- Every citation resolves to a chunk returned by PolicyAgent.
- No invented payer address or policy facts.
- Artifact is stored in MongoDB.
- Content includes human-review disclaimer.

Resources:

- Gemini text generation: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/inference
- Responsible AI: https://cloud.google.com/vertex-ai/generative-ai/docs/learn/responsible-ai

## System 14: Expanded Eval Suite

Status: `TODO`

Purpose: make quality repeatable after drafting is added, instead of relying on one successful demo run.

Create eval cases:

- Golden denial -> corrected claim.
- Missing/unclear denial codes -> fallback.
- True appeal case -> appeal bucket.
- Credentialing-ish case -> non-golden bucket, but no CredentialingRiskAgent.
- No retrieved playbook chunks -> safe low-confidence fallback.

Do not:

- Write pytest tests that assert exact LLM wording.

Acceptance checks:

- `agents-cli eval run` works.
- Eval report is saved or summarized.
- Golden path passes before UI polish.
- Citation validation failures are represented in eval or smoke-test fixtures.

Resources:

- Local skill: `/Users/sanketdongre/.agents/skills/google-agents-cli-eval/SKILL.md`
- ADK evaluation docs: https://adk.dev/evaluate/

## System 15: Landing Page to Demo Route

Status: `TODO`

Purpose: connect the current public ClaimCompass landing page to the actual hackathon demo experience without burning time on production auth.

Current repo state:

- `app/page.tsx` is the landing page.
- `components/nav.tsx` has a `Sign in` link pointing to `#login`.
- `components/hero.tsx` and `components/cta-section.tsx` drive users toward decoding a denial.
- No real post-login app route exists yet.

Hackathon-safe auth decision and scope cap:

- Do **not** add full Firebase/Auth/multi-tenant accounts for the hackathon unless absolutely needed.
- Build a **single-button demo gate** that looks like a product sign-in but simply sets a demo cookie/session marker and routes to the upload flow.
- Keep all data marked as demo/no-PHI.
- If judges click around, they should see a coherent app flow, but we should not spend days on production auth.
- Budget: **half a day maximum**. If it grows beyond that, remove `/signin` and route CTAs directly to `/demo/denials/new`.

Routes to build:

- `/` — current landing page.
- `/signin` — lightweight demo sign-in page.
- `/demo` — optional thin redirect/summary page only if it can be built quickly.
- `/demo/denials/new` — upload/paste the synthetic EOB or denial text.
- `/demo/denials/[denialId]` — live agent run, trace, result, and before/after diff.

Landing page changes:

- Change nav `Sign in` from `#login` to `/signin`.
- Change primary CTAs from `#cta` where appropriate to `/signin?next=/demo/denials/new` or directly `/demo/denials/new` if using a demo bypass.
- Keep marketing sections intact; they support the full-product vision.

Sign-in gate behavior:

- Show ClaimCompass branding and a single "Continue to demo workspace" action.
- Do not ask for real auth. Optional email capture is allowed only if it does not block the demo.
- Store a simple demo session marker if needed.
- Route to `/demo/denials/new`.

Acceptance checks:

- From the homepage, a judge can click `Sign in` and reach the upload/paste flow within one click after the sign-in gate.
- From the homepage, a judge can click `Decode my denial` and reach the upload/paste flow.
- No real PHI/auth claim is made.
- No Firebase/Auth dependency is introduced unless explicitly chosen later.
- The transition from marketing site to demo app is clear in the 3-minute recording.
- The whole gate takes less than half a day to implement.

Resources:

- Next.js local docs per `AGENTS.md`: `node_modules/next/dist/docs/`
- Cloud Run Next.js/custom service hosting: https://cloud.google.com/run/docs/quickstarts

## System 16: Next.js Agent Demonstration UI

Status: `TODO`

Purpose: make the agent legible to judges in under 60 seconds after the user enters the signed-in demo workspace.

Pages/components:

- Optional demo command center, only if it stays lightweight:
  - workflow health
  - open denials
  - at-risk amount
  - recent trace activity
  - clear "Upload denial" / "Paste denial" actions
- Upload/paste page.
- Denial detail/result page.
- Agent Trace panel from `trace_events`.
- Before/after MongoDB JSON diff.
- Citation chips/popovers.
- Save-as-rule button.
- Error/loading states.

Post-sign-in demo journey:

1. Landing page: user clicks `Sign in` or `Decode my denial`.
2. `/signin`: one-button demo gate, then redirect.
3. `/demo/denials/new`: user uploads synthetic EOB or uses paste fallback.
4. App creates/loads a `denials` document and starts RootAgent.
5. `/demo/denials/[denialId]`: trace panel updates as tools run.
6. Result panel shows bucket, confidence, plain-English reason, corrected-claim guidance, and citation chips.
7. Before/after diff proves MongoDB write-back.
8. "Save as billing rule" inserts a `billing_rules` doc and shows confirmation.

Design constraints:

- Build the actual demo app, not a marketing landing page.
- Keep UI dense, operational, and easy to scan.
- Show "DEMO DATA - NOT REAL PHI" where claim data appears.
- The trace panel is the hero.
- The signed-in app can be a deterministic demo workspace; production multi-user UX is out of scope.
- Demo command center widgets are optional. If timeline is tight, skip `/demo` and make `/demo/denials/new` the first post-gate screen.

Acceptance checks:

- One click/paste starts the run.
- Trace visibly shows Document AI, Gemini, and MCP tool calls.
- Result explains the denial and next action.
- Before/after diff proves MongoDB write-back.

Resources:

- Next.js local docs per `AGENTS.md`: `node_modules/next/dist/docs/`
- Cloud Run Next.js/custom service hosting: https://cloud.google.com/run/docs/quickstarts

## System 17: Deployment Integration

Status: `TODO`

Purpose: produce stable hosted URLs for Devpost and demo recording.

Target shape:

- ADK backend: Agent Runtime / Vertex AI Agent Engine.
- Frontend: Cloud Run.
- Optional fallback: backend tool/API shim on Cloud Run if Agent Runtime integration blocks.

Steps:

1. Deploy backend only after local run and evals pass.
2. Deploy frontend to Cloud Run.
3. Configure secrets/environment.
4. Set Cloud Run `min-instances=1` only for recording/submission QA.
5. Scale back after submission.

Acceptance checks:

- Hosted frontend URL works.
- Agent endpoint works from frontend.
- No secrets visible in client bundle or logs.
- Cold start is acceptable for demo window.

Resources:

- ADK deploy to Agent Runtime: https://adk.dev/deploy/agent-runtime/
- Cloud Run deploy: https://cloud.google.com/run/docs/deploying
- Secret Manager with Cloud Run: https://cloud.google.com/run/docs/configuring/services/secrets

## System 18: Hosted Dress Rehearsal

Status: `TODO`

Purpose: create the actual ship gate before final recording and Devpost submission.

Run on hosted URLs only:

1. Open landing page.
2. Click `Sign in` or `Decode my denial`.
3. Continue through demo gate.
4. Upload synthetic EOB or use paste fallback.
5. Watch trace panel complete.
6. Confirm result page.
7. Confirm MongoDB before/after diff.
8. Click save-as-rule if still in scope.
9. Capture deterministic backup recording.

Measurements:

- Time from first click to final result.
- Cloud Run cold start, if any.
- Agent Runtime call latency.
- Document AI latency.
- MongoDB MCP/vector retrieval latency.
- Any UI loading state longer than 2 seconds.

Acceptance checks:

- Full hosted run succeeds twice in a row.
- Backup recording exists before final recording day.
- Cold start is acceptable or Cloud Run `min-instances=1` is temporarily enabled for recording.
- No secrets, real patient data, payer logos, or private IDs appear in the video.
- If anything fails, fallback paste-text path still completes the demo.

Resources:

- Cloud Run service settings: https://cloud.google.com/run/docs/configuring/min-instances
- Devpost video requirements: https://rapid-agent.devpost.com/rules

## System 19: README and Submission Assets

Status: `TODO`

Purpose: give judges a 90-second understanding path.

README must include:

- One-paragraph pitch.
- Architecture diagram.
- "Why this is a real agent, not a chatbot."
- MongoDB role section:
  - collections
  - MCP tools
  - Vector Search index
  - `$vectorSearch` aggregation
- Google Cloud Agent Builder / ADK / Agent Runtime wording.
- One-command local run.
- Sample denial -> expected output.
- Apache-2.0 license.

Submission assets:

- Hosted URL.
- Public repo URL.
- 3-minute demo video.
- MongoDB track selected.
- Devpost long-form description.
- Screenshots of trace panel and before/after diff.

Acceptance checks:

- README does not reference pre-hackathon code/assets as submitted work.
- README states all AI runtime components are Google Cloud.
- README makes MongoDB MCP and Atlas Vector Search impossible to miss.

Resources:

- Devpost project submission guidance: https://rapid-agent.devpost.com
- MongoDB hackathon resources: https://rapid-agent.devpost.com/details/mongodb-resources

## System 20: Recording and Devpost Submission

Status: `TODO`

Purpose: package the build so the judges see the right proof points.

Video structure:

1. 0:00-0:15 title and stack.
2. 0:15-0:35 problem framing.
3. 0:35-0:50 upload/paste golden denial.
4. 0:50-1:50 trace panel.
5. 1:50-2:15 result page.
6. 2:15-2:40 MongoDB before/after diff.
7. 2:40-2:55 save as billing rule.
8. 2:55-3:00 close.

Acceptance checks:

- Video is around 3 minutes.
- Trace panel clearly shows MCP and `$vectorSearch`.
- Before/after diff proves write-back.
- Hosted URL is stable.
- Repo is public and licensed.
- Devpost selects MongoDB track.

Resources:

- Hackathon rules: https://rapid-agent.devpost.com/rules
- Hackathon FAQ: https://rapid-agent.devpost.com/details/faq

## Handoff Prompt for a New Chat or Agent

Use this when starting a new chat or giving work to another coding agent:

```text
We are building ClaimCompass for the Google Cloud Rapid Agent Hackathon MongoDB track.
Read docs/HACKATHON_BP_IMPLEMENTATION.md first, then docs/HACKATHON_BLUEPRINT.md.
Follow the master build sequence. Do not use non-Google AI at runtime.
Use Google ADK / Agents CLI for the backend, Agent Runtime / Vertex AI Agent Engine for final deployment, Cloud Run for the Next.js frontend, Document AI for extraction, and MongoDB Atlas + official MongoDB MCP Server for all agent DB reads/writes and vector search.
Before changing code, report the current system number/status and the exact acceptance checks you are working toward.
```

## Immediate Next Step

Start with **System 1 verification** and **System 2 `.agents-cli-spec.md`**.

Do not scaffold the agent until `.agents-cli-spec.md` exists and has been reviewed against the blueprint.
