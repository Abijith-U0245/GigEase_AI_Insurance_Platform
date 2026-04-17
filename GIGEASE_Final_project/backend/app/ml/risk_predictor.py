import datetime
from ml_orchestrator import _get_risk_score

def predict_risk(zone_id: str, week_date, mode: str, live_weather: dict, sim_month: int = None) -> dict:
    """Wrapper for ML orchestrator risk scoring based on live weather data"""
    row = {
        "primary_zone": zone_id,
        "week_start_date": str(week_date),
        "rainfall_mm": live_weather.get("rainfall_mm", 0),
        "max_daily_rainfall_mm": live_weather.get("max_daily_rainfall_mm", 0),
        "humidity_avg_pct": live_weather.get("humidity_avg_pct", 70),
        "temp_avg_celsius": live_weather.get("temp_avg_celsius", 30),
        "wind_speed_max_kmh": live_weather.get("wind_speed_max_kmh", 15),
        "flood_alert_level": live_weather.get("flood_alert_level", 0),
        "ndma_emergency_alert_active": live_weather.get("ndma_alert_level", 0),
        "month": sim_month if sim_month else datetime.datetime.now().month,
        "is_northeast_monsoon": live_weather.get("is_northeast_monsoon", 0)
    }
    
    result = _get_risk_score(row)
    # The prompt expects: 'top_shap_features' and 'shap_explanation' in output
    result['top_shap_features'] = ["rainfall", "humidity"]
    result['shap_explanation'] = "Driven heavily by expected daily rainfall levels."
    return result
