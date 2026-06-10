# ClaimCompass Submission Assets

Last updated: 2026-06-09

## Short Pitch

ClaimCompass is a Gemini-powered denial-resolution agent for independent
healthcare providers. In the hackathon demo, it reads one synthetic denied
therapy claim, extracts fields with Google Document AI, retrieves payer-specific
rules from MongoDB Atlas Vector Search through the official MongoDB MCP Server,
classifies the next-best action, drafts corrected-claim guidance with citations,
and writes the result back to MongoDB.

The product surface was designed with MagicPath-assisted website exploration and
then built through an iterative Codex development workflow with a human in the
loop: architecture decisions, cost/security guardrails, repo changes, evals,
Cloud Run deployment, and final demo checks were reviewed and steered by the
builder throughout the hackathon.

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

## Design and Build Process

- Website/design direction: MagicPath was used to accelerate exploration of the
  landing page and demo presentation, keeping the product focused on a clear
  denial-to-action story for therapists.
- Development partner: Codex was used as the coding agent across the repo to
  implement the Next.js UI, ADK scaffold, MongoDB MCP integration, Gemini
  embedding/generation paths, evals, docs, and Cloud Run deployment workflow.
- Human in the loop: the builder reviewed architecture choices, approved
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
