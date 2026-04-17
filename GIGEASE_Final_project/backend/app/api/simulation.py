from fastapi import APIRouter
from app.ml.risk_predictor import predict_risk

router = APIRouter(prefix="/api/simulation", tags=["simulation"])

HISTORICAL_ZONE_MONTH_AVG = {
    "VELACHERY": {
        1: {"rainfall_mm": 28.4, "humidity_avg_pct": 75, "temp_avg_celsius": 26.8, "wind_speed_avg_kmh": 14.2, "flood_alert_level": 0},
        2: {"rainfall_mm": 12.1, "humidity_avg_pct": 70, "temp_avg_celsius": 27.9, "wind_speed_avg_kmh": 13.8, "flood_alert_level": 0},
        3: {"rainfall_mm": 8.4,  "humidity_avg_pct": 65, "temp_avg_celsius": 30.2, "wind_speed_avg_kmh": 16.1, "flood_alert_level": 0},
        4: {"rainfall_mm": 14.2, "humidity_avg_pct": 68, "temp_avg_celsius": 33.1, "wind_speed_avg_kmh": 17.4, "flood_alert_level": 0},
        5: {"rainfall_mm": 35.6, "humidity_avg_pct": 72, "temp_avg_celsius": 35.8, "wind_speed_avg_kmh": 19.2, "flood_alert_level": 0},
        6: {"rainfall_mm": 52.4, "humidity_avg_pct": 78, "temp_avg_celsius": 32.4, "wind_speed_avg_kmh": 22.1, "flood_alert_level": 0},
        7: {"rainfall_mm": 84.2, "humidity_avg_pct": 82, "temp_avg_celsius": 30.8, "wind_speed_avg_kmh": 24.3, "flood_alert_level": 1},
        8: {"rainfall_mm": 112.3,"humidity_avg_pct": 84, "temp_avg_celsius": 30.1, "wind_speed_avg_kmh": 26.8, "flood_alert_level": 1},
        9: {"rainfall_mm": 124.6,"humidity_avg_pct": 86, "temp_avg_celsius": 29.4, "wind_speed_avg_kmh": 28.4, "flood_alert_level": 1},
        10:{"rainfall_mm": 218.4,"humidity_avg_pct": 91, "temp_avg_celsius": 27.8, "wind_speed_avg_kmh": 34.2, "flood_alert_level": 2},
        11:{"rainfall_mm": 312.8,"humidity_avg_pct": 94, "temp_avg_celsius": 26.4, "wind_speed_avg_kmh": 38.6, "flood_alert_level": 3},
        12:{"rainfall_mm": 184.2,"humidity_avg_pct": 89, "temp_avg_celsius": 25.8, "wind_speed_avg_kmh": 31.4, "flood_alert_level": 2},
    }
}

# Auto-fill other zones based on Velachery data with slight offsets for simplicity
_modifier = {"ADYAR": 1.1, "T_NAGAR": 0.9, "SHOLINGANALLUR": 1.2, "GUINDY": 0.95, "ANNA_NAGAR": 0.7, "TAMBARAM": 0.8, "PORUR": 0.6}
for _zone, _mod in _modifier.items():
    HISTORICAL_ZONE_MONTH_AVG[_zone] = {}
    for m in range(1, 13):
        HISTORICAL_ZONE_MONTH_AVG[_zone][m] = {
            "rainfall_mm": HISTORICAL_ZONE_MONTH_AVG["VELACHERY"][m]["rainfall_mm"] * _mod,
            "humidity_avg_pct": HISTORICAL_ZONE_MONTH_AVG["VELACHERY"][m]["humidity_avg_pct"],
            "temp_avg_celsius": HISTORICAL_ZONE_MONTH_AVG["VELACHERY"][m]["temp_avg_celsius"],
            "wind_speed_avg_kmh": HISTORICAL_ZONE_MONTH_AVG["VELACHERY"][m]["wind_speed_avg_kmh"],
            "flood_alert_level": max(0, HISTORICAL_ZONE_MONTH_AVG["VELACHERY"][m]["flood_alert_level"] - (1 if _mod < 0.8 else 0))
        }

@router.get("/premium/{zone_id}/{month}")
async def get_simulation_premium(zone_id: str, month: int, worker_id: str = None):
    hist = HISTORICAL_ZONE_MONTH_AVG.get(zone_id, HISTORICAL_ZONE_MONTH_AVG["VELACHERY"])[month]
    
    # Add derived fields
    hist['max_daily_rainfall_mm'] = hist['rainfall_mm'] / 7 * 1.6
    hist['is_northeast_monsoon'] = 1 if month in [10,11,12] else 0
    hist['is_summer_season'] = 1 if month in [3,4,5] else 0
    hist['ndma_alert_level'] = hist['flood_alert_level']
    hist['heatwave_declared'] = 1 if month in [4,5] and zone_id not in ['VELACHERY','ADYAR'] else 0
    
    from datetime import date
    sim_date = date(2026, month, 15)
    risk_output = predict_risk(
        zone_id=zone_id,
        week_date=sim_date,
        mode='simulation',
        live_weather=hist,
        sim_month=month
    )
    
    zone_risk_score = risk_output.get('zone_risk_score', 0.5)
    premium_score = (
        min(1.0, hist['max_daily_rainfall_mm'] / 180) * 0.3 +
        (hist['humidity_avg_pct'] / 100) * 0.2 +
        zone_risk_score * 0.3 +
        (1.5 if hist['is_northeast_monsoon'] else 0.7) * 0.2
    )
    W_avg = 4200.0
    sum_insured = max(3000, min(15000, 1.5 * W_avg))
    P_base = (0.05 * sum_insured) / 4
    P_final = max(25, min(250, P_base * (1 + premium_score)))
    
    month_names = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    season = "Northeast Monsoon 🌧️" if month in [10,11,12] else \
             "Southwest Monsoon 🌦️" if month in [6,7,8,9] else \
             "Summer ☀️" if month in [3,4,5] else "Winter 🌤️"
             
    return {
        "mode": "SIMULATION",
        "zone_id": zone_id,
        "month": month,
        "month_name": month_names[month],
        "season": season,
        "historical_weather": hist,
        "risk_score": zone_risk_score,
        "risk_level": "HIGH" if zone_risk_score > 0.65 else "MEDIUM" if zone_risk_score > 0.35 else "LOW",
        "premium_score": round(premium_score, 4),
        "premium_components": {
            "weather_risk": round(min(1.0, hist['max_daily_rainfall_mm']/180) * 0.3, 4),
            "humidity": round((hist['humidity_avg_pct']/100) * 0.2, 4),
            "zone_risk": round(zone_risk_score * 0.3, 4),
            "season_factor": round((1.5 if hist['is_northeast_monsoon'] else 0.7) * 0.2, 4)
        },
        "weekly_premium_inr": round(P_final, 2),
        "comparison_note": f"In {month_names[month]}, {zone_id} premium is ₹{P_final:.0f}/week vs summer average ₹{max(25, min(250, P_base*(1+0.28))):.0f}/week",
        "shap_explanation": risk_output.get('top_shap_features', []),
        "llm_explanation": risk_output.get('shap_explanation', '')
    }

@router.get("/compare/{zone_id}")
async def compare_all_months(zone_id: str):
    results = []
    for month in range(1, 13):
        r = await get_simulation_premium(zone_id, month)
        results.append({
            "month": r["month_name"],
            "premium": r["weekly_premium_inr"],
            "risk_score": r["risk_score"],
            "season": r["season"]
        })
    return {"zone_id": zone_id, "monthly_premiums": results}
