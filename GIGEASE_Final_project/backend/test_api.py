import httpx
import json
import asyncio

async def run_tests():
    url = "http://localhost:8000"
    
    print("Testing /health")
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(f"{url}/health")
        print("Status", r.status_code)
        print("Response:", json.dumps(r.json(), indent=2))
        
    print("\n------------------------------\nTesting /predict_claim - W001 Flood Claim")
    w001_payload = {
      "worker_id": "W001", "worker_name": "Arun S",
      "week_start_date": "2024-11-04", "primary_zone": "Velachery",
      "zone_flood_risk_score": 0.82, "zone_elevation_category": 0,
      "zone_drainage_quality": 0, "experience_months": 24,
      "week_number": 44, "month": 11, "is_northeast_monsoon_season": 1,
      "is_summer_heat_season": 0, "festival_week": 0,
      "w_actual": 1600.0, "order_earnings": 1200.0,
      "daily_bonus_total": 300.0, "weekly_target_bonus": 100.0,
      "login_guarantee_received": 0.0, "orders_completed": 18,
      "active_days": 4, "total_login_hours": 32.0,
      "peak_hour_login_days": 3, "order_rejection_rate": 0.08,
      "w_avg_4wk": 5000.0, "w_avg_12wk": 5000.0,
      "w_expected": 4250.0, "income_vs_peer_ratio": 0.96,
      "risk_model_score": 0.9991, "seasonal_loading_factor": 0.65,
      "rainfall_mm": 187.0, "max_daily_rainfall_mm": 187.0,
      "wind_speed_kmph": 45.0, "flood_alert_level": 4,
      "cyclone_warning_active": 0, "heatwave_declared": 0, "AQI_avg": 85.0,
      "stfi_event_confirmed": 1, "stfi_event_severity": 4,
      "rsmd_news_score": 0.0, "rsmd_news_source_count": 0,
      "google_maps_congestion_index": 0.45, "ndma_emergency_alert_active": 0,
      "rsmd_event_confirmed": 0, "rsmd_event_type": "",
      "rsmd_event_severity": 0, "fraud_model_score": 0.12,
      "fraud_action": "AUTO_APPROVE", "gps_spoofing_detected": 0,
      "behavioral_anomaly_flag": 0, "fraud_deduction_inr": 0.0,
      "policy_active": 1, "sum_insured": 7500.0,
      "current_claim_loading_pct": 0.05, "claims_last_4wk": 0,
      "daily_zero_income_days": 4, "daily_event_active_days": 3,
      "daily_pre_event_rejection_spike": 0.0,
      "daily_income_trajectory_slope": -119.17,
      "daily_max_rainfall": 187.0, "daily_max_congestion": 0.625,
      "daily_max_rsmd_news_score": 0.048, "daily_max_rsmd_source_count": 0,
      "daily_ndma_alert_any_day": 0, "daily_peak_hour_days": 5,
      "daily_avg_fraud_score": 0.02,
      "daily_income_mon": 0.0, "daily_income_tue": 0.0,
      "daily_income_wed": 400.0, "daily_income_thu": 600.0,
      "daily_income_fri": 600.0, "daily_income_sat": 0.0,
      "daily_income_sun": 0.0, "daily_claim_signal_days": 3
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(f"{url}/predict_claim", json=w001_payload)
        print("Status", r.status_code)
        try:
           res = r.json()
           print(f"Claim Triggered: {res.get('claim_triggered')}")
           print(f"Claim Amount: {res.get('claim_amount_inr')}")
           print(f"Explanation: {res.get('ai_explanation', {}).get('reason_short')[:60]}...")
        except Exception as e:
           print("Error decoding:", e)
           print("Raw text:", r.text)
           
    print("\n------------------------------\nTesting /predict_claim - W099 Fraud Reject")
    w099_payload = w001_payload.copy()
    w099_payload["worker_id"] = "W099"
    w099_payload["w_actual"] = 800.0
    w099_payload["fraud_action"] = "AUTO_REJECT"
    w099_payload["gps_spoofing_detected"] = 1
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(f"{url}/predict_claim", json=w099_payload)
        print("Status", r.status_code)
        try:
           res = r.json()
           print(f"Claim Triggered: {res.get('claim_triggered')}")
           print(f"Claim Amount: {res.get('claim_amount_inr')}")
           print(f"Fraud Action: {res.get('fraud_action')}")
           print(f"Explanation: {res.get('ai_explanation', {}).get('reason_short')}")
        except Exception as e:
           print("Error:", e)

    print("\n------------------------------\nTesting /premium_only")
    premium_payload = {
        "w_avg_12wk": 5000.0,
        "risk_model_score": 0.9991,
        "current_claim_loading_pct": 0.05,
        "claims_last_4wk": 1
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.post(f"{url}/premium_only", json=premium_payload)
        print("Status", r.status_code)
        print("Weekly Premium:", r.json().get("weekly_premium_inr"))

if __name__ == "__main__":
    asyncio.run(run_tests())
