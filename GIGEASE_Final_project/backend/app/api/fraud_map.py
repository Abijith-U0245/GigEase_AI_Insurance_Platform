"""
GPS Fraud Map API — standalone (no ORM).
Provides animated GPS path data for Mapbox rendering on the admin panel.
"""
from fastapi import APIRouter
import random
import math
from app.services.weather_service import ZONE_COORDINATES

router = APIRouter(prefix="/api/fraud-map", tags=["fraud-map"])

# ─── Pre-baked GPS route data per zone ───────────────────────────
ZONE_ROUTE_PATHS = {
    "VELACHERY": [
        {"lat": 12.9782, "lon": 80.2209, "timestamp": 0},
        {"lat": 12.9801, "lon": 80.2245, "timestamp": 120},
        {"lat": 12.9823, "lon": 80.2189, "timestamp": 240},
        {"lat": 12.9756, "lon": 80.2167, "timestamp": 360},
        {"lat": 12.9712, "lon": 80.2198, "timestamp": 480},
        {"lat": 12.9745, "lon": 80.2234, "timestamp": 600},
        {"lat": 12.9782, "lon": 80.2209, "timestamp": 720},
    ],
    "T_NAGAR": [
        {"lat": 13.0418, "lon": 80.2341, "timestamp": 0},
        {"lat": 13.0445, "lon": 80.2378, "timestamp": 90},
        {"lat": 13.0412, "lon": 80.2412, "timestamp": 180},
        {"lat": 13.0389, "lon": 80.2389, "timestamp": 270},
        {"lat": 13.0418, "lon": 80.2341, "timestamp": 360},
    ],
    "ADYAR": [
        {"lat": 13.0012, "lon": 80.2565, "timestamp": 0},
        {"lat": 13.0030, "lon": 80.2580, "timestamp": 120},
        {"lat": 13.0010, "lon": 80.2600, "timestamp": 240},
    ],
}

# Fraud-flagged teleporting route
FRAUD_ROUTE_PATH = {
    "VELACHERY": [
        {"lat": 12.9782, "lon": 80.2209, "timestamp": 0,   "speed_kmh": 0,     "note": ""},
        {"lat": 12.9782, "lon": 80.2209, "timestamp": 60,  "speed_kmh": 0,     "note": "STATIONARY_BUT_GPS_CLAIMS_MOVED"},
        {"lat": 13.0600, "lon": 80.2800, "timestamp": 120, "speed_kmh": 485.2, "note": "GPS_JUMP_DETECTED"},
        {"lat": 13.0600, "lon": 80.2800, "timestamp": 180, "speed_kmh": 0,     "note": "STATIONARY_BUT_GPS_CLAIMS_MOVED"},
        {"lat": 12.9782, "lon": 80.2209, "timestamp": 240, "speed_kmh": 485.2, "note": "TELEPORT_BACK"},
    ]
}

# Demo worker list (no DB)
DEMO_WORKERS = [
    {"worker_id": "W001", "worker_name": "Arun S",    "zone": "VELACHERY", "fraud_score": 0.12, "fraud_action": "AUTO_APPROVE"},
    {"worker_id": "W002", "worker_name": "Priya M",   "zone": "VELACHERY", "fraud_score": 0.85, "fraud_action": "AUTO_REJECT"},
    {"worker_id": "W003", "worker_name": "Karthik R",  "zone": "ADYAR",    "fraud_score": 0.45, "fraud_action": "SOFT_FLAG"},
    {"worker_id": "W004", "worker_name": "Deepa L",   "zone": "T_NAGAR",  "fraud_score": 0.08, "fraud_action": "AUTO_APPROVE"},
    {"worker_id": "W005", "worker_name": "Suresh K",  "zone": "VELACHERY", "fraud_score": 0.72, "fraud_action": "SOFT_FLAG"},
]


def _haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


@router.get("/active-workers")
async def get_active_workers():
    offset = 0.003
    result = []
    for w in DEMO_WORKERS:
        coords = ZONE_COORDINATES.get(w["zone"], {"lat": 12.978, "lon": 80.22})
        result.append({
            "worker_id": w["worker_id"],
            "worker_name": w["worker_name"],
            "zone_id": w["zone"],
            "lat": coords["lat"] + random.uniform(-offset, offset),
            "lon": coords["lon"] + random.uniform(-offset, offset),
            "fraud_score": w["fraud_score"],
            "dot_color": "red" if w["fraud_score"] > 0.70 else "amber" if w["fraud_score"] > 0.30 else "green",
            "fraud_action": w["fraud_action"],
            "is_active": True,
        })
    return {"workers": result, "total": len(result)}


@router.get("/worker-path/{worker_id}")
async def get_worker_gps_path(worker_id: str, fraud_demo: bool = False):
    worker = next((w for w in DEMO_WORKERS if w["worker_id"] == worker_id), None)
    if not worker:
        return {"error": "worker not found"}

    zone_id = worker["zone"]
    if fraud_demo:
        path = FRAUD_ROUTE_PATH.get(zone_id, FRAUD_ROUTE_PATH["VELACHERY"])
    else:
        path = ZONE_ROUTE_PATHS.get(zone_id, ZONE_ROUTE_PATHS["VELACHERY"])

    processed_path = []
    for i, point in enumerate(path):
        p = dict(point)
        if i > 0:
            prev = path[i - 1]
            dist = _haversine_km(prev["lat"], prev["lon"], p["lat"], p["lon"])
            time_diff = (p["timestamp"] - prev["timestamp"]) / 3600
            speed = dist / time_diff if time_diff > 0 else 0
            p["computed_speed_kmh"] = round(speed, 1)
            p["dist_from_prev_km"] = round(dist, 3)
            p["is_speed_violation"] = speed > 80
            p["is_jump"] = dist > 2.0
        else:
            p["computed_speed_kmh"] = 0
            p["is_speed_violation"] = False
            p["is_jump"] = False
            p["dist_from_prev_km"] = 0.0
        processed_path.append(p)

    fraud_score = worker["fraud_score"]
    return {
        "worker_id": worker_id,
        "zone_id": zone_id,
        "path": processed_path,
        "animation_duration_ms": path[-1]["timestamp"] * 1000 if path else 10000,
        "fraud_score": fraud_score,
        "fraud_action": worker["fraud_action"],
        "overall_color": "red" if fraud_score > 0.7 else "green",
        "fraud_flags": ["GPS_JUMP_DETECTED", "TELEPORT_BACK"] if fraud_demo else [],
        "l1_score": round(fraud_score * 0.8, 2),
        "l2_score": round(fraud_score * 0.6, 2),
    }
