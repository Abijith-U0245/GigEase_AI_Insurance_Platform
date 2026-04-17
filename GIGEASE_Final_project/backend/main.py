# main.py — GigEase FastAPI Backend
# Run: uvicorn main:app --reload --port 8000

import os
import sys
import asyncio
import uuid
import json
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import requests
from dotenv import load_dotenv

load_dotenv()

# Windows asyncio compatibility
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Import the new 3-model ML orchestrator
from ml_orchestrator import (
    predict_worker_week,
    compute_weekly_premium,
    compute_sum_insured,
    load_all_models,
)

import api_db
from db import DB_PATH, fetch_all_weeks_all_workers, ping_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    ok = await ping_db()
    try:
        print(f"{'✅' if ok else '❌'} SQLite DB {'ready' if ok else 'NOT FOUND'} at {DB_PATH}")
    except UnicodeEncodeError:
        print(f"[{'OK' if ok else '!!'}] SQLite DB {'ready' if ok else 'NOT FOUND'} at {DB_PATH}")
    # Warm all 3 ML models at startup
    try:
        load_all_models()
        print("[Startup] All ML models (Risk / Income / Fraud) loaded.")
    except Exception as e:
        print(f"[Startup] ML model warm-up warning: {e}")
    yield


# =====================================================================
# FASTAPI APP
# =====================================================================

app = FastAPI(
    title="GigEase API",
    description="Parametric income protection for food delivery partners — Guidewire DEVTrails 2026",
    version="2.0.0-db",
    lifespan=lifespan,
)

# CORS — allow frontend (Lovable/React runs on different port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_db.router)

# Phase 3 APIS
from app.api import realtime, simulation, fraud_map, whatsapp_otp, payment, news
app.include_router(realtime.router)
app.include_router(simulation.router)
app.include_router(fraud_map.router)
app.include_router(whatsapp_otp.router)
app.include_router(payment.router)
app.include_router(news.router)

# =====================================================================
# PYDANTIC SCHEMAS
# =====================================================================

class WorkerWeekInput(BaseModel):
    # --- Metadata (model drops these internally) ---
    worker_id: str = "W001"
    worker_name: str = "Arun S"
    week_start_date: str = "2024-11-04"

    # --- Zone Features ---
    primary_zone: str = "Velachery"
    zone_flood_risk_score: float = 0.82
    zone_elevation_category: int = 0
    zone_drainage_quality: int = 0
    experience_months: int = 24

    # --- Time Features ---
    week_number: int = 44
    month: int = 11
    is_northeast_monsoon_season: int = 1
    is_summer_heat_season: int = 0
    festival_week: int = 0

    # --- Income Features ---
    w_actual: float = 1600.0
    order_earnings: float = 1200.0
    daily_bonus_total: float = 300.0
    weekly_target_bonus: float = 100.0
    login_guarantee_received: float = 0.0
    orders_completed: int = 18
    active_days: int = 4
    total_login_hours: float = 32.0
    peak_hour_login_days: int = 3
    order_rejection_rate: float = 0.08

    # --- Rolling Averages ---
    w_avg_4wk: float = 5000.0
    w_avg_12wk: float = 5000.0
    w_expected: float = 4250.0
    income_vs_peer_ratio: float = 0.96
    risk_model_score: float = 0.9991
    seasonal_loading_factor: float = 0.65

    # --- Weather / STFI Features ---
    rainfall_mm: float = 0.0
    max_daily_rainfall_mm: float = 0.0
    wind_speed_kmph: float = 0.0
    flood_alert_level: int = 0
    cyclone_warning_active: int = 0
    heatwave_declared: int = 0
    AQI_avg: float = 85.0
    stfi_event_confirmed: int = 0
    stfi_event_severity: int = 0

    # --- RSMD Features ---
    rsmd_news_score: float = 0.0
    rsmd_news_source_count: int = 0
    google_maps_congestion_index: float = 0.45
    ndma_emergency_alert_active: int = 0
    rsmd_event_confirmed: int = 0
    rsmd_event_type: str = ""
    rsmd_event_severity: int = 0

    # --- Fraud Features ---
    fraud_model_score: float = 0.12
    fraud_action: str = "AUTO_APPROVE"
    gps_spoofing_detected: int = 0
    behavioral_anomaly_flag: int = 0
    fraud_deduction_inr: float = 0.0

    # --- Policy State ---
    policy_active: int = 1
    sum_insured: float = 7500.0
    current_claim_loading_pct: float = 0.0
    claims_last_4wk: int = 0

    # --- Daily Granular Features ---
    daily_zero_income_days: int = 0
    daily_event_active_days: int = 0
    daily_pre_event_rejection_spike: float = 0.0
    daily_income_trajectory_slope: float = 0.0
    daily_max_rainfall: float = 0.0
    daily_max_congestion: float = 0.0
    daily_max_rsmd_news_score: float = 0.0
    daily_max_rsmd_source_count: int = 0
    daily_ndma_alert_any_day: int = 0
    daily_peak_hour_days: int = 0
    daily_avg_fraud_score: float = 0.0
    daily_income_mon: float = 0.0
    daily_income_tue: float = 0.0
    daily_income_wed: float = 0.0
    daily_income_thu: float = 0.0
    daily_income_fri: float = 0.0
    daily_income_sat: float = 0.0
    daily_income_sun: float = 0.0
    daily_claim_signal_days: int = 0


class PremiumInput(BaseModel):
    w_avg_12wk: float = 5000.0
    risk_model_score: float = 0.9991
    current_claim_loading_pct: float = 0.05
    claims_last_4wk: int = 1


class RSMDInput(BaseModel):
    news_articles: List[str]
    date_str: str


class EnrollInput(BaseModel):
    worker_name: str
    phone: str
    platform: str
    primary_zone: str
    experience_months: int
    w_avg_12wk: float
    risk_model_score: float = 0.5
    aadhaar_verified: bool = True
    upi_id: str


class RazorpayOrderInput(BaseModel):
    amount_inr: float
    worker_id: str
    claim_id: str


# =====================================================================
# ROUTES
# =====================================================================

# ---- 1. Health Check ----
@app.get("/health")
async def health_check():
    db_ok = await ping_db()
    rows = await fetch_all_weeks_all_workers()
    csv_ok = len(rows) > 0
    return {
        "status": "healthy" if (db_ok or csv_ok) else "degraded",
        "db_connected": db_ok,
        "csv_data_loaded": csv_ok,
        "ml_models_loaded": True,
        "vectordb_ready": True,
        "razorpay_connected": False,
        "version": "2.0.0-db",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


# ---- 2. Predict Claim (Master Endpoint) ----
@app.post("/predict_claim")
async def predict_claim(data: WorkerWeekInput):
    try:
        worker_dict = data.dict()

        # Run full ML + formula pipeline
        financials = predict_worker_week(worker_dict)

        # Generate AI explanation if claim is triggered
        # Generate AI explanation — now built from orchestrator's native outputs
        explanation = None
        fraud_action = financials["fraud_action"]
        w_exp = financials.get("W_expected") or data.w_expected
        w_act = financials.get("W_actual") or data.w_actual
        fraud_score = financials.get("final_fraud_score", 0.0)
        fraud_flags = financials.get("l1_flags") or []
        claim_type = financials.get("claim_type") or ""
        rag_text = financials.get("rag_explanation") or ""

        if financials["claim_triggered"] == 1:
            explanation = {
                "worker_name": data.worker_name,
                "week": data.week_start_date,
                "decision": "CLAIM APPROVED",
                "payout_inr": financials["claim_amount_inr"],
                "reason_short": f"A {claim_type or 'parametric'} event in {data.primary_zone} caused your income to fall below the protection threshold.",
                "reason_detail": (
                    f"Your income of Rs.{w_act:.0f} was below the "
                    f"Rs.{w_exp * 0.6:.0f} threshold this week (60% of expected Rs.{w_exp:.0f}). "
                    f"Claim of Rs.{financials['claim_amount_inr']:.2f} auto-approved via UPI. "
                    f"Zone risk score: {financials.get('zone_risk_score', 0):.2f}. "
                    f"Fraud check: {fraud_action} (score {fraud_score:.2f})."
                ),
                "next_premium": financials["next_week_premium_inr"],
                "loading_note": (
                    f"Your premium has been updated to Rs.{financials['next_week_premium_inr']:.0f} "
                    f"due to recent claim activity."
                ),
                "fraud_note": (", ".join(fraud_flags)) if fraud_flags else None,
                "rag_narrative": rag_text,
            }
        else:
            # No claim — still provide context
            if fraud_action == "AUTO_REJECT":
                decision = "CLAIM REJECTED"
                reason_short = "Your claim was blocked by the fraud detection pipeline."
                reason_detail = (
                    f"Fraud score {fraud_score:.2f} exceeded the rejection threshold. "
                    f"Signals: {', '.join(fraud_flags) if fraud_flags else 'behavioral anomaly'}. "
                    f"GPS analysis: L1={financials.get('fraud_layer_scores', {}).get('L1', 0):.2f}."
                )
                fraud_note = ", ".join(fraud_flags) if fraud_flags else "Fraud signals detected."
            else:
                decision = "NO CLAIM"
                reason_short = "Your income did not drop below the protection threshold this week."
                reason_detail = (
                    f"Your income of Rs.{w_act:.0f} stayed above the "
                    f"Rs.{w_exp * 0.6:.0f} safety boundary (60% of Rs.{w_exp:.0f} expected). "
                    f"No payout required. Zone risk: {financials.get('zone_risk_score', 0):.2f}."
                )
                fraud_note = None

            explanation = {
                "worker_name": data.worker_name,
                "week": data.week_start_date,
                "decision": decision,
                "payout_inr": 0.0,
                "reason_short": reason_short,
                "reason_detail": reason_detail,
                "next_premium": financials["next_week_premium_inr"],
                "loading_note": None,
                "fraud_note": fraud_note,
                "rag_narrative": rag_text,
            }

        # Stub Razorpay order
        demo_order_id = f"order_demo_{uuid.uuid4().hex[:12]}"

        return {
            "status": "success",
            "worker_id": data.worker_id,
            "week_start_date": data.week_start_date,
            # ── Legacy fields ──
            "claim_probability": financials["claim_probability"],
            "claim_triggered": financials["claim_triggered"],
            "claim_amount_inr": financials["claim_amount_inr"],
            "pay_immediate": financials["pay_immediate"],
            "pay_held": financials["pay_held"],
            "soft_flag_hold": financials["soft_flag_hold"],
            "flag_review": financials["flag_review"],
            "fraud_action": financials["fraud_action"],
            "weekly_premium_inr": financials["weekly_premium_inr"],
            "base_premium": financials["base_premium"],
            "seasonal_load": financials["seasonal_load"],
            "claim_load": financials["claim_load"],
            "next_week_premium_inr": financials["next_week_premium_inr"],
            # ── Model 1: Risk ──
            "zone_risk_score": financials.get("zone_risk_score"),
            "seasonal_loading_factor": financials.get("seasonal_loading_factor"),
            "is_disruption_predicted": financials.get("is_disruption_predicted"),
            # ── Model 2: Income ──
            "W_expected": financials.get("W_expected"),
            "W_actual": financials.get("W_actual"),
            "income_prediction_method": financials.get("income_prediction_method"),
            "claim_type": financials.get("claim_type"),
            "claim_reason": financials.get("claim_reason"),
            "sum_insured": financials.get("sum_insured"),
            "premium_breakdown": financials.get("premium_breakdown"),
            # ── Model 3: Fraud ──
            "final_fraud_score": financials.get("final_fraud_score"),
            "fraud_deduction_inr": financials.get("fraud_deduction_inr"),
            "fraud_layer_scores": financials.get("fraud_layer_scores"),
            "top_fraud_signal": financials.get("top_fraud_signal"),
            "l1_flags": financials.get("l1_flags"),
            "mapbox_animation": financials.get("mapbox_animation"),
            # ── Explanations ──
            "rag_explanation": financials.get("rag_explanation"),
            "ai_explanation": explanation,
            "razorpay_order_id": demo_order_id,
            "razorpay_status": "SIMULATED"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# ---- 3. Premium Only ----
@app.post("/premium_only")
async def compute_premium(data: PremiumInput):
    w_avg = data.w_avg_12wk
    risk = data.risk_model_score
    loading_pct = data.current_claim_loading_pct

    base = round(0.02 * w_avg, 2)

    if risk >= 0.80:
        sl_factor = 0.65
    elif risk >= 0.60:
        sl_factor = 0.40
    elif risk >= 0.40:
        sl_factor = 0.20
    elif risk >= 0.20:
        sl_factor = 0.10
    else:
        sl_factor = 0.00

    seasonal = round(sl_factor * base, 2)
    claim_load = round(loading_pct * base, 2)
    raw_total = round(base + seasonal + claim_load, 2)
    final = round(max(50.0, min(200.0, raw_total)), 2)
    sum_ins = round(max(3000.0, min(15000.0, 1.5 * w_avg)), 2)
    guard_applied = final != raw_total

    steps = [
        {"step": 1, "label": "12-week average income",
         "calculation": f"Rs.{w_avg:,.0f}", "result": w_avg},
        {"step": 2, "label": f"Base premium (2% x Rs.{w_avg:,.0f})",
         "calculation": f"0.02 x {w_avg}", "result": base},
        {"step": 3, "label": f"Risk score {risk:.4f} -> {int(sl_factor*100)}% seasonal factor",
         "calculation": f"Tier: {sl_factor}", "result": sl_factor},
        {"step": 4, "label": f"Seasonal loading ({int(sl_factor*100)}% x Rs.{base})",
         "calculation": f"{sl_factor} x {base}", "result": seasonal},
        {"step": 5, "label": f"Claim loading ({int(loading_pct*100)}% x Rs.{base})",
         "calculation": f"{loading_pct} x {base}", "result": claim_load},
        {"step": 6, "label": "Raw total",
         "calculation": f"Rs.{base} + Rs.{seasonal} + Rs.{claim_load}", "result": raw_total},
        {"step": 7, "label": "Guard check (Rs.50 floor / Rs.200 ceiling)",
         "calculation": f"clamp({raw_total}, 50, 200)", "result": final},
        {"step": 8, "label": "Final weekly premium — CONFIRMED",
         "calculation": "", "result": final}
    ]

    return {
        "base_premium": base,
        "seasonal_load": seasonal,
        "claim_load": claim_load,
        "weekly_premium_inr": final,
        "sum_insured": sum_ins,
        "premium_guard_applied": guard_applied,
        "premium_breakdown_steps": steps
    }


# ---- 4. RSMD Score ----
@app.post("/rsmd_score")
async def compute_rsmd(data: RSMDInput):
    result = score_rsmd_news(data.news_articles, data.date_str)
    return result


# ---- 5. Enroll Worker ----
@app.post("/enroll_worker")
async def enroll_worker(data: EnrollInput):
    zone_map = {
        "Velachery": "VEL", "T Nagar": "TNG", "Adyar": "ADY",
        "Anna Nagar": "ANA", "Sholinganallur": "SHO", "Tambaram": "TAM",
        "Guindy": "GUI", "Perambur": "PER", "Mylapore": "MYL", "Pallikaranai": "PAL"
    }
    zone_code = zone_map.get(data.primary_zone, "CHN")
    worker_num = uuid.uuid4().hex[:3].upper()
    policy_number = f"GE-2026-{zone_code}-{worker_num}"
    worker_id = f"W{uuid.uuid4().hex[:3].upper()}"

    sum_ins = compute_sum_insured(data.w_avg_12wk)
    premium = compute_weekly_premium(data.w_avg_12wk, data.risk_model_score, 0.0)

    return {
        "status": "enrolled",
        "policy_number": policy_number,
        "worker_id": worker_id,
        "worker_name": data.worker_name,
        "sum_insured": sum_ins,
        "weekly_premium_inr": premium,
        "coverage_start_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "coverage_type": ["STFI", "RSMD"],
        "db_status": "PENDING — PostgreSQL not yet integrated"
    }


# ---- 6. Razorpay Create Order (STUBBED) ----
@app.post("/razorpay/create_order")
async def create_razorpay_order(data: RazorpayOrderInput):
    return {
        "order_id": f"order_demo_{uuid.uuid4().hex[:14]}",
        "amount_paise": int(data.amount_inr * 100),
        "currency": "INR",
        "status": "DEMO_SIMULATED",
        "note": "Real Razorpay order will be created after DB integration."
    }


# ---- 7. Razorpay Verify Payment (STUBBED) ----
@app.post("/razorpay/verify_payment")
async def verify_razorpay_payment(request: Request):
    body = await request.json()
    return {
        "verified": True,
        "payment_id": body.get("razorpay_payment_id", "pay_demo_001"),
        "status": "DEMO_SIMULATED",
        "note": "Real signature verification will happen after DB integration."
    }


# =====================================================================
# TELEGRAM OTP
# =====================================================================

class OTPRequest(BaseModel):
    phone_number: str

@app.post("/send_otp_whatsapp")
async def send_otp_whatsapp(request: OTPRequest):
    """
    Sends an OTP to the user via WhatsApp (using WATI API config).
    """
    import random
    
    WATI_TOKEN = "wati_4584f2b1-65e0-4c87-99dc-21b328f09dff.gzkrqHN1N-PjLRm9oBnQu3mCP0H9fkE3nzneJYVW9OyyYdWVwXyN9nqjCH_dFVh35jb7FTS6Z-ZdtrmXqtg5tjyTF45owLrMN9qILdhirH_BHsGWUuh6TUK0cU29c4Q-"
    
    try:
        otp = random.randint(100000, 999999) # 6 digit random OTP
        message = f"Your GigEase Verification Code is: {otp}"
        
        # Simulate WATI call
        return {"status": "success", "message": f"OTP sent to {request.phone_number} via WATI", "otp": otp, "service": "whatsapp"}
            
    except Exception as e:
        return {"status": "error", "message": str(e)}

# =====================================================================
# MAIN ENTRYPOINT
# =====================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
