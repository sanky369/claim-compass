# ClaimCompass — Google Cloud Rapid Agent Hackathon Blueprint

> **Submission track:** MongoDB (1st = $5,000, 2nd = $3,000, 3rd = $2,000).
> **Product framing:** Financial operations automation for independent healthcare providers — a MongoDB-backed revenue-recovery agent.
> **Goal:** Win the MongoDB track.
> **Status:** Hackathon v2 — incorporates feasibility review (Google-only AI, real MCP tool names, reduced agent count, golden-path demo, IP-clean repo).

---

## 0. Reading the brief literally

Devpost criteria, ordered by what we have to demonstrate on screen:

1. **Technological Implementation** — Gemini + Google Cloud Agent Builder / Agent Platform + one **partner MCP server** doing real work.
2. **Design & UX** — a non-expert can run the demo and understand the magic in <60 seconds.
3. **Potential Impact** — the problem is real, the addressable market is obvious.
4. **Quality of the Idea** — the agent is doing something a single LLM call cannot.

**Non-negotiables from the rules:**
- Project must be **newly created during the contest period**. No code, content, prompts, embeddings, or seed data carried over from prior projects. The repo is fresh, the assets are fresh, the design is fresh.
- Only **Google Cloud AI tools** (and AI features built into the chosen partner's products) are permitted in the submission. No Claude, no OpenAI, no third-party OCR AI in the runtime.
- Third-party IP rules apply: no real payer logos, no real EOBs, no real patient data.

**Official Google product terminology, so we do not build toward the wrong surface:**
- **Gemini Enterprise Agent Platform / Google Cloud Agent Builder** is the umbrella suite for building, deploying, governing, and optimizing AI agents.
- **Agent Studio** is the low-code visual builder. We do **not** need it for the golden-path submission.
- **Agent Development Kit (ADK)** is the code-first framework Google documents for building complex agents with reasoning and tool use.
- **Agent Runtime / Vertex AI Agent Engine** is the managed runtime target inside the Agent Platform/Agent Builder family. Older docs and APIs still say "Vertex AI Agent Engine" or `ReasoningEngine`; newer docs increasingly say "Agent Runtime."
- **Submission wording:** say "built with Gemini and Google Cloud Agent Builder using ADK, designed for Agent Runtime / Vertex AI Agent Engine, and hosted for the demo on Cloud Run." Only say "deployed on Agent Runtime" if the ClaimCompass-specific Agent Runtime deploy is actually live and tested.

**Google resource alignment from the hackathon resource page:**
- **Managed setup / API setup:** use the ClaimCompass GCP project with Agent Platform / Vertex AI, Document AI, Cloud Run, Cloud Build, Artifact Registry, Secret Manager, Storage, Logging, Monitoring, and Cloud Trace enabled. Do not enable broad Studio-only APIs just because the console modal asks.
- **Low-code Agent Builder guide:** useful for terminology and judging language, but not the implementation path. ClaimCompass needs custom MCP calls, Document AI tools, trace persistence, and evals, so the code-first ADK path is the correct path.
- **Gemini Enterprise Agent Platform SDK / Vertex AI SDK:** use it through ADK and the `google-genai` / Vertex SDK surfaces for Gemini generation and embeddings. Keep model IDs in env vars so we can swap if hackathon-supported Gemini model names change.
- **Agent Starter Pack:** treat it as a reference only. The Google repo now points new projects to `google-agents-cli`, which we already installed. Build with Agents CLI lifecycle: scaffold -> run -> eval -> deploy -> observe.
- **Agent Builder Extensions:** optional. Our primary action mechanism is the official MongoDB MCP Server plus a custom Document AI tool. Do not add extensions unless one directly shortens the golden path.
- **Agent Builder Data Stores / Agent Platform Search / RAG Engine:** not used for v1. For the MongoDB track, grounding must visibly come from MongoDB Atlas Vector Search through MCP, not a parallel Google-managed datastore.
- **Agent Runtime:** final agent deployment target for the ADK backend. Cloud Run remains the frontend host and can also host a custom API/tool shim if Agent Runtime integration becomes a blocker.
- **Secret Manager:** required for MongoDB URI/API credentials, Document AI processor IDs if sensitive, and any service credentials. Do not commit secrets or put them in README screenshots.
- **Cloud Run:** required for the Next.js demo app. Use `min-instances=1` only during recording/submission QA, then scale back to zero.
- **Safety settings / Responsible AI:** include explicit safety instructions, no-PHI demo data, citation validation, confidence thresholds, fallback states, and a human-review disclaimer. Run evals for the golden denial and at least a few edge cases before recording.

**The one sentence the 3-minute video has to prove:**
> *"Upload a denied claim. The agent reads it with Document AI, retrieves payer rules from MongoDB Atlas Vector Search via the MongoDB MCP server, decides the fix, drafts the artifact, and writes the resolution back to MongoDB — autonomously, in under a minute."*

---

## 1. Track + positioning

- **Formal track on Devpost:** MongoDB.
- **Theme framing in the description:** Financial operations automation — recovering denied revenue for independent healthcare providers.
- **Positioning statement (verbatim copy for the Devpost write-up):**
  > **ClaimCompass is a MongoDB-backed revenue-recovery agent for independent healthcare providers. It doesn't just explain a denial — it reads the EOB with Document AI, retrieves payer-specific rules from MongoDB Atlas Vector Search through the MongoDB MCP server, decides the resolution path, generates the fix, and writes the corrected revenue record back to MongoDB.**
- **Why this wins on "Quality of Idea":** denial resolution is a problem the *agent loop itself* solves — multi-step planning over a structured action space, heterogeneous tools (OCR + vector search + write-back), and a visible artifact. A single Gemini call cannot do it.

### MongoDB track fit

The MongoDB resource page frames Atlas as a unified operational foundation and persistent memory layer for agentic workloads, combining operational, vector, and semantic data in one platform. ClaimCompass should make that visible rather than treating MongoDB as a passive database.

**Track requirements we intentionally demonstrate:**
- **MongoDB Atlas as operational memory:** `denials`, `generated_artifacts`, `billing_rules`, and `trace_events` are ordinary operational collections that change during the agent run.
- **MongoDB Atlas Vector Search:** `payer_playbooks` stores Google-generated embeddings and is queried through a `$vectorSearch` aggregation pipeline.
- **MongoDB MCP Server:** the app/agent path accesses MongoDB through the official MCP server tools, especially `find`, `aggregate`, `insert-many`, `update-many`, and `count`.
- **MongoDB Aggregations:** PolicyAgent retrieval is not a direct vector SDK call; it is an MCP `aggregate` call whose first stage is `$vectorSearch`, followed by `$project`.
- **MongoDB Atlas Search:** optional for v1. If time permits, use Atlas Search only for lexical backup over payer playbooks; do not add it before the vector-search golden path is polished.
- **Bring-your-own Google embeddings:** use `gemini-embedding-2` at 1536 dimensions. Do **not** use Voyage AI embedding generation in the runtime, because the hackathon requires Google Cloud AI tools for AI functionality.
- **No sample Mflix dependency:** the Mflix dataset is a useful resource, but ClaimCompass uses newly authored healthcare denial demo data so the submission remains domain-specific and IP-clean.

---

## 2. Scope: golden-path demo, nothing more

### In scope
- One synthetic EOB PDF: **BCBS-TX / CPT 90837 / telehealth modifier missing / CO-45 + N179**. Watermarked "DEMO DATA — NOT REAL PHI" in the UI.
- Upload flow + paste-text fallback.
- Google ADK / Agents CLI system designed for Agent Runtime / Vertex AI Agent Engine, with the hackathon demo hosted on Cloud Run.
- MongoDB MCP server doing **real CRUD + vector search** over the demo data.
- In-app **Agent Trace panel** showing each tool call with status, latency, and the document IDs touched.
- Result page: plain-English denial, bucket = `corrected_claim`, confidence, drafted corrected-claim guidance with citation chips.
- "Save as billing rule" → inserts a `billing_rules` doc.
- Side panel: "MongoDB Document — Before / After" JSON diff for the denial doc.

### Out of scope (do not build)
- CredentialingRiskAgent and any NPPES / OIG / SAM HTTP tools. (Defer until the golden path is *polished*; in practice we don't add it back.)
- Firebase Auth. Use a single demo route or unauthenticated demo bucket.
- Multi-bucket live demo. All seven buckets exist as code paths and labels in the UI; **we demo only the corrected-claim path live.** A second bucket appears as a recorded thumbnail.
- HIPAA, BAAs, PHI segregation, SOC 2, audit logs, multi-tenant RLS.
- Stripe, billing tiers, plans.
- 240 playbook chunks. We seed **30–60 excellent chunks.**
- Five EOB samples. **One primary + one backup.**
- Live Atlas Data Explorer in the demo (too risky). The before/after view is rendered in-app from MongoDB MCP responses.

**Rule:** if a feature does not appear in the 3-minute video, do not build it.

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Next.js 16 (App Router) — Cloud Run                          │
│    - Upload + paste-fallback page                             │
│    - Denial detail page                                       │
│    - Agent Trace panel (reads trace_events from MongoDB)      │
│    - MongoDB Before/After JSON diff panel                     │
└─────────────────────────────┬────────────────────────────────┘
                              │ HTTPS
                              ▼
┌──────────────────────────────────────────────────────────────┐
│  Google Cloud Agent Builder — ADK app on Agent Runtime          │
│  (Vertex AI Agent Engine / ReasoningEngine in older docs)       │
│                                                                │
│    ┌────────────────────────────────────────────────┐        │
│    │ RootAgent  (Gemini generation)                 │        │
│    │  - Plans the resolution                        │        │
│    │  - Calls Document AI as a tool                 │        │
│    │  - Delegates to PolicyAgent, DrafterAgent      │        │
│    │  - Writes trace_events + denial update         │        │
│    └────┬──────────────────────┬────────────────────┘        │
│         │                      │                              │
│         ▼                      ▼                              │
│   ┌─────────────────┐    ┌──────────────────┐                │
│   │ PolicyAgent     │    │ DrafterAgent     │                │
│   │  Gemini embed   │    │  Gemini draft    │                │
│   │  - embeds query │    │  - generates     │                │
│   │  - $vectorSearch│    │    corrected-    │                │
│   │    via MCP      │    │    claim doc     │                │
│   └────────┬────────┘    └────────┬─────────┘                │
└────────────┼──────────────────────┼──────────────────────────┘
             │                      │
             ▼                      ▼
   ┌─────────────────────┐  ┌─────────────────────────────────┐
   │ Document AI         │  │  MongoDB MCP Server (official)  │
   │  Form Parser        │  │   Tools used:                   │
   │  (called as tool    │  │   - find                        │
   │   from RootAgent)   │  │   - aggregate ($vectorSearch)   │
   └─────────────────────┘  │   - insert-many                 │
                            │   - update-many                 │
                            │   - count                       │
                            │                                  │
                            │  Atlas (one cluster, region     │
                            │  co-located with Cloud Run):    │
                            │   - denials                     │
                            │   - claims                      │
                            │   - payer_playbooks (vector)    │
                            │   - generated_artifacts         │
                            │   - billing_rules               │
                            │   - trace_events                │
                            │   - carc, rarc, payers          │
                            └─────────────────────────────────┘
```

**Why this shape scores on every criterion:**
- **Tech impl:** ADK/Agents CLI, Gemini generation + embeddings, Document AI, and MongoDB MCP doing real `find`/`aggregate`/`update-many`/`insert-many`. All the boxes ticked.
- **Design:** One upload, one result, one trace panel. Nothing to learn.
- **Impact:** Revenue recovery for ~1M independent US healthcare providers.
- **Idea quality:** Reasoning over codified payer rules; the agent has a seven-state action space and picks one with citations.

---

## 4. Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js 16 App Router + Tailwind + shadcn/ui | App shell; server actions call the Agent Runtime / Agent Engine endpoint. |
| Hosting | **Cloud Run** | `min-instances=1` during demo window. |
| Agent platform | **Google Cloud Agent Builder / Gemini Enterprise Agent Platform** | Umbrella suite named in the hackathon brief. We use the code-first path, not the low-code Studio path. |
| Agent framework/runtime | **Google ADK** deployed to **Agent Runtime / Vertex AI Agent Engine** | ADK is the code-first builder; Agent Runtime / Agent Engine is the managed deployment target. |
| Model — root + drafter | **`gemini-3.5-flash`** | Stable Google model ID verified against the Agent Platform docs and the project. Override with `GEMINI_DRAFT_MODEL` only if needed. |
| Model — policy + extraction | **Gemini embeddings** | Uses `gemini-embedding-2` for query/playbook embeddings. |
| OCR | **Document AI Form Parser** | Text + key/value + tables. $30 / 1,000 pages — negligible at demo scale. |
| Primary DB | **MongoDB Atlas** (M10, co-located region with Cloud Run) | One cluster, all collections. |
| Vector search | **MongoDB Atlas Vector Search** via `$vectorSearch` aggregation stage | Native. |
| MCP server | **Official MongoDB MCP Server** | Wired into ADK via `McpToolset`. |
| Embeddings | **`gemini-embedding-2`** with `output_dimensionality=1536` | Google-only AI rule. We store the vectors in Atlas ourselves; do not configure MCP/Voyage automatic embeddings for runtime. |
| Atlas Search | Optional fallback only | Keep out of v1 unless vector retrieval is already solid. If added, use it as a lexical comparison in README/demo, not as a replacement for Vector Search. |
| Storage | Cloud Storage bucket | Uploaded EOB PDFs. |
| Auth | None (demo route) or Identity-Aware Proxy if needed | Don't burn a day on auth. |
| Observability | In-app **Agent Trace panel** (MongoDB-backed) + Cloud Trace | The in-app panel is the demo's hero. |
| CI/CD | Cloud Build → Cloud Run | `gcloud run deploy` on tag. |
| Repo | New GitHub repo, **Apache-2.0** `LICENSE` at root | New work only — see §11. |

**Explicitly excluded from the submission:**
- Any non-Google LLM (Claude, OpenAI, etc.) — disallowed by rules.
- Any non-Google OCR AI (AWS Textract, Mistral, Reducto) — disallowed by rules.
- Any code, embeddings, prompts, or seed data from prior projects — disallowed by rules.
- Real payer logos, real EOB scans, real patient names — IP rules.

---

## 5. Agents

Three agents. Each has one job, one IO contract, and a small tool set. Every MongoDB action goes through the official MCP server's named tools — **we do not invent tool names.**

**MCP tool discipline:** per the official MongoDB MCP Server tools, database work should use real tool names such as `find`, `aggregate`, `count`, `explain`, `insert-many`, `update-many`, `rename-collection`, `create-collection`, `delete-many`, `list-databases`, `list-collections`, `collection-indexes`, and `db-stats` as applicable. Local `mongodb-mcp-server@1.11.0` exposes `update-many`, not `update-one`; use `update-many` with unique `denial_id` filters. Vector retrieval uses `aggregate`; vector-index management is handled by Atlas or setup scripts, not by an invented `create-vector-search-index` tool name.

### 5.1 RootAgent (Gemini / deterministic golden-path classification)
- **Input:** `denial_id` (string).
- **Tools:**
  - MongoDB MCP: `find` (denials), `update-many` (denials with unique `denial_id` filter), `insert-many` (trace_events).
  - Document AI: `documentai.process(form_parser, gcs_uri)` — registered as a tool function.
- **Plan:**
  1. `find` the denial doc in MongoDB.
  2. If `ocr_status != "done"`, call Document AI Form Parser on the GCS URI; extract `{carc[], rarc[], cpt, modifiers, pos, dx[], payer_hint, amounts, raw_text}`; `update-many` the denial doc with a unique `denial_id` filter.
  3. Delegate to **PolicyAgent** with `{payer_id, cpt, raw_text}`. Receive top playbook chunks + carc/rarc plain-English.
  4. Classify into one of seven buckets: `fix_resubmit`, `corrected_claim`, `payer_followup`, `credentialing`, `true_appeal`, `client_bill`, `write_off`. Output `{bucket, confidence}`.
  5. Delegate to **DrafterAgent** with `{denial, playbook_chunks, bucket}`.
  6. `update-many` denial with `{bucket, bucket_confidence, plain_english, recommended_action, generated_artifact_id, status: "triaged"}` and a unique `denial_id` filter.
  7. `insert-many` step-level events into `trace_events` throughout (one event per tool call, with `latency_ms` and `mcp_tool` name).

### 5.2 PolicyAgent (Gemini embeddings)
- **Input:** `{payer_id, cpt, raw_text}`.
- **Tools:**
  - Vertex `embed_content(model="gemini-embedding-2", output_dimensionality=1536)` — registered as a tool function.
  - MongoDB MCP: `aggregate` against `payer_playbooks`, first stage `$vectorSearch`.
  - MongoDB MCP: `find` against `carc`, `rarc`.
- **Pipeline (`$vectorSearch` aggregation):**
  ```
  [
    { $vectorSearch: {
        index: "playbook_vec",
        path: "embedding",
        queryVector: <embedding>,
        numCandidates: 100,
        limit: 8,
        filter: { payer_id: <payer>, "scope.cpt_family": <family> }
    }},
    { $project: { _id: 1, title: 1, body: 1, source_url: 1, score: { $meta: "vectorSearchScore" } } }
  ]
  ```
- **Output:** `{chunks: [...], carc_descriptions: [...], rarc_descriptions: [...]}`.

### 5.3 DrafterAgent (Gemini generation)
- **Input:** `{denial, playbook_chunks, bucket}`.
- **Tools:** MongoDB MCP: `find` (payers, for appeal address — never let the model invent this), `insert-many` (generated_artifacts).
- **Output:** `generated_artifact_id`. The artifact (a corrected-claim-guidance markdown doc) **must cite playbook chunk `_id`s.** Post-processing validates that every citation chip in the rendered markdown resolves to a real `payer_playbooks._id` returned by the PolicyAgent.

**Cut for v1:** an OCR sub-agent. OCR is a single tool call inside RootAgent — wrapping it in an agent adds latency without scoring more points.

**Cut for v1:** CredentialingRiskAgent. Adds external API flakiness, distracts from the MongoDB story.

---

## 6. Data model

Single Atlas database `claimcompass`. All collections live in one cluster.

```js
// denials
{
  _id, source: "upload" | "paste",
  gcs_uri,                                    // null if pasted
  payer_id, carc: ["CO-45"], rarc: ["N179"],
  raw_text, ocr_status: "pending" | "done" | "failed",
  cpt, modifiers: [], pos, dx: [],
  billed, allowed, paid, patient_resp,
  plain_english, bucket, bucket_confidence,
  recommended_action,
  generated_artifact_id,
  status: "new" | "triaged" | "resolved",
  created_at, updated_at
}

// payer_playbooks  (Atlas Vector Search index = "playbook_vec")
{
  _id, payer_id, scope: { cpt_family, topic, denial_codes: [] },
  title, body, embedding: [1536],
  source_url, effective_date
}

// generated_artifacts
{
  _id, denial_id, kind: "corrected_claim_guidance" | "appeal_letter" | "call_script",
  content_md,
  citations: [{ playbook_id, chunk_title }],
  model: "configured-gemini-generation-model", created_at
}

// billing_rules
{
  _id, payer_id, trigger: { cpt, pos, missing_modifier },
  guidance, source_denial_id, active: true, created_at
}

// trace_events  (the demo's hero collection)
{
  _id, denial_id, agent: "RootAgent" | "PolicyAgent" | "DrafterAgent",
  action: "mcp.find" | "mcp.aggregate" | "mcp.update-many" | "mcp.insert-many"
        | "documentai.process" | "gemini.generate" | "gemini.embed",
  mcp_tool,                       // "find", "aggregate", etc. when applicable
  target_collection,              // when applicable
  summary,                        // short human-readable line
  latency_ms,
  status: "ok" | "error",
  occurred_at
}

// payers, carc, rarc  (small reference collections, seeded fresh)
```

**Atlas Vector Search index `playbook_vec`:**
```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 1536, "similarity": "cosine" },
    { "type": "filter", "path": "payer_id" },
    { "type": "filter", "path": "scope.cpt_family" }
  ]
}
```

**Index creation note:** create and verify this Atlas Vector Search index explicitly during setup. If doing it through MCP, use the official index-management tools (`create-index`, `collection-indexes`, `drop-index`). If doing it in Atlas UI or script, still show the final index definition in the README.

**Seed plan (all newly authored during the contest, no carryover):**
- **2 payers** (BCBS-TX, Aetna), each freshly written in our own words.
- **3 CPT families** (psychotherapy 90-codes, evaluation 90791, telehealth modifiers).
- **5 denial themes** per family (modifier missing, POS mismatch, units mismatch, prior auth, timely filing).
- **2–3 chunks per (payer, family, theme)** → **30–60 chunks total.**
- All chunks are paraphrased rules, not verbatim payer text, with a `source_url` pointing to publicly available X12/CMS references where relevant. No payer logos. No copy-pasted policy bulletins.

---

## 7. Agent Trace panel (the secret weapon)

This panel is what wins the "Tech Impl" score on video. It's an in-app component that streams from `trace_events` keyed by `denial_id`.

**Rendered example (what judges see during the demo):**

```
Agent run · denial_id 6644a…
─────────────────────────────────────────────────────────────
✓  RootAgent          mcp.find            denials             18 ms
✓  RootAgent          documentai.process  Form Parser         3.4 s
✓  RootAgent          mcp.update-many     denials             22 ms
   → ocr_status: "done", extracted CO-45 + N179, CPT 90837
✓  PolicyAgent        gemini.embed        gemini-embedding-2 410 ms
✓  PolicyAgent        mcp.aggregate       payer_playbooks      47 ms
   → $vectorSearch returned 5 chunks (top score 0.91)
✓  PolicyAgent        mcp.find            carc, rarc           14 ms
✓  RootAgent          classifier          corrected_claim      1.1 s
   → bucket = "corrected_claim", confidence = 0.92
✓  DrafterAgent       mcp.find            payers               12 ms
✓  DrafterAgent       gemini.generate     drafting             4.2 s
✓  DrafterAgent       mcp.insert-many     generated_artifacts  19 ms
✓  RootAgent          mcp.update-many     denials              21 ms
✓  RootAgent          mcp.insert-many     trace_events         (final)
─────────────────────────────────────────────────────────────
Total: 9.7 s · 11 MCP calls · 3 agents · 0 errors
```

Pair it with a **Before / After** MongoDB JSON diff panel that renders the same denial doc twice (pre and post agent run), highlighted. That panel is 20 seconds of the video.

---

## 8. Demo script (3 minutes)

| Time | Shot | Beat |
|---|---|---|
| 0:00–0:15 | Title card | "ClaimCompass — an autonomous revenue-recovery agent. Google Cloud Agent Builder · Gemini · MongoDB MCP." |
| 0:15–0:35 | Problem framing | "US independent healthcare providers lose 8–15% of revenue to preventable denials. Today's tools tell you a claim was denied. This agent fixes it." |
| 0:35–0:50 | Upload | Drag the watermarked synthetic EOB. Click upload. |
| 0:50–1:50 | **Live agent trace panel** | Camera focused on the in-app trace as source extraction context → live Gemini embedding → MongoDB MCP `aggregate $vectorSearch`/`find` → classification → validated artifact → MCP `update-many`/`insert-many`. |
| 1:50–2:15 | Result page | Plain-English denial, bucket `corrected_claim`, confidence 0.92, drafted corrected-claim guidance, citation chips that pop up the source `payer_playbooks` chunk on hover. |
| 2:15–2:40 | **MongoDB Before / After diff** | Side-by-side JSON of the `denials` doc. Pre-run shows `status: "new"`, no bucket. Post-run shows `status: "triaged"`, `bucket`, `recommended_action`, `generated_artifact_id`. Voice-over: "Atlas isn't just storage — it's the agent's memory and execution substrate." |
| 2:40–2:55 | Save as rule | One click. `billing_rules` doc inserts. "Now every BCBS-TX 90837 with missing modifier 95 gets caught before submission." |
| 2:55–3:00 | Close | "Built end-to-end on Google Cloud + MongoDB. Repo + hosted URL in the submission." |

**Filming rules:**
- 1440p+, normalized audio, OBS scene transitions (no jump cuts).
- `min-instances=1` on Cloud Run during the demo window.
- Pre-warm the hosted demo with a throwaway sample run before recording.
- **Pre-record a deterministic backup run** with the exact same script — splice in if the live take flakes.

---

## 9. Risk register

| Risk | Mitigation |
|---|---|
| MongoDB integration looks superficial | Trace panel + Before/After diff make MCP calls the centerpiece. Every read/write goes through MCP — never a direct driver call. |
| OCR flakes during the live demo | One clean synthetic PDF + paste-text fallback button visible in the UI. Backup recording always available. |
| Cold start on Cloud Run | `min-instances=1` for the day of recording. ~$5. |
| MCP latency adds up across the trace | Co-locate Atlas + Cloud Run in the same region. Connection-pool the MCP client. Cap `numCandidates`. |
| Gemini model name changes between now and submission | Pin via env var; one-line swap. Do not claim Gemini 3 unless that exact deployed model ID is verified. |
| Judges think we used non-Google AI | README states explicitly: "All AI components are Google Cloud (Gemini generation/embeddings and Document AI). MongoDB Atlas Vector Search is part of the chosen partner stack." Reproduce this in the Devpost description. |
| Repo looks like a fork of prior work | New repo, new commits, new asset hashes, new prompts, new seed data, new diagrams. Never reference any pre-existing project in commits, README, or submission text. See §11. |
| Over-scoping | Re-read §2 *Out of scope* daily. CredentialingRiskAgent stays cut. |

---

## 10. Build plan (14 days)

| Day | Deliverable |
|---|---|
| **1** | New public GitHub repo, Apache-2.0 license, GCP project, billing/budget alerts on. Enable Agent Platform / Vertex AI, Document AI, Cloud Run, Cloud Build, Artifact Registry, Secret Manager, Storage, Logging/Monitoring/Trace APIs. Atlas M10 cluster + a fresh service user. Cloud Run hello-world deployed. |
| **2** | Agents CLI / ADK skeleton. Create `.agents-cli-spec.md`. Wire **MongoDB MCP server** into ADK via `McpToolset`. Put MongoDB and Google config in Secret Manager / env. Smoke-test `find`, `aggregate`, `update-many`, `insert-many` from a RootAgent stub. Create `denials`, `payer_playbooks`, `generated_artifacts`, `trace_events` collections. |
| **3** | Document AI Form Parser tool function. End-to-end: synthetic PDF → GCS → Form Parser → extracted fields → `update-many` denial. |
| **4** | Author **30–60 payer playbook chunks** from scratch (2 payers × 3 CPT families × 5 themes). Generate embeddings with `gemini-embedding-2` at 1536 dims. Insert via MCP `insert-many`. Create and verify the `playbook_vec` Atlas Vector Search index (`create-index` via MCP or Atlas UI/script). |
| **5** | PolicyAgent. `gemini.embed` tool + `$vectorSearch` aggregation. Verify top-k retrieval is sane on the golden denial. |
| **6** | RootAgent bucket classification on retrieved context. Confidence threshold + fallback. Agents CLI eval on a small in-repo set of 5 denials covering 3 buckets; do not use pytest assertions for LLM wording. |
| **7** | DrafterAgent. Generates corrected-claim guidance with citation chips. Citation validation post-processor. `insert-many` artifact + `update-many` denial. |
| **8** | App UI: upload page, denial detail page, Agent Trace panel, citation hover popovers, save-as-rule button. |
| **9** | MongoDB Before / After diff panel. Synthetic EOB PDF authored from scratch (no real payer template). Paste-text fallback wired. |
| **10** | Deterministic backup run recorded. Error states and loading states polished. |
| **11** | README: hero diagram, "Why this is a real agent" section, MongoDB role section, one-command local run, sample denial → expected output table. |
| **12** | Agent Runtime deployment + Cloud Run frontend URL stable. Manual QA pass on golden path. Confirm no Studio-only/RAG Engine/Agent Platform Vector Search dependencies. Devpost long-form description drafted. |
| **13** | Film the 3-minute video. Edit. |
| **14** | Submit on Devpost: hosted URL, repo URL, demo video, **MongoDB track selection**, written description. **24-hour cut-off buffer.** |

**Slip lever:** if D5–D8 take twice as long, cut the "save as rule" flow before cutting any agent or the trace panel. The rule flow is a 25-second beat, not a load-bearing piece.

---

## 11. Compliance with the contest rules

This section exists so we can defend the submission if challenged.

- **Newly created work:** the GitHub repo is created fresh on day 1 of the build window. Every commit is dated inside the window. The blueprint document is internal planning and not part of the submission. No prompts, embeddings, seed data, EOB samples, code, or design assets are carried over from any prior project. The README does not reference any earlier work.
- **Google Cloud Agent Builder compliance:** ClaimCompass uses the code-first Agent Builder path: Google ADK for agent orchestration, deployed to Agent Runtime / Vertex AI Agent Engine. We avoid relying on Agent Studio because the demo needs custom MCP, Document AI, trace persistence, and deterministic evals.
- **AI tools used:** Gemini generation (`gemini-3.5-flash`), Gemini Embedding (`gemini-embedding-2`), and Document AI Form Parser — all Google Cloud. MongoDB Atlas Vector Search is part of the chosen partner's product stack and is used directly (no third-party LLM behind it). No Claude, no OpenAI, no third-party OCR AI is invoked at runtime.
- **Partner MCP server:** the official MongoDB MCP server is integrated into the app path. Agent database reads/writes go through MCP tools (`find`, `aggregate`, `update-many`, `insert-many`, `count`) — visible in the in-app trace panel.
- **Third-party IP:** no real payer logos, no real EOBs, no copy-pasted policy bulletins, no real patient identifiers. Playbook chunks are paraphrased rules with `source_url` pointers to publicly available X12 / CMS references.
- **License:** Apache-2.0 at repo root.
- **Demo data:** every screen showing claim or denial content carries a "DEMO DATA — NOT REAL PHI" watermark.

---

## 12. README outline (judges will skim it in 90 seconds)

1. One-paragraph pitch (the positioning statement from §1, verbatim).
2. **Hero architecture diagram** (turn the §3 ASCII into a real image).
3. **"Why this is a real agent, not a chatbot"** — screenshot of the Agent Trace panel showing 11 MCP + Document AI + Gemini calls across three agents.
4. **MongoDB role:** collections, vector-search index definition, the exact MCP tools used, and the `$vectorSearch` aggregation pipeline copy-pasted.
5. One-command local run: `make demo` (Docker compose or Cloud Run dev script).
6. Sample denial → expected output table.
7. Apache-2.0 license link.

---

**End of hackathon blueprint v2.** Built to win the MongoDB track at the Google Cloud Rapid Agent Hackathon.
