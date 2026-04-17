"""
REST routes backed by gigease.enriched_worker_week (Postgres or CSV fallback).
"""
from __future__ import annotations

import json
import os
import uuid
from collections import defaultdict
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from db import (
    fetch_all_weeks_all_workers,
    fetch_all_workers,
    fetch_worker_all_weeks,
    fetch_worker_latest,
)
from demo_data import DEMO_ACTIVE_DISRUPTION, DEMO_ICR
from gigease_financial_model import predict_worker_week
from gigease_rag_explainer import generate_claim_explanation
from simulation_helpers import (
    build_claim_rationale_sync,
    build_premium_rationale_sync,
    build_week_summary,
    group_weeks_by_month,
    log_ml_simulation_event,
    resolve_worker_id,
    row_to_predict_input,
)

router = APIRouter()


class TriggerInput(BaseModel):
    trigger_type: str = "STFI"
    zones: List[str] = ["Velachery", "Adyar"]
    rainfall_mm: float = 187.0
    wind_speed_kmph: float = 45.0
    flood_alert_level: int = 4
    temperature_c: float = 32.0
    rsmd_sources_confirmed: int = 0


@router.get("/workers")
async def list_workers():
    workers = await fetch_all_workers()
    return {"workers": workers, "total": len(workers), "active_disruption": DEMO_ACTIVE_DISRUPTION}


@router.get("/worker/{worker_id}")
async def get_worker(worker_id: str):
    wid = resolve_worker_id(worker_id)
    row = await fetch_worker_latest(wid)
    if not row:
        raise HTTPException(404, detail=f"Worker {worker_id} not found")
    pred_input = row_to_predict_input(row)
    pred = predict_worker_week(pred_input)
    latest = row.get("week_start_date")
    if hasattr(latest, "isoformat"):
        latest = latest.isoformat()
    return {
        "profile": {
            "worker_id": row["worker_id"],
            "worker_name": row["worker_name"],
            "primary_zone": row["primary_zone"],
            "zone_flood_risk_score": row.get("zone_flood_risk_score"),
            "experience_months": row.get("experience_months"),
            "policy_active": row.get("policy_active"),
            "sum_insured": row.get("sum_insured"),
            "latest_week": latest,
        },
        "current_week": build_week_summary(row, pred),
    }


@router.get("/worker/{worker_id}/predict")
async def predict_latest(worker_id: str):
    wid = resolve_worker_id(worker_id)
    row = await fetch_worker_latest(wid)
    if not row:
        raise HTTPException(404, detail=f"Worker {worker_id} not found")
    pred_input = row_to_predict_input(row)
    pred = predict_worker_week(pred_input)

    explanation = None
    if pred["claim_triggered"] == 1:
        try:
            explanation = await generate_claim_explanation(pred, pred_input)
        except Exception:
            explanation = {
                "decision": "CLAIM APPROVED",
                "payout_inr": pred["claim_amount_inr"],
                "reason_short": "A disruption in your zone caused income to fall below threshold.",
                "reason_detail": (
                    f"Income ₹{pred_input.get('w_actual', 0):.0f} vs threshold "
                    f"₹{float(pred_input.get('w_expected') or 0) * 0.6:.0f}. "
                    f"Claim ₹{pred['claim_amount_inr']:.2f}."
                ),
                "next_premium": pred["next_week_premium_inr"],
                "loading_note": None,
                "fraud_note": None,
            }

    log_ml_simulation_event(
        "predict_latest",
        {
            "worker_id": wid,
            "worker_name": row.get("worker_name"),
            "claim_triggered": int(pred.get("claim_triggered") or 0),
            "claim_amount_inr": float(pred.get("claim_amount_inr") or 0),
            "weekly_premium_inr": float(pred.get("weekly_premium_inr") or 0),
            "claim_probability": float(pred.get("claim_probability") or 0),
            "fraud_action": pred.get("fraud_action"),
            "rag_generated": explanation is not None,
        },
    )

    return {
        "worker_id": wid,
        "week_start_date": pred_input.get("week_start_date"),
        **pred,
        "ai_explanation": explanation,
        "razorpay_order_id": f"order_demo_{uuid.uuid4().hex[:12]}",
        "razorpay_status": "SIMULATED",
    }


@router.get("/worker/{worker_id}/simulate/claims")
async def simulate_claim_history(worker_id: str):
    wid = resolve_worker_id(worker_id)
    rows = await fetch_worker_all_weeks(wid)
    if not rows:
        raise HTTPException(404, detail=f"Worker {worker_id} not found")

    wname = rows[0].get("worker_name")
    log_ml_simulation_event(
        "simulate_claims_start",
        {
            "worker_id": wid,
            "worker_name": wname,
            "rows": len(rows),
            "engine": "predict_worker_week",
        },
    )

    weeks_processed: list = []
    cumulative_premium_paid = 0.0
    cumulative_claims_received = 0.0
    sample_rag_claim = None

    for row in rows:
        pred_input = row_to_predict_input(row)
        pred = predict_worker_week(pred_input)
        w = build_week_summary(row, pred)
        w["ml_claim_rationale"] = build_claim_rationale_sync(pred_input, pred)
        cumulative_premium_paid += pred["weekly_premium_inr"]
        cumulative_claims_received += pred["claim_amount_inr"]
        w["cumulative_premium_paid"] = round(cumulative_premium_paid, 2)
        w["cumulative_claims_received"] = round(cumulative_claims_received, 2)
        w["net_position"] = round(cumulative_premium_paid - cumulative_claims_received, 2)
        weeks_processed.append(w)
        if sample_rag_claim is None and int(pred.get("claim_triggered") or 0) == 1:
            try:
                sample_rag_claim = await generate_claim_explanation(pred, pred_input)
            except Exception as ex:
                sample_rag_claim = {
                    "error": str(ex),
                    "fallback": w.get("ml_claim_rationale"),
                }

    months = group_weeks_by_month(weeks_processed)
    total_claims = sum(1 for w in weeks_processed if w["claim_triggered"] == 1)
    total_premium = round(sum(w["weekly_premium_inr"] for w in weeks_processed), 2)
    total_payout = round(sum(w["claim_amount_inr"] for w in weeks_processed), 2)
    fraud_weeks = [w for w in weeks_processed if w["fraud_action"] in ("AUTO_REJECT", "SOFT_FLAG")]

    for w in weeks_processed:
        if w.get("claim_triggered") == 1:
            log_ml_simulation_event(
                "claim_week_ml",
                {
                    "worker_id": wid,
                    "worker_name": wname,
                    "week_start_date": w.get("week_start_date"),
                    "claim_amount_inr": w.get("claim_amount_inr"),
                    "claim_probability": w.get("claim_probability"),
                    "ml_claim_rationale": w.get("ml_claim_rationale"),
                },
            )
    log_ml_simulation_event(
        "simulate_claims_complete",
        {
            "worker_id": wid,
            "worker_name": wname,
            "total_weeks": len(weeks_processed),
            "total_claims": total_claims,
            "total_premium_paid": total_premium,
            "total_payout_received": total_payout,
            "net_position_inr": round(total_premium - total_payout, 2),
        },
    )
    if sample_rag_claim is not None:
        log_ml_simulation_event(
            "rag_claim_sample",
            {"worker_id": wid, "worker_name": wname, "payload": sample_rag_claim},
        )

    return {
        "worker_id": wid,
        "worker_name": wname,
        "primary_zone": rows[0].get("primary_zone"),
        "simulation_type": "CLAIMS",
        "total_weeks": len(weeks_processed),
        "total_months": len(months),
        "total_claims": total_claims,
        "total_premium_paid": total_premium,
        "total_payout_received": total_payout,
        "net_position_inr": round(total_premium - total_payout, 2),
        "fraud_weeks": len(fraud_weeks),
        "months": months,
        "rag_claim_explanation_sample": sample_rag_claim,
    }


@router.get("/worker/{worker_id}/simulate/premium")
async def simulate_premium_history(worker_id: str):
    wid = resolve_worker_id(worker_id)
    rows = await fetch_worker_all_weeks(wid)
    if not rows:
        raise HTTPException(404, detail=f"Worker {worker_id} not found")

    wname = rows[0].get("worker_name")
    log_ml_simulation_event(
        "simulate_premium_start",
        {"worker_id": wid, "worker_name": wname, "rows": len(rows), "engine": "predict_worker_week"},
    )

    bundled: list[tuple[dict, dict, dict, float, float]] = []
    for row in rows:
        pred_input = row_to_predict_input(row)
        pred = predict_worker_week(pred_input)
        w_avg = float(pred_input.get("w_avg_12wk") or 0)
        risk = float(pred_input.get("risk_model_score") or 0)
        loading_pct = float(pred_input.get("current_claim_loading_pct") or 0)
        base = round(0.02 * w_avg, 2)
        if risk >= 0.80:
            sl = 0.65
        elif risk >= 0.60:
            sl = 0.40
        elif risk >= 0.40:
            sl = 0.20
        elif risk >= 0.20:
            sl = 0.10
        else:
            sl = 0.00
        seasonal = round(sl * base, 2)
        claim_load = round(loading_pct * base, 2)
        date = row.get("week_start_date")
        if hasattr(date, "isoformat"):
            date = date.isoformat()

        entry = {
            "week_start_date": date,
            "w_avg_12wk": w_avg,
            "risk_model_score": risk,
            "sl_factor": sl,
            "base_premium": base,
            "seasonal_load": seasonal,
            "claim_load": claim_load,
            "weekly_premium_inr": pred["weekly_premium_inr"],
            "next_week_premium_inr": pred["next_week_premium_inr"],
            "claim_triggered_this_week": pred["claim_triggered"],
            "fraud_action": pred["fraud_action"],
            "current_claim_loading_pct": loading_pct,
            "loading_label": f"{int(loading_pct * 100)}%",
            "breakdown_steps": [
                {"step": 1, "label": "12-week avg income", "result": w_avg},
                {"step": 2, "label": f"Base (2% × ₹{w_avg:,.0f})", "result": base},
                {"step": 3, "label": f"Risk {risk:.2f} → {int(sl * 100)}% seasonal", "result": sl},
                {"step": 4, "label": f"Seasonal load ({int(sl * 100)}% × ₹{base})", "result": seasonal},
                {"step": 5, "label": f"Claim load ({int(loading_pct * 100)}% × ₹{base})", "result": claim_load},
                {"step": 6, "label": "Raw total", "result": round(base + seasonal + claim_load, 2)},
                {"step": 7, "label": "Guard (₹50–₹200)", "result": pred["weekly_premium_inr"]},
                {"step": 8, "label": "Final premium ✓", "result": pred["weekly_premium_inr"]},
            ],
        }
        bundled.append((entry, pred_input, pred, seasonal, claim_load))

    prem = [b[0]["weekly_premium_inr"] for b in bundled]
    hist_avg = round(sum(prem) / len(prem), 2) if prem else 0.0

    weeks_processed = []
    sample_note = None
    for entry, pred_input, pred, seasonal, claim_load in bundled:
        e = dict(entry)
        e["premium_rationale"] = build_premium_rationale_sync(
            pred_input, pred, seasonal, claim_load, hist_avg
        )
        weeks_processed.append(e)
        if sample_note is None and e.get("premium_rationale"):
            sample_note = {"week": e["week_start_date"], "premium_rationale": e["premium_rationale"]}
        if (
            hist_avg > 0
            and e["weekly_premium_inr"] >= hist_avg * 1.07
            and e.get("premium_rationale")
        ):
            log_ml_simulation_event(
                "premium_week_elevated",
                {
                    "worker_id": wid,
                    "worker_name": wname,
                    "week_start_date": e["week_start_date"],
                    "weekly_premium_inr": e["weekly_premium_inr"],
                    "hist_avg_premium": hist_avg,
                    "premium_rationale": e.get("premium_rationale"),
                },
            )

    months = group_weeks_by_month(weeks_processed)

    log_ml_simulation_event(
        "simulate_premium_complete",
        {
            "worker_id": wid,
            "worker_name": wname,
            "total_weeks": len(weeks_processed),
            "avg_premium": round(sum(prem) / len(prem), 2) if prem else 0,
            "min_premium": min(prem) if prem else 0,
            "max_premium": max(prem) if prem else 0,
            "sample_elevated_premium_note": sample_note,
        },
    )

    return {
        "worker_id": wid,
        "worker_name": wname,
        "simulation_type": "PREMIUM",
        "total_weeks": len(weeks_processed),
        "avg_premium": round(sum(prem) / len(prem), 2) if prem else 0,
        "min_premium": min(prem) if prem else 0,
        "max_premium": max(prem) if prem else 0,
        "premium_after_claim_weeks": [w for w in weeks_processed if w["claim_load"] > 0],
        "months": months,
        "premium_rationale_sample": sample_note,
    }


@router.get("/admin/simulate/all")
async def simulate_all_workers():
    all_rows = await fetch_all_weeks_all_workers()
    if not all_rows:
        raise HTTPException(404, detail="No data found in DB")

    worker_rows: dict[str, list] = defaultdict(list)
    for row in all_rows:
        worker_rows[str(row["worker_id"])].append(row)

    results = []
    for wid in sorted(worker_rows.keys()):
        rows = sorted(worker_rows[wid], key=lambda r: str(r.get("week_start_date") or ""))
        weeks_processed = []
        cum_premium = 0.0
        cum_claims = 0.0
        for row in rows:
            pred_input = row_to_predict_input(row)
            pred = predict_worker_week(pred_input)
            w = build_week_summary(row, pred)
            cum_premium += pred["weekly_premium_inr"]
            cum_claims += pred["claim_amount_inr"]
            w["cumulative_premium_paid"] = round(cum_premium, 2)
            w["cumulative_claims_received"] = round(cum_claims, 2)
            weeks_processed.append(w)
        total_claims = sum(1 for w in weeks_processed if w["claim_triggered"] == 1)
        results.append(
            {
                "worker_id": wid,
                "worker_name": rows[0].get("worker_name"),
                "primary_zone": rows[0].get("primary_zone"),
                "total_weeks": len(weeks_processed),
                "total_claims": total_claims,
                "total_premium": round(cum_premium, 2),
                "total_payout": round(cum_claims, 2),
                "net_position": round(cum_premium - cum_claims, 2),
                "loss_ratio_pct": round((cum_claims / cum_premium * 100) if cum_premium > 0 else 0, 1),
                "months": group_weeks_by_month(weeks_processed),
            }
        )

    total_premium_all = sum(r["total_premium"] for r in results)
    total_payout_all = sum(r["total_payout"] for r in results)

    return {
        "simulation_type": "ALL_WORKERS",
        "total_workers": len(results),
        "total_weeks_across_all": sum(r["total_weeks"] for r in results),
        "total_claims_across_all": sum(r["total_claims"] for r in results),
        "total_premium_inr": round(total_premium_all, 2),
        "total_payout_inr": round(total_payout_all, 2),
        "overall_loss_ratio_pct": round(
            (total_payout_all / total_premium_all * 100) if total_premium_all > 0 else 0, 1
        ),
        "workers": results,
    }


@router.post("/admin/trigger_simulate")
async def trigger_simulate(data: TriggerInput):
    all_rows = await fetch_all_weeks_all_workers()
    latest: dict = {}
    for row in all_rows:
        wid = str(row["worker_id"])
        wd = row.get("week_start_date")
        if wid not in latest:
            latest[wid] = row
            continue
        other = latest[wid].get("week_start_date")
        if str(wd) > str(other):
            latest[wid] = row

    event_log = []
    ts = [1]

    def log(msg: str):
        event_log.append({"timestamp": f"06:00:{ts[0]:02d}", "message": msg})
        ts[0] += 1

    log(f"{data.trigger_type} trigger received — zones: {', '.join(data.zones)}")

    results = []
    total_payout = 0.0
    approved = 0
    rejected = 0

    for wid, row in latest.items():
        if row.get("primary_zone") not in data.zones:
            continue
        log(f"Processing {wid} — {row.get('worker_name')}...")
        pred_input = row_to_predict_input(dict(row))
        pred_input["stfi_event_confirmed"] = 1 if data.trigger_type == "STFI" else 0
        pred_input["stfi_event_severity"] = data.flood_alert_level
        pred_input["rainfall_mm"] = data.rainfall_mm
        pred_input["max_daily_rainfall_mm"] = data.rainfall_mm
        pred_input["wind_speed_kmph"] = data.wind_speed_kmph
        pred_input["flood_alert_level"] = data.flood_alert_level
        pred_input["rsmd_event_confirmed"] = 1 if data.rsmd_sources_confirmed >= 2 else 0
        pred_input["rsmd_news_source_count"] = data.rsmd_sources_confirmed

        try:
            pred = predict_worker_week(pred_input)
            payout = pred["claim_amount_inr"]
            fa = pred["fraud_action"]
            log(
                f"{wid} income: ₹{pred_input.get('w_actual', 0):.0f} vs threshold "
                f"₹{float(pred_input.get('w_expected') or 0) * 0.6:.0f} → "
                f"{'✓ TRIGGERED' if pred['claim_triggered'] else '✗ NO CLAIM'}"
            )
            log(f"{wid} fraud: {fa} | payout: ₹{payout:.2f}")
            total_payout += payout
            if pred["claim_triggered"] == 1:
                approved += 1
            else:
                rejected += 1
            results.append(
                {"worker_id": wid, "worker_name": row.get("worker_name"), "payout": payout, "status": fa}
            )
        except Exception as e:
            log(f"{wid} ERROR: {e}")
            results.append(
                {"worker_id": wid, "worker_name": row.get("worker_name"), "payout": 0, "status": "ERROR"}
            )

    log(f"Complete. ₹{total_payout:,.2f} total disbursed to {approved} workers.")
    return {
        "trigger_id": f"TRG-{uuid.uuid4().hex[:6].upper()}",
        "event_log": event_log,
        "total_payout_inr": round(total_payout, 2),
        "claims_approved": approved,
        "claims_rejected": rejected,
        "results": results,
    }


@router.get("/admin/model_info")
async def get_model_info():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    fi_path = os.path.join(script_dir, "financial_model_ml", "gigease_feature_importance.json")
    feature_importance = []
    if os.path.exists(fi_path):
        with open(fi_path, encoding="utf-8") as f:
            fi_data = json.load(f)
            clf_features = fi_data.get("classifier_top20", [])
            if clf_features:
                max_val = clf_features[0].get("shap_importance", 1)
                for feat in clf_features[:10]:
                    pct = int(round(feat.get("shap_importance", 0) / max_val * 100))
                    feature_importance.append({"feature": feat["feature"], "importance_pct": pct})

    return {
        "classifier_version": "XGBoost v2.0.3 — GigEase Classifier v1.0",
        "trained_date": "2026-04-03",
        "training_rows": 520,
        "feature_count": 70,
        "auc": 1.000,
        "recall": 0.933,
        "f1": 0.931,
        "feature_importance": feature_importance,
        "last_predictions": [],
    }


@router.get("/admin/icr")
async def get_icr():
    all_rows = await fetch_all_weeks_all_workers()
    if not all_rows:
        return {**DEMO_ICR, "source": "demo_stub"}
    total_premium = sum(float(r.get("weekly_premium_inr") or 0) for r in all_rows)
    total_claims = sum(float(r.get("claim_amount_inr") or 0) for r in all_rows)
    icr = round((total_claims / total_premium * 100) if total_premium > 0 else 0, 1)
    zone = "TARGET" if icr < 70 else ("WARNING" if icr < 85 else "CRITICAL")
    return {
        "icr_percent": icr,
        "total_premium_collected_inr": round(total_premium, 2),
        "total_claims_paid_inr": round(total_claims, 2),
        "active_policies": len({str(r.get("worker_id")) for r in all_rows}),
        "total_weeks_tracked": len(all_rows),
        "icr_zone": zone,
        "source": "live_db",
    }
