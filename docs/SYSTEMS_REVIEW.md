# ClaimCompass Systems Review

Last reviewed: 2026-06-03

This review summarizes the systems completed against
`docs/HACKATHON_BP_IMPLEMENTATION.md`. It is intentionally operational: each
line answers whether the system is built, how it was checked, and what risk
remains.

## Systems 0-14

| System | Status | Evidence | Remaining risk |
|---:|---|---|---|
| 0 | DONE | Guardrails live in `AGENTS.md`, `.agents-cli-spec.md`, and implementation docs. | Keep future scope changes out of the golden-path demo. |
| 1 | DONE | Google Cloud project, budgets, secrets policy, and cost notes documented. | Budgets do not cover Atlas spend; keep Atlas on M0. |
| 2 | DONE | `.agents-cli-spec.md` defines the agent contract, MongoDB MCP tools, and demo data shape. | Update it if MCP tool names change. |
| 3 | DONE | ADK scaffold exists; hello Agent Runtime deploy was proven and deleted to avoid idle cost. | Production deploy is still System 17. |
| 4 | DONE | Atlas project, M0 cluster, DB, collections, service user, and access list are configured. | Local IP changes require new Atlas `/32` entries. |
| 5 | DONE | `npm run mongodb:mcp-smoke` verifies MCP `find`, `aggregate`, `insert-many`, `update-many`, and `count`. | MCP requires a valid local Atlas URI and current IP allowlist. |
| 6 | DONE | Synthetic EOB fixture and paste-text fallback exist under `docs/test-documents`. | Keep all future documents synthetic and clearly marked demo data. |
| 7 | DONE | `npm run docai:golden-smoke` uploads synthetic PDF, processes Document AI, and writes extraction through MCP. | Document AI calls can create small variable cost. |
| 8 | DONE | `npm run playbooks:seed` seeded 30 Gemini-embedded synthetic playbook chunks. | Re-seeding should stay synthetic and avoid payer-copied text. |
| 9 | DONE | `npm run playbooks:create-vector-index` and `npm run playbooks:vector-smoke` verified `playbook_vec`. | Atlas Search stays free only while the cluster remains M0/no dedicated Search Nodes. |
| 10 | DONE | `npm run policy:smoke` retrieves playbook chunks and CARC/RARC through MCP. | Retrieval quality depends on keeping chunk metadata consistent. |
| 11 | DONE | `npm run root:smoke` classifies golden denial as `corrected_claim` and writes trace events. | Classification is intentionally narrow and deterministic for v1. |
| 12 | DONE | `npm run eval:agents-cli` and `npm run eval:minimal` passed. | The ADK CLI eval is still a scaffold smoke; ClaimCompass-specific gating lives in Node eval scripts. |
| 13 | DONE | `npm run draft:smoke` generated and stored a validated `corrected_claim_guidance` artifact. | Gemini may omit required citations; the validator repairs or rejects before storage. |
| 14 | DONE | `npm run eval:expanded` passed RootAgent, DrafterAgent, citation, and fallback cases. | Edge cases are fixtures, not broad payer/claim support. |

## Latest Verification Commands

```bash
npm run eval:agents-cli
npm run eval:minimal
npm run draft:smoke
npm run eval:expanded
```

## Current Next Build

System 15 should connect the current landing page to a narrow demo route. The
frontend should not become a broad production app yet; it only needs to prove
the signed-in/demo handoff into the ClaimCompass golden path before System 16
builds the trace/result UI.
