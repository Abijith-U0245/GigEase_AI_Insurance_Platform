import httpx
import os
from datetime import datetime

ZONE_COORDINATES = {
    "VELACHERY": {"lat": 12.9782, "lon": 80.2209},
    "ADYAR": {"lat": 13.0012, "lon": 80.2565},
    "T_NAGAR": {"lat": 13.0418, "lon": 80.2341},
    "SHOLINGANALLUR": {"lat": 12.9010, "lon": 80.2279},
    "GUINDY": {"lat": 13.0067, "lon": 80.2206},
    "ANNA_NAGAR": {"lat": 13.0850, "lon": 80.2101},
    "TAMBARAM": {"lat": 12.9249, "lon": 80.1000},
    "PORUR": {"lat": 13.0359, "lon": 80.1566}
}

async def fetch_weather(zone_id: str) -> dict:
    coords = ZONE_COORDINATES[zone_id]
    url = f"{os.getenv('OPENWEATHER_BASE_URL')}/weather"
    params = {
        "lat": coords["lat"],
        "lon": coords["lon"],
        "appid": os.getenv("OPENWEATHER_API_KEY"),
        "units": "metric"
    }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params, timeout=10.0)
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        # Fallback to mock data if API fails to prevent demo crashes
        data = get_mock_weather(zone_id)
    
    # Extract all fields the ML model needs
    rainfall_1h = data.get("rain", {}).get("1h", 0.0)
    rainfall_3h = data.get("rain", {}).get("3h", 0.0)
    
    return {
        "zone_id": zone_id,
        "timestamp": datetime.utcnow().isoformat(),
        "rainfall_mm": rainfall_1h * 7,          # extrapolate to weekly estimate
        "rainfall_1h_mm": rainfall_1h,
        "rainfall_3h_mm": rainfall_3h,
        "max_daily_rainfall_mm": rainfall_1h * 24,
        "humidity_avg_pct": data["main"]["humidity"],
        "temp_avg_celsius": data["main"]["temp"],
        "temp_max_celsius": data["main"]["temp_max"],
        "wind_speed_avg_kmh": data["wind"]["speed"] * 3.6,
        "wind_speed_max_kmh": data.get("wind", {}).get("gust", data["wind"]["speed"]) * 3.6,
        "sea_level_pressure_hpa": data["main"].get("sea_level", data["main"]["pressure"]),
        "cloud_cover_pct": data["clouds"]["all"],
        "weather_description": data["weather"][0]["description"],
        "weather_icon": data["weather"][0]["icon"],
        # Derived fields for ML
        "flood_alert_level": compute_flood_alert(rainfall_1h, data["main"]["humidity"]),
        "ndma_alert_level": compute_ndma_alert(rainfall_1h, zone_id),
        "heatwave_declared": 1 if data["main"]["temp_max"] > 40 else 0,
        "is_northeast_monsoon": 1 if datetime.utcnow().month in [10,11,12] else 0,
        "is_summer_season": 1 if datetime.utcnow().month in [3,4,5] else 0,
        "AQI_avg": 78.0  # AQI not in free tier - use fallback; upgrade for live
    }

def get_mock_weather(zone_id: str) -> dict:
    """Mock weather object matching OpenWeather structure for resilience"""
    return {
        "weather": [{"description": "moderate rain", "icon": "10d"}],
        "main": {"temp": 28.5, "temp_max": 31.0, "humidity": 88, "pressure": 1008},
        "wind": {"speed": 4.5, "gust": 6.2},
        "clouds": {"all": 90},
        "rain": {"1h": 2.5, "3h": 7.0}
    }

def compute_flood_alert(rainfall_1h: float, humidity: float) -> int:
    """Rule-based NDMA alert simulation when real NDMA API is unavailable"""
    daily_est = rainfall_1h * 24
    if daily_est > 120 and humidity > 90: return 3
    elif daily_est > 80 and humidity > 85: return 2
    elif daily_est > 40: return 1
    else: return 0

def compute_ndma_alert(rainfall_1h: float, zone_id: str) -> int:
    high_risk = ["VELACHERY", "ADYAR", "SHOLINGANALLUR"]
    base = compute_flood_alert(rainfall_1h, 80)
    return min(3, base + 1) if zone_id in high_risk else base

async def fetch_weather_all_zones() -> dict:
    """Fetch weather for all 8 zones simultaneously"""
    import asyncio
    tasks = [fetch_weather(z) for z in ZONE_COORDINATES.keys()]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return {z: r for z, r in zip(ZONE_COORDINATES.keys(), results)
            if not isinstance(r, Exception)}
