from fastapi import APIRouter, Depends
from app.services.weather_service import fetch_weather
from app.ml.risk_predictor import predict_risk
from app.ml.income_predictor import predict_income
from datetime import datetime, date

router = APIRouter(prefix="/api/realtime", tags=["realtime"])

@router.get("/premium/{zone_id}")
async def get_realtime_premium(zone_id: str, worker_id: str = None):
    """
    REAL-TIME mode: fetch live weather → run Risk ML → calculate premium.
    Called every time worker opens the dashboard.
    Returns premium for THIS WEEK based on TODAY's live conditions.
    """
    # Step 1: Fetch live weather for zone
    weather = await fetch_weather(zone_id)
    
    # Step 2: Run Risk ML model
    risk_output = predict_risk(
        zone_id=zone_id,
        week_date=date.today(),
        mode='realtime',
        live_weather=weather
    )
    
    # Step 3: Get worker income history if worker_id provided
    W_avg = 4200.0  # fallback
    if worker_id:
        income_output = predict_income(worker_id=worker_id, mode='realtime',
                                        zone_id=zone_id, week_date=date.today(),
                                        live_weather=weather)
        W_avg = income_output.get('W_avg_12wk', 4200.0)
    
    # Step 4: Calculate premium using the full formula
    zone_risk_score = risk_output.get('zone_risk_score', 0.5)
    premium_score = (
        min(1.0, weather.get('max_daily_rainfall_mm', 0) / 180) * 0.3 +
        (weather.get('humidity_avg_pct', 70) / 100) * 0.2 +
        zone_risk_score * 0.3 +
        (1.5 if weather.get('is_northeast_monsoon', 0) else 0.7) * 0.2
    )
    sum_insured = max(3000, min(15000, 1.5 * W_avg))
    P_base = (0.05 * sum_insured) / 4
    P_final = max(25, min(250, P_base * (1 + premium_score)))
    
    return {
        "mode": "REALTIME",
        "zone_id": zone_id,
        "date": str(date.today()),
        "weather_live": weather,
        "risk_score": zone_risk_score,
        "risk_level": "HIGH" if zone_risk_score > 0.65 else "MEDIUM" if zone_risk_score > 0.35 else "LOW",
        "seasonal_loading_factor": risk_output.get('seasonal_loading_factor', 0.1),
        "premium_score": round(premium_score, 4),
        "premium_components": {
            "weather_risk": round(min(1.0, weather.get('max_daily_rainfall_mm', 0)/180) * 0.3, 4),
            "humidity": round((weather.get('humidity_avg_pct', 70)/100) * 0.2, 4),
            "zone_risk": round(zone_risk_score * 0.3, 4),
            "season_factor": round((1.5 if weather.get('is_northeast_monsoon', 0) else 0.7) * 0.2, 4)
        },
        "weekly_premium_inr": round(P_final, 2),
        "sum_insured": round(sum_insured, 2),
        "shap_explanation": risk_output.get('top_shap_features', []),
        "llm_explanation": risk_output.get('shap_explanation', ''),
        "flood_alert_level": weather.get('flood_alert_level', 0),
        "ndma_alert_level": weather.get('ndma_alert_level', 0)
    }
