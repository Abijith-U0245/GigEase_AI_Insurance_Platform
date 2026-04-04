-- GigEase — PostgreSQL schema matching enriched CSV / SQLite layout
-- (T001_enriched … T008_enriched share the same columns; SQLite uses one table per file stem.)
--
-- Apply:
--   psql -U postgres -d gigease -v ON_ERROR_STOP=1 -f database/postgresql_schema.sql
--
-- Load all rows into the base table (from repo root):
--   psql ... -c "\copy gigease.enriched_worker_week FROM 'T001_enriched.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');"
--   (repeat for T002 … T008, or use a shell loop)

CREATE SCHEMA IF NOT EXISTS gigease;
SET search_path TO gigease, public;

CREATE TABLE IF NOT EXISTS enriched_worker_week (
  worker_id                      TEXT NOT NULL,
  worker_name                    TEXT,
  week_start_date                DATE NOT NULL,
  primary_zone                   TEXT,
  zone_flood_risk_score          DOUBLE PRECISION,
  zone_elevation_category        INTEGER,
  zone_drainage_quality          INTEGER,
  experience_months              INTEGER,
  week_number                    INTEGER,
  month                          INTEGER,
  is_northeast_monsoon_season    INTEGER,
  is_summer_heat_season          INTEGER,
  festival_week                  INTEGER,
  w_actual                       DOUBLE PRECISION,
  order_earnings                 DOUBLE PRECISION,
  daily_bonus_total              DOUBLE PRECISION,
  weekly_target_bonus            DOUBLE PRECISION,
  login_guarantee_received       DOUBLE PRECISION,
  orders_completed               INTEGER,
  active_days                    INTEGER,
  total_login_hours              DOUBLE PRECISION,
  peak_hour_login_days           INTEGER,
  order_rejection_rate           DOUBLE PRECISION,
  w_avg_4wk                      DOUBLE PRECISION,
  w_avg_12wk                     DOUBLE PRECISION,
  w_expected                     DOUBLE PRECISION,
  income_vs_peer_ratio           DOUBLE PRECISION,
  risk_model_score               DOUBLE PRECISION,
  seasonal_loading_factor        DOUBLE PRECISION,
  rainfall_mm                    DOUBLE PRECISION,
  max_daily_rainfall_mm          DOUBLE PRECISION,
  wind_speed_kmph                DOUBLE PRECISION,
  flood_alert_level              INTEGER,
  cyclone_warning_active         INTEGER,
  heatwave_declared              INTEGER,
  "AQI_avg"                      DOUBLE PRECISION,
  stfi_event_confirmed           INTEGER,
  stfi_event_severity            INTEGER,
  rsmd_news_score                DOUBLE PRECISION,
  rsmd_news_source_count         INTEGER,
  google_maps_congestion_index   DOUBLE PRECISION,
  ndma_emergency_alert_active    INTEGER,
  rsmd_event_confirmed           INTEGER,
  rsmd_event_type                TEXT,
  rsmd_event_severity            INTEGER,
  fraud_model_score              DOUBLE PRECISION,
  fraud_action                   TEXT,
  gps_spoofing_detected          INTEGER,
  behavioral_anomaly_flag        INTEGER,
  fraud_deduction_inr            DOUBLE PRECISION,
  policy_active                  INTEGER,
  sum_insured                    DOUBLE PRECISION,
  current_claim_loading_pct      DOUBLE PRECISION,
  claims_last_4wk                INTEGER,
  daily_zero_income_days         INTEGER,
  daily_event_active_days        INTEGER,
  daily_pre_event_rejection_spike DOUBLE PRECISION,
  daily_income_trajectory_slope  DOUBLE PRECISION,
  daily_max_rainfall             DOUBLE PRECISION,
  daily_max_congestion           DOUBLE PRECISION,
  daily_max_rsmd_news_score      DOUBLE PRECISION,
  daily_max_rsmd_source_count    DOUBLE PRECISION,
  daily_ndma_alert_any_day       INTEGER,
  daily_peak_hour_days           INTEGER,
  daily_avg_fraud_score          DOUBLE PRECISION,
  daily_income_mon               DOUBLE PRECISION,
  daily_income_tue               DOUBLE PRECISION,
  daily_income_wed               DOUBLE PRECISION,
  daily_income_thu               DOUBLE PRECISION,
  daily_income_fri               DOUBLE PRECISION,
  daily_income_sat               DOUBLE PRECISION,
  daily_income_sun               DOUBLE PRECISION,
  daily_claim_signal_days        INTEGER,
  weekly_premium_inr             DOUBLE PRECISION,
  claim_triggered                INTEGER,
  claim_type                     TEXT,
  claim_amount_inr               DOUBLE PRECISION,
  PRIMARY KEY (worker_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_enriched_worker_week_week
  ON enriched_worker_week (week_start_date);

-- Optional: SQLite-compatible names (one table per worker), backed by the same physical rows.
CREATE OR REPLACE VIEW "T001_enriched" AS
  SELECT * FROM enriched_worker_week WHERE worker_id = 'T001';
CREATE OR REPLACE VIEW "T002_enriched" AS
  SELECT * FROM enriched_worker_week WHERE worker_id = 'T002';
CREATE OR REPLACE VIEW "T003_enriched" AS
  SELECT * FROM enriched_worker_week WHERE worker_id = 'T003';
CREATE OR REPLACE VIEW "T004_enriched" AS
  SELECT * FROM enriched_worker_week WHERE worker_id = 'T004';
CREATE OR REPLACE VIEW "T005_enriched" AS
  SELECT * FROM enriched_worker_week WHERE worker_id = 'T005';
CREATE OR REPLACE VIEW "T006_enriched" AS
  SELECT * FROM enriched_worker_week WHERE worker_id = 'T006';
CREATE OR REPLACE VIEW "T007_enriched" AS
  SELECT * FROM enriched_worker_week WHERE worker_id = 'T007';
CREATE OR REPLACE VIEW "T008_enriched" AS
  SELECT * FROM enriched_worker_week WHERE worker_id = 'T008';
