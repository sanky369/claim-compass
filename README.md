# ClaimCompass

ClaimCompass is a Google Cloud Rapid Agent Hackathon project for the MongoDB
track. It is a denial-resolution copilot for independent healthcare providers:
upload a denied claim, let the agent read it, retrieve payer-specific rules,
choose the next-best action, draft the fix, and write the result back to
MongoDB.

The hackathon demo focuses on one synthetic golden path: CPT `90837`, missing
telehealth modifier `95`, denial codes `CO-45` and `N179`, classified as a
`corrected_claim`.

> Demo data only. This project must not be used with real PHI, payer portal
> screenshots, real EOBs, subscriber IDs, or patient documents.
> <img width="2832" height="1540" alt="CleanShot 2026-06-10 at 19 29 11@2x" src="https://github.com/user-attachments/assets/69f57803-0987-4dde-9ced-5c7c8b8eea99" />

Cinematic Video (problem and solution understanding) - https://notebooklm.google.com/notebook/7815c96f-d773-4405-b4d4-5f326f81202f/artifact/495b6200-c26d-463c-8cdb-0477d29a2e57?utm_source=nlm_web_share&utm_medium=google_oo&utm_campaign=art_share_2&utm_content=&utm_smc=nlm_web_share_google_oo_art_share_2_

## What It Builds

ClaimCompass is not just a denial explainer. The v1 demo proves a complete
agent loop:

1. Read a synthetic EOB PDF with Google Document AI.
2. Store and update the denial record in MongoDB Atlas.
3. Retrieve payer playbook guidance from MongoDB Atlas Vector Search through
   the official MongoDB MCP Server.
4. Use Gemini and ADK agents to classify the denial into a resolution bucket.
5. Generate corrected-claim guidance with citations.
6. Persist the generated artifact and trace events back to MongoDB.
7. Show the run in a Next.js demo UI with trace, citations, and before/after
   document state.

## Hackathon Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js App Router |
| Agent framework | Google ADK / Agents CLI |
| Agent runtime target | Google Cloud Agent Runtime / Vertex AI Agent Engine |
| Models | `gemini-3.5-flash` generation and `gemini-embedding-2` embeddings |
| OCR | Google Document AI Form Parser |
| Database | MongoDB Atlas |
| Retrieval | MongoDB Atlas Vector Search |
| Agent database access | Official MongoDB MCP Server |
| Secrets | Google Secret Manager for deployed config, ignored `.env.local` locally |
| Hosting target | Cloud Run for the demo app |

Hosted demo integrity:

- Every hosted run performs live `gemini-embedding-2` query embedding at 1536 dimensions.
- Every hosted run performs live MongoDB MCP `aggregate` with `$vectorSearch`,
  MCP `find`, MCP `update-many`, and MCP `insert-many`.
- The hosted path labels Document AI extraction and DrafterAgent generation as
  verified replay/reuse for recording stability; the full live Document AI and
  Gemini drafting path is covered by local release checks.

The final submission wording should stay honest to the proven deployment path:

> Built with Gemini and Google Cloud Agent Builder using ADK, designed for Agent
> Runtime / Vertex AI Agent Engine, hosted for the demo on Cloud Run, and
> integrated with MongoDB Atlas through the official MongoDB MCP Server.

## Repository Map

```text
.
├── app/                         # Next.js app shell
├── components/                  # Landing/demo UI components
├── claimcompass-agent/          # ClaimCompass-specific ADK / Agents CLI app
├── docs/
│   ├── HACKATHON_BLUEPRINT.md   # Product, architecture, and judging strategy
│   ├── HACKATHON_BP_IMPLEMENTATION.md
│   └── test-documents/          # Synthetic EOB fixtures and rendered previews
├── scripts/
│   ├── document-ai/             # Golden Document AI smoke path
│   └── mongodb/                 # Atlas bootstrap and MCP smoke tests
├── .agents-cli-spec.md          # Agent behavior, tools, data model, demo contract
└── AGENTS.md                    # Repo-wide agent, security, and cost guardrails
```

## Current Build Status

Completed systems are tracked in
[`docs/HACKATHON_BP_IMPLEMENTATION.md`](docs/HACKATHON_BP_IMPLEMENTATION.md).
As of the current baseline commit, Systems 0-17 are final-testing ready except
for the cost-approved hosted Cloud Run deploy and hosted dress rehearsal.
The old ADK weather/time scaffold has been replaced by a ClaimCompass-specific
synthetic-denial agent, so the repo no longer overclaims a placeholder agent.

- Project guardrails and docs
- Google Cloud project and cost controls
- Agent implementation spec
- ClaimCompass-specific ADK app and hello Agent Runtime proof
- MongoDB Atlas foundation
- MongoDB MCP smoke path
- Synthetic demo data
- Document AI extraction with MongoDB MCP write-back
- Gemini-embedded payer playbook chunks
- Atlas Vector Search index and MCP `$vectorSearch` smoke path
- PolicyAgent retrieval over MCP with CARC/RARC lookups
- RootAgent orchestration and deterministic golden-path classification
- Minimal eval gate over ADK CLI plus ClaimCompass RootAgent behavior
- DrafterAgent artifact generation with citation validation
- Expanded eval suite covering drafting, citations, and safe fallbacks
- Landing page to demo gate handoff
- Local Next.js demonstration UI with sample PDF import, run API, trace,
  result, citations, MongoDB before/after diff, and save-as-rule
- Cost-approved Cloud Run deployment with hosted health/sample-PDF path verified

Next systems:

- System 18: hosted browser dress rehearsal and backup recording
- System 19: README/submission assets with honest stack claims

Hosted demo:

```text
https://claimcompass-demo-834613361298.us-central1.run.app
```

## Local Setup

Install dependencies:

```bash
npm install
```

Create local environment config:

```bash
cp .env.example .env.local
```

Fill `.env.local` with a least-privilege Atlas URI for the `claimcompass`
database. Do not commit `.env.local`.

Run the web app:

```bash
npm run dev
```

Run lint:

```bash
npm run lint
```

## MongoDB Setup and Smoke Tests

Bootstrap the local Atlas collections and synthetic seed data:

```bash
npm run mongodb:bootstrap
```

Inspect local MongoDB MCP tools:

```bash
npm run mongodb:mcp-tools
```

Run the MCP smoke test:

```bash
npm run mongodb:mcp-smoke
```

The smoke path verifies `find`, `aggregate`, `insert-many`, `update-many`, and
`count` through the official MongoDB MCP Server. For this repo,
`mongodb-mcp-server@1.11.0` exposes `update-many`, so v1 write-back uses a
unique `denial_id` filter instead of an unavailable `update-one`.

## Playbook Embeddings and Vector Search

Seed the synthetic payer playbook chunks and Gemini embeddings:

```bash
npm run playbooks:seed
```

Create or verify the Atlas Vector Search index:

```bash
npm run playbooks:create-vector-index
```

Run the golden-path vector retrieval smoke test through MongoDB MCP:

```bash
npm run playbooks:vector-smoke
```

Run the PolicyAgent retrieval smoke test:

```bash
npm run policy:smoke
```

Run the RootAgent orchestration smoke test:

```bash
npm run root:smoke
```

Run the eval and drafting gates:

```bash
npm run eval:agents-cli
npm run eval:minimal
npm run draft:smoke
npm run eval:expanded
```

Run the local demo UI proof:

```bash
npm run dev
```

Then open `/demo/denials/new`, open the displayed sample PDF, click
**Import sample PDF and run**, and inspect `/demo/denials/demo_denial_001`.

Deployment notes live in
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). The deploy helper is guarded and
will not run without explicit cost approval:

```bash
CONFIRM_CLOUD_RUN_DEPLOY=yes scripts/deploy/cloud-run-frontend.sh
```

The smoke query uses an MCP `aggregate` call with this `$vectorSearch` shape:

```js
[
  {
    $vectorSearch: {
      index: "playbook_vec",
      path: "embedding",
      queryVector: "<1536-dim gemini-embedding-2 vector>",
      numCandidates: 30,
      limit: 5,
      filter: {
        payer_id: "bcbs_tx_demo",
        "scope.cpt_family": "psychotherapy_90_codes",
      },
    },
  },
  {
    $project: {
      _id: 1,
      title: 1,
      body: 1,
      source_url: 1,
      payer_id: 1,
      scope: 1,
      score: { $meta: "vectorSearchScore" },
    },
  },
]
```

## Document AI Smoke Test

The golden EOB smoke path uploads the synthetic PDF to the configured demo GCS
bucket, processes it with Document AI Form Parser, extracts denial fields, and
writes the result back to MongoDB through MCP:

```bash
npm run docai:golden-smoke
```

Required Google Cloud config is stored in Secret Manager for deployed use:

- `documentai-processor-id`
- `documentai-location`
- `gcp-project-id`
- `gcs-upload-bucket`
- `mongodb-uri`

## Security and Cost Guardrails

- Use only synthetic data marked `DEMO DATA - NOT REAL PHI`.
- Never commit PHI, real EOBs, payer portal screenshots, secrets, tokens, or
  Atlas connection strings.
- Use Google Secret Manager for deployed secrets and ignored `.env.local` for
  local development.
- Keep Atlas on `M0` unless a paid tier is explicitly approved.
- Keep Cloud Run min instances at `0` except during recording or rehearsal.
- Do not run paid deploys or enable broad cloud services without an explicit
  reason and cost check.
- Generated guidance is decision support only and requires human review.

See [`AGENTS.md`](AGENTS.md) for the complete repository operating rules.

## Development Workflow

This project is being built system by system for the hackathon. After each
completed system:

1. Run the relevant acceptance checks from the tracker.
2. Update `docs/HACKATHON_BP_IMPLEMENTATION.md`.
3. Commit with a message that names the completed system.
4. Push to GitHub.

Useful references:

- Hackathon blueprint:
  [`docs/HACKATHON_BLUEPRINT.md`](docs/HACKATHON_BLUEPRINT.md)
- Implementation tracker:
  [`docs/HACKATHON_BP_IMPLEMENTATION.md`](docs/HACKATHON_BP_IMPLEMENTATION.md)
- Agent spec:
  [`.agents-cli-spec.md`](.agents-cli-spec.md)

## License

Apache-2.0. See [`LICENSE`](LICENSE).
