# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""ClaimCompass ADK entrypoint for the hackathon demo.

The production demo is intentionally narrow: one synthetic golden-path denial
for BCBS-TX, CPT 90837, missing telehealth modifier 95, CARC CO-45 and RARC
N179. The Next.js demo API still runs the full Document AI -> MongoDB MCP ->
Gemini -> write-back flow for the live UI. This ADK app gives Agent Runtime a
ClaimCompass-specific agent, not the default weather/time scaffold.
"""

from __future__ import annotations

import os
from typing import Any

from google.adk.agents import Agent
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai import types

GOLDEN_DENIAL_ID = "demo_denial_001"

os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "claimcompass-497412")
os.environ.setdefault("GOOGLE_CLOUD_LOCATION", "global")
os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "True")


def decode_claimcompass_golden_denial(denial_id: str = GOLDEN_DENIAL_ID) -> dict[str, Any]:
    """Return the deterministic ClaimCompass plan for the synthetic demo denial.

    Args:
        denial_id: Synthetic demo denial id. Only ``demo_denial_001`` is
            supported for the hackathon safety boundary.

    Returns:
        A structured decision-support summary for the golden denial.
    """
    if denial_id != GOLDEN_DENIAL_ID:
        return {
            "ok": False,
            "demo_data_notice": "DEMO DATA - NOT REAL PHI",
            "error": (
                "ClaimCompass hackathon ADK demo only supports the synthetic "
                "golden denial demo_denial_001. Do not provide real PHI."
            ),
        }

    return {
        "ok": True,
        "demo_data_notice": "DEMO DATA - NOT REAL PHI",
        "denial_id": GOLDEN_DENIAL_ID,
        "payer": "BCBS Texas Demo",
        "claim": {
            "cpt": "90837",
            "issue": "Missing telehealth modifier 95",
            "codes": ["CO-45", "N179"],
        },
        "decision": {
            "bucket": "corrected_claim",
            "next_best_action": (
                "Submit a corrected claim with modifier 95 on CPT 90837 after "
                "human billing review confirms the original place of service "
                "and telehealth documentation."
            ),
            "why": (
                "The retrieved synthetic BCBS-TX playbook says this denial "
                "pattern is usually a claim-correction workflow, not a formal "
                "appeal, when the telehealth modifier is missing."
            ),
        },
        "google_cloud_runtime": [
            "Google Document AI extracts the synthetic EOB in the hosted UI flow.",
            "Gemini embedding-001 creates 1536-dimensional playbook vectors.",
            "Gemini generation drafts human-review billing guidance.",
            "ADK/Agent Runtime hosts this ClaimCompass-specific agent surface.",
        ],
        "mongodb_proof": [
            "MongoDB MCP aggregate uses $vectorSearch on payer_playbooks.",
            "MongoDB MCP inserts trace events and generated artifacts.",
            "MongoDB MCP write-back records the save-as-rule demo action.",
        ],
        "citation_id": "pb_bcbs_tx_demo_psychotherapy_90_codes_modifier_missing_01",
        "human_review_notice": (
            "Decision support only. A human biller must verify payer policy, "
            "documentation, and claim facts before submission."
        ),
    }


root_agent = Agent(
    name="claimcompass_agent",
    model=Gemini(
        model="gemini-flash-latest",
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    instruction=(
        "You are ClaimCompass, a synthetic-demo denial resolution copilot for "
        "independent healthcare providers. Stay inside the hackathon golden "
        "path: BCBS-TX Demo, CPT 90837, missing telehealth modifier 95, CO-45 "
        "and N179. Always mention that the data is synthetic demo data and not "
        "real PHI. Use the decode_claimcompass_golden_denial tool when asked "
        "what ClaimCompass does, why the denial happened, what action to take, "
        "or how the Google Cloud and MongoDB stack is proven. Do not provide "
        "legal, clinical, billing, or payer-policy advice beyond decision "
        "support for human review."
    ),
    tools=[decode_claimcompass_golden_denial],
)

app = App(
    root_agent=root_agent,
    name="app",
)
