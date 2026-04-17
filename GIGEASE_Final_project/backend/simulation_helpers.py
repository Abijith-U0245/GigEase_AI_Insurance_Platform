"""Shared helpers for DB-driven claim/premium simulation responses."""
from __future__ import annotations

import datetime
import json
from collections import OrderedDict
from typing import Any

MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]


def resolve_worker_id(worker_id: str) -> str:
    """Map demo UI id to enriched CSV worker id."""
    if worker_id.upper() == "W001":
        return "T001"
    return worker_id


def row_to_predict_input(row: dict) -> dict[str, Any]:
    """DB/CSV row -> dict for predict_worker_week (feature names + types)."""
    d = dict(row)
    # PostgreSQL / asyncpg may expose quoted column as aqi_avg
    if "aqi_avg" in d and "AQI_avg" not in d:
        d["AQI_avg"] = d.pop("aqi_avg")
    ws = d.get("week_start_date")
    if hasattr(ws, "isoformat"):
        d["week_start_date"] = ws.isoformat()
    skip_none = {
        "worker_id", "worker_name", "week_start_date", "primary_zone",
        "rsmd_event_type", "fraud_action",
    }
    for k, v in list(d.items()):
        if hasattr(v, "item"):
            d[k] = v.item()
        elif v is None and k not in skip_none:
            d[k] = 0.0
    if d.get("fraud_action") is None:
        d["fraud_action"] = "AUTO_APPROVE"
    if d.get("rsmd_event_type") is None:
        d["rsmd_event_type"] = ""
    return d


def build_week_summary(row: dict, pred: dict) -> dict[str, Any]:
    """Single week payload for timeline UI + ML outputs."""
    date = row.get("week_start_date")
    if hasattr(date, "isoformat"):
        date = date.isoformat()
    w_exp = float(row.get("w_expected") or 0)
    w_act = float(row.get("w_actual") or 0)
    thresh = round(w_exp * 0.6, 2) if w_exp else 0.0
    drop_pct = round((1 - w_act / w_exp) * 100, 1) if w_exp > 0 else 0.0
    return {
        "week_start_date": date,
        "week_number_in_history": None,
        "month_label": None,
        "w_actual": w_act,
        "w_expected": w_exp,
        "threshold_60pct": thresh,
        "income_drop_pct": drop_pct,
        "threshold_crossed": w_act < thresh if w_exp > 0 else False,
        "weekly_premium_inr": float(pred.get("weekly_premium_inr") or 0),
        "base_premium": float(pred.get("base_premium") or 0),
        "seasonal_load": float(pred.get("seasonal_load") or 0),
        "claim_load": float(pred.get("claim_load") or 0),
        "next_week_premium_inr": float(pred.get("next_week_premium_inr") or 0),
        "claim_triggered": int(pred.get("claim_triggered") or 0),
        "claim_probability": float(pred.get("claim_probability") or 0),
        "claim_amount_inr": float(pred.get("claim_amount_inr") or 0),
        "pay_immediate": float(pred.get("pay_immediate") or 0),
        "pay_held": float(pred.get("pay_held") or 0),
        "soft_flag_hold": bool(pred.get("soft_flag_hold")),
        "fraud_action": str(pred.get("fraud_action") or "AUTO_APPROVE"),
        "flag_review": bool(pred.get("flag_review")),
        "stfi_event_confirmed": int(row.get("stfi_event_confirmed") or 0),
        "stfi_event_severity": int(row.get("stfi_event_severity") or 0),
        "rsmd_event_confirmed": int(row.get("rsmd_event_confirmed") or 0),
        "rsmd_event_type": str(row.get("rsmd_event_type") or ""),
        "flood_alert_level": int(row.get("flood_alert_level") or 0),
        "rainfall_mm": float(row.get("rainfall_mm") or 0),
    }


def group_weeks_by_month(weeks: list[dict]) -> list[dict]:
    """Attach week indices and nest under month buckets for horizontal timeline UI."""
    months: OrderedDict[str, dict] = OrderedDict()
    for idx, w in enumerate(weeks):
        w = dict(w)
        date_str = w.get("week_start_date")
        if hasattr(date_str, "isoformat"):
            date_str = date_str.isoformat()
        if not date_str:
            continue
        ds = str(date_str)[:10]
        dt = datetime.date.fromisoformat(ds)
        key = f"{MONTH_NAMES[dt.month - 1]}-{dt.year}"
        if key not in months:
            months[key] = {
                "month_label": MONTH_NAMES[dt.month - 1],
                "month_year": key,
                "year": dt.year,
                "month_num": dt.month,
                "weeks": [],
            }
        w["week_number_in_history"] = idx + 1
        w["month_label"] = key
        months[key]["weeks"].append(w)
    return list(months.values())


def humanize_feature_label(snake: str) -> str:
    """Turn zone_risk_score → Zone risk score for UI copy."""
    if not snake:
        return ""
    parts = [p for p in str(snake).replace("-", "_").split("_") if p]
    return " ".join((p[0].upper() + p[1:].lower()) if len(p) > 1 else p.upper() for p in parts)


def build_claim_rationale_sync(pred_input: dict, pred: dict) -> str | None:
    """Deterministic claim explanation for UI + terminal (no LLM)."""
    if int(pred.get("claim_triggered") or 0) != 1:
        return None
    w_exp = float(pred_input.get("w_expected") or 0)
    w_act = float(pred_input.get("w_actual") or 0)
    thresh = round(w_exp * 0.6, 2) if w_exp else 0.0
    bits = [
        f"Income ₹{w_act:.0f} fell below the 60% floor ₹{thresh:.0f} (expected income ₹{w_exp:.0f}).",
    ]
    if int(pred_input.get("stfi_event_confirmed") or 0) == 1:
        bits.append(
            f"STFI context: flood alert level {int(pred_input.get('flood_alert_level') or 0)}, "
            f"rainfall {float(pred_input.get('rainfall_mm') or 0):.0f}mm."
        )
    if int(pred_input.get("rsmd_event_confirmed") or 0) == 1:
        et = pred_input.get("rsmd_event_type") or "RSMD"
        bits.append(f"{et} disruption confirmed in zone data.")
    cp = float(pred.get("claim_probability") or 0)
    bits.append(
        f"Classifier claim probability {cp:.3f}; fraud review: {pred.get('fraud_action')}. "
        f"Approved payout ₹{float(pred.get('claim_amount_inr') or 0):.2f}."
    )
    return " ".join(bits)


def build_premium_rationale_sync(
    pred_input: dict,
    pred: dict,
    seasonal_load: float,
    claim_load: float,
    hist_avg_premium: float,
) -> str | None:
    """Why premium is elevated this week (deterministic)."""
    reasons: list[str] = []
    prem = float(pred.get("weekly_premium_inr") or 0)
    risk = float(pred_input.get("risk_model_score") or 0)
    if claim_load > 0.01:
        reasons.append(
            f"Claim loading (+₹{claim_load:.0f} on base) from recent paid claims on file."
        )
    if seasonal_load > 0.01 and risk >= 0.4:
        reasons.append(
            f"Seasonal risk load (+₹{seasonal_load:.0f}) tied to elevated risk score ({risk:.2f})."
        )
    if hist_avg_premium > 0 and prem > hist_avg_premium * 1.07:
        reasons.append(
            f"This week ₹{prem:.0f} is above your run average ₹{hist_avg_premium:.0f} because of the factors above."
        )
    return " ".join(reasons) if reasons else None


def log_ml_simulation_event(event: str, payload: dict) -> None:
    """Single-line JSON for judges / uvicorn terminal."""
    line = json.dumps({"gigease_ml_audit": event, **payload}, default=str)
    print(line, flush=True)
