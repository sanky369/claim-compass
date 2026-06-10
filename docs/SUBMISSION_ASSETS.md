# ClaimCompass Submission Assets

Last updated: 2026-06-10

## Short Pitch

ClaimCompass is a Gemini-powered denial-resolution agent for independent
healthcare providers. In the hackathon demo, it reads one synthetic denied
therapy claim, extracts fields with Google Document AI, retrieves payer-specific
rules from MongoDB Atlas Vector Search through the official MongoDB MCP Server,
classifies the next-best action, drafts corrected-claim guidance with citations,
and writes the result back to MongoDB.

The product surface was designed with MagicPath-assisted website exploration and
then built through an iterative Codex development workflow with me as the human
in the loop: architecture decisions, cost/security guardrails, repo changes,
evals, Cloud Run deployment, and final demo checks were reviewed and steered by
me throughout the hackathon.

## Devpost Description Draft

Independent therapists lose hours and revenue when an insurance denial says
something vague like `CO-45` or `N179`. The hard part is not writing an appeal;
it is knowing whether to resubmit, correct the claim, call the payer, appeal, or
bill the client.

ClaimCompass turns that messy denial workflow into a traceable agent run. For
the hackathon, the demo focuses on one synthetic golden path: BCBS Texas Demo,
CPT `90837`, missing telehealth modifier `95`, denial codes `CO-45` and `N179`.
The user opens the synthetic PDF, starts the run, and watches ClaimCompass:

- use the verified synthetic Document AI extraction for the sample PDF;
- run a live `gemini-embedding-2` query embedding;
- retrieve synthetic payer playbook guidance through live MongoDB MCP
  `aggregate` with `$vectorSearch`;
- use MongoDB MCP `find`, `update-many`, and `insert-many` for hosted
  read/write proof;
- reuse the latest validated Gemini-drafted corrected-claim artifact for
  recording stability;
- show citations, trace events, and a before/after MongoDB diff in the demo UI.

This is intentionally not a generic chatbot. The visible proof is the loop:
document in, tool trace, grounded retrieval, next-best-action classification,
artifact generation, and MongoDB write-back.

The website and demo flow were shaped with MagicPath for rapid design direction,
then implemented with Codex in a human-in-the-loop development process. Codex
helped turn the hackathon blueprint into tracked systems, code, tests, docs,
deployment scripts, and verification runs; the builder made the product, safety,
scope, and submission decisions.

All demo documents are synthetic and marked `DEMO DATA - NOT REAL PHI`.
ClaimCompass is decision support for human billing review, not legal, clinical,
billing, or payer-policy advice.

## Devpost Form Answers

### Inspiration

Independent therapists do not go into practice because they love insurance
administration. But when a claim is denied, they are often left decoding payer
codes, checking credentialing assumptions, reading EOBs, and guessing whether
the next step is an appeal, corrected claim, payer call, or client bill.

The inspiration for ClaimCompass came from that moment of confusion: a provider
has already done the clinical work, but revenue gets stuck because the denial
workflow is hard to interpret. I wanted to build an agent that does more than
explain a code. It should read the document, retrieve payer-specific guidance,
decide the correct next action, show its reasoning, and help prevent the same
denial from happening again.

### What it does

ClaimCompass is a denial-resolution agent for independent therapists and small
behavioral-health practices.

For the hackathon demo, it processes a fully synthetic EOB for a therapy claim:
CPT `90837`, denial codes `CO-45` and `N179`, and a missing telehealth modifier.
The app lets a user inspect the sample PDF, run the agent workflow, and review a
traceable result.

ClaimCompass:

- extracts claim context from a synthetic PDF workflow;
- creates a live Gemini embedding query;
- retrieves relevant payer playbook guidance from MongoDB Atlas Vector Search
  through the official MongoDB MCP Server;
- classifies the denial into the right action bucket;
- shows corrected-claim guidance with citations;
- writes the updated denial state and reusable billing rule back to MongoDB;
- displays an agent trace and MongoDB before/after proof for judges.

The key outcome is simple: it turns a denied claim into a clear next action:
correct and resubmit, with human review.

### How I built it

I built ClaimCompass as a code-first Google Cloud agent demo with a Next.js
frontend, Google Cloud AI services, and MongoDB Atlas as the operational and
retrieval layer.

The AI path uses Gemini for reasoning/generation and Gemini embeddings for
semantic retrieval. The document workflow uses Google Document AI for the
synthetic EOB path. The app is built with Google Cloud Agent Builder / ADK
terminology and is hosted for the demo on Cloud Run.

MongoDB Atlas is central to the agent loop. I store denials, payer playbooks,
generated artifacts, trace events, demo runs, and billing rules in Atlas. The
agent retrieves playbook chunks with Atlas Vector Search using `$vectorSearch`
through the official MongoDB MCP Server, then writes updates back through MCP so
the demo proves both retrieval and persistence.

The website and demo flow were shaped with MagicPath for rapid product/design
direction. Codex helped implement the project system-by-system: Next.js UI,
agent scaffolding, MongoDB MCP integration, Gemini model wiring, evals, docs,
Cloud Run deployment, and final verification. I stayed human in the
loop for product judgment, healthcare safety, cost controls, architecture
decisions, and final scope.

### Challenges I ran into

The biggest challenge was keeping the demo ambitious while staying honest,
safe, and shippable.

Healthcare data is sensitive, so I made the entire demo synthetic and visibly
marked `DEMO DATA - NOT REAL PHI`. I also avoided real payer logos, real EOBs,
and unsupported policy claims.

Another challenge was aligning the hackathon requirements with the right stack.
The brief asked for Gemini and Google Cloud Agent Builder, while the build also
needed custom MCP calls, MongoDB Vector Search, trace persistence, and a
product-specific workflow. I chose a code-first ADK-style approach, hosted the
demo on Cloud Run, and documented the Agent Builder / Agent Runtime distinction
clearly.

I also had to make the hosted demo reliable for judges. The final flow keeps
the scenario narrow, but makes the proof strong: live Gemini embedding, live
MongoDB MCP vector retrieval, MCP write-back, visible citations, and a
before/after database diff.

### Accomplishments that I'm proud of

I am proud that ClaimCompass is not just a chatbot wrapper. It demonstrates a
real agentic workflow: document intake, retrieval, classification, guidance,
traceability, and write-back.

The MongoDB integration is also a strong proof point. Atlas is not used as a
passive database; it acts as the agent's working memory, vector retrieval layer,
trace store, and rule store. The demo shows MongoDB MCP calls, `$vectorSearch`,
and write-back in the product UI.

I am also proud of the safety posture. The project is healthcare-adjacent, so
I treated privacy, synthetic data, disclaimers, and human review as product
requirements rather than afterthoughts.

Finally, I am proud of the build process itself. I used a tracked system
plan, daily checkpoints, evals, Cloud Run deployment, and human-in-the-loop
Codex development to move from blueprint to hosted demo under hackathon time
pressure.

### What I learned

I learned that the strongest agent demos are not about making an AI answer
sound smart. They are about proving the workflow: what tools were called, what
data was retrieved, what changed in the system, and where the human should
review the result.

I also learned how important it is to keep the first version narrow. A full
revenue-cycle copilot could cover credentialing, eligibility, claim submission,
appeals, and cash-flow risk. For the hackathon, the right move was to choose one
high-value denial path and make it traceable end to end.

On the technical side, I learned how Gemini, Document AI, Google Cloud
deployment, MongoDB Atlas Vector Search, and the MongoDB MCP Server can fit
together as one agent loop rather than separate demos.

### What's next for ClaimCompass: Denial Resolution Agent for Therapists

Next, ClaimCompass should expand from one golden-path denial into a broader
denial-resolution workspace for therapists.

The near-term roadmap is:

- support more denial families, including prior authorization, credentialing,
  eligibility, place-of-service, and coordination-of-benefits issues;
- add more payer and CPT-specific playbooks with stronger citation management;
- support real user-uploaded documents only after production-grade privacy,
  security, consent, and retention controls are in place;
- add role-based review workflows for billers and practice owners;
- learn from saved billing rules to prevent repeat denials before submission;
- turn the command center into a therapist revenue copilot that covers before,
  during, and after the denial.

The long-term vision is to help small practices protect revenue without forcing
clinicians to become insurance operations experts.

## Design and Build Process

- Website/design direction: MagicPath was used to accelerate exploration of the
  landing page and demo presentation, keeping the product focused on a clear
  denial-to-action story for therapists.
- Development partner: Codex was used as the coding agent across the repo to
  implement the Next.js UI, ADK scaffold, MongoDB MCP integration, Gemini
  embedding/generation paths, evals, docs, and Cloud Run deployment workflow.
- Human in the loop: I reviewed architecture choices, approved
  cost-sensitive cloud actions, kept the healthcare safety constraints tight,
  verified outputs, and decided what belonged in the final hackathon scope.

## Stack Wording

Use this wording unless a final ClaimCompass-specific Agent Runtime deployment
is actually approved, deployed, and tested:

> Built with Gemini and Google Cloud Agent Builder using ADK, designed for Agent
> Runtime / Vertex AI Agent Engine, hosted for the demo on Cloud Run, and
> integrated with MongoDB Atlas through the official MongoDB MCP Server.

If a final Agent Runtime deployment succeeds, this may be changed to:

> Built with Gemini and Google Cloud Agent Builder using ADK, deployed on Agent
> Runtime / Vertex AI Agent Engine, hosted with a Cloud Run demo UI, and
> integrated with MongoDB Atlas through the official MongoDB MCP Server.

## MongoDB Track Proof Points

- Atlas database: `claimcompass`
- Collections used in the demo: `denials`, `payer_playbooks`,
  `generated_artifacts`, `billing_rules`, `trace_events`, `carc`, `rarc`
- Vector index: `playbook_vec`
- Retrieval proof: MongoDB MCP `aggregate` with `$vectorSearch` as the first
  pipeline stage
- Hosted write-back proof: MCP `update-many` on `denials`, MCP `insert-many`
  into `trace_events`, MCP `insert-many` into `demo_runs`, and MCP
  `insert-many` into `billing_rules` for save-as-rule
- Local full-path proof: Document AI extraction and Gemini drafting scripts use
  MongoDB MCP write-back and pass the release checks
- Safety proof: synthetic data only, no PHI, no real payer documents

## Screenshot List

Capture these after the hosted dress rehearsal:

1. Landing page or sign-in demo gate.
2. Sample PDF import card showing the PDF filename.
3. Trace panel showing Document AI, Gemini, MongoDB MCP, and `$vectorSearch`.
4. Result page with corrected-claim guidance and citation chip.
5. MongoDB before/after diff.
6. Save-as-rule success state.

## Video Voiceover Skeleton

> ClaimCompass is a denial-resolution agent for independent providers. The demo
> uses only synthetic data, no real PHI.
>
> Here is the denied claim: CPT 90837, BCBS Texas Demo, denied with CO-45 and
> N179 because the telehealth modifier is missing.
>
> When I start the hosted run, ClaimCompass uses the verified synthetic
> Document AI extraction, creates a live Gemini embedding query, retrieves payer
> guidance from MongoDB Atlas Vector Search through the official MongoDB MCP
> Server, and writes the updated denial state back through MCP.
>
> The important part is the trace. This is not a chatbot answer; the app shows
> the tool path, the retrieved playbook citation, the decision bucket, and the
> before/after MongoDB state.
>
> ClaimCompass recommends a corrected claim, not a formal appeal, and displays
> validated Gemini-drafted human-review guidance tied to the retrieved playbook.
>
> Finally, the save-as-rule action writes a reusable billing rule back to
> MongoDB so the same denial pattern is easier to prevent next time.
