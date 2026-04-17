"""
GigEase Risk Prediction Model — Model 1 of 3
XGBoost (65%) + Facebook Prophet (35%) Weighted Ensemble
Predicts zone_risk_score (0-1) per zone per week for premium calculation.

Premium Score = Weather_Risk*0.3 + Humidity*0.2 + Zone_Risk*0.3 + Season*0.2
"""

import os
import json
import warnings
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
import shap
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (mean_squared_error, mean_absolute_error, r2_score,
                             roc_auc_score, precision_score, recall_score,
                             f1_score, confusion_matrix)
from scipy.stats import ks_2samp

warnings.filterwarnings('ignore')
os.environ['HUGGINGFACEHUB_API_TOKEN'] = os.environ.get('HF_TOKEN', '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')

# ============================================================
# SECTION 1 — CONFIGURATION
# ============================================================
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models', 'risk')
os.makedirs(MODEL_DIR, exist_ok=True)

ZONES = ['VELACHERY', 'ADYAR', 'T_NAGAR', 'SHOLINGANALLUR', 'GUINDY',
         'ANNA_NAGAR', 'TAMBARAM', 'PORUR']

DROP_COLS = ['row_id', 'zone_name', 'state', 'city', 'week_end_date',
             'data_source', 'disruption_type_actual']

TARGET_REG = 'zone_risk_score'
TARGET_CLF = 'is_disruption_week'

LOADING_MAP = [(0.20, 0.00), (0.35, 0.10), (0.50, 0.20),
               (0.65, 0.35), (0.80, 0.50), (1.01, 0.65)]

def compute_loading_factor(risk_score):
    for threshold, loading in LOADING_MAP:
        if risk_score < threshold:
            return loading
    return 0.65


# ============================================================
# SECTION 2 — DATA LOADING AND VALIDATION
# ============================================================
def load_and_validate():
    print("[1/13] Loading dataset...")
    df = pd.read_csv(os.path.join(os.path.dirname(__file__),
                                   'gigease_risk_model_training.csv'))
    print(f"  Shape: {df.shape}")
    assert df.shape[0] >= 5000, f"Need >= 5000 rows, got {df.shape[0]}"
    assert 0 <= df[TARGET_REG].min() and df[TARGET_REG].max() <= 1, \
        "zone_risk_score out of [0,1]"
    assert set(df[TARGET_CLF].unique()) == {0, 1}, \
        "is_disruption_week must have both 0 and 1"
    print(f"  Columns: {len(df.columns)}")
    print(f"  First 3 rows:\n{df.head(3).to_string()}")
    return df


# ============================================================
# SECTION 3 — FEATURE ENGINEERING
# ============================================================
def engineer_features(df):
    print("[2/13] Feature engineering...")

    # Encode zone_id
    zone_le = LabelEncoder()
    df['zone_id_encoded'] = zone_le.fit_transform(df['zone_id'])
    joblib.dump(zone_le, os.path.join(MODEL_DIR, 'zone_le.pkl'))

    # Encode severity columns
    sev_map = {'NONE': 0, 'MILD': 1, 'MODERATE': 2, 'SEVERE': 3, 'EXTREME': 4}
    if 'stfi_event_severity' in df.columns:
        df['stfi_event_severity_enc'] = df['stfi_event_severity'].map(sev_map).fillna(0).astype(int)
    rsmd_map = {'NONE': 0, 'BANDH': 1, 'RIOT': 2, 'CURFEW': 3, 'STRIKE': 4}
    if 'rsmd_event_type' in df.columns:
        df['rsmd_event_type_enc'] = df['rsmd_event_type'].map(rsmd_map).fillna(0).astype(int)

    # Engineered features
    df['rainfall_intensity_ratio'] = df['max_daily_rainfall_mm'] / (df['rainfall_mm'] + 1)
    df['humidity_heat_index'] = df['humidity_avg_pct'] * df['temp_avg_celsius'] / 100
    df['wind_rainfall_compound'] = df['wind_speed_max_kmh'] * df.get('rainfall_7d_rolling_mm',
                                    df['rainfall_mm']) / 1000
    if 'zone_drainage_score' in df.columns and 'zone_flood_risk_base' in df.columns:
        df['drainage_flood_interaction'] = (1 - df['zone_drainage_score']) * df['zone_flood_risk_base']

    # Premium score formula
    is_ne = df.get('is_northeast_monsoon', df.get('is_northeast_monsoon_season',
              pd.Series(np.zeros(len(df)))))
    is_sum = df.get('is_summer_season', pd.Series(np.zeros(len(df))))
    season_raw = np.where(is_ne == 1, 1.5, np.where(is_sum == 1, 0.4, 0.7))
    df['premium_score_formula'] = (
        np.minimum(1.0, df['max_daily_rainfall_mm'] / 180) * 0.3 +
        (df['humidity_avg_pct'] / 100) * 0.2 +
        df.get('zone_flood_risk_base', df.get('zone_risk_score', 0.5)) * 0.3 +
        season_raw * 0.2
    )

    # Drop non-feature columns
    to_drop = [c for c in DROP_COLS if c in df.columns]
    # Also drop raw string columns already encoded
    to_drop += [c for c in ['zone_id', 'stfi_event_severity', 'rsmd_event_type',
                             'rsmd_event_severity'] if c in df.columns]
    df.drop(columns=to_drop, inplace=True, errors='ignore')

    # Forward fill missing per zone, then zone mean
    for col in df.select_dtypes(include=[np.number]).columns:
        if df[col].isna().any():
            df[col] = df.groupby('zone_id_encoded')[col].transform(
                lambda s: s.fillna(method='ffill', limit=3).fillna(s.mean())
            )
    df.fillna(0, inplace=True)

    # Identify feature columns (exclude targets and date)
    exclude = {TARGET_REG, TARGET_CLF, 'seasonal_loading_factor',
               'week_start_date', 'year'}
    feature_cols = [c for c in df.columns if c not in exclude
                    and df[c].dtype in [np.float64, np.int64, np.float32, np.int32]]

    # Scale
    scaler = StandardScaler()
    df[feature_cols] = scaler.fit_transform(df[feature_cols])
    joblib.dump(scaler, os.path.join(MODEL_DIR, 'risk_scaler.pkl'))

    print(f"  Features: {len(feature_cols)}")
    return df, feature_cols


# ============================================================
# SECTION 4 — TRAIN-TEST SPLIT (CHRONOLOGICAL)
# ============================================================
def split_data(df, feature_cols):
    print("[3/13] Chronological train/val/test split...")
    df['week_start_date'] = pd.to_datetime(df['week_start_date'])
    df.sort_values('week_start_date', inplace=True)

    train = df[df['year'] <= 2022]
    val   = df[df['year'] == 2023]
    test  = df[df['year'] >= 2024]

    X_train, y_train_r = train[feature_cols], train[TARGET_REG]
    X_val,   y_val_r   = val[feature_cols],   val[TARGET_REG]
    X_test,  y_test_r  = test[feature_cols],  test[TARGET_REG]

    y_train_c = train[TARGET_CLF]
    y_val_c   = val[TARGET_CLF]
    y_test_c  = test[TARGET_CLF]

    print(f"  Train: {len(train)} | Val: {len(val)} | Test: {len(test)}")
    return (X_train, y_train_r, y_train_c,
            X_val, y_val_r, y_val_c,
            X_test, y_test_r, y_test_c, train, val, test)


# ============================================================
# SECTION 5 — XGBOOST TRAINING
# ============================================================
def train_xgboost(X_train, y_train_r, y_train_c,
                  X_val, y_val_r, y_val_c):
    print("[4/13] Training XGBoost Regressor...")
    reg = xgb.XGBRegressor(
        n_estimators=800, max_depth=6, learning_rate=0.05,
        subsample=0.80, colsample_bytree=0.80,
        reg_alpha=0.1, reg_lambda=1.0, min_child_weight=5,
        random_state=42, n_jobs=-1, verbosity=0
    )
    reg.fit(X_train, y_train_r,
            eval_set=[(X_val, y_val_r)],
            verbose=100)
    try:
        print(f"  Best iteration: {reg.best_iteration}")
    except AttributeError:
        print(f"  Training complete (no early stopping triggered).")
    joblib.dump(reg, os.path.join(MODEL_DIR, 'xgb_risk_regressor.pkl'))

    print("[5/13] Training XGBoost Classifier...")
    n_normal = (y_train_c == 0).sum()
    n_disrupt = max(1, (y_train_c == 1).sum())
    clf = xgb.XGBClassifier(
        n_estimators=800, max_depth=6, learning_rate=0.05,
        subsample=0.80, colsample_bytree=0.80,
        reg_alpha=0.1, reg_lambda=1.0, min_child_weight=5,
        scale_pos_weight=n_normal / n_disrupt,
        random_state=42, n_jobs=-1, verbosity=0,
        eval_metric='auc'
    )
    clf.fit(X_train, y_train_c,
            eval_set=[(X_val, y_val_c)],
            verbose=100)
    joblib.dump(clf, os.path.join(MODEL_DIR, 'xgb_risk_classifier.pkl'))

    # Platt scaling calibration
    print("[6/13] Platt scaling calibration...")
    raw_preds = reg.predict(X_val)
    platt = LogisticRegression()
    platt.fit(raw_preds.reshape(-1, 1), y_val_c)
    joblib.dump(platt, os.path.join(MODEL_DIR, 'risk_platt_calibrator.pkl'))

    return reg, clf, platt


# ============================================================
# SECTION 6 — PROPHET SEASONAL MODELS
# ============================================================
def train_prophet_models(df_raw):
    print("[7/13] Training Prophet models for 8 zones...")
    try:
        from prophet import Prophet
    except ImportError:
        print("  WARNING: prophet not installed, skipping Prophet training.")
        return {}

    prophet_models = {}
    zone_le = joblib.load(os.path.join(MODEL_DIR, 'zone_le.pkl'))
    raw = pd.read_csv(os.path.join(os.path.dirname(__file__),
                                    'gigease_risk_model_training.csv'))

    for zone in ZONES:
        zone_data = raw[raw['zone_id'] == zone][['week_start_date', 'zone_risk_score']].copy()
        zone_data.columns = ['ds', 'y']
        zone_data['ds'] = pd.to_datetime(zone_data['ds'])
        zone_data = zone_data.sort_values('ds').reset_index(drop=True)

        if len(zone_data) < 52:
            print(f"  Skipping {zone}: only {len(zone_data)} rows")
            continue

        m = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=False,
            daily_seasonality=False,
            seasonality_mode='multiplicative',
            changepoint_prior_scale=0.05,
            holidays_prior_scale=10.0
        )
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            m.fit(zone_data)

        prophet_models[zone] = m
        joblib.dump(m, os.path.join(MODEL_DIR, f'prophet_model_{zone}.pkl'))
        print(f"  Trained Prophet for {zone} ({len(zone_data)} rows)")

    return prophet_models


# ============================================================
# SECTION 7 — ENSEMBLE
# ============================================================
def ensemble_predict(xgb_reg, prophet_models, X, zone_ids_encoded, dates,
                     zone_le, feature_cols):
    print("[8/13] Computing ensemble predictions...")
    xgb_preds = xgb_reg.predict(X)

    prophet_preds = np.full(len(X), np.nan)
    try:
        zone_names = zone_le.inverse_transform(zone_ids_encoded)
    except Exception:
        zone_names = ['VELACHERY'] * len(X)

    for i, (zname, dt) in enumerate(zip(zone_names, dates)):
        if zname in prophet_models:
            future = pd.DataFrame({'ds': [pd.Timestamp(dt)]})
            try:
                fcst = prophet_models[zname].predict(future)
                prophet_preds[i] = fcst['yhat'].values[0]
            except Exception:
                prophet_preds[i] = xgb_preds[i]
        else:
            prophet_preds[i] = xgb_preds[i]

    # Fill any remaining NaN with xgb
    prophet_preds = np.where(np.isnan(prophet_preds), xgb_preds, prophet_preds)

    final = np.clip(0.65 * xgb_preds + 0.35 * prophet_preds, 0, 1)
    return final, xgb_preds, prophet_preds


# ============================================================
# SECTION 8 — EVALUATION
# ============================================================
def evaluate(y_true_reg, y_pred_reg, y_true_clf, y_pred_clf_prob):
    print("[9/13] Evaluation metrics...")
    rmse = np.sqrt(mean_squared_error(y_true_reg, y_pred_reg))
    mae = mean_absolute_error(y_true_reg, y_pred_reg)
    r2 = r2_score(y_true_reg, y_pred_reg)
    print(f"  Regression: RMSE={rmse:.4f}  MAE={mae:.4f}  R2={r2:.4f}")
    if rmse > 0.12:
        print("  WARNING: RMSE > 0.12 — consider reducing min_child_weight or increasing n_estimators")

    y_pred_clf = (y_pred_clf_prob >= 0.60).astype(int)
    try:
        auc = roc_auc_score(y_true_clf, y_pred_clf_prob)
    except ValueError:
        auc = 0.0
    prec = precision_score(y_true_clf, y_pred_clf, zero_division=0)
    rec = recall_score(y_true_clf, y_pred_clf, zero_division=0)
    f1 = f1_score(y_true_clf, y_pred_clf, zero_division=0)
    cm = confusion_matrix(y_true_clf, y_pred_clf)
    print(f"  Classifier: AUC={auc:.4f}  Prec={prec:.4f}  Rec={rec:.4f}  F1={f1:.4f}")
    print(f"  Confusion Matrix:\n{cm}")
    if auc < 0.80:
        print("  WARNING: AUC < 0.80 — model underfitting")

    return {'rmse': rmse, 'mae': mae, 'r2': r2, 'auc': auc,
            'precision': prec, 'recall': rec, 'f1': f1}


# ============================================================
# SECTION 9 — SHAP EXPLAINABILITY
# ============================================================
def compute_shap(reg, X_test, feature_cols):
    print("[10/13] Computing SHAP values...")
    try:
        # Use generic Explainer to avoid XGBoost version incompatibility
        explainer = shap.Explainer(reg, X_test[:100])
        shap_values = explainer(X_test).values
    except Exception:
        try:
            explainer = shap.TreeExplainer(reg)
            shap_values = explainer.shap_values(X_test)
        except Exception as e:
            print(f"  SHAP failed: {e}. Using zero values.")
            explainer = None
            shap_values = np.zeros((len(X_test), X_test.shape[1]))

    try:
        shap.summary_plot(shap_values, X_test, feature_names=feature_cols,
                          show=False)
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        plt.savefig(os.path.join(MODEL_DIR, 'shap_risk_summary.png'),
                    bbox_inches='tight', dpi=150)
        plt.close()
        print("  Saved shap_risk_summary.png")
    except Exception as e:
        print(f"  Could not save SHAP plot: {e}")

    return explainer, shap_values


def get_top_shap_features(shap_row, feature_names, top_n=3):
    pairs = sorted(zip(feature_names, shap_row), key=lambda x: -abs(x[1]))
    return [(pairs[i][0], round(float(pairs[i][1]), 4)) for i in range(min(top_n, len(pairs)))]


# ============================================================
# SECTION 10 — RAG SETUP
# ============================================================
def setup_rag():
    print("[11/13] Setting up RAG pipeline...")
    try:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        from langchain_community.vectorstores import Chroma
        from langchain_text_splitters import RecursiveCharacterTextSplitter

        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

        base = os.path.dirname(__file__)
        docs_text = []
        for fname in ['gigease_zone_profiles.txt', 'gigease_policy_rules.txt',
                       'gigease_historical_events.txt']:
            fpath = os.path.join(base, fname)
            if os.path.exists(fpath):
                with open(fpath, 'r', encoding='utf-8') as f:
                    docs_text.append(f.read())

        if not docs_text:
            print("  WARNING: No RAG docs found, skipping RAG")
            return None, None

        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = []
        for doc in docs_text:
            chunks.extend(splitter.split_text(doc))

        db_path = os.path.join(base, 'gigease_risk_vectordb')
        vectordb = Chroma.from_texts(chunks, embeddings, persist_directory=db_path)
        retriever = vectordb.as_retriever(search_kwargs={"k": 3})
        print(f"  RAG vector store created with {len(chunks)} chunks")
        return retriever, embeddings

    except Exception as e:
        print(f"  RAG setup failed: {e}")
        return None, None


def generate_risk_explanation(retriever, zone_id, week_date, risk_score,
                               top_features, loading_factor, language='en'):
    if retriever is None:
        return f"Zone {zone_id} risk score {risk_score:.2f}. Loading factor {loading_factor:.0%}."

    try:
        feat_str = ', '.join([f"{f}: {v:+.3f}" for f, v in top_features])
        query = f"Chennai {zone_id} flood risk month rainfall {feat_str}"
        docs = retriever.invoke(query)
        context = '\n'.join([d.page_content for d in docs[:3]])

        direction = 'higher' if risk_score > 0.5 else 'lower'
        explanation = (
            f"Zone {zone_id} has a risk score of {risk_score:.2f} this week. "
            f"The premium loading is {loading_factor:.0%}. "
            f"Top risk drivers: {feat_str}. "
            f"Based on historical data: {context[:200]}..."
        )
        return explanation
    except Exception as e:
        return f"Zone {zone_id} risk: {risk_score:.2f}. Error generating explanation: {e}"


# ============================================================
# SECTION 11 — PREDICTION FUNCTION
# ============================================================
def predict_risk(xgb_reg, prophet_models, scaler, zone_le, feature_cols,
                 explainer, retriever,
                 zone_id, week_date, mode='realtime',
                 live_weather=None, sim_month=None):
    """
    mode='realtime': uses live_weather dict
    mode='simulation': uses historical averages for zone/month
    """
    raw_df = pd.read_csv(os.path.join(os.path.dirname(__file__),
                                       'gigease_risk_model_training.csv'))

    if mode == 'simulation' and sim_month is not None:
        hist = raw_df[(raw_df['zone_id'] == zone_id) &
                      (raw_df['month'] == sim_month)]
        live_weather = hist.mean(numeric_only=True).to_dict()

    if live_weather is None:
        live_weather = {}

    # Build feature vector from the last known row for this zone
    zone_rows = raw_df[raw_df['zone_id'] == zone_id].sort_values('week_start_date')
    if len(zone_rows) == 0:
        return {'error': f'Zone {zone_id} not found'}

    template = zone_rows.iloc[-1].copy()
    # Override with live weather
    for k, v in live_weather.items():
        if k in template.index:
            template[k] = v

    # Re-engineer features on this single row
    template_df = pd.DataFrame([template])
    template_df['zone_id_encoded'] = zone_le.transform([zone_id])[0]

    # Add engineered features
    template_df['rainfall_intensity_ratio'] = (
        template_df['max_daily_rainfall_mm'] / (template_df['rainfall_mm'] + 1))
    template_df['humidity_heat_index'] = (
        template_df['humidity_avg_pct'] * template_df['temp_avg_celsius'] / 100)

    # Select feature columns that exist
    available = [c for c in feature_cols if c in template_df.columns]
    missing = [c for c in feature_cols if c not in template_df.columns]
    for c in missing:
        template_df[c] = 0

    X = template_df[feature_cols].values.astype(float)
    X_scaled = scaler.transform(X)

    xgb_score = float(xgb_reg.predict(X_scaled)[0])

    # Prophet
    prophet_score = xgb_score
    if zone_id in prophet_models:
        try:
            future = pd.DataFrame({'ds': [pd.Timestamp(week_date)]})
            fcst = prophet_models[zone_id].predict(future)
            prophet_score = float(fcst['yhat'].values[0])
        except Exception:
            pass

    final_score = float(np.clip(0.65 * xgb_score + 0.35 * prophet_score, 0, 1))

    # Premium score
    rainfall_max = live_weather.get('max_daily_rainfall_mm',
                                     template.get('max_daily_rainfall_mm', 10))
    humidity = live_weather.get('humidity_avg_pct',
                                template.get('humidity_avg_pct', 70))
    is_ne = live_weather.get('is_northeast_monsoon',
                              template.get('is_northeast_monsoon', 0))
    premium_score = (
        min(1.0, rainfall_max / 180) * 0.3 +
        (humidity / 100) * 0.2 +
        final_score * 0.3 +
        (1.5 if is_ne else 0.7) * 0.2 / 1.5
    )

    # SHAP
    try:
        sv = explainer.shap_values(X_scaled)[0]
        top_features = get_top_shap_features(sv, feature_cols)
    except Exception:
        top_features = [('zone_risk_score', 0.0)]

    loading = compute_loading_factor(final_score)
    explanation = generate_risk_explanation(
        retriever, zone_id, week_date, final_score, top_features, loading)

    return {
        'zone_id': zone_id,
        'week_date': str(week_date),
        'mode': mode,
        'zone_risk_score': round(final_score, 4),
        'seasonal_loading_factor': loading,
        'premium_score_component': round(float(premium_score), 4),
        'is_disruption_predicted': int(final_score >= 0.60),
        'xgb_component': round(xgb_score, 4),
        'prophet_component': round(prophet_score, 4),
        'top_shap_features': top_features,
        'shap_explanation': explanation,
        'confidence': 'HIGH' if abs(final_score - 0.5) > 0.3 else 'MEDIUM'
    }


# ============================================================
# SECTION 12 — DRIFT DETECTION
# ============================================================
def check_model_drift(training_df, new_data_df):
    print("[12/13] Checking for distribution drift...")
    drift_features = ['rainfall_mm', 'humidity_avg_pct', 'temp_avg_celsius',
                      'wind_speed_max_kmh']
    for feature in drift_features:
        if feature in training_df.columns and feature in new_data_df.columns:
            stat, p = ks_2samp(training_df[feature].dropna(),
                                new_data_df[feature].dropna())
            status = "DRIFT WARNING" if p < 0.05 else "OK"
            print(f"  {feature}: KS stat={stat:.4f}, p={p:.4f} [{status}]")


# ============================================================
# SECTION 13 — MAIN
# ============================================================
def main():
    print("=" * 60)
    print("GigEase Risk Prediction Model — Training Pipeline")
    print("=" * 60)

    # 1. Load
    df = load_and_validate()
    raw_df = df.copy()

    # 2. Engineer
    df, feature_cols = engineer_features(df)

    # 3. Split
    (X_train, y_train_r, y_train_c,
     X_val, y_val_r, y_val_c,
     X_test, y_test_r, y_test_c,
     train_df, val_df, test_df) = split_data(df, feature_cols)

    # 4. Train XGBoost
    reg, clf, platt = train_xgboost(
        X_train, y_train_r, y_train_c,
        X_val, y_val_r, y_val_c)

    # 5. Train Prophet
    prophet_models = train_prophet_models(raw_df)

    # 6. Ensemble predictions on test
    zone_le = joblib.load(os.path.join(MODEL_DIR, 'zone_le.pkl'))
    scaler = joblib.load(os.path.join(MODEL_DIR, 'risk_scaler.pkl'))

    zone_ids_enc = test_df['zone_id_encoded'].values if 'zone_id_encoded' in test_df.columns \
        else np.zeros(len(X_test))
    dates = test_df['week_start_date'].values if 'week_start_date' in test_df.columns \
        else pd.date_range('2024-01-01', periods=len(X_test), freq='W')

    final_preds, xgb_preds, prophet_preds = ensemble_predict(
        reg, prophet_models, X_test, zone_ids_enc, dates, zone_le, feature_cols)

    # 7. Evaluate
    y_pred_clf_prob = final_preds  # use risk score as disruption probability
    metrics = evaluate(y_test_r, final_preds, y_test_c, y_pred_clf_prob)

    # 8. SHAP
    explainer, shap_values = compute_shap(reg, X_test, feature_cols)

    # 9. RAG
    retriever, embeddings = setup_rag()

    # 10. Drift check
    check_model_drift(
        raw_df[raw_df['year'] <= 2022],
        raw_df[raw_df['year'] >= 2024]
    )

    # 11. Sample prediction
    print("\n[13/13] Sample Prediction...")
    sample = predict_risk(
        reg, prophet_models, scaler, zone_le, feature_cols,
        explainer, retriever,
        zone_id='VELACHERY',
        week_date='2024-11-15',
        mode='realtime',
        live_weather={
            'rainfall_mm': 142, 'max_daily_rainfall_mm': 142,
            'humidity_avg_pct': 88, 'temp_avg_celsius': 27,
            'wind_speed_max_kmh': 67, 'flood_alert_level': 2,
            'ndma_alert_level': 2, 'AQI_avg': 78,
            'rsmd_news_score': 0.12,
            'google_maps_congestion_index': 0.34,
            'is_northeast_monsoon': 1
        }
    )
    print(json.dumps(sample, indent=2, default=str))

    print("\n" + "=" * 60)
    print("Risk Model Training COMPLETE")
    print(f"Models saved to: {MODEL_DIR}")
    print("=" * 60)

    return metrics


if __name__ == '__main__':
    main()
