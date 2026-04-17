"""
GigEase ML Orchestrator — Unified 3-Model Pipeline
Replaces gigease_financial_model.py (legacy) with:
  Model 1: Risk Prediction   (XGBoost + Prophet ensemble)
  Model 2: Income Prediction (LightGBM tiered + claim trigger logic)
  Model 3: Fraud Detection   (L1 rules + L2 IsolationForest + L3 network + L4 DBSCAN)

Exposes the same predict_worker_week(row_dict) interface for backward compatibility.
"""

import os
import sys
import json
import warnings
import joblib
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

# ─── Path setup ────────────────────────────────────────────────────────────────
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_ML_DIR = os.path.join(_BACKEND_DIR, "MACHINE LEARNING MODEL")
_RISK_MODEL_DIR = os.path.join(_ML_DIR, "models", "risk")
_INCOME_MODEL_DIR = os.path.join(_ML_DIR, "models", "income")
_FRAUD_MODEL_DIR = os.path.join(_ML_DIR, "models", "fraud")

# Make sure ML module is importable
if _ML_DIR not in sys.path:
    sys.path.insert(0, _ML_DIR)

# ─── Lazy-loaded model cache ────────────────────────────────────────────────────
_risk_xgb_reg = None
_risk_xgb_clf = None
_risk_scaler = None
_risk_zone_le = None
_risk_prophet_models = {}

_income_lgbm = None
_income_explainer = None

_fraud_iso_forest = None
_fraud_meta_xgb = None

_rag_retriever = None   # unified premium/claim RAG


# ───────────────────────────────────────────────────────────────────────────────
# MODEL LOADERS
# ───────────────────────────────────────────────────────────────────────────────

def _load_risk_models():
    global _risk_xgb_reg, _risk_xgb_clf, _risk_scaler, _risk_zone_le, _risk_prophet_models
    if _risk_xgb_reg is not None:
        return
    try:
        _risk_xgb_reg = joblib.load(os.path.join(_RISK_MODEL_DIR, "xgb_risk_regressor.pkl"))
        _risk_xgb_clf = joblib.load(os.path.join(_RISK_MODEL_DIR, "xgb_risk_classifier.pkl"))
        _risk_scaler = joblib.load(os.path.join(_RISK_MODEL_DIR, "risk_scaler.pkl"))
        _risk_zone_le = joblib.load(os.path.join(_RISK_MODEL_DIR, "zone_le.pkl"))
        # Load prophet models if available
        from gigease_risk_model import ZONES
        for zone in ZONES:
            p = os.path.join(_RISK_MODEL_DIR, f"prophet_model_{zone}.pkl")
            if os.path.exists(p):
                try:
                    _risk_prophet_models[zone] = joblib.load(p)
                except Exception:
                    pass
        print("[ML Orch] Risk models loaded OK")
    except Exception as e:
        print(f"[ML Orch] Risk model load failed: {e}")
        _risk_xgb_reg = None


def _load_income_models():
    global _income_lgbm, _income_explainer
    if _income_lgbm is not None:
        return
    try:
        import shap
        _income_lgbm = joblib.load(os.path.join(_INCOME_MODEL_DIR, "income_lgbm_model.pkl"))
        _income_explainer = shap.TreeExplainer(_income_lgbm)
        print("[ML Orch] Income models loaded OK")
    except Exception as e:
        print(f"[ML Orch] Income model load failed: {e}")
        _income_lgbm = None


def _load_fraud_models():
    global _fraud_iso_forest, _fraud_meta_xgb
    if _fraud_iso_forest is not None:
        return
    try:
        _fraud_iso_forest = joblib.load(os.path.join(_FRAUD_MODEL_DIR, "isolation_forest_model.pkl"))
        _fraud_meta_xgb = joblib.load(os.path.join(_FRAUD_MODEL_DIR, "meta_fraud_xgb.pkl"))
        print("[ML Orch] Fraud models loaded OK")
    except Exception as e:
        print(f"[ML Orch] Fraud model load failed: {e}")
        _fraud_iso_forest = None


def _load_rag():
    global _rag_retriever
    if _rag_retriever is not None:
        return
    try:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        from langchain_community.vectorstores import Chroma
        db_path = os.path.join(_ML_DIR, "gigease_premium_claim_vectordb")
        if os.path.exists(db_path):
            emb = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
            _rag_retriever = Chroma(persist_directory=db_path,
                                    embedding_function=emb).as_retriever(search_kwargs={"k": 3})
            print("[ML Orch] RAG vectordb loaded OK")
    except Exception as e:
        print(f"[ML Orch] RAG load failed (non-fatal): {e}")
        _rag_retriever = None


def load_all_models():
    """Call once at app startup to warm all models."""
    _load_risk_models()
    _load_income_models()
    _load_fraud_models()
    _load_rag()


# ───────────────────────────────────────────────────────────────────────────────
# HELPER: ZONE NORMALISER
# ───────────────────────────────────────────────────────────────────────────────

_ZONE_ALIAS = {
    "velachery": "VELACHERY", "adyar": "ADYAR", "t nagar": "T_NAGAR",
    "t_nagar": "T_NAGAR", "sholinganallur": "SHOLINGANALLUR", "guindy": "GUINDY",
    "anna nagar": "ANNA_NAGAR", "anna_nagar": "ANNA_NAGAR", "tambaram": "TAMBARAM",
    "porur": "PORUR",
    # Fallbacks for zones not in ML training set
    "perambur": "VELACHERY", "mylapore": "ADYAR", "pallikaranai": "SHOLINGANALLUR",
}

def _normalise_zone(zone_raw: str) -> str:
    return _ZONE_ALIAS.get(str(zone_raw).lower().strip(), "VELACHERY")


# ───────────────────────────────────────────────────────────────────────────────
# MODEL 1: RISK SCORE
# ───────────────────────────────────────────────────────────────────────────────

_RISK_FEATURE_COLS = None   # resolved lazily from scaler

def _get_risk_score(row: dict) -> dict:
    """Returns zone_risk_score (0-1) and seasonal_loading_factor."""
    _load_risk_models()

    # Default / fallback
    default = {"zone_risk_score": 0.35, "seasonal_loading_factor": 0.10,
               "is_disruption_predicted": 0}

    if _risk_xgb_reg is None:
        # Fallback to formula using legacy field if models not available
        risk = float(row.get("risk_model_score") or row.get("zone_flood_risk_score") or 0.35)
        return {**default, "zone_risk_score": risk}

    try:
        zone_raw = row.get("primary_zone") or row.get("zone_id") or "VELACHERY"
        zone_id = _normalise_zone(zone_raw)

        # Build a minimal feature vector using available row fields
        month = int(row.get("month") or 6)
        is_ne = int(row.get("is_northeast_monsoon_season") or
                    row.get("is_northeast_monsoon") or (month in [10, 11, 12]))

        # Encode zone
        try:
            zone_enc = float(_risk_zone_le.transform([zone_id])[0])
        except Exception:
            zone_enc = 0.0

        rainfall = float(row.get("rainfall_mm") or row.get("max_daily_rainfall_mm") or 10)
        max_rainfall = float(row.get("max_daily_rainfall_mm") or rainfall)
        humidity = float(row.get("humidity_avg_pct", 70))
        temp = float(row.get("temp_avg_celsius", 30))
        wind = float(row.get("wind_speed_max_kmh") or row.get("wind_speed_kmph") or 15)
        flood_alert = float(row.get("flood_alert_level") or 0)
        ndma = float(row.get("ndma_emergency_alert_active") or 0)
        rsmd_news = float(row.get("rsmd_news_score") or 0)
        congestion = float(row.get("google_maps_congestion_index") or 0.3)
        aqi = float(row.get("AQI_avg") or row.get("aqi_avg") or 80)

        rainfall_int_ratio = max_rainfall / (rainfall + 1)
        humidity_heat = humidity * temp / 100
        weather_sev = (rainfall / 200 + humidity / 100 + wind / 80) / 3
        temp_hum_int = temp * humidity / 100

        # Use scaler's feature set if available
        global _RISK_FEATURE_COLS
        if _RISK_FEATURE_COLS is None and hasattr(_risk_scaler, "n_features_in_"):
            _RISK_FEATURE_COLS = _risk_scaler.feature_names_in_ if hasattr(
                _risk_scaler, "feature_names_in_") else None

        # Build feature dict
        feat_dict = {
            "zone_id_encoded": zone_enc,
            "month": month,
            "is_northeast_monsoon": is_ne,
            "is_northeast_monsoon_season": is_ne,
            "is_summer_season": int(month in [4, 5, 6]),
            "rainfall_mm": rainfall,
            "max_daily_rainfall_mm": max_rainfall,
            "humidity_avg_pct": humidity,
            "temp_avg_celsius": temp,
            "wind_speed_max_kmh": wind,
            "flood_alert_level": flood_alert,
            "ndma_alert_level": ndma,
            "rsmd_news_score": rsmd_news,
            "google_maps_congestion_index": congestion,
            "AQI_avg": aqi,
            "rainfall_intensity_ratio": rainfall_int_ratio,
            "humidity_heat_index": humidity_heat,
            "weather_severity_index": weather_sev,
            "temp_humidity_interaction": temp_hum_int,
            "wind_rainfall_compound": wind * rainfall / 1000,
            "zone_flood_risk_base": float(row.get("zone_flood_risk_score") or 0.5),
            "zone_drainage_score": float(row.get("zone_drainage_quality") or 0.5),
            "zone_elevation_m": float(row.get("zone_elevation_category") or 0),
            "ndma_emergency_alert_active": ndma,
            "stfi_event_severity_enc": float(row.get("stfi_event_severity") or 0),
            "rsmd_event_type_enc": 0.0,
        }

        # Reconstruct to match scaler input size (fill missing with 0)
        try:
            n_features = _risk_scaler.n_features_in_
            feat_arr = np.array([[feat_dict.get(k, 0.0) for k in
                                   (_risk_scaler.feature_names_in_
                                    if hasattr(_risk_scaler, "feature_names_in_")
                                    else list(feat_dict.keys())[:n_features])]])
        except Exception:
            feat_arr = np.array([[v for v in feat_dict.values()]])

        X_scaled = _risk_scaler.transform(feat_arr)
        xgb_score = float(_risk_xgb_reg.predict(X_scaled)[0])

        # Prophet ensemble
        prophet_score = xgb_score
        if zone_id in _risk_prophet_models:
            try:
                week_date = row.get("week_start_date", "2024-11-15")
                future = pd.DataFrame({"ds": [pd.Timestamp(week_date)]})
                fcst = _risk_prophet_models[zone_id].predict(future)
                prophet_score = float(fcst["yhat"].values[0])
            except Exception:
                pass

        final_score = float(np.clip(0.65 * xgb_score + 0.35 * prophet_score, 0, 1))

        # Loading factor
        loading_map = [(0.20, 0.00), (0.35, 0.10), (0.50, 0.20),
                       (0.65, 0.35), (0.80, 0.50), (1.01, 0.65)]
        loading = 0.65
        for thresh, load in loading_map:
            if final_score < thresh:
                loading = load
                break

        return {
            "zone_risk_score": round(final_score, 4),
            "seasonal_loading_factor": loading,
            "is_disruption_predicted": int(final_score >= 0.60),
        }

    except Exception as e:
        print(f"[ML Orch] Risk scoring error: {e}")
        return default


# ───────────────────────────────────────────────────────────────────────────────
# MODEL 2: INCOME PREDICTION + PREMIUM + CLAIM TRIGGER
# ───────────────────────────────────────────────────────────────────────────────

_INCOME_FEATURE_COLS = [
    "worker_tenure_weeks", "platform_encoded", "vehicle_type_encoded",
    "is_multiplatform", "experience_months",
    "w_income_w1", "w_income_w2", "w_income_w3", "w_income_w4",
    "w_income_w8", "w_income_w12", "w_avg_12wk", "income_stddev_12w",
    "income_trend_slope", "orders_completed", "total_login_hours",
    "order_rejection_rate", "festival_week", "festival_multiplier",
    "heatwave_declared", "platform_incentive_active",
    "same_week_last_year_income", "zone_avg_income_thisweek",
    "zone_risk_score_thisweek", "is_northeast_monsoon_season", "month",
    "income_volatility_ratio", "recent_trend_signal",
]

def _predict_income(row: dict, zone_risk_score: float) -> dict:
    """Returns W_expected, claim_trigger, and premium."""
    _load_income_models()

    w_avg = float(row.get("w_avg_12wk") or row.get("w_avg_4wk") or 4000)
    w_actual = float(row.get("w_actual") or 0)
    tenure = int(row.get("worker_tenure_weeks") or
                 int(float(row.get("experience_months") or 12) * 4))
    month = int(row.get("month") or 6)
    is_ne = int(row.get("is_northeast_monsoon_season") or (month in [10, 11, 12]))
    festival_mult = float(row.get("festival_multiplier") or 1.0)
    heatwave = int(row.get("heatwave_declared") or 0)
    incentive = int(row.get("platform_incentive_active") or 0)

    # ── Tiered prediction ──
    if tenure < 4:
        zone_avg = float(row.get("zone_avg_income_thisweek") or w_avg)
        W_expected = zone_avg
        method = "COLD_START"
    elif tenure < 12 or _income_lgbm is None:
        # WMA exponential decay
        hist = [w_avg] * 4
        weights = [0.9 ** i for i in range(len(hist))]
        wma = sum(w * h for w, h in zip(weights, hist)) / sum(weights)
        W_expected = wma * festival_mult * (0.85 if heatwave else 1.0) * (1.10 if incentive else 1.0)
        method = "WMA"
    else:
        try:
            hist_cols = ["w_income_w1", "w_income_w2", "w_income_w3", "w_income_w4",
                         "w_income_w8", "w_income_w12"]
            hist_vals = []
            for col in hist_cols:
                v = float(row.get(col) or w_avg)
                hist_vals.append(v)
            w_avg_12 = float(row.get("w_avg_12wk") or np.mean(hist_vals))
            stddev = float(row.get("income_stddev_12w") or np.std(hist_vals))
            trend = (hist_vals[0] - hist_vals[-1]) / max(1, len(hist_vals))

            feat_vals = {
                "worker_tenure_weeks": tenure,
                "platform_encoded": float({"Zomato": 0, "Swiggy": 1, "Zepto": 2}.get(
                    str(row.get("platform") or "Zomato"), 0)),
                "vehicle_type_encoded": float({"MOTORCYCLE": 0, "BICYCLE": 1, "FOOT": 2}.get(
                    str(row.get("vehicle_type") or "MOTORCYCLE"), 0)),
                "is_multiplatform": float(row.get("is_multiplatform") or 0),
                "experience_months": float(row.get("experience_months") or tenure // 4),
                "w_income_w1": hist_vals[0],
                "w_income_w2": hist_vals[1],
                "w_income_w3": hist_vals[2],
                "w_income_w4": hist_vals[3],
                "w_income_w8": hist_vals[4],
                "w_income_w12": hist_vals[5],
                "w_avg_12wk": w_avg_12,
                "income_stddev_12w": stddev,
                "income_trend_slope": trend,
                "orders_completed": float(row.get("orders_completed") or 50),
                "total_login_hours": float(row.get("total_login_hours") or 45),
                "order_rejection_rate": float(row.get("order_rejection_rate") or 0.05),
                "festival_week": float(row.get("festival_week") or 0),
                "festival_multiplier": festival_mult,
                "heatwave_declared": float(heatwave),
                "platform_incentive_active": float(incentive),
                "same_week_last_year_income": float(row.get("same_week_last_year_income") or w_avg_12),
                "zone_avg_income_thisweek": float(row.get("zone_avg_income_thisweek") or w_avg_12),
                "zone_risk_score_thisweek": zone_risk_score,
                "is_northeast_monsoon_season": float(is_ne),
                "month": float(month),
                "income_volatility_ratio": stddev / (w_avg_12 + 1),
                "recent_trend_signal": trend * 4,
            }

            X_arr = np.array([[feat_vals[c] for c in _INCOME_FEATURE_COLS]])
            base_pred = float(_income_lgbm.predict(X_arr)[0])
            W_expected = base_pred * festival_mult
            if heatwave:
                W_expected *= 0.85
            if incentive:
                W_expected *= 1.10
            method = "LightGBM"
        except Exception as e:
            print(f"[ML Orch] Income LightGBM error: {e}")
            W_expected = w_avg
            method = "WMA_FALLBACK"

    W_expected = max(0, W_expected)

    # ── Premium calculation (new formula from income model) ──
    sum_insured = float(max(3000, min(15000, 1.5 * w_avg)))
    P_base = (0.05 * sum_insured) / 4
    max_rainfall = float(row.get("max_daily_rainfall_mm") or row.get("rainfall_mm") or 10)
    humidity = float(row.get("humidity_avg_pct") or 70)
    claims_4wk = int(row.get("claims_last_4wk") or 0)

    weather_risk = min(1.0, max_rainfall / 180) * 0.3
    humidity_comp = (humidity / 100) * 0.2
    zone_comp = zone_risk_score * 0.3
    season_comp = (1.5 if is_ne else 0.7) * 0.2

    premium_score = weather_risk + humidity_comp + zone_comp + season_comp
    P_adjusted = P_base * (1 + premium_score)

    loading_map_claim = {0: 0.0, 1: 0.05, 2: 0.12, 3: 0.25}
    loading_pct = loading_map_claim.get(min(claims_4wk, 3), 0.25)
    P_final = float(max(25, min(250, P_adjusted * (1 + loading_pct))))

    premium_result = {
        "sum_insured": round(sum_insured, 2),
        "base_premium": round(P_base, 2),
        "premium_score": round(premium_score, 4),
        "weather_risk_component": round(weather_risk, 4),
        "humidity_component": round(humidity_comp, 4),
        "zone_risk_component": round(zone_comp, 4),
        "season_factor": round(season_comp, 4),
        "claim_loading_pct": loading_pct,
        "final_weekly_premium": round(P_final, 2),
    }

    # ── Claim trigger ──
    policy_active = int(row.get("policy_active") or 1)
    fraud_action = str(row.get("fraud_action") or "AUTO_APPROVE")
    stfi = int(row.get("stfi_event_confirmed") or 0)
    rsmd = int(row.get("rsmd_event_confirmed") or 0)
    fraud_deduction = float(row.get("fraud_deduction_inr") or 0)
    stfi_sev = int(row.get("stfi_event_severity") or 0)
    rsmd_sev = int(row.get("rsmd_event_severity") or 0)

    claim_triggered = 0
    claim_amount = 0.0
    claim_type = None
    claim_reason = "NO_EVENT_CONFIRMED"

    if not policy_active:
        claim_reason = "POLICY_INACTIVE"
    elif fraud_action == "AUTO_REJECT":
        claim_reason = "FRAUD_REJECTED"
    elif stfi or rsmd:
        threshold = 0.60 * W_expected
        if w_actual < threshold:
            # Beta (payout rate)
            if stfi:
                beta = 0.80 if stfi_sev >= 4 else (0.70 if stfi_sev >= 2 else 0.55)
                claim_type = "STFI"
            else:
                beta = 0.65 if rsmd_sev >= 3 else 0.50
                claim_type = "RSMD"

            loss = max(0, W_expected - w_actual)
            raw_payout = beta * loss
            after_fraud = max(0, raw_payout - fraud_deduction)
            claim_amount = min(after_fraud, sum_insured)
            claim_triggered = 1
            claim_reason = f"{claim_type}_TRIGGERED"
        else:
            claim_reason = f"INCOME_ABOVE_THRESHOLD (actual {w_actual:.0f} >= {threshold:.0f})"

    # Heatwave standalone claim
    heatwave_decl = int(row.get("heatwave_declared") or 0)
    if not claim_triggered and heatwave_decl and policy_active and fraud_action != "AUTO_REJECT":
        threshold = 0.60 * W_expected
        if w_actual < threshold:
            loss = max(0, W_expected - w_actual)
            raw_payout = 0.45 * loss
            after_fraud = max(0, raw_payout - fraud_deduction)
            claim_amount = min(after_fraud, sum_insured)
            claim_triggered = 1
            claim_type = "HEATWAVE"
            claim_reason = "HEATWAVE_TRIGGERED"

    # Fraud payout modifiers
    pay_immediate, pay_held, soft_flag_hold = claim_amount, 0.0, False
    if fraud_action == "SOFT_FLAG" and claim_triggered:
        pay_immediate = round(claim_amount * 0.50, 2)
        pay_held = round(claim_amount * 0.50, 2)
        soft_flag_hold = True
    elif fraud_action in ("HARD_FLAG", "AUTO_REJECT"):
        pay_immediate = 0.0
        pay_held = 0.0
        soft_flag_hold = False

    # next_week_premium (after claim loading)
    next_claims = claims_4wk + (1 if claim_triggered else 0)
    next_loading = loading_map_claim.get(min(next_claims, 3), 0.25)
    P_next = float(max(25, min(250, P_adjusted * (1 + next_loading))))

    return {
        "W_expected": round(W_expected, 2),
        "W_actual": round(w_actual, 2),
        "prediction_method": method,
        "claim_triggered": claim_triggered,
        "claim_type": claim_type,
        "claim_reason": claim_reason,
        "claim_amount_inr": round(claim_amount, 2),
        "pay_immediate": round(pay_immediate, 2),
        "pay_held": round(pay_held, 2),
        "soft_flag_hold": soft_flag_hold,
        "flag_review": False,
        "weekly_premium_inr": round(P_final, 2),
        "base_premium": round(P_base, 2),
        "seasonal_load": round(zone_comp * P_base + season_comp * P_base, 2),
        "claim_load": round(loading_pct * P_base, 2),
        "next_week_premium_inr": round(P_next, 2),
        "sum_insured": round(sum_insured, 2),
        "premium_breakdown": premium_result,
    }


# ───────────────────────────────────────────────────────────────────────────────
# MODEL 3: FRAUD DETECTION
# ───────────────────────────────────────────────────────────────────────────────

_L2_FEATURES = [
    "orders_ratio_event_vs_normal", "income_ratio_event_vs_normal",
    "login_ratio_event_vs_normal", "order_acceptance_rate_event",
    "income_vs_peer_ratio_event", "pre_event_rejection_spike",
    "rejection_spike_magnitude", "claim_frequency_90d",
    "earnings_drop_pct", "login_hours_event_day", "days_since_last_claim",
]

def _predict_fraud(row: dict) -> dict:
    _load_fraud_models()

    default_result = {
        "final_fraud_score": 0.05,
        "fraud_action": str(row.get("fraud_action") or "AUTO_APPROVE"),
        "fraud_deduction_inr": float(row.get("fraud_deduction_inr") or 0),
        "layer_scores": {"L1": 0.0, "L2": 0.0, "L3": 0.0, "L4": 0.0},
        "top_fraud_signal": "NONE",
        "l1_flags": [],
        "mapbox_animation": None,
    }

    if _fraud_iso_forest is None:
        # Use existing fraud_action from row
        fs = float(row.get("fraud_model_score") or 0.05)
        fa = str(row.get("fraud_action") or "AUTO_APPROVE")
        default_result["final_fraud_score"] = fs
        default_result["fraud_action"] = fa
        return default_result

    try:
        from gigease_fraud_model import compute_l1_hardware_score, compute_l3_network_score
        row_series = pd.Series(row)

        # L1
        l1, l1_flags, anim_color, anim_label = compute_l1_hardware_score(row_series)

        # L2 — behavioral
        l2_feats = {c: float(row.get(c) or 0) for c in _L2_FEATURES}
        l2_df = pd.DataFrame([l2_feats])
        raw_score = _fraud_iso_forest.score_samples(l2_df)[0]
        l2 = float(np.clip((-raw_score - 0.3) / 0.7, 0, 1))

        # L3 — network
        l3, _ = compute_l3_network_score(row_series)

        # L4 — placeholder (DBSCAN requires full population)
        l4 = float(row.get("l4_syndicate_score") or 0.0)

        # Ensemble
        raw_final = 0.40 * l1 + 0.30 * l2 + 0.15 * l3 + 0.15 * l4
        if l1 > 0.85 or l2 > 0.90:
            raw_final = max(raw_final, 0.75)
        f_score = float(np.clip(raw_final, 0, 1))

        # Action
        if f_score < 0.30:
            action = "AUTO_APPROVE"
        elif f_score < 0.50:
            action = "SOFT_FLAG"
        elif f_score < 0.70:
            action = "HARD_FLAG"
        else:
            action = "AUTO_REJECT"

        # GPS deduction
        gps_dist = float(row.get("gps_total_distance_km") or 10)
        ct_dist = float(row.get("cell_tower_estimated_distance_km") or gps_dist)
        ratio = gps_dist / (ct_dist + 0.1)
        fraud_deduction = max(0, (gps_dist - ct_dist) * 4.5) if ratio > 1.5 else 0.0

        # Mapbox data (simple representation without actual GPS logs)
        mapbox = {
            "worker_id": str(row.get("worker_id") or "UNKNOWN"),
            "fraud_score": round(f_score, 4),
            "overall_color": "red" if f_score > 0.7 else ("amber" if f_score > 0.3 else "green"),
            "fraud_flags": l1_flags,
            "animation_frames": [],  # Real-time frames added when GPS logs available
        }

        top_signal = l1_flags[0] if (l1_flags and l1 >= l2) else ("BEHAVIORAL_ANOMALY" if l2 > l3 else "NONE")

        return {
            "final_fraud_score": round(f_score, 4),
            "fraud_action": action,
            "fraud_deduction_inr": round(fraud_deduction, 2),
            "layer_scores": {
                "L1": round(l1, 4), "L2": round(l2, 4),
                "L3": round(l3, 4), "L4": round(l4, 4),
            },
            "top_fraud_signal": top_signal,
            "l1_flags": l1_flags,
            "mapbox_animation": mapbox,
        }

    except Exception as e:
        print(f"[ML Orch] Fraud scoring error: {e}")
        return default_result


# ───────────────────────────────────────────────────────────────────────────────
# RAG EXPLANATION
# ───────────────────────────────────────────────────────────────────────────────

def _get_rag_explanation(income_result: dict, risk_result: dict,
                          fraud_result: dict, row: dict) -> str:
    _load_rag()
    zone = str(row.get("primary_zone") or row.get("zone_id") or "UNKNOWN")
    w_exp = income_result.get("W_expected", 0)
    w_act = income_result.get("W_actual", 0)
    premium = income_result.get("weekly_premium_inr", 0)
    zone_risk = risk_result.get("zone_risk_score", 0)
    triggered = income_result.get("claim_triggered", 0)

    if _rag_retriever is None:
        status = "CLAIM TRIGGERED" if triggered else "No claim"
        return (
            f"Worker in {zone}: Expected Rs.{w_exp:.0f}, Earned Rs.{w_act:.0f} ({status}). "
            f"Zone risk: {zone_risk:.2f}. Weekly premium: Rs.{premium:.0f}. "
            f"Fraud score: {fraud_result.get('final_fraud_score', 0):.2f} → {fraud_result.get('fraud_action')}."
        )

    try:
        query = (f"{'claim triggered' if triggered else 'no claim'} zone {zone} "
                 f"income {w_exp:.0f} risk {zone_risk:.2f} premium {premium:.0f}")
        docs = _rag_retriever.invoke(query)
        context = " | ".join(d.page_content[:120] for d in docs[:2])
        status = "CLAIM TRIGGERED" if triggered else "No claim this week"
        return (
            f"[{zone}] {status}. Actual Rs.{w_act:.0f} vs Expected Rs.{w_exp:.0f}. "
            f"Zone risk score: {zone_risk:.2f}. Weekly premium: Rs.{premium:.0f}. "
            f"Fraud: {fraud_result.get('fraud_action')} (score {fraud_result.get('final_fraud_score',0):.2f}). "
            f"Policy context: {context}"
        )
    except Exception as e:
        return f"Explanation unavailable: {e}"


# ───────────────────────────────────────────────────────────────────────────────
# CLAIM PROBABILITY (unified score feeding the legacy field)
# ───────────────────────────────────────────────────────────────────────────────

def _compute_claim_probability(income_result: dict, risk_result: dict,
                                fraud_result: dict, row: dict) -> float:
    """Synthetic 0-1 claim probability for backward-compat with frontend."""
    w_exp = income_result.get("W_expected", 1)
    w_act = income_result.get("W_actual", w_exp)
    zone_risk = risk_result.get("zone_risk_score", 0.35)
    fraud_score = fraud_result.get("final_fraud_score", 0.05)

    if w_exp > 0:
        income_drop_ratio = max(0, (w_exp - w_act) / w_exp)
    else:
        income_drop_ratio = 0.0

    stfi = int(row.get("stfi_event_confirmed") or 0)
    rsmd = int(row.get("rsmd_event_confirmed") or 0)
    event_flag = 1.0 if (stfi or rsmd) else 0.0

    raw = (0.40 * income_drop_ratio +
           0.25 * zone_risk +
           0.20 * event_flag +
           0.15 * (1 - fraud_score))

    return round(float(np.clip(raw, 0.0, 1.0)), 4)


# ───────────────────────────────────────────────────────────────────────────────
# PUBLIC API — predict_worker_week()
# ───────────────────────────────────────────────────────────────────────────────

def predict_worker_week(row_dict: dict) -> dict:
    """
    Unified 3-model prediction pipeline. Backward-compatible with legacy
    gigease_financial_model.predict_worker_week() output schema.
    """
    row = dict(row_dict)

    # ── Step 1: Risk Model ──
    risk_result = _get_risk_score(row)

    # ── Step 2: Income + Premium + Claim Trigger ──
    income_result = _predict_income(row, risk_result["zone_risk_score"])

    # ── Step 3: Fraud Detection ──
    # Inject the fraud result back so income model retries fraud_action
    fraud_result = _predict_fraud(row)
    # Re-apply fraud action to claim if model gives stricter verdict
    ml_fraud_action = fraud_result["fraud_action"]
    existing_fa = str(row.get("fraud_action") or "AUTO_APPROVE")

    action_severity = {"AUTO_APPROVE": 0, "SOFT_FLAG": 1, "HARD_FLAG": 2, "AUTO_REJECT": 3}
    if action_severity.get(ml_fraud_action, 0) > action_severity.get(existing_fa, 0):
        # More severe — re-run income with updated fraud action
        row["fraud_action"] = ml_fraud_action
        row["fraud_deduction_inr"] = fraud_result["fraud_deduction_inr"]
        income_result = _predict_income(row, risk_result["zone_risk_score"])

    # Update fraud_action in income_result
    income_result["fraud_action"] = ml_fraud_action

    # ── Step 4: Claim probability (synthetic, for frontend gauge) ──
    claim_probability = _compute_claim_probability(income_result, risk_result, fraud_result, row)

    # ── Step 5: RAG Explanation ──
    rag_explanation = _get_rag_explanation(income_result, risk_result, fraud_result, row)

    # ── Compose final output (legacy-compatible + new fields) ──
    return {
        # ── Legacy fields (backward compat with all existing endpoints) ──
        "claim_probability": claim_probability,
        "claim_triggered": income_result["claim_triggered"],
        "claim_amount_inr": income_result["claim_amount_inr"],
        "pay_immediate": income_result["pay_immediate"],
        "pay_held": income_result["pay_held"],
        "soft_flag_hold": income_result["soft_flag_hold"],
        "flag_review": income_result["flag_review"],
        "fraud_action": ml_fraud_action,
        "weekly_premium_inr": income_result["weekly_premium_inr"],
        "base_premium": income_result["base_premium"],
        "seasonal_load": income_result["seasonal_load"],
        "claim_load": income_result["claim_load"],
        "next_week_premium_inr": income_result["next_week_premium_inr"],

        # ── New Model 1: Risk fields ──
        "zone_risk_score": risk_result["zone_risk_score"],
        "seasonal_loading_factor": risk_result["seasonal_loading_factor"],
        "is_disruption_predicted": risk_result["is_disruption_predicted"],

        # ── New Model 2: Income fields ──
        "W_expected": income_result["W_expected"],
        "W_actual": income_result["W_actual"],
        "income_prediction_method": income_result["prediction_method"],
        "claim_type": income_result.get("claim_type"),
        "claim_reason": income_result.get("claim_reason"),
        "sum_insured": income_result["sum_insured"],
        "premium_breakdown": income_result["premium_breakdown"],

        # ── New Model 3: Fraud fields ──
        "final_fraud_score": fraud_result["final_fraud_score"],
        "fraud_deduction_inr": fraud_result["fraud_deduction_inr"],
        "fraud_layer_scores": fraud_result["layer_scores"],
        "top_fraud_signal": fraud_result["top_fraud_signal"],
        "l1_flags": fraud_result["l1_flags"],
        "mapbox_animation": fraud_result["mapbox_animation"],

        # ── RAG Explanation ──
        "rag_explanation": rag_explanation,
    }


# ───────────────────────────────────────────────────────────────────────────────
# Legacy compatibility shims
# ───────────────────────────────────────────────────────────────────────────────

def compute_sum_insured(w_avg_12wk: float) -> float:
    return round(max(3000.0, min(15000.0, 1.5 * w_avg_12wk)), 2)


def compute_weekly_premium(w_avg_12wk: float, risk_model_score: float,
                            current_claim_loading_pct: float) -> float:
    base = 0.02 * w_avg_12wk
    if risk_model_score >= 0.80: sl = 0.65
    elif risk_model_score >= 0.60: sl = 0.40
    elif risk_model_score >= 0.40: sl = 0.20
    elif risk_model_score >= 0.20: sl = 0.10
    else: sl = 0.00
    result = base + sl * base + current_claim_loading_pct * base
    return round(max(50.0, min(200.0, result)), 2)
