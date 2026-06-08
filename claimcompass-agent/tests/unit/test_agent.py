from app.agent import GOLDEN_DENIAL_ID, decode_claimcompass_golden_denial


def test_decode_claimcompass_golden_denial_returns_demo_plan() -> None:
    result = decode_claimcompass_golden_denial(GOLDEN_DENIAL_ID)

    assert result["ok"] is True
    assert result["demo_data_notice"] == "DEMO DATA - NOT REAL PHI"
    assert result["decision"]["bucket"] == "corrected_claim"
    assert "modifier 95" in result["decision"]["next_best_action"]
    assert result["citation_id"].endswith("modifier_missing_01")
    assert any("$vectorSearch" in item for item in result["mongodb_proof"])


def test_decode_claimcompass_golden_denial_rejects_non_demo_input() -> None:
    result = decode_claimcompass_golden_denial("real_claim_123")

    assert result["ok"] is False
    assert "synthetic" in result["error"]
    assert "Do not provide real PHI" in result["error"]
