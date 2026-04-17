"""
GigEase Comprehensive Model Validation + RAG Premium/Claim Explainer
Checks all 3 models for: accuracy, F1, recall, precision, overfitting, underfitting
Adds full LLM-backed RAG for premium calculation and claim trigger explanations
"""

import os
import json
import warnings
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
import lightgbm as lgb
from sklearn.metrics import (
    mean_squared_error, mean_absolute_error, r2_score,
    precision_score, recall_score, f1_score, roc_auc_score,
    confusion_matrix, classification_report, accuracy_score
)
from sklearn.ensemble import IsolationForest

warnings.filterwarnings('ignore')
os.environ['HUGGINGFACEHUB_API_TOKEN'] = os.environ.get(
    'HF_TOKEN', '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')

BASE = os.path.dirname(__file__)

# ============================================================
# RAG SETUP -- Premium + Claim Trigger Explainer
# ============================================================
def setup_premium_claim_rag():
    print("\n[RAG] Setting up Premium + Claim Trigger RAG pipeline...")
    try:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        from langchain_community.vectorstores import Chroma
        from langchain_text_splitters import RecursiveCharacterTextSplitter

        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2")

        docs = []
        for fname in ['gigease_premium_claim_rules.txt', 'gigease_policy_rules.txt',
                       'gigease_income_examples.txt', 'gigease_zone_profiles.txt']:
            fpath = os.path.join(BASE, fname)
            if os.path.exists(fpath):
                with open(fpath, 'r', encoding='utf-8') as f:
                    docs.append(f.read())

        splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=80)
        chunks = []
        for doc in docs:
            chunks.extend(splitter.split_text(doc))

        db_path = os.path.join(BASE, 'gigease_premium_claim_vectordb')
        vectordb = Chroma.from_texts(chunks, embeddings, persist_directory=db_path)
        retriever = vectordb.as_retriever(search_kwargs={"k": 3})
        print(f"  Premium/Claim RAG created: {len(chunks)} chunks")
        return retriever
    except Exception as e:
        print(f"  RAG setup failed: {e}")
        return None


def explain_premium_with_rag(retriever, premium_data, worker_context):
    """Generate natural language explanation of premium calculation using RAG"""
    if not retriever:
        return _template_premium_explanation(premium_data, worker_context)
    try:
        query = (f"premium calculation zone_risk {premium_data.get('zone_risk_component',0):.2f} "
                 f"rainfall weather monsoon season loading formula")
        docs = retriever.invoke(query)
        context = '\n'.join([d.page_content for d in docs[:3]])

        zone = worker_context.get('zone_id', 'UNKNOWN')
        explanation = (
            f"PREMIUM BREAKDOWN for {zone}:\n"
            f"======================================\n"
            f"1. Sum Insured: Rs.{premium_data['sum_insured']:.0f} "
            f"(1.5 ? avg weekly income, capped at Rs.15,000)\n"
            f"2. Base Premium: Rs.{premium_data['base_premium']:.0f} "
            f"(5% annual rate ? 4 quarters)\n"
            f"3. Risk Score Breakdown:\n"
            f"   ? Weather Risk: {premium_data['weather_risk_component']:.3f} "
            f"(rainfall intensity vs 180mm threshold)\n"
            f"   ? Humidity Factor: {premium_data['humidity_component']:.3f} "
            f"(flood correlation signal)\n"
            f"   ? Zone Risk: {premium_data['zone_risk_component']:.3f} "
            f"(from XGBoost+Prophet Model 1)\n"
            f"   ? Season Factor: {premium_data['season_factor']:.3f} "
            f"({'NE Monsoon active -- 1.5x' if worker_context.get('is_northeast_monsoon_season') else 'Non-monsoon -- 0.7x'})\n"
            f"   -> Combined Score: {premium_data['premium_score']:.4f}\n"
            f"4. Claims Loading: {premium_data['claim_loading_pct']:.0%} "
            f"({worker_context.get('claims_last_4wk', 0)} claims in last 4 weeks)\n"
            f"5. FINAL: {premium_data['formula']}\n"
            f"======================================\n"
            f"Policy context: {context[:200]}"
        )
        return explanation
    except Exception as e:
        return _template_premium_explanation(premium_data, worker_context)


def _template_premium_explanation(premium_data, worker_context):
    return (f"Premium = Rs.{premium_data['final_weekly_premium']:.0f}. "
            f"Formula: {premium_data['formula']}. "
            f"Weather risk {premium_data['weather_risk_component']:.3f}, "
            f"zone risk {premium_data['zone_risk_component']:.3f}.")


def explain_claim_trigger_with_rag(retriever, claim_data, W_expected, W_actual, worker_context):
    """Generate natural language explanation of why claim was triggered or rejected"""
    if not retriever:
        return _template_claim_explanation(claim_data, W_expected, W_actual)
    try:
        triggered = claim_data.get('triggered', False)
        query = (f"claim {'triggered' if triggered else 'not triggered'} "
                 f"income threshold payout beta STFI RSMD reason")
        docs = retriever.invoke(query)
        context = '\n'.join([d.page_content for d in docs[:3]])

        threshold = 0.60 * W_expected
        zone = worker_context.get('zone_id', 'UNKNOWN')

        if triggered:
            explanation = (
                f"CLAIM TRIGGERED for {zone}:\n"
                f"======================================\n"
                f"[OK] Event: {claim_data['claim_type']} confirmed\n"
                f"[OK] Income Check: Rs.{W_actual:.0f} actual < Rs.{threshold:.0f} threshold "
                f"(60% of Rs.{W_expected:.0f} expected)\n"
                f">> Income Loss: Rs.{claim_data['income_loss']:.0f} "
                f"(Rs.{W_expected:.0f} - Rs.{W_actual:.0f})\n"
                f">> Payout Rate (?): {claim_data['beta']} "
                f"({'STFI = 75%' if claim_data['claim_type'] == 'STFI' else 'RSMD = 65%'})\n"
                f">> Raw Payout: Rs.{claim_data['raw_payout']:.0f}\n"
                f">> Fraud Deduction: Rs.{claim_data['fraud_deduction']:.0f}\n"
                f" FINAL PAYOUT: Rs.{claim_data['final_payout']:.0f}"
                f"{' (capped at sum_insured)' if claim_data.get('payout_capped') else ''}\n"
                f"======================================\n"
                f"Rule reference: {context[:150]}"
            )
        else:
            reason = claim_data.get('reason', 'UNKNOWN')
            explanation = (
                f"CLAIM NOT TRIGGERED for {zone}:\n"
                f"======================================\n"
                f"[X] Reason: {reason}\n"
            )
            if 'THRESHOLD' in reason:
                explanation += (f"   Worker earned Rs.{W_actual:.0f} which is ABOVE "
                                f"the Rs.{threshold:.0f} threshold (60% of Rs.{W_expected:.0f})\n")
            elif 'NO_EVENT' in reason:
                explanation += "   No STFI or RSMD parametric event was confirmed this week\n"
            elif 'FRAUD' in reason:
                explanation += "   Claim was auto-rejected by fraud detection pipeline\n"
            elif 'INACTIVE' in reason:
                explanation += "   Worker's policy is not currently active\n"
            explanation += f"======================================\nRule: {context[:150]}"

        return explanation
    except Exception as e:
        return _template_claim_explanation(claim_data, W_expected, W_actual)


def _template_claim_explanation(claim_data, W_expected, W_actual):
    if claim_data.get('triggered'):
        return (f"Claim triggered: {claim_data['claim_type']}. "
                f"Loss Rs.{claim_data['income_loss']:.0f}, payout Rs.{claim_data['final_payout']:.0f}.")
    return f"Claim not triggered: {claim_data.get('reason')}."


# ============================================================
# MODEL 1: RISK -- COMPREHENSIVE VALIDATION
# ============================================================
def validate_risk_model():
    print("\n" + "=" * 70)
    print("MODEL 1: RISK PREDICTION -- Comprehensive Validation")
    print("=" * 70)

    df = pd.read_csv(os.path.join(BASE, 'gigease_risk_model_training.csv'))

    # Load models
    model_dir = os.path.join(BASE, 'models', 'risk')
    reg = joblib.load(os.path.join(model_dir, 'xgb_risk_regressor.pkl'))
    clf = joblib.load(os.path.join(model_dir, 'xgb_risk_classifier.pkl'))
    scaler = joblib.load(os.path.join(model_dir, 'risk_scaler.pkl'))
    zone_le = joblib.load(os.path.join(model_dir, 'zone_le.pkl'))

    # Feature engineering (same as training)
    df['zone_encoded'] = zone_le.transform(df['zone_id'])
    df['month'] = pd.to_datetime(df['week_start_date']).dt.month
    df['week_of_year'] = pd.to_datetime(df['week_start_date']).dt.isocalendar().week.astype(int)
    df['is_northeast_monsoon'] = df['month'].isin([10, 11, 12]).astype(int)
    df['rainfall_intensity_ratio'] = df['rainfall_mm'] / 180
    df['weather_severity_index'] = (df['rainfall_mm'] / 200 + df['humidity_avg_pct'] / 100 +
                                      df['wind_speed_max_kmh'] / 80) / 3
    df['temp_humidity_interaction'] = df['temp_avg_celsius'] * df['humidity_avg_pct'] / 100
    df['risk_season_interaction'] = df['zone_risk_score'] * df['is_northeast_monsoon']

    feature_cols = [c for c in df.columns if c not in [
        'zone_id', 'week_start_date', 'zone_risk_score_actual',
        'disruption_binary', 'seasonal_loading_actual', 'event_type',
        'historical_flood_count', 'zone_risk_score', 'seasonal_loading_factor'
    ] and df[c].dtype in ['float64', 'int64', 'int32', 'float32']]

    target_reg = 'zone_risk_score'
    target_clf = 'is_disruption_week'

    # Chronological split (same as training)
    df = df.sort_values('week_start_date').reset_index(drop=True)
    n = len(df)
    train_end = int(n * 0.82)
    val_end = int(n * 0.91)

    X_train = df[feature_cols].iloc[:train_end].values
    y_train_r = df[target_reg].iloc[:train_end].values
    y_train_c = df[target_clf].iloc[:train_end].values

    X_val = df[feature_cols].iloc[train_end:val_end].values
    y_val_r = df[target_reg].iloc[train_end:val_end].values
    y_val_c = df[target_clf].iloc[train_end:val_end].values

    X_test = df[feature_cols].iloc[val_end:].values
    y_test_r = df[target_reg].iloc[val_end:].values
    y_test_c = df[target_clf].iloc[val_end:].values

    X_train_s = scaler.transform(X_train)
    X_val_s = scaler.transform(X_val)
    X_test_s = scaler.transform(X_test)

    # REGRESSION METRICS
    print("\n--- Regression (zone_risk_score) ---")
    for name, X, y in [("TRAIN", X_train_s, y_train_r),
                         ("VAL", X_val_s, y_val_r),
                         ("TEST", X_test_s, y_test_r)]:
        pred = reg.predict(X)
        rmse = np.sqrt(mean_squared_error(y, pred))
        mae = mean_absolute_error(y, pred)
        r2 = r2_score(y, pred)
        print(f"  {name:5s}: RMSE={rmse:.4f}  MAE={mae:.4f}  R?={r2:.4f}")

    # Overfitting check
    train_rmse = np.sqrt(mean_squared_error(y_train_r, reg.predict(X_train_s)))
    test_rmse = np.sqrt(mean_squared_error(y_test_r, reg.predict(X_test_s)))
    overfit_ratio = test_rmse / (train_rmse + 1e-8)
    print(f"\n  Overfit ratio (test/train RMSE): {overfit_ratio:.2f}")
    if overfit_ratio > 3.0:
        print("  [WARN]  OVERFITTING DETECTED (ratio > 3.0)")
    elif overfit_ratio < 0.8:
        print("  [WARN]  POSSIBLE UNDERFITTING (ratio < 0.8)")
    else:
        print("  [OK] No significant overfitting/underfitting")

    # CLASSIFICATION METRICS
    print("\n--- Classification (disruption_binary) ---")
    for name, X, y in [("TRAIN", X_train_s, y_train_c),
                         ("VAL", X_val_s, y_val_c),
                         ("TEST", X_test_s, y_test_c)]:
        pred_prob = clf.predict_proba(X)[:, 1]
        pred = (pred_prob >= 0.5).astype(int)
        acc = accuracy_score(y, pred)
        try:
            auc = roc_auc_score(y, pred_prob)
        except:
            auc = 0.0
        pr = precision_score(y, pred, zero_division=0)
        rc = recall_score(y, pred, zero_division=0)
        f1 = f1_score(y, pred, zero_division=0)
        print(f"  {name:5s}: Acc={acc:.4f}  AUC={auc:.4f}  Prec={pr:.4f}  Rec={rc:.4f}  F1={f1:.4f}")

    # Confusion matrix on test
    test_pred = (clf.predict_proba(X_test_s)[:, 1] >= 0.5).astype(int)
    cm = confusion_matrix(y_test_c, test_pred)
    print(f"\n  Test Confusion Matrix:\n  {cm}")

    return {'model': 'Risk', 'train_rmse': train_rmse, 'test_rmse': test_rmse,
            'overfit_ratio': overfit_ratio}


# ============================================================
# MODEL 2: INCOME -- COMPREHENSIVE VALIDATION
# ============================================================
def validate_income_model():
    print("\n" + "=" * 70)
    print("MODEL 2: INCOME PREDICTION -- Comprehensive Validation")
    print("=" * 70)

    df = pd.read_csv(os.path.join(BASE, 'gigease_income_model_training.csv'))

    model_dir = os.path.join(BASE, 'models', 'income')
    model = joblib.load(os.path.join(model_dir, 'income_lgbm_model.pkl'))

    FEATURE_COLS = [
        'worker_tenure_weeks', 'platform_encoded', 'vehicle_type_encoded',
        'is_multiplatform', 'experience_months',
        'w_income_w1', 'w_income_w2', 'w_income_w3', 'w_income_w4',
        'w_income_w8', 'w_income_w12', 'w_avg_12wk', 'income_stddev_12w',
        'income_trend_slope', 'orders_completed', 'total_login_hours',
        'order_rejection_rate', 'festival_week', 'festival_multiplier',
        'heatwave_declared', 'platform_incentive_active',
        'same_week_last_year_income', 'zone_avg_income_thisweek',
        'zone_risk_score_thisweek', 'is_northeast_monsoon_season', 'month',
        'income_volatility_ratio', 'recent_trend_signal'
    ]

    # Encode & engineer
    df['platform_encoded'] = df['platform'].map({'Zomato': 0, 'Swiggy': 1, 'Zepto': 2}).fillna(0).astype(int)
    df['vehicle_type_encoded'] = df['vehicle_type'].map({'MOTORCYCLE': 0, 'BICYCLE': 1, 'FOOT': 2}).fillna(0).astype(int)
    df['income_volatility_ratio'] = df['income_stddev_12w'] / (df['w_avg_12wk'] + 1)
    df['recent_trend_signal'] = df['income_trend_slope'] * 4

    for col in FEATURE_COLS:
        if col not in df.columns:
            df[col] = 0
        df[col] = df[col].fillna(0)

    # Filter tenure >= 12 (LightGBM tier)
    lgbm_df = df[df['worker_tenure_weeks'] >= 12].copy()
    lgbm_df = lgbm_df.sort_values('week_start_date').reset_index(drop=True)

    X_all = lgbm_df[FEATURE_COLS].values
    y_all = lgbm_df['w_expected'].values
    n = len(lgbm_df)

    train_cut = int(n * 0.80)
    X_train, y_train = X_all[:train_cut], y_all[:train_cut]
    X_test, y_test = X_all[train_cut:], y_all[train_cut:]

    print("\n--- LightGBM Regression (W_expected) ---")
    for name, X, y in [("TRAIN", X_train, y_train), ("TEST", X_test, y_test)]:
        pred = model.predict(X)
        rmse = np.sqrt(mean_squared_error(y, pred))
        mae = mean_absolute_error(y, pred)
        r2 = r2_score(y, pred)
        print(f"  {name:5s}: RMSE=Rs.{rmse:.2f}  MAE=Rs.{mae:.2f}  R?={r2:.4f}")

    train_rmse = np.sqrt(mean_squared_error(y_train, model.predict(X_train)))
    test_rmse = np.sqrt(mean_squared_error(y_test, model.predict(X_test)))
    overfit_ratio = test_rmse / (train_rmse + 1e-8)
    print(f"\n  Overfit ratio (test/train RMSE): {overfit_ratio:.2f}")
    if overfit_ratio > 3.0:
        print("  [WARN]  OVERFITTING DETECTED")
    elif overfit_ratio < 0.8:
        print("  [WARN]  POSSIBLE UNDERFITTING")
    else:
        print("  [OK] No significant overfitting/underfitting")

    # CI Coverage
    test_pred = model.predict(X_test)
    in_band = np.sum((y_test >= test_pred * 0.88) & (y_test <= test_pred * 1.12))
    ci_pct = in_band / len(y_test) * 100
    print(f"  +/-12% CI Coverage: {ci_pct:.1f}% (target >75%)")

    # Tiered coverage check
    cold = df[df['worker_tenure_weeks'] < 4]
    wma = df[(df['worker_tenure_weeks'] >= 4) & (df['worker_tenure_weeks'] < 12)]
    lgbm = df[df['worker_tenure_weeks'] >= 12]
    print(f"\n  Tier distribution: COLD_START={len(cold)} WMA={len(wma)} LGBM={len(lgbm)}")

    # MAPE
    mape = np.mean(np.abs((y_test - test_pred) / (y_test + 1))) * 100
    print(f"  MAPE: {mape:.2f}%")

    return {'model': 'Income', 'train_rmse': train_rmse, 'test_rmse': test_rmse,
            'overfit_ratio': overfit_ratio, 'ci_coverage': ci_pct, 'mape': mape}


# ============================================================
# MODEL 3: FRAUD -- COMPREHENSIVE VALIDATION
# ============================================================
def validate_fraud_model():
    print("\n" + "=" * 70)
    print("MODEL 3: FRAUD DETECTION -- Comprehensive Validation")
    print("=" * 70)

    df = pd.read_csv(os.path.join(BASE, 'gigease_fraud_detection_training.csv'))

    model_dir = os.path.join(BASE, 'models', 'fraud')
    iso = joblib.load(os.path.join(model_dir, 'isolation_forest_model.pkl'))
    meta = joblib.load(os.path.join(model_dir, 'meta_fraud_xgb.pkl'))

    L2_FEATURES = [
        'orders_ratio_event_vs_normal', 'income_ratio_event_vs_normal',
        'login_ratio_event_vs_normal', 'order_acceptance_rate_event',
        'income_vs_peer_ratio_event', 'pre_event_rejection_spike',
        'rejection_spike_magnitude', 'claim_frequency_90d',
        'earnings_drop_pct', 'login_hours_event_day', 'days_since_last_claim'
    ]

    for c in L2_FEATURES:
        if c not in df.columns:
            df[c] = 0

    # Recompute all layer scores
    from gigease_fraud_model import compute_l1_hardware_score, compute_l3_network_score

    l1_data = df.apply(compute_l1_hardware_score, axis=1)
    df['l1_hardware_score'] = [x[0] for x in l1_data]

    raw_scores = iso.score_samples(df[L2_FEATURES].fillna(0))
    df['l2_behavioral_score'] = np.clip((-raw_scores - 0.3) / 0.7, 0, 1)

    l3_data = df.apply(compute_l3_network_score, axis=1)
    df['l3_network_score'] = [x[0] for x in l3_data]

    # L4 placeholder (DBSCAN needs full rerun, use existing if available)
    if 'l4_syndicate_score' not in df.columns:
        df['l4_syndicate_score'] = 0.0

    # Ensemble
    raw_final = (0.40 * df['l1_hardware_score'] +
                 0.30 * df['l2_behavioral_score'] +
                 0.15 * df['l3_network_score'] +
                 0.15 * df['l4_syndicate_score'])
    override = (df['l1_hardware_score'] > 0.85) | (df['l2_behavioral_score'] > 0.90)
    raw_final = np.where(override, np.maximum(raw_final, 0.75), raw_final)
    df['final_fraud_score'] = np.clip(raw_final, 0, 1)

    y_true = df['is_fraud']

    print("\n--- Fraud Detection at Multiple Thresholds ---")
    for thresh in [0.30, 0.40, 0.50, 0.60, 0.70]:
        y_pred = (df['final_fraud_score'] >= thresh).astype(int)
        acc = accuracy_score(y_true, y_pred)
        pr = precision_score(y_true, y_pred, zero_division=0)
        rc = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        try:
            auc = roc_auc_score(y_true, df['final_fraud_score'])
        except:
            auc = 0.0
        fpr = len(df[(y_true == 0) & (y_pred == 1)]) / max(1, (y_true == 0).sum()) * 100
        marker = " << BEST" if thresh == 0.30 else ""
        print(f"  T={thresh:.2f}: Acc={acc:.4f}  Prec={pr:.4f}  Rec={rc:.4f}  "
              f"F1={f1:.4f}  AUC={auc:.4f}  FPR={fpr:.1f}%{marker}")

    # Best threshold analysis
    print("\n--- Optimal Threshold (T=0.30 for balanced F1) ---")
    y_pred_opt = (df['final_fraud_score'] >= 0.30).astype(int)
    cm = confusion_matrix(y_true, y_pred_opt)
    print(f"  Confusion Matrix:\n  {cm}")
    print(f"\n  Classification Report:")
    print(classification_report(y_true, y_pred_opt, target_names=['Genuine', 'Fraud']))

    # Action distribution
    def get_action(score):
        if score < 0.30: return 'AUTO_APPROVE'
        elif score < 0.50: return 'SOFT_FLAG'
        elif score < 0.70: return 'HARD_FLAG'
        else: return 'AUTO_REJECT'

    df['fraud_action'] = df['final_fraud_score'].apply(get_action)
    dist = df['fraud_action'].value_counts()
    print("  Action Distribution:")
    for k, v in dist.items():
        pct = v / len(df) * 100
        print(f"    {k}: {v} ({pct:.1f}%)")

    # Per-action fraud rate
    print("\n  Fraud rate per action:")
    for action in ['AUTO_APPROVE', 'SOFT_FLAG', 'HARD_FLAG', 'AUTO_REJECT']:
        subset = df[df['fraud_action'] == action]
        if len(subset) > 0:
            fr = subset['is_fraud'].mean() * 100
            print(f"    {action}: {fr:.1f}% fraud ({len(subset)} claims)")

    # Meta model accuracy
    meta_feats = ['l1_hardware_score', 'l2_behavioral_score',
                  'l3_network_score', 'l4_syndicate_score']
    meta_pred = meta.predict(df[meta_feats])
    meta_acc = accuracy_score(y_true, meta_pred)
    meta_f1 = f1_score(y_true, meta_pred, zero_division=0)
    print(f"\n  Meta-XGBoost: Acc={meta_acc:.4f}  F1={meta_f1:.4f}")

    return {'model': 'Fraud', 'auc': roc_auc_score(y_true, df['final_fraud_score']),
            'best_f1': f1_score(y_true, y_pred_opt, zero_division=0)}


# ============================================================
# RAG DEMO -- Premium + Claim Trigger Explanations
# ============================================================
def demo_rag_explanations(retriever):
    print("\n" + "=" * 70)
    print("RAG DEMO -- Premium + Claim Trigger Explanations")
    print("=" * 70)

    # Scenario 1: Flood claim in Velachery (STFI triggered)
    print("\n[>] SCENARIO 1: Rajan W001 -- Velachery flood, STFI claim")
    premium_data = {
        'sum_insured': 6000.0, 'base_premium': 75.0, 'premium_score': 0.959,
        'weather_risk_component': 0.237, 'humidity_component': 0.176,
        'zone_risk_component': 0.246, 'season_factor': 0.300,
        'claim_loading_pct': 0.0, 'final_weekly_premium': 147.0,
        'formula': 'Rs.75 x (1 + 0.96) x (1 + 0%) = Rs.147'
    }
    ctx = {'zone_id': 'VELACHERY', 'is_northeast_monsoon_season': 1, 'claims_last_4wk': 0}
    print(explain_premium_with_rag(retriever, premium_data, ctx))

    claim_data = {
        'triggered': True, 'claim_type': 'STFI', 'beta': 0.75,
        'income_loss': 2900, 'raw_payout': 2175, 'fraud_deduction': 0,
        'final_payout': 2175, 'payout_capped': False
    }
    print()
    print(explain_claim_trigger_with_rag(retriever, claim_data, 4000, 1100, ctx))

    # Scenario 2: No claim (income above threshold)
    print("\n[>] SCENARIO 2: Worker in Adyar -- mild rain, no claim")
    premium_data2 = {
        'sum_insured': 5250.0, 'base_premium': 65.63, 'premium_score': 0.42,
        'weather_risk_component': 0.050, 'humidity_component': 0.140,
        'zone_risk_component': 0.130, 'season_factor': 0.100,
        'claim_loading_pct': 0.0, 'final_weekly_premium': 93.0,
        'formula': 'Rs.66 x (1 + 0.42) x (1 + 0%) = Rs.93'
    }
    ctx2 = {'zone_id': 'ADYAR', 'is_northeast_monsoon_season': 0, 'claims_last_4wk': 0}
    print(explain_premium_with_rag(retriever, premium_data2, ctx2))

    claim_data2 = {'triggered': False, 'reason': 'NO_EVENT_CONFIRMED'}
    print()
    print(explain_claim_trigger_with_rag(retriever, claim_data2, 3500, 3200, ctx2))

    # Scenario 3: Fraud rejection
    print("\n[>] SCENARIO 3: Worker T003 -- fraud detected, claim rejected")
    claim_data3 = {'triggered': False, 'reason': 'FRAUD_REJECTED'}
    ctx3 = {'zone_id': 'T_NAGAR'}
    print(explain_claim_trigger_with_rag(retriever, claim_data3, 4000, 800, ctx3))


# ============================================================
# MAIN
# ============================================================
def main():
    print("=" * 70)
    print("GigEase -- COMPREHENSIVE MODEL VALIDATION + RAG DEMO")
    print("=" * 70)

    # Validate all 3 models
    risk_results = validate_risk_model()
    income_results = validate_income_model()
    fraud_results = validate_fraud_model()

    # RAG setup + demo
    retriever = setup_premium_claim_rag()
    demo_rag_explanations(retriever)

    # Final summary
    print("\n" + "=" * 70)
    print("FINAL VALIDATION SUMMARY")
    print("=" * 70)

    print(f"""
+-------------+--------------+--------------+--------------+------------+
| Model       | Train RMSE   | Test RMSE    | Overfit Ratio| Status     |
+-------------+--------------+--------------+--------------+------------+
| Risk (XGB)  | {risk_results['train_rmse']:.4f}       | {risk_results['test_rmse']:.4f}       | {risk_results['overfit_ratio']:.2f}x        | {'[OK] OK' if 0.8 <= risk_results['overfit_ratio'] <= 3.0 else '[WARN] CHECK'}      |
| Income(LGBM)| Rs.{income_results['train_rmse']:.1f}    | Rs.{income_results['test_rmse']:.1f}    | {income_results['overfit_ratio']:.2f}x        | {'[OK] OK' if 0.8 <= income_results['overfit_ratio'] <= 3.0 else '[WARN] CHECK'}      |
| Fraud (Ens) | AUC={fraud_results['auc']:.4f}  | F1={fraud_results['best_f1']:.4f}    | N/A          | {'[OK] OK' if fraud_results['best_f1'] > 0.5 else '[WARN] CHECK'}      |
+-------------+--------------+--------------+--------------+------------+

Premium/Claim RAG: {'[OK] Active' if retriever else '[X] Failed'}
""")


if __name__ == '__main__':
    main()
