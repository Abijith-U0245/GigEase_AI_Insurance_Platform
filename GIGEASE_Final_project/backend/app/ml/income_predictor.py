import datetime
from ml_orchestrator import _predict_income

def predict_income(worker_id: str, mode: str, zone_id: str, week_date=None, live_weather: dict = None) -> dict:
    """Wrapper for ML orchestrator income prediction"""
    if live_weather is None:
        live_weather = {}
        
    row = {
        "worker_id": worker_id,
        "primary_zone": zone_id,
        "w_avg_12wk": 4200.0,
        "worker_tenure_weeks": 24,
        "experience_months": 6,
        "max_daily_rainfall_mm": live_weather.get("max_daily_rainfall_mm", 0),
        "humidity_avg_pct": live_weather.get("humidity_avg_pct", 70),
        "heatwave_declared": live_weather.get("heatwave_declared", 0),
        "is_northeast_monsoon_season": live_weather.get("is_northeast_monsoon", 0)
    }
    
    # We pass a default risk score for the income calculation
    result = _predict_income(row, zone_risk_score=0.45)
    return result
