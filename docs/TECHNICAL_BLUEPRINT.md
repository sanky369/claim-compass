# ClaimCompass — Technical Blueprint (MVP → V1)

> **The insurance revenue copilot for behavioral-health therapists.**
> Decode denials, triage the next action across six buckets, monitor credentialing health, prevent repeat denials — without switching EHRs.

**Audience:** founding engineering team (2 engineers + design).
**Goal:** ship a narrow, trustworthy MVP that a paying solo therapist can use end-to-end in **8–12 weeks** (8 is aggressive; 10–12 is honest once HIPAA ops, payer-playbook quality, and evals are accounted for), with the same architectural bones we ride into V1.
**Status:** v0.2 — May 2026. Revised after external feasibility review (cost model, OCR strategy, Vercel/PHI boundary, credentialing positioning, Stedi economics).

### What changed in v0.2

- **Textract cost corrected.** Forms+Tables is ~$0.065/page (not $0.015). MVP defaults to a cheaper OCR strategy; Forms+Tables is opt-in.
- **Prompt caching reframed as upside, not a guaranteed 90% reduction.** Instrument cost/denial day 1; assume conservative hit rate at launch.
- **Vercel PHI boundary tightened.** Marketing + app shell only — no PHI in Vercel logs, previews, error traces, analytics, or SSR responses.
- **Credentialing rebranded** to "credentialing risk signals" / "credentialing health monitor" — we surface public-dataset signals, we do not assert payer enrollment.
- **Stedi priced separately** as a usage-based V1 add-on or higher tier. Not bundled into the $79/mo Solo plan.
- **Cost model** now has lean / forms-heavy / V1+Stedi scenarios with realistic Aurora, NAT, Stripe, and Textract numbers.
- **Pricing tiers** added (Solo with denial cap, Practice, EDI add-on, per-page overage).
- **8-week plan** kept as the target sprint, with an honest 10–12-week range called out.

---

## 0. Table of Contents

1. [Product Scope: MVP vs V1](#1-product-scope-mvp-vs-v1)
2. [System Architecture](#2-system-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Data Model](#4-data-model)
5. [Core Workflows](#5-core-workflows)
6. [AI / LLM Pipeline](#6-ai--llm-pipeline)
7. [External Integrations](#7-external-integrations)
8. [API Surface](#8-api-surface)
9. [HIPAA & Security](#9-hipaa--security)
10. [Deployment & DevOps](#10-deployment--devops)
11. [Cost Model](#11-cost-model)
12. [8-Week MVP Plan](#12-8-week-mvp-plan)
13. [MVP → V1 Roadmap](#13-mvp--v1-roadmap)
14. [Risks & Open Questions](#14-risks--open-questions)
15. [Appendix: Reference Data Sources](#15-appendix-reference-data-sources)

---

## 1. Product Scope: MVP vs V1

The product owns the **full insurance revenue arc** — before, during, and after a denial. We sequence features so the highest-leverage, lowest-friction capability ships first.

### MVP (weeks 0–8) — "Decode My Denial"

**Acceptance criteria:** A solo therapist signs up, uploads a denial (PDF EOB or pasted text), gets a plain-language explanation and a recommended next action within 30 seconds, then either generates a fix artifact (corrected claim guidance draft, appeal letter draft, payer call script, client invoice note) or saves it as a billing rule. **Credentialing Risk Monitor** page surfaces NPI/taxonomy, license expiration (manual entry), OIG LEIE, SAM.gov, and Medicare Opt-Out signals — clearly labeled as risk signals, not authoritative payer enrollment.

> **Positioning guardrails for MVP messaging:**
> - Generated letters, scripts, and corrected-claim guidance are **drafts for therapist/biller review** — never auto-filed.
> - Credentialing screens use language like *"signals from public datasets"* — we never tell a user *"you are credentialed with payer X."*
> - No claim submission, no eligibility checks, no ERA ingestion, no EHR integration in MVP.

| Feature | MVP | V1 |
|---|---|---|
| **Denial Decoder** (paste/upload → plain English) | ✅ | ✅ + bulk ingestion |
| **6-Bucket Triage** with confidence score | ✅ | ✅ + auto-routing by user rules |
| **Appeal Letter Generator** (payer-tuned) | ✅ basic | ✅ + attachment checklist + e-fax |
| **Payer Call Script + Portal Checklist** | ✅ | ✅ + recorded outcome capture |
| **Corrected Claim Guidance** (modifier/POS/etc.) | ✅ instructions | ✅ submit via Stedi 837P |
| **Credentialing Risk Monitor** (public-dataset signals only) | ✅ NPI + license + OIG/SAM + Medicare opt-out | ✅ + CAQH attestation tracking + payer directory cross-check |
| **Repeat-Denial Prevention Rules** | ✅ manual save-as-rule | ✅ auto-suggest from patterns |
| **Aging AR Dashboard** | ❌ | ✅ |
| **Eligibility Verification** (270/271) | ❌ | ✅ via Stedi |
| **Claim Submission** (837P) | ❌ | ✅ via Stedi |
| **ERA Auto-Ingest** (835) | ❌ | ✅ via Stedi SFTP |
| **Multi-user / supervisor roles** | ❌ | ✅ |
| **EHR import (SimplePractice etc.)** | ❌ | ⏳ exploratory — email-forward pattern first |

### Non-goals for V1

- Replacing the EHR. We integrate via uploads, email-forwards, and clearinghouse feeds — never as a charting system.
- Patient-facing portal.
- Predictive denial scoring before submission (Anomaly's lane). Revisit post-V1.

---

## 2. System Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                          MARKETING + WEB APP                          │
│            Next.js 16 (App Router) · Vercel Pro + HIPAA                │
│   - Public marketing pages (no PHI)                                    │
│   - Authenticated app shell (UI only — no PHI rendering server-side)   │
│   - PHI fetched client-side directly from api.claimcompass.com (AWS)   │
│   - No PHI in Vercel logs, previews, error traces, analytics, or SSR  │
└───────────────────────────┬───────────────────────────────────────────┘
                            │  HTTPS + signed session cookie
                            ▼
┌───────────────────────────────────────────────────────────────────────┐
│                    PHI API + WORKERS  (AWS us-east-1, VPC)             │
│                                                                        │
│   ┌──────────────┐   ┌──────────────────┐   ┌─────────────────────┐  │
│   │ ECS Fargate  │   │ ECS Fargate      │   │ Lambda (light jobs) │  │
│   │  API service │   │  Worker service  │   │  - webhooks         │  │
│   │  (tRPC/REST) │◄──┤  (SQS consumer)  │   │  - cron triggers    │  │
│   └──────┬───────┘   └──────┬───────────┘   └──────────┬──────────┘  │
│          │                  │                          │              │
│          ▼                  ▼                          ▼              │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │              Aurora Postgres Serverless v2 + pgvector         │   │
│   │  - app schema (denials, claims, providers, rules, audit_log) │   │
│   │  - reference schema (CARC, RARC, NUCC, NPPES snapshot)        │   │
│   │  - vector schema (payer_policy_chunks, denial_embeddings)     │   │
│   └──────────────────────────────────────────────────────────────┘   │
│                                                                        │
│   ┌────────────┐  ┌────────────┐  ┌──────────┐  ┌────────────────┐   │
│   │ S3 + KMS   │  │   SQS      │  │ Cognito  │  │ Secrets Manager│   │
│   │ EOBs/ERAs  │  │ job queues │  │ auth+MFA │  │ vendor keys    │   │
│   └────────────┘  └────────────┘  └──────────┘  └────────────────┘   │
└───────────────────┬───────────────────────┬──────────────┬────────────┘
                    │                       │              │
       ┌────────────┴───┐      ┌────────────┴───┐  ┌───────┴────────┐
       │ AWS Bedrock    │      │ AWS Textract   │  │ External APIs  │
       │  Claude Sonnet │      │  EOB OCR       │  │  - Stedi (EDI) │
       │  Claude Haiku  │      │  (forms+tables)│  │  - NPPES       │
       └────────────────┘      └────────────────┘  │  - SAM.gov     │
                                                   │  - OIG LEIE    │
                                                   │  - Payer FHIR  │
                                                   └────────────────┘
```

**Why this shape:**

- **PHI never lands on Vercel — and we enforce that strictly.** Vercel's HIPAA add-on covers compute, but we still keep all PHI fetching, rendering, logging, and file handling inside AWS. The Next.js app on Vercel is a UI shell: client-side fetches to `api.claimcompass.com` (ECS behind ALB) return PHI directly to the authenticated browser, never through a Vercel server route. **No PHI in Vercel logs, edge functions, preview deployments, error traces, analytics, image optimization, or SSR payloads.** A PR-time lint rule rejects PHI-touching server routes; a runtime header (`x-no-phi-server`) is asserted on Vercel-originated requests. See §9.5.
- **One AWS BAA** covers Bedrock, Textract, RDS, S3, SQS, Cognito, SES, CloudWatch, Secrets Manager. No per-vendor BAA juggling.
- **Stateless API + queue-driven workers.** Heavy work (OCR, LLM, policy lookup, external API calls) goes to SQS → Fargate worker so the API stays snappy and we can retry/observe.
- **Aurora Serverless v2 + pgvector.** One database, two indexing strategies (relational + vector). No separate vector DB until we exceed ~5M policy chunks.

---

## 3. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Framework** | Next.js 16 (App Router, RSC) | Already scaffolded; great DX; clean split between marketing (static) and app (PHI proxy). |
| **Language** | TypeScript everywhere | One language across web + workers reduces context-switching for a 2-person team. |
| **PHI API** | Hono on Node 22 in ECS Fargate, behind ALB | Lightweight, fast cold start, easy to swap to Lambda later. tRPC for typed RPC from Next.js client. |
| **DB** | Aurora Postgres Serverless v2 + pgvector | HIPAA-eligible under AWS BAA. Branching less critical than control + parity with prod. |
| **ORM** | Drizzle | Edge-friendly, SQL-first, no runtime weight. Type-safe migrations. |
| **Auth** | AWS Cognito (OIDC) + MFA enforced | Under AWS BAA, ~free at MVP scale. Hosted UI keeps surface small. NextAuth optional fallback. |
| **Object storage** | S3 + KMS CMK, presigned POST uploads | Standard. Lifecycle to S3-IA after 90 days. |
| **Queue** | SQS standard + Fargate worker pool | Boring, reliable, cheap. DLQ for poison messages. |
| **LLM** | Claude Sonnet 4.6 (Bedrock) + Haiku 4.5 | Sonnet for triage/decoder + appeal generation; Haiku for cheap classification + routing. Prompt caching on payer playbooks is **upside** (target ≥50% effective discount at scale; assume conservative cache hit at launch — Bedrock TTL is 5 min, low concurrency hurts hit rate). |
| **OCR** | AWS Textract — **tiered strategy** | **Default path:** `DetectDocumentText` (~$0.0015/page) for pasted/typed denials and high-quality EOB pages, falling back to `AnalyzeDocument(TABLES)` or `AnalyzeDocument(QUERIES)` (~$0.015/page) when structured fields are needed. **Forms+Tables** (~$0.065/page) is **opt-in** only for complex multi-claim EOBs where the cheaper modes fail confidence thresholds. Routing decision is logged per page; cost telemetry per denial. |
| **EDI** | Stedi (270/271, 276/277, 837P, 835) | JSON-over-REST, BAA, free Basic plan to start. Deferred to V1. |
| **NPI lookup** | NPPES (live API + monthly bulk into Postgres) | Free. Bulk for fast intra-app search; live for refresh. |
| **Sanctions** | OIG LEIE CSV + SAM.gov v3 API + Medicare Opt-Out CSV | All free. Nightly job rebuilds match index. |
| **Email** | AWS SES + React Email | Magic-link auth, notifications. No PHI in body — link to app. |
| **Logs/metrics** | CloudWatch + X-Ray + Sentry (frontend only, scrubbed) | Under AWS BAA. Sentry only sees redacted browser errors. |
| **Secrets** | AWS Secrets Manager | Rotation, audit. |
| **IaC** | Terraform (root) + SST (Next.js app artifact only if useful) | Reproducible infra. Open-source toolchain only — no Pulumi license complexity. |
| **CI/CD** | GitHub Actions → Vercel preview deploys + ECR image push + ECS task update | Standard. PR previews for marketing; staging ECS env for app. |
| **Feature flags** | OpenFeature SDK + Postgres-backed provider | Self-hosted, no third-party BAA. |
| **Compliance tooling** | Vanta or Drata (post-first-customer) | SOC 2 + HIPAA evidence collection. ~$500–1,500/mo. |

**What we explicitly avoided and why:**

- **Vercel for PHI storage** — Vercel Pro BAA add-on covers compute, but we still prefer to land all PHI in AWS for blast-radius reasons.
- **Cloudflare R2 / Vercel Blob / UploadThing** — no BAA as of May 2026.
- **Inngest / Trigger.dev / Resend / BetterStack** — great DX, no BAA. Revisit when they add it.
- **Clerk / Auth0 / WorkOS** — BAAs only on Enterprise tiers (~$2k+/mo). Cognito is free under our existing AWS BAA.
- **Mistral Document AI / Reducto** — no BAA yet. Textract wins.
- **Pinecone / Qdrant standalone** — premature. pgvector handles MVP scale.

---

## 4. Data Model

Five Postgres schemas. All PHI lives in `app.*` and is row-level-secured by `practice_id`. Reference data is read-only and contains no PHI.

### `app` schema (PHI)

```sql
-- Tenancy
create table app.practice (
  id              uuid primary key default gen_random_uuid(),
  legal_name      text not null,
  tax_id          text,                          -- encrypted column
  practice_type   text check (practice_type in ('solo','group')) not null,
  state           text not null,
  created_at      timestamptz not null default now()
);

create table app.user (
  id              uuid primary key default gen_random_uuid(),
  practice_id     uuid not null references app.practice(id),
  cognito_sub     text not null unique,
  email           text not null,
  role            text check (role in ('owner','clinician','biller','viewer')) not null,
  created_at      timestamptz not null default now()
);

-- Providers (clinicians the practice bills under)
create table app.provider (
  id                uuid primary key default gen_random_uuid(),
  practice_id       uuid not null references app.practice(id),
  npi               text not null,                -- NPI-1 (individual)
  group_npi         text,                         -- NPI-2 (if billed under group)
  legal_name        text not null,
  credentials       text,                         -- "LCSW", "PsyD", etc.
  primary_taxonomy  text not null references ref.nucc_taxonomy(code),
  license_number    text,
  license_state     text,
  license_expires   date,
  caqh_id           text,
  caqh_last_attest  date,
  dea_number        text,                         -- encrypted
  created_at        timestamptz not null default now()
);

-- Payer registry (per-practice, for credentialing tracking)
create table app.payer_enrollment (
  id                  uuid primary key default gen_random_uuid(),
  practice_id         uuid not null references app.practice(id),
  provider_id         uuid not null references app.provider(id),
  payer_id            text not null references ref.payer(id),
  network_status      text check (network_status in ('in_network','out_of_network','pending','terminated')),
  effective_date      date,
  termination_date    date,
  contract_type       text check (contract_type in ('individual','group')),
  notes               text
);

-- Claims (denormalized — most data comes from EOB upload, not 837 submission in MVP)
create table app.claim (
  id                  uuid primary key default gen_random_uuid(),
  practice_id         uuid not null references app.practice(id),
  provider_id         uuid not null references app.provider(id),
  payer_id            text references ref.payer(id),
  patient_ref         text,                       -- pseudonymized/short ref; full PHI in patient table if collected
  patient_dob_hash    text,                       -- for matching, not retrieval
  date_of_service     date,
  cpt                 text,                       -- e.g. '90837'
  modifiers           text[],                     -- e.g. ['95']
  pos                 text,                       -- e.g. '10' (home)
  diagnosis           text[],                     -- ICD-10
  billed_amount       numeric(10,2),
  allowed_amount      numeric(10,2),
  paid_amount         numeric(10,2),
  patient_resp        numeric(10,2),
  status              text check (status in ('paid','denied','partial','pending','written_off')),
  created_at          timestamptz not null default now()
);

-- Denials — central table for triage
create table app.denial (
  id                    uuid primary key default gen_random_uuid(),
  practice_id           uuid not null references app.practice(id),
  claim_id              uuid references app.claim(id),
  source                text check (source in ('upload_pdf','paste','era_835','clearinghouse_api','email_forward')) not null,
  source_artifact_id    uuid references app.uploaded_artifact(id),
  payer_id              text references ref.payer(id),
  carc_codes            text[],                   -- e.g. ['CO-45']
  rarc_codes            text[],                   -- e.g. ['N179']
  raw_text              text,                     -- full payer reason text
  plain_english         text,                     -- decoder output
  bucket                text check (bucket in (
                          'fix_resubmit','corrected_claim','payer_followup',
                          'credentialing','true_appeal','client_bill','write_off'
                        )),
  bucket_confidence     numeric(3,2),             -- 0.00–1.00
  recommended_action    jsonb,                    -- structured action plan
  status                text check (status in (
                          'new','triaged','in_progress','resolved','at_risk','written_off'
                        )) not null default 'new',
  at_risk_amount        numeric(10,2),
  resolution_outcome    text,
  resolved_at           timestamptz,
  created_at            timestamptz not null default now()
);

create index on app.denial (practice_id, status);
create index on app.denial (practice_id, bucket, created_at desc);

-- Artifacts (raw uploads, generated letters)
create table app.uploaded_artifact (
  id              uuid primary key default gen_random_uuid(),
  practice_id     uuid not null references app.practice(id),
  s3_key          text not null,                  -- s3://claimcompass-phi/<practice>/<uuid>
  kms_key_arn     text not null,
  mime_type       text not null,
  size_bytes      bigint not null,
  ocr_status      text check (ocr_status in ('pending','done','failed')),
  ocr_json_key    text,                           -- pointer to Textract JSON in S3
  created_at      timestamptz not null default now()
);

create table app.generated_artifact (
  id              uuid primary key default gen_random_uuid(),
  practice_id     uuid not null references app.practice(id),
  denial_id       uuid not null references app.denial(id),
  kind            text check (kind in (
                    'appeal_letter','corrected_claim_guidance','call_script',
                    'client_invoice_note','medical_necessity_letter'
                  )) not null,
  content_md      text not null,
  s3_pdf_key      text,
  llm_model       text,
  prompt_version  text,
  created_at      timestamptz not null default now()
);

-- Repeat-denial rules
create table app.billing_rule (
  id              uuid primary key default gen_random_uuid(),
  practice_id     uuid not null references app.practice(id),
  payer_id        text references ref.payer(id),
  trigger         jsonb not null,                  -- {cpt:'90837', pos:'10', missing_modifier:'95'}
  guidance        text not null,
  source_denial_id uuid references app.denial(id),
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- Immutable audit log (HIPAA §164.312(b))
create table app.audit_log (
  id              bigserial primary key,
  practice_id     uuid,
  user_id         uuid,
  action          text not null,                  -- 'denial.view', 'artifact.download', etc.
  target_kind     text,
  target_id       uuid,
  ip              inet,
  user_agent      text,
  metadata        jsonb,
  occurred_at     timestamptz not null default now()
);
-- partition by month for retention/perf
```

### `ref` schema (no PHI, read-mostly)

```sql
-- CARC + RARC code dictionaries (X12 standard)
create table ref.carc (code text primary key, description text, plain_english text, common_buckets text[]);
create table ref.rarc (code text primary key, description text, plain_english text);

-- NUCC provider taxonomy
create table ref.nucc_taxonomy (
  code text primary key,
  grouping text, classification text, specialization text,
  display_name text, is_behavioral_health boolean
);

-- NPPES snapshot (monthly bulk + nightly delta)
create table ref.nppes_provider (
  npi text primary key,
  enumeration_type text,                          -- NPI-1 / NPI-2
  legal_name text,
  primary_taxonomy text references ref.nucc_taxonomy(code),
  taxonomies jsonb,
  practice_state text,
  deactivation_date date,
  last_updated date
);
create index on ref.nppes_provider using gin (to_tsvector('english', legal_name));

-- Payers (curated, augmented with our learnings)
create table ref.payer (
  id text primary key,                            -- our slug e.g. 'bcbs-tx'
  display_name text not null,
  parent_org text,                                -- 'BCBSA', 'Optum/UHC'
  fhir_directory_url text,                        -- public Patient Access endpoint
  appeal_address jsonb,
  appeal_fax text,
  appeal_portal_url text,
  timely_filing_days int,
  notes text
);

-- Payer playbooks — the moat
create table ref.payer_playbook_chunk (
  id uuid primary key default gen_random_uuid(),
  payer_id text references ref.payer(id),
  scope jsonb,                                    -- {cpt:'90837', topic:'telehealth_modifier'}
  title text,
  body text,                                      -- markdown rule/explanation
  embedding vector(1536),                         -- text-embedding-3-large
  source_url text,
  effective_date date,
  superseded_by uuid references ref.payer_playbook_chunk(id)
);
create index on ref.payer_playbook_chunk using hnsw (embedding vector_cosine_ops);

-- Sanctions
create table ref.sanction (
  source text check (source in ('oig_leie','sam_gov','medicare_optout','state_medicaid')),
  npi text,
  name_normalized text,
  dob date,
  excl_type text,
  excl_date date,
  reinstate_date date,
  raw jsonb,
  ingested_at timestamptz not null default now()
);
create index on ref.sanction (npi);
create index on ref.sanction (name_normalized);
```

### `app.*` row-level security

Every `app.*` table has RLS enabled with a policy like:

```sql
alter table app.denial enable row level security;
create policy denial_tenant on app.denial
  using (practice_id = current_setting('app.practice_id', true)::uuid);
```

Connection pool sets `app.practice_id` per request via a session-context middleware. Background workers set it explicitly per job message.

---

## 5. Core Workflows

### 5.1 Denial Intake → Triage → Action

```
[Therapist] uploads EOB.pdf
        │
        ▼
[Next.js client]  POST /api/uploads  → presigned S3 POST URL
        │
        ▼
[Browser]   PUT directly to S3 (KMS-encrypted)
        │
        ▼
[Next.js API]  POST /api/denials  { artifact_id }
        │
        ▼
[ECS API]  insert app.uploaded_artifact(ocr_status='pending');
           insert app.denial(status='new', source='upload_pdf');
           enqueue SQS: { job:'process_denial', denial_id }
        │
        ▼
[Worker]  ─┬─ Textract: AnalyzeDocument(TABLES+FORMS)  ──► save OCR JSON to S3
           │
           ├─ LLM (Haiku): extract structured claim ────► {payer, cpt, dx, carc, rarc, amounts}
           │
           ├─ Retrieve playbook chunks (pgvector)  ─────► top-k context
           │
           ├─ LLM (Sonnet, prompt-cached payer rules):
           │     Decode → plain_english
           │     Classify → bucket + confidence
           │     Propose action → recommended_action (jsonb)
           │
           ├─ Update app.denial + app.claim
           │
           └─ Notify user (SES magic-link "Your denial is ready")
```

Latency target: **<30s p50, <60s p95** from upload to "ready". OCR is the slowest step (~10–20s for multi-page EOBs).

### 5.2 Triage Buckets → Action Recipes

Each bucket has a deterministic "action recipe" the LLM fills in:

| Bucket | Recipe outputs | Generator |
|---|---|---|
| **fix_resubmit** | What to change (CPT/dx/modifier/POS/NPI), how to resubmit in your EHR | LLM (Sonnet) + payer playbook lookup |
| **corrected_claim** | 7-field corrected-claim guidance + payer-specific submission method | LLM + ref.payer.appeal_portal_url |
| **payer_followup** | Call script: who to ask for, reference IDs, exact questions, screenshots to save | LLM (script template) |
| **credentialing** | Specific fix (CAQH re-attest, taxonomy update, group contract escalation) + responsible party | Rule-based + LLM |
| **true_appeal** | Drafted appeal letter (markdown + PDF), attachment checklist, deadline countdown | LLM (Sonnet, citation-required) |
| **client_bill** | Invoice-line note + script for the conversation | LLM (short) |
| **write_off** | Reason + tax-deduction notation; flag for accountant export | Rule-based |

### 5.3 Credentialing Risk Monitor (daily cron)

> Output is a **risk signals** snapshot — not a verification of payer enrollment. UI and notifications always cite the data source and a last-checked timestamp.

```
Nightly @ 03:00 UTC:
  for each practice:
    for each provider:
      - NPPES lookup → diff against stored taxonomy/state/active
      - License expiration → days remaining, flag <60d
      - CAQH attestation → days since last_attest, flag >100d
      - Sanctions sweep → fuzzy match against ref.sanction
      - Payer FHIR directory (top 10) → listing presence + listed taxonomy
    Write provider_health snapshot row
    If status changes → email + in-app notification
```

### 5.4 Repeat-Denial Prevention

When a denial is resolved, the user is prompted: **"Save this fix as a billing rule?"** If yes, we serialize the trigger pattern (e.g. `{cpt:'90837', pos:'10', payer:'bcbs-tx', missing_modifier:'95'}`) and surface it as a checklist on every new claim of the same shape (V1: we'll lint claims pre-submission via 837P; MVP: surface in the dashboard).

---

## 6. AI / LLM Pipeline

### 6.1 Model selection per step

| Step | Model | Why |
|---|---|---|
| OCR | Textract (tiered: DetectDocumentText → Tables/Queries → Forms+Tables) | Deterministic, BAA. **$0.0015/page** default; **$0.015/page** for structured fields; **$0.065/page** only on fallback for complex EOBs. |
| Structured extraction from OCR JSON | **Claude Haiku 4.5** | Cheap, fast, structured-output mode |
| Bucket classification | **Claude Haiku 4.5** with payer-rule context | $1/M in, plenty for routing |
| Plain-English decoder + recommended action | **Claude Sonnet 4.6** | Quality matters; prompt-cache payer playbooks |
| Appeal letter generation | **Claude Sonnet 4.6** | Tone + medical-necessity citations |
| Payer call script | **Claude Haiku 4.5** | Template-y, cheap |
| Embedding generation (playbook chunks) | OpenAI `text-embedding-3-large` via Azure (BAA) or **Cohere Embed v3** via Bedrock | Bedrock keeps us in one BAA |

### 6.2 Prompt caching strategy

The expensive context is the **payer playbook** (rules, common denial fixes, fee schedules, prior auth requirements). For each (payer × CPT family) we ship a ~5–15K-token system context. Bedrock prompt caching offers up to ~90% read discount on cache hits, but at launch we **treat this as upside, not a planned saving**:

- Bedrock cache TTL is **5 minutes**. At low concurrency (single therapist working through a queue of denials spaced out across hours), the effective hit rate may be well below 50%.
- We instrument **LLM cost per denial** from day 1 (Sonnet input/output/cache-read/cache-write tokens labeled by payer + CPT shape) and use that data — not assumed cache rates — to plan unit economics.
- To improve hit rate at low concurrency, the worker batches denials by (payer, CPT family) when more than one is queued, and uses a warm-up call for active payers at the start of a user session.
- Cost model in §11 explicitly uses a **conservative cache hit assumption** (~40–60%) and a separate "stretch" assumption to show upside.

### 6.3 Retrieval pipeline

1. Embed the denial text + claim metadata.
2. Filter `ref.payer_playbook_chunk` to `payer_id = X AND scope.cpt = Y`.
3. HNSW cosine search → top-8 chunks.
4. Concatenate into Sonnet system prompt (cached on payer key).
5. Tool-call structured output → `{bucket, confidence, plain_english, recommended_action, citations[]}`.

### 6.4 Guardrails

- **No hallucinated payer addresses** — appeal generator's "where to send" field is sourced only from `ref.payer.appeal_address`, never the LLM.
- **No invented denial codes** — Haiku extracts CARC/RARC from text, validated against `ref.carc` / `ref.rarc`. Unknown codes flagged for human review, not invented.
- **Citation requirement** — appeal letters must cite playbook chunks (UUIDs persisted on `generated_artifact`).
- **PII minimization in prompts** — patient name redacted to `[PATIENT]` before sending to model; we restore on render.
- **Eval harness** — `/evals` directory with 200 gold-standard denials (synthesized + de-identified real). Run on every prompt change.

### 6.5 Failure modes

| Failure | Detection | Recovery |
|---|---|---|
| OCR confidence < 0.6 on key fields | Textract confidence scores | Mark `ocr_status='failed'`, ask user to paste text manually |
| LLM returns bucket with confidence < 0.7 | Structured output | Show "Needs human review" + side-by-side payer text + best-guess |
| Bedrock 429 / outage | SDK retry + circuit breaker | Failover to Anthropic direct API (separate BAA, same model) |

---

## 7. External Integrations

| Integration | When | Auth | Free tier | Owner |
|---|---|---|---|---|
| **NPPES Registry** | MVP day 1 | None | Yes | Backend |
| **NUCC Taxonomy** | MVP day 1 | None (CSV) | Yes | Backend |
| **OIG LEIE** | MVP day 1 | None (CSV) | Yes | Backend |
| **SAM.gov Exclusions API** | MVP day 1 | API key (free) | 10k/day | Backend |
| **Medicare Opt-Out CSV** | MVP day 1 | None | Yes | Backend |
| **AWS Bedrock** | MVP day 1 | IAM | Pay-go | Backend |
| **AWS Textract** | MVP day 1 | IAM | $0.0015–$0.065/page (tiered) | Backend |
| **AWS SES** | MVP day 1 | IAM | 62k/mo free outbound | Backend |
| **Payer FHIR Directories** (top 10) | MVP week 6 | None | Yes | Backend |
| **Stripe** (billing) | MVP week 7 | API key | Pay-go | Full-stack |
| **Stedi** (270/271, 276/277, 835, 837P) | V1 | OAuth + BAA | Basic plan free | Backend |
| **ProviderTrust or EverCheck** (license monitoring) | V1 | API key | Paid (~$3–8/provider/mo) | Backend |
| **CAQH ProView API** | Post-V1 | PO contract | Enterprise | Founders |

### Integration-specific notes

**NPPES bulk ingest.** Download monthly file (~7GB zipped), stream into a staging table, swap atomically. Weekly incrementals via the delta file. Live API for ad-hoc refresh on a single NPI.

**Payer FHIR Directories.** Each major payer publishes their Patient Access base URL (CMS maintains a directory). Practitioner / PractitionerRole / InsurancePlan / Network resources. We use them for "Are you listed?" health-check only — accuracy is poor enough that we never tell a user they're definitely out-of-network from this.

**Stedi for V1 — priced separately, not bundled into Solo.** Drop-in REST/JSON for the four transactions we need most: 270/271 (eligibility), 276/277 (claim status), 837P (submit corrected claim), 835 (auto-ingest ERAs via SFTP webhook). Free Basic plan for development; **Developer plan is ~$500/mo base** plus per-transaction fees:

| Transaction | Stedi price | Notes |
|---|---|---|
| 270/271 eligibility | $0.15 | per check |
| 276/277 claim status | $0.15 | per check |
| 837P claim submission | $0.20 | per claim |
| 835 ERA | $0.15 | per remittance |
| 275 claim attachments | $0.75 | per attachment |

At 5,000 claims/month with full loop, Stedi alone is **~$3,000–$4,100/mo**. We must not bundle unlimited EDI into a $79 plan — see Pricing Strategy in §11. Payer enrollment is also a per-payer onboarding burden — budget operational time, not just dollars.

### Credentialing data — what we do and do **not** claim

These public datasets power the **Credentialing Risk Monitor**. They are **signals**, not proof of payer enrollment:

| Source | Signal type | What we surface | What we never claim |
|---|---|---|---|
| NPPES | Identity / taxonomy | NPI active, taxonomy match, deactivation date | "You are credentialed with payer X" |
| OIG LEIE | Federal exclusion | Match alert (fuzzy + NPI) | Final legal determination |
| SAM.gov | Debarment | Match alert | Cause of debarment specificity |
| Medicare Opt-Out | Opt-out flag | Whether the NPI appears on the opt-out list | Whether you can bill Medicare today |
| Payer FHIR directories (top 10) | Listing presence | "Listed" / "not listed" with last-checked timestamp | "In-network" status — directories are too unreliable |
| State license boards | Status / expiration | Manual entry in MVP; later API-backed | Disciplinary action specificity beyond the public record |
| CAQH | Attestation freshness | Post-V1 only; manual entry until then | Payer-roster status |

UI copy uses *"Risk signals from public datasets — verify directly with payer."* Generated artifacts (letters, scripts, corrected-claim guidance) are framed as **drafts for review**.

---

## 8. API Surface

We expose **two** API styles:

1. **Internal tRPC router** (Next.js → ECS) — typed, fast iteration.
2. **REST webhook receivers** — for Stripe, Stedi SFTP-drop notifications, email-forward (`forward+denial@in.claimcompass.com`).

### tRPC routers (MVP)

```ts
// /server/routers
auth.router        - { signUp, signIn, requestMagicLink, completeMfa }
practice.router    - { get, update, listMembers, inviteMember }
provider.router    - { list, create, updateLicense, healthSnapshot }
payer.router       - { search }
upload.router      - { presign(mimeType, sizeBytes) → { url, fields, artifactId } }
denial.router      - { create, list, get, retry, manualBucket, markResolved }
artifact.router    - { listForDenial, download(id) → presigned-get URL }
rule.router        - { list, createFromDenial, toggle }
credentialing.router - { provider(id) → { nppes, sanctions, license, caqh } }   // returns risk signals only
audit.router       - { listForPractice(filters) — owner role only }
billing.router     - { plan, openPortal, openCheckout }
```

### REST webhooks

```
POST /webhooks/stripe                 — subscription lifecycle
POST /webhooks/email/denial-forward   — SES inbound → S3 → enqueue
POST /webhooks/stedi/era              — V1 only
```

### Public unauthenticated landing-page lead capture

```
POST /api/lead   { email }   — no PHI; stored in Postgres `app.lead`
```

---

## 9. HIPAA & Security

### 9.1 BAAs in place before first paying customer

- [ ] AWS (sign in AWS Artifact, free)
- [ ] Vercel HIPAA add-on ($350/mo)
- [ ] Anthropic (only if we use the direct API as Bedrock failover) — self-serve via privacy.claude.com
- [ ] Stedi (V1)
- [ ] Stripe (auto-signed via subscription)
- [ ] Sentry (Enterprise — defer; until then, frontend-only with strict scrubbing and no PHI lint rule)

### 9.2 Technical safeguards (§164.312)

| Requirement | Implementation |
|---|---|
| Access controls | Cognito + MFA enforced (TOTP or WebAuthn); RBAC via `app.user.role`; RLS in Postgres |
| Audit logs | `app.audit_log` append-only, partitioned monthly, retained 6+ years per HIPAA |
| Integrity | All artifacts hashed (SHA-256) on upload; verified on download; checksums in S3 ETag |
| Transmission security | TLS 1.2+ everywhere; HSTS preload; ACM-managed certs |
| Encryption at rest | S3 SSE-KMS with CMK per environment; RDS encryption with KMS; Secrets Manager |
| Encryption in transit | TLS to all data planes including RDS, S3, Bedrock |
| Automatic logoff | 15-min idle Cognito session timeout for non-MFA, 8-hour for MFA-bound |

### 9.3 Administrative safeguards

- Documented policies (Access Control, Incident Response, BCP/DR, Sanction, Workforce Training) — start with a template kit from Vanta or Drata when we hit a customer who asks for them.
- Annual risk assessment (SRA Tool from HealthIT.gov for v0).
- Workforce training for any contractor with prod access; tracked in HRIS.
- Designated Security Officer and Privacy Officer (founder + early ops hire).

### 9.4 Physical safeguards

Inherited from AWS BAA. We don't operate any hardware. (We avoid Vercel-hosted PHI partly so that the physical-safeguards surface is single-source: AWS only.)

### 9.5 PHI minimization & the Vercel boundary

- We do **not** require patient name to do triage. Patient identifier in our DB is a short ref; we store the minimum required to disambiguate claims.
- Patient name in payer documents is OCR-extracted but redacted to `[PATIENT]` before sending text to the LLM, restored only on render to authorized practice users.
- DOB stored as a one-way hash for matching, never recoverable.
- **Vercel exclusion list (enforced in code and CI):**
  - No PHI in `app/` server components, server actions, route handlers, or middleware.
  - No PHI in Vercel logs, build logs, runtime logs, Sentry/Vercel analytics, error traces, or preview deployments.
  - No PHI through `next/image` optimization (uploaded artifacts are served from AWS only).
  - No PHI in URL paths or query strings that hit Vercel routing.
  - Client-side fetches use a separate auth flow against `api.claimcompass.com`; auth tokens scoped so that Vercel-originating servers cannot replay them against PHI endpoints.
  - A `phi-lint` rule in CI greps server-side files for known PHI field names and blocks the PR if matched.
  - The PHI API rejects any request whose origin or referer indicates a Vercel server route (only `Origin: https://app.claimcompass.com` from the browser is accepted).

### 9.6 Compliance cost reality

BAAs are necessary but not sufficient. Realistic launch budget beyond the recurring SOC 2 platform fee:

| Item | Expected cost |
|---|---|
| HIPAA policies / SRA / templates / counsel review | **$2k–$15k one-time** |
| Vendor / BAA review (Stripe, Stedi, AWS, Vercel) | Counsel hours, ad-hoc |
| SOC 2 readiness platform (Vanta / Drata) | **$500–$2k/mo**, plan-dependent |
| SOC 2 Type I/II audit (when pursued) | **$7.5k–$20k+** per cycle for SMB |
| Behavioral-health billing advisor (playbook QA) | Budget separately — see §14 |
| Cyber liability insurance | Recommended before first real PHI customer |

### 9.7 Incident response

- Pager (PagerDuty free tier) on Sentry/CloudWatch critical alerts.
- 60-day breach notification process documented.
- Quarterly tabletop exercise.

---

## 10. Deployment & DevOps

### Environments

| Env | Purpose | URL | Data |
|---|---|---|---|
| `local` | Dev | localhost | Faker-only |
| `staging` | Integration | staging.claimcompass.com | Synthetic PHI (mark-of-shame banner) |
| `prod` | Live | claimcompass.com | Real PHI; restricted access |

### CI/CD

GitHub Actions workflows:

- `pr.yml` — typecheck, lint, unit tests, eval harness on prompt changes, Drizzle migration dry-run, Terraform plan diff comment on PR.
- `deploy-staging.yml` — on merge to `main`: build Docker image → push to ECR → ECS service update with blue/green via CodeDeploy → run smoke tests.
- `deploy-prod.yml` — manual approval after staging green for 24h, same flow.
- `nightly.yml` — NPPES delta ingest, OIG/SAM sweep, credentialing health snapshots.

### Observability

- **Logs**: CloudWatch with structured JSON; correlation ID across web → API → worker.
- **Metrics**: CloudWatch + custom (denial intake latency, OCR pass rate, LLM cost per denial, bucket confidence distribution).
- **Traces**: AWS X-Ray.
- **Alerts**: CloudWatch alarms → SNS → PagerDuty. Page-worthy: API p95 > 2s for 5min, worker DLQ depth > 10, OCR failure rate > 5%, Bedrock 5xx surge.

### Backups & DR

- Aurora automated backups + 35-day PITR.
- S3 versioning + cross-region replication for `claimcompass-phi` (us-east-1 → us-west-2) with KMS replica keys.
- RTO 4h, RPO 15min.

---

## 11. Cost Model

We model three scenarios. The earlier blueprint understated Textract (Forms+Tables is **$0.065/page**, not $0.015), assumed an aggressive 90% cache hit on Sonnet from day 1, and undercounted Aurora, NAT, and Stripe. The numbers below replace those assumptions.

**Common assumptions:** ~3 pages per denial, ~12K tokens of payer context per Sonnet call. Stripe is **2.9% + $0.30** per domestic card transaction.

### Scenario A — Design-partner MVP (5–10 paying users, low volume)

No Stedi, no compliance platform yet. Minimal production footprint.

| Line | Monthly cost |
|---|---|
| Vercel Pro (2 seats) + HIPAA add-on | ~$390 |
| AWS baseline (Aurora Serverless v2 1–2 ACU, ECS API+worker, S3+KMS, SQS, Cognito, SES, CloudWatch, single NAT, ALB) | ~$250–$600 |
| Textract + LLMs at low volume | ~$25–$250 |
| Stripe | usage-based, ~$15–$40 |
| **Estimated total** | **~$700–$1,300/mo** |

Excludes labor, legal review, billing-advisor review, SOC 2/HIPAA tooling.

### Scenario B — Blueprint MVP scale (100 users, 5,000 denials/mo, 15,000 pages/mo)

Two OCR paths shown — the difference matters.

| Line | Lean OCR path (DetectDocumentText + Tables fallback) | Forms+Tables OCR path |
|---|---:|---:|
| Vercel Pro (2 seats) + HIPAA add-on | $390 | $390 |
| Aurora Postgres Serverless v2 (~2 ACU avg) | $175 | $175 |
| ECS Fargate API + Worker | $75 | $75 |
| ALB + NAT (1 gateway) + data transfer | $80 | $80 |
| S3 + KMS (50 GB stored, 30 GB egress) | $15 | $15 |
| Textract (15k pages) | ~$225 (Tables-heavy) or ~$22 (DetectOnly) | ~$975 |
| Bedrock Sonnet 4.6 (~30M input + 3M output, conservative 40–60% cache hit) | $150–$250 | $150–$250 |
| Bedrock Haiku 4.5 (classification + extraction) | $45 | $45 |
| OpenAI/Cohere embeddings (playbook chunks, non-PHI under appropriate BAA path) | <$5 | <$5 |
| SQS + CloudWatch + SES + Cognito + Secrets Mgr | $35 | $35 |
| Sentry Team (frontend only, scrubbed) | $30 | $30 |
| Domain + ACM (annualized) | $5 | $5 |
| Stripe processing (2.9% + $0.30 on $79 × 100) | $259 | $259 |
| **Subtotal** | **~$1,400–$2,000/mo** | **~$2,100–$2,800/mo** |

**Unit economics at $79 × 100 users = $7,900 MRR:**

- Lean OCR path: COGS ~$1,400–$2,000 → **~75–82% gross margin**.
- Forms+Tables path: COGS ~$2,100–$2,800 → **~65–73% gross margin**.

Conclusion: the **lean OCR tier is the MVP default**. Forms+Tables is opt-in for documents the cheaper modes can't parse.

### Scenario C — V1 with Stedi EDI (eligibility, status, 837, 835)

Same 100 users, 5,000 claim events/month, ~10% need 275 attachments.

| Line | Monthly cost |
|---|---:|
| Stedi Developer base | $500 |
| 270/271 eligibility (5,000 × $0.15) | $750 |
| 837P claim submission (5,000 × $0.20) | $1,000 |
| 835 ERA (5,000 × $0.15) | $750 |
| 276/277 status (5,000 × $0.15) | $750 |
| 275 attachments (500 × $0.75) | $375 |
| **Stedi subtotal** | **~$3,000–$4,100/mo** |

Combined with Scenario B (lean OCR), V1 total COGS at 100 customers lands at **~$4,500–$7,000/mo**. At $79/customer flat that destroys margin — Stedi must be a higher tier or a usage-priced add-on. See §11.x Pricing Strategy.

### Variable cost per denial (MVP, ~3 pages)

| Component | Per-denial cost |
|---|---:|
| Textract DetectDocumentText | ~$0.0045 |
| Textract Tables / Queries only | ~$0.045 |
| Textract Forms + Tables | ~$0.195 |
| LLMs (Sonnet + Haiku) | ~$0.02–$0.10 depending on output + cache |
| Stedi V1 full claim loop | ~$0.50–$0.80+ per claim event bundle, plus base fee |

### Scaling notes

- Textract, Bedrock, and Stedi scale linearly. Sonnet cache hit rate improves as users batch denials by payer.
- Aurora Serverless v2 scales sub-linearly until ~1k+ active users; expect to revisit reservation pricing then.
- NAT gateway cost grows with outbound LLM/Stedi traffic; consider VPC interface endpoints for Bedrock once volume warrants.

### 11.x Pricing Strategy

A flat $79/mo Solo plan only works with **usage caps** and clear add-ons:

| Plan | Monthly | What's included |
|---|---:|---|
| **Solo Decoder** | **$79** | 25–50 denials/mo, 1 provider, denial decoder + triage + drafts + Credentialing Risk Monitor; lean OCR only |
| **Practice Copilot** | **$149–$249** | 200+ denials/mo, multiple providers, team seats, billing rules library, audit log export |
| **V1 EDI Add-on** | usage-priced | Eligibility, claim status, 837P, 835 ingest — **never bundled** unlimited |
| **Overage** | per-denial / per-page | Caps usage spikes; surfaces real cost when an EOB triggers Forms+Tables fallback |

Display the **denials remaining** counter prominently; pre-purchase packs ($X per 50 denials) for customers near the cap.

---

## 12. 8-Week MVP Plan

> **Honest range: 8–12 weeks.** 8 is achievable for a focused 2-engineer team if HIPAA paperwork starts week 0 and payer playbook authoring is the founder's parallel workstream. **10–12 weeks** is more realistic once you account for BAA negotiation, audit-log polish, eval coverage, and the inevitable OCR edge cases on real payer PDFs. We plan to 8 and budget to 12.

### Explicitly out of MVP scope (do not let these creep in)

- Stedi 270/271/276/277/837/835
- Eligibility checks, claim submission, ERA ingest
- CAQH automation, payer-roster verification
- EHR integration (SimplePractice etc.) — including email-forward
- Auto-filing of appeals or auto-submission of corrected claims
- "You are credentialed with X" claims of any kind
- Predictive denial scoring on pre-submission claims

### Week-by-week

| Week | Deliverable |
|---|---|
| **0** | AWS account, Vercel project, BAAs signed (AWS, Vercel, Stripe), Terraform skeleton, Cognito user pool, base RDS, S3 buckets, KMS keys, CI/CD pipeline. PHI-lint CI rule. Marketing site live (already done). |
| **1** | Auth + multi-tenant Practice/User/RLS. Onboarding wizard. Drizzle schema for `app.*` and `ref.*`. NPPES bulk ingest + nightly delta cron. NUCC import. |
| **2** | Upload flow: presigned S3 + Textract worker (lean-first OCR router) + OCR JSON parsing. Manual paste fallback. Denial create + list views. Cost-per-denial telemetry wired in. |
| **3** | LLM pipeline v0: Haiku extraction → Sonnet decoder with hardcoded payer context for top 3 payers (BCBS-TX, Aetna, UHC). Bucket classification. Eval harness with 50 seed denials. Cache-hit telemetry. |
| **4** | Payer playbook chunks for top 10 BH payers (curated by founders + Sonnet drafts reviewed by a biller advisor). pgvector retrieval. Prompt caching live with measured hit rate. |
| **5** | Draft generators (appeal letter, call script, corrected-claim guidance, client-bill note) — all clearly labeled as **drafts for review**. PDF export. Save-as-rule. |
| **6** | **Credentialing Risk Monitor** v1: NPPES diff, OIG LEIE + SAM + Medicare Opt-Out sweeps, license expiration tracking (manual entry), payer FHIR directory listing check for top 10 payers — all surfaced as risk signals, never as enrollment proof. |
| **7** | Stripe billing (Solo $79 with 25–50 denial cap, Practice $149–$249). Usage counter UI. Onboarding polish. Audit log UI. Email magic-links. Production deploy. First 5 design-partner therapists in. |
| **8** | Hardening: eval pass rate ≥ 90% on 200-denial golden set, p95 latency under target, SOC 2 / HIPAA evidence collection started, first paid customer. |
| **9–12 (buffer)** | Edge-case OCR, payer playbook depth on the next 10 payers, real-customer support load, billing-advisor QA loop, breach-response tabletop, SOC 2 readiness platform onboarding. |

---

## 13. MVP → V1 Roadmap

After MVP launches, V1 is the next ~6 months. Sequencing prioritizes features that compound the moat (payer playbooks, repeat-denial rules) before features that broaden surface area.

| Quarter | Theme | Key features |
|---|---|---|
| **Q+1** | Trust + speed | EHR email-forward ingestion (Postmark-style inbound), bulk EOB upload, multi-user roles, audit log export, SOC 2 Type I |
| **Q+2** | Loop closure | Stedi integration: eligibility (270/271), claim status (276/277), ERA auto-ingest (835), corrected-claim submission (837P) |
| **Q+3** | Prevention | Pre-submission claim linting against billing rules, predictive denial scoring on common shapes, aging AR dashboard, write-off tax export |
| **Q+4** | Scale | ProviderTrust/EverCheck license monitoring, payer FHIR Provider Access endpoints, supervisor rollups, API for white-label partners (boutique billers) |

---

## 14. Risks & Open Questions

| Risk | Likelihood | Mitigation |
|---|---|---|
| Payer playbook quality is the **real moat** — building it is slow and expensive, and trust in the output is what therapists buy | **Highest** | Hire one part-time behavioral-health biller advisor day 1; founder-led playbook curation, Sonnet drafts + advisor review; ship narrow (top 10 payers × top 8 BH CPTs) before broadening; eval harness must gate prompt changes |
| OCR fails on payer-portal screenshots or unusual EOB layouts | Medium | Tiered Textract (Detect → Tables → Forms+Tables fallback) with confidence gates; manual paste fallback always available; route low-confidence to "needs review" instead of bad triage |
| **Textract Forms+Tables cost runs over budget** (Forms+Tables is ~$0.065/page, not $0.015) | Medium | Default to DetectDocumentText; only escalate to Forms+Tables on confidence failure; per-denial cost telemetry; per-page overage pricing on user plans |
| **Sonnet prompt cache hit rate lower than hoped** at low concurrency | Medium | Treat cache as upside; conservative cost model in §11; batch denials per (payer, CPT), warm-up calls at session start; switch to Haiku for steps that don't need Sonnet |
| Therapists won't upload PHI to a new SaaS without trust signals | High | Day-1 BAA, plain-language privacy page, SOC 2 readiness by Q+1, "decode without signup" demo with synthetic data, Vercel-PHI boundary visibly enforced (architecture page) |
| **"Credentialed with payer X" overclaim risk** in marketing or UI | High | Strict "risk signals" language; legal review of marketing copy; UI shows last-checked timestamps and data-source attribution; never assert payer enrollment from public datasets |
| LLM cost explodes with usage | Medium | Aggressive Haiku-first routing, prompt caching, cache-hit telemetry, batch mode for non-realtime jobs, per-denial cost dashboard |
| Bedrock outage takes us down | Low | Anthropic direct API failover (separate BAA), circuit breaker, queued retry |
| Competition adds triage layer | Medium | Speed of payer-playbook accumulation is the moat; talk to 100 therapists in first 90 days for proprietary data |
| Stedi/clearinghouse integration is harder + more expensive than expected for V1 | **High for cost** | Defer to V1; price Stedi as a usage-based add-on or higher tier, never bundle unlimited into Solo; payer enrollment is an operational burden in addition to dollars |
| **8-week MVP timeline slips** to 10–12 weeks | High | Plan to 8, budget to 12; explicit out-of-scope list in §12; HIPAA paperwork started week 0; payer-playbook authoring runs parallel to engineering |
| **SOC 2 / compliance cost surprises** | Medium | Budget $2k–$15k one-time policies/SRA, $500–$2k/mo readiness platform, $7.5k–$20k audit cycle (when pursued); start with template kit, defer audit until customer demand |

### Open questions for week 1 review

1. **Bedrock vs Anthropic direct** — which is the primary path? Bedrock simpler under one BAA; Anthropic API has marginally better prompt-cache ergonomics and earlier model access. Default: Bedrock primary, Anthropic failover.
2. **Cognito vs NextAuth** — Cognito wins on BAA + free, NextAuth wins on DX. Default: Cognito with custom Hosted UI styling; revisit if DX becomes a blocker.
3. **Aurora vs Neon** — Aurora keeps everything under one AWS BAA; Neon's branching is genuinely better for migrations. Default: Aurora for MVP; reconsider Neon if migration pain compounds.
4. **Email-forward inbound — MVP or V1?** Big UX win, requires SES inbound + DNS work. Default: V1.
5. **Should we expose a public "decode this denial" landing-page tool?** Synthetic-only, no PHI accepted. Marketing leverage vs eng cost. Lean: yes, week 8.

---

## 15. Appendix: Reference Data Sources

| Source | URL | Use |
|---|---|---|
| NPPES NPI Registry API | https://npiregistry.cms.hhs.gov/api-page | NPI validation, taxonomy, address |
| NPPES Bulk Files | https://download.cms.gov/nppes/NPI_Files.html | Monthly snapshot for fast local lookup |
| NUCC Provider Taxonomy CSV | https://www.nucc.org/index.php/code-sets-mainmenu-41/provider-taxonomy-mainmenu-40/csv-mainmenu-57 | Taxonomy reference table |
| CARC (Claim Adjustment Reason Codes) | https://x12.org/codes/claim-adjustment-reason-codes | Denial-code dictionary |
| RARC (Remittance Advice Remark Codes) | https://x12.org/codes/remittance-advice-remark-codes | Remark-code dictionary |
| OIG LEIE | https://oig.hhs.gov/exclusions/exclusions_list.asp | Federal exclusions sweep |
| SAM.gov Exclusions API | https://api.sam.gov/entity-information/v3/exclusions | Federal debarment sweep |
| Medicare Opt-Out list | https://data.cms.gov/provider-characteristics/medicare-provider-supplier-enrollment/opt-out-affidavits | Medicare opt-out flag |
| Stedi Healthcare APIs | https://www.stedi.com/docs/healthcare/api-reference | V1 EDI integration |
| Stedi Pricing | https://www.stedi.com/pricing | Cost planning |
| CMS Interoperability Patient Access | https://www.cms.gov/priorities/key-initiatives/burden-reduction/interoperability/policies-and-regulations/patient-access-api | FHIR directory base URLs |
| CMS DaVinci Prior Auth Rule (CMS-0057-F) | https://www.cms.gov/priorities/electronic-prior-authorization/overview | Track payer FHIR rollout |
| AWS HIPAA Eligible Services | https://aws.amazon.com/compliance/hipaa-eligible-services-reference/ | Stay in BAA scope |
| Vercel HIPAA add-on | https://vercel.com/changelog/hipaa-baas-are-now-available-to-pro-teams | Hosting BAA |
| Anthropic BAA | https://privacy.claude.com/en/articles/8114513-business-associate-agreements-baa-for-commercial-customers | LLM BAA (if direct API) |
| AWS Bedrock Pricing | https://aws.amazon.com/bedrock/pricing/ | LLM cost modeling |
| HealthIT SRA Tool | https://www.healthit.gov/topic/privacy-security-and-hipaa/security-risk-assessment-tool | Annual HIPAA risk assessment |

---

**End of blueprint v0.2.** Revised after external feasibility review (cost realism, OCR tiering, Vercel/PHI strictness, credentialing positioning, Stedi economics). Next iteration after week-1 review and design-partner conversations.
