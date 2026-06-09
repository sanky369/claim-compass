# ClaimCompass Systems Review

Last reviewed: 2026-06-09

This review summarizes the systems completed against
`docs/HACKATHON_BP_IMPLEMENTATION.md`. It is intentionally operational: each
line answers whether the system is built, how it was checked, and what risk
remains.

## Systems 0-18

| System | Status | Evidence | Remaining risk |
|---:|---|---|---|
| 0 | DONE | Guardrails live in `AGENTS.md`, `.agents-cli-spec.md`, and implementation docs. | Keep future scope changes out of the golden-path demo. |
| 1 | DONE | Google Cloud project, budgets, secrets policy, and cost notes documented. | Budgets do not cover Atlas spend; keep Atlas on M0. |
| 2 | DONE | `.agents-cli-spec.md` defines the agent contract, MongoDB MCP tools, and demo data shape. | Update it if MCP tool names change. |
| 3 | DONE | ClaimCompass-specific ADK app exists; hello Agent Runtime deploy was proven earlier and deleted to avoid idle cost. | Final Agent Runtime deploy remains cost-gated. |
| 4 | DONE | Atlas project, M0 cluster, DB, collections, service user, and access list are configured. | Local IP changes require new Atlas `/32` entries. |
| 5 | DONE | `npm run mongodb:mcp-smoke` verifies MCP `find`, `aggregate`, `insert-many`, `update-many`, and `count`. | MCP requires a valid local Atlas URI and current IP allowlist. |
| 6 | DONE | Synthetic EOB fixture and paste-text fallback exist under `docs/test-documents`. | Keep all future documents synthetic and clearly marked demo data. |
| 7 | DONE | `npm run docai:golden-smoke` uploads synthetic PDF, processes Document AI, and writes extraction through MCP. | Document AI calls can create small variable cost. |
| 8 | DONE | `npm run playbooks:seed` seeded 30 Gemini-embedded synthetic playbook chunks. | Re-seeding should stay synthetic and avoid payer-copied text. |
| 9 | DONE | `npm run playbooks:create-vector-index` and `npm run playbooks:vector-smoke` verified `playbook_vec`. | Atlas Search stays free only while the cluster remains M0/no dedicated Search Nodes. |
| 10 | DONE | `npm run policy:smoke` retrieves playbook chunks and CARC/RARC through MCP. | Retrieval quality depends on keeping chunk metadata consistent. |
| 11 | DONE | `npm run root:smoke` classifies golden denial as `corrected_claim` and writes trace events. | Classification is intentionally narrow and deterministic for v1. |
| 12 | DONE | `npm run eval:agents-cli` previously passed; ADK eval fixtures now target ClaimCompass golden-denial prompts, and `npm run eval:minimal` passed. | Re-run `npm run eval:agents-cli` before final submission if Gemini eval cost is acceptable. |
| 13 | DONE | `npm run draft:smoke` generated and stored a validated `corrected_claim_guidance` artifact. | Gemini may omit required citations; the validator repairs or rejects before storage. |
| 14 | DONE | `npm run eval:expanded` passed RootAgent, DrafterAgent, citation, and fallback cases. | Edge cases are fixtures, not broad payer/claim support. |
| 15 | DONE | `npm run lint` clean; `npm run dev` served `/`, `/signin`, and `/demo/denials/new` at `200`. Landing CTAs route into a one-button demo gate, then the placeholder upload/paste page. | Gate is a demo marker cookie, not real auth; the upload/paste page is a System 16 placeholder. |
| 16 | DONE | `GET /api/demo/sample-pdf` serves the exact PDF; `POST /api/demo/run` with `mode: "sample_pdf"` returned `200`; result page shows source PDF, GCS URI, trace, citations, diff, save-as-rule; `POST /api/demo/rules` returned `200`. The confusing paste fallback marker was removed. `npm run lint` and `npm run build` pass. | Sample-PDF mode uses the synthetic golden PDF only; arbitrary user PDF upload remains out of scope for PHI safety. |
| 17 | DONE | Cloud Run service `claimcompass-demo` is deployed at `https://claimcompass-demo-ss3fmrraoa-uc.a.run.app`, revision `claimcompass-demo-00006-n7p`, with 100% traffic, `min-instances=0`, max scale `2`, Secret Manager access, and hosted health/sample-PDF run verified. The hosted branch returns `live_mcp: true` with live Gemini embedding plus MongoDB MCP `$vectorSearch`, `find`, `update-many`, and `insert-many`. | Temporary Atlas `0.0.0.0/0` allowlist is open and expires on 2026-06-12. |
| 18 | READY | Hosted sample-PDF API run `run_1781036034323_405e5753` completed in 14747ms with live MCP proof, result page shows only fresh run-scoped trace rows, and save-as-rule `rule_1781036075633_fe26ed26` wrote through MCP `insert-many`. | Manual hosted browser dress rehearsal and backup recording remain before final Devpost recording. |

## Latest Verification Commands

```bash
npm run eval:agents-cli
npm run eval:minimal
npm run draft:smoke
npm run eval:expanded
npm run lint
npm run build
curl https://claimcompass-demo-ss3fmrraoa-uc.a.run.app/api/health
```

## Current Next Build

System 18 is the next gate: run a manual hosted browser dress rehearsal, record
a backup take, then finish System 19/20 submission assets. Keep
`min-instances=0` unless cold start is unacceptable during recording.
