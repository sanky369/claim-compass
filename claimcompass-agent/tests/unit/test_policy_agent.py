import pytest

from app.policy_agent import (
    DenialCodeDescription,
    PolicyAgentRetriever,
    PolicyQuery,
    infer_cpt_family,
)


class FakeEmbedder:
    async def embed_query(self, text: str) -> list[float]:
        self.last_text = text
        return [0.01] * 1536


class FakeMongodb:
    def __init__(self, chunks=None):
        self.chunks = chunks if chunks is not None else []
        self.aggregate_calls = []
        self.find_calls = []

    async def aggregate(self, database, collection, pipeline):
        self.aggregate_calls.append((database, collection, pipeline))
        return self.chunks

    async def find(self, database, collection, filter, limit):
        self.find_calls.append((database, collection, filter, limit))
        if collection == "carc":
            return [
                {
                    "code": "CO-45",
                    "label": "Charge exceeds fee schedule/maximum allowable",
                    "demo_summary": "Contractual adjustment or pricing issue.",
                }
            ]
        if collection == "rarc":
            return [
                {
                    "code": "N179",
                    "label": "Additional information requested",
                    "demo_summary": "Inspect documentation and payer requirements.",
                }
            ]
        return []


@pytest.mark.asyncio
async def test_policy_retriever_returns_chunks_and_code_descriptions():
    mongodb = FakeMongodb(
        chunks=[
            {
                "_id": "pb_bcbs_tx_demo_psychotherapy_90_codes_modifier_missing_01",
                "title": "BCBS-TX: Modifier Missing for psychotherapy 90-series claims",
                "body": "Telehealth modifier missing; use corrected_claim.",
                "source_url": "synthetic://source",
                "score": 0.91,
                "scope": {"action_bucket": "corrected_claim"},
            }
        ]
    )
    retriever = PolicyAgentRetriever(FakeEmbedder(), mongodb)

    result = await retriever.retrieve(
        PolicyQuery(
            payer_id="bcbs_tx_demo",
            cpt="90837",
            raw_text="CPT 90837 denied for missing telehealth modifier.",
            carc=("CO-45",),
            rarc=("N179",),
        )
    )

    assert result.fallback_reason is None
    assert result.chunks[0].id.endswith("modifier_missing_01")
    assert result.chunks[0].title.startswith("BCBS-TX")
    assert result.chunks[0].scope["action_bucket"] == "corrected_claim"
    assert result.carc_descriptions == [
        DenialCodeDescription(
            code="CO-45",
            label="Charge exceeds fee schedule/maximum allowable",
            demo_summary="Contractual adjustment or pricing issue.",
        )
    ]
    assert result.rarc_descriptions[0].code == "N179"

    pipeline = mongodb.aggregate_calls[0][2]
    vector_stage = pipeline[0]["$vectorSearch"]
    assert vector_stage["index"] == "playbook_vec"
    assert vector_stage["path"] == "embedding"
    assert vector_stage["filter"] == {
        "payer_id": "bcbs_tx_demo",
        "scope.cpt_family": "psychotherapy_90_codes",
    }
    assert len(vector_stage["queryVector"]) == 1536


@pytest.mark.asyncio
async def test_policy_retriever_handles_no_results_cleanly():
    result = await PolicyAgentRetriever(FakeEmbedder(), FakeMongodb(chunks=[])).retrieve(
        PolicyQuery(
            payer_id="unknown_demo",
            cpt="90837",
            raw_text="No matching payer playbook should exist.",
        )
    )

    assert result.chunks == []
    assert result.fallback_reason
    assert "human review" in result.fallback_reason


def test_infer_cpt_family():
    assert infer_cpt_family("90837") == "psychotherapy_90_codes"
    assert infer_cpt_family("90791") == "evaluation_90791"
    assert infer_cpt_family("99441") == "telehealth_modifiers"
