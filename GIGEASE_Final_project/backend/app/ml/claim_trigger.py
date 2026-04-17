"""
Claim Trigger Engine — standalone module.
Uses ML income predictor to decide automatic parametric payouts.
No ORM dependency; works with in-memory demo data.
"""
from app.ml.income_predictor import predict_income
import uuid


async def run_claim_trigger_engine(zone_id: str, event_type: str):
    """
    Evaluate all demo workers in a zone and trigger claims where
    income dropped below 60 % of expected.
    Returns a summary dict.
    """
    # Demo worker stubs — in production this reads from DB
    demo_workers = [
        {"worker_id": "W001", "zone": "VELACHERY", "w_actual": 1600, "fraud_action": "AUTO_APPROVE", "fraud_deduction_inr": 0, "sum_insured": 7500},
        {"worker_id": "W002", "zone": "VELACHERY", "w_actual": 3200, "fraud_action": "AUTO_APPROVE", "fraud_deduction_inr": 0, "sum_insured": 7500},
        {"worker_id": "W003", "zone": "ADYAR",     "w_actual": 1400, "fraud_action": "SOFT_FLAG",    "fraud_deduction_inr": 200, "sum_insured": 6000},
        {"worker_id": "W004", "zone": "T_NAGAR",   "w_actual": 2000, "fraud_action": "AUTO_REJECT",  "fraud_deduction_inr": 0, "sum_insured": 7500},
    ]

    triggered = []
    for wk in demo_workers:
        if wk["zone"] != zone_id:
            continue
        if wk["fraud_action"] == "AUTO_REJECT":
            continue

        income = predict_income(wk["worker_id"], mode="realtime", zone_id=zone_id)
        W_expected = income.get("W_expected", 4200.0)
        W_actual = wk["w_actual"]

        if W_actual >= 0.60 * W_expected:
            continue

        beta = 0.75 if event_type == "STFI" else 0.65
        loss = W_expected - W_actual
        raw_payout = beta * loss
        final_payout = min(max(0, raw_payout - wk["fraud_deduction_inr"]), wk["sum_insured"])

        if final_payout <= 0:
            continue

        transfer_id = f"pay_mock_claim_{uuid.uuid4().hex[:8]}"
        triggered.append({
            "worker_id": wk["worker_id"],
            "W_expected": W_expected,
            "W_actual": W_actual,
            "final_payout": round(final_payout, 2),
            "transfer_id": transfer_id,
        })

    return {"triggered_count": len(triggered), "workers": triggered}
