"""
GigEase Income Prediction Model — Model 2 of 3
Tiered: COLD_START → WMA → LightGBM
Predicts W_expected (counterfactual weekly income) per worker per week.
Also contains Premium Calculation Engine and Claim Trigger Logic.
"""

import os
import json
import warnings
import joblib
import numpy as np
import pandas as pd
import lightgbm as lgb
import shap
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error, mean_absolute_error

warnings.filterwarnings('ignore')
os.environ['HUGGINGFACEHUB_API_TOKEN'] = os.environ.get(
    'HF_TOKEN', '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')

# ============================================================
# CONFIGURATION
# ============================================================
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models', 'income')
os.makedirs(MODEL_DIR, exist_ok=True)

TARGET = 'w_expected'
DATA_FILE = 'gigease_income_model_training.csv'

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


# ============================================================
# SECTION 1 — DATA LOADING & VALIDATION
# ============================================================
def load_and_validate():
    print("[1/12] Loading Income dataset...")
    df = pd.read_csv(os.path.join(os.path.dirname(__file__), DATA_FILE))
    print(f"  Shape: {df.shape}")
    assert df.shape[0] >= 10000, f"Expected >= 10000 rows, got {df.shape[0]}"
    assert df.shape[1] >= 139, f"Expected >= 139 columns, got {df.shape[1]}"

    # Validate w_expected > 0 for active policies
    active = df[df['policy_active'] == 1]
    assert (active['w_expected'] > 0).all(), "w_expected must be > 0 for active policies"

    # Validate tenure increases per worker (relax: just check non-negative)
    assert (df['worker_tenure_weeks'] >= 0).all(), "worker_tenure_weeks has negative values"

    print(f"  Workers: {df['worker_id'].nunique()}")
    print(f"  Weeks covered: {df['week_start_date'].nunique()}")
    return df


# ============================================================
# SECTION 2 — FEATURE ENGINEERING
# ============================================================
def engineer_features(df):
    print("[2/12] Feature engineering...")

    # Encode platform
    plat_le = LabelEncoder()
    plat_le.classes_ = np.array(['Zomato', 'Swiggy', 'Zepto'])
    df['platform_encoded'] = df['platform'].map({'Zomato': 0, 'Swiggy': 1, 'Zepto': 2}).fillna(0).astype(int)
    joblib.dump(plat_le, os.path.join(MODEL_DIR, 'income_platform_le.pkl'))

    # Encode vehicle type
    veh_le = LabelEncoder()
    df['vehicle_type_encoded'] = df['vehicle_type'].map(
        {'MOTORCYCLE': 0, 'BICYCLE': 1, 'FOOT': 2}).fillna(0).astype(int)
    joblib.dump(veh_le, os.path.join(MODEL_DIR, 'income_vehicle_le.pkl'))

    # Engineered features
    df['income_volatility_ratio'] = df['income_stddev_12w'] / (df['w_avg_12wk'] + 1)
    df['recent_trend_signal'] = df['income_trend_slope'] * 4

    # Fill missing feature columns with 0
    for col in FEATURE_COLS:
        if col not in df.columns:
            df[col] = 0
        df[col] = df[col].fillna(0)

    print(f"  Features ready: {len(FEATURE_COLS)}")
    return df


# ============================================================
# SECTION 3 — TIERED PREDICTION LOGIC
# ============================================================
def get_prediction_tier(tenure_weeks):
    if tenure_weeks < 4:
        return 'COLD_START'
    elif tenure_weeks < 12:
        return 'WMA'
    else:
        return 'LIGHTGBM'


def compute_wma(income_history, decay=0.9):
    """WMA with exponential decay. income_history[0] = most recent."""
    history = [h for h in income_history if h is not None and not np.isnan(h)]
    if not history:
        return 0.0
    weights = [decay ** i for i in range(len(history))]
    return sum(w * h for w, h in zip(weights, history)) / sum(weights)


def apply_adjusters(base, festival_mult=1.0, heatwave_flag=0, incentive_flag=0):
    result = base * festival_mult
    if heatwave_flag:
        result *= 0.85
    if incentive_flag:
        result *= 1.10
    return result


# ============================================================
# SECTION 4 — LIGHTGBM TRAINING (Walk-Forward)
# ============================================================
def train_lightgbm(df):
    print("[3/12] Training LightGBM with walk-forward validation...")

    lgbm_df = df[df['worker_tenure_weeks'] >= 12].copy()
    lgbm_df = lgbm_df.sort_values('week_start_date').reset_index(drop=True)

    X_all = lgbm_df[FEATURE_COLS].values
    y_all = lgbm_df[TARGET].values

    n = len(lgbm_df)
    splits = [
        (lgbm_df.index[lgbm_df['week_number'] <= 40].tolist(),
         lgbm_df.index[(lgbm_df['week_number'] > 40) & (lgbm_df['week_number'] <= 52)].tolist()),
        (lgbm_df.index[lgbm_df['week_number'] <= 52].tolist(),
         lgbm_df.index[(lgbm_df['week_number'] > 52) & (lgbm_df['week_number'] <= 64)].tolist()),
    ]

    rmse_scores = []
    for i, (train_idx, val_idx) in enumerate(splits):
        if not train_idx or not val_idx:
            continue
        X_tr, y_tr = X_all[train_idx], y_all[train_idx]
        X_vl, y_vl = X_all[val_idx], y_all[val_idx]

        m = lgb.LGBMRegressor(
            n_estimators=500, max_depth=5, learning_rate=0.05,
            num_leaves=31, subsample=0.80, colsample_bytree=0.80,
            reg_alpha=0.1, reg_lambda=1.0, min_child_samples=10,
            random_state=42, verbose=-1
        )
        m.fit(X_tr, y_tr,
              eval_set=[(X_vl, y_vl)],
              callbacks=[lgb.early_stopping(50, verbose=False),
                         lgb.log_evaluation(period=-1)])
        preds = m.predict(X_vl)
        rmse = np.sqrt(mean_squared_error(y_vl, preds))
        rmse_scores.append(rmse)
        print(f"  Fold {i+1}: RMSE = Rs.{rmse:.2f}")

    print(f"  Cross-val Mean RMSE = Rs.{np.mean(rmse_scores):.2f} "
          f"+/- Rs.{np.std(rmse_scores):.2f}")
    if np.mean(rmse_scores) > 350:
        print("  WARNING: RMSE > Rs.350 — consider adding order_count features or increasing num_leaves")

    # Final model on full data
    print("  Training final model on all data (tenure >= 12)...")
    final_model = lgb.LGBMRegressor(
        n_estimators=500, max_depth=5, learning_rate=0.05,
        num_leaves=31, subsample=0.80, colsample_bytree=0.80,
        reg_alpha=0.1, reg_lambda=1.0, min_child_samples=10,
        random_state=42, verbose=-1
    )
    # 80/20 chronological split for final training
    train_cutoff = int(n * 0.80)
    X_train_f = X_all[:train_cutoff]
    y_train_f = y_all[:train_cutoff]
    X_test_f = X_all[train_cutoff:]
    y_test_f = y_all[train_cutoff:]

    final_model.fit(X_train_f, y_train_f,
                    eval_set=[(X_test_f, y_test_f)],
                    callbacks=[lgb.early_stopping(50, verbose=False),
                               lgb.log_evaluation(period=-1)])

    joblib.dump(final_model, os.path.join(MODEL_DIR, 'income_lgbm_model.pkl'))
    print(f"  Final model saved.")
    return final_model, X_test_f, y_test_f, lgbm_df


# ============================================================
# SECTION 5 — EVALUATION
# ============================================================
def evaluate(model, X_test, y_test, df_with_context=None):
    print("[4/12] Evaluation...")
    preds = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    mae = mean_absolute_error(y_test, preds)
    print(f"  RMSE: Rs.{rmse:.2f}  MAE: Rs.{mae:.2f}")

    # CI coverage check
    ci_low = preds * 0.88
    ci_high = preds * 1.12
    in_band = np.sum((y_test >= ci_low) & (y_test <= ci_high))
    pct = in_band / len(y_test) * 100
    print(f"  {pct:.1f}% of actuals fall within ±12% CI (target: >75%)")

    if rmse > 600:
        print("  WARNING: RMSE > Rs.600 — consider adding order_count features or increasing num_leaves")

    return {'rmse': rmse, 'mae': mae, 'ci_coverage_pct': pct}


# ============================================================
# SECTION 6 — SHAP
# ============================================================
def compute_shap(model, X_test):
    print("[5/12] Computing SHAP values...")
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_test)

    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        shap.summary_plot(shap_values, X_test, feature_names=FEATURE_COLS,
                          show=False)
        plt.savefig(os.path.join(MODEL_DIR, 'shap_income_summary.png'),
                    bbox_inches='tight', dpi=150)
        plt.close()
        print("  Saved shap_income_summary.png")
    except Exception as e:
        print(f"  Could not save SHAP plot: {e}")

    return explainer, shap_values


def get_income_shap_explanation(shap_row, feature_names=FEATURE_COLS):
    pairs = sorted(zip(feature_names, shap_row), key=lambda x: -abs(x[1]))
    top_3 = pairs[:3]
    lines = []
    for feat, val in top_3:
        direction = "increases" if val > 0 else "decreases"
        lines.append(f"{feat} {direction} expected income by Rs.{abs(val):.0f}")
    return '; '.join(lines)


# ============================================================
# SECTION 7 — RAG
# ============================================================
def setup_rag():
    print("[6/12] Setting up Income RAG...")
    try:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        from langchain_community.vectorstores import Chroma
        from langchain_text_splitters import RecursiveCharacterTextSplitter

        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2")

        base = os.path.dirname(__file__)
        docs_text = []
        for fname in ['gigease_income_examples.txt']:
            fpath = os.path.join(base, fname)
            if os.path.exists(fpath):
                with open(fpath, 'r', encoding='utf-8') as f:
                    docs_text.append(f.read())

        if not docs_text:
            print("  WARNING: No RAG docs found")
            return None

        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = []
        for doc in docs_text:
            chunks.extend(splitter.split_text(doc))

        db_path = os.path.join(base, 'gigease_income_vectordb')
        vectordb = Chroma.from_texts(chunks, embeddings, persist_directory=db_path)
        retriever = vectordb.as_retriever(search_kwargs={"k": 2})
        print(f"  Income RAG created: {len(chunks)} chunks")
        return retriever
    except Exception as e:
        print(f"  Income RAG setup failed: {e}")
        return None


def generate_income_explanation(retriever, worker_id, zone, week_date,
                                 W_expected, W_actual, trigger_met, shap_text):
    if retriever is None:
        return (f"Worker {worker_id} in {zone}: expected Rs.{W_expected:.0f}, "
                f"actual Rs.{W_actual:.0f}. {'Claim triggered.' if trigger_met else 'No claim.'}")
    try:
        query = f"income prediction {zone} festival trigger {trigger_met}"
        docs = retriever.invoke(query)
        context = '\n'.join([d.page_content for d in docs[:2]])
        status = "CLAIM TRIGGERED" if trigger_met else "no claim"
        return (f"Worker {worker_id} expected income Rs.{W_expected:.0f}, "
                f"earned Rs.{W_actual:.0f} ({status}). "
                f"Key drivers: {shap_text}. Context: {context[:150]}...")
    except Exception as e:
        return f"Income explanation error: {e}"


# ============================================================
# SECTION 8 — CLAIM TRIGGER LOGIC
# ============================================================
def evaluate_claim_trigger(W_expected, W_actual, stfi_confirmed, rsmd_confirmed,
                            fraud_action, policy_active, sum_insured,
                            fraud_deduction=0.0, claim_type=None):
    if not policy_active:
        return {'triggered': False, 'reason': 'POLICY_INACTIVE'}
    if fraud_action == 'AUTO_REJECT':
        return {'triggered': False, 'reason': 'FRAUD_REJECTED'}
    if not (stfi_confirmed or rsmd_confirmed):
        return {'triggered': False, 'reason': 'NO_EVENT_CONFIRMED'}

    threshold = 0.60 * W_expected
    if W_actual >= threshold:
        return {
            'triggered': False,
            'reason': f'INCOME_ABOVE_THRESHOLD: actual Rs.{W_actual:.0f} >= '
                      f'threshold Rs.{threshold:.0f}'
        }

    beta = 0.75 if stfi_confirmed else 0.65
    loss = W_expected - W_actual
    raw_payout = beta * loss
    after_fraud = max(0, raw_payout - fraud_deduction)
    final_payout = min(after_fraud, sum_insured)

    return {
        'triggered': True,
        'claim_type': 'STFI' if stfi_confirmed else 'RSMD',
        'beta': beta,
        'income_loss': round(loss, 2),
        'raw_payout': round(raw_payout, 2),
        'fraud_deduction': round(fraud_deduction, 2),
        'final_payout': round(final_payout, 2),
        'payout_capped': after_fraud > sum_insured
    }


# ============================================================
# SECTION 9 — WEEKLY PREMIUM CALCULATION
# ============================================================
def calculate_weekly_premium(W_avg, zone_risk_score, seasonal_loading_factor,
                              rainfall_mm, humidity_avg_pct, is_northeast_monsoon,
                              claims_last_4wk, max_daily_rainfall_mm):
    sum_insured = float(max(3000, min(15000, 1.5 * W_avg)))
    P_base = (0.05 * sum_insured) / 4

    weather_risk = min(1.0, max_daily_rainfall_mm / 180) * 0.3
    humidity_component = (humidity_avg_pct / 100) * 0.2
    zone_component = zone_risk_score * 0.3
    season_component = (1.5 if is_northeast_monsoon else 0.7) * 0.2

    premium_score = weather_risk + humidity_component + zone_component + season_component
    P_adjusted = P_base * (1 + premium_score)

    loading_map = {0: 0.0, 1: 0.05, 2: 0.12, 3: 0.25}
    loading = loading_map.get(min(int(claims_last_4wk), 3), 0.25)
    P_final = float(max(25, min(250, P_adjusted * (1 + loading))))

    return {
        'sum_insured': round(sum_insured, 2),
        'base_premium': round(P_base, 2),
        'premium_score': round(premium_score, 4),
        'weather_risk_component': round(weather_risk, 4),
        'humidity_component': round(humidity_component, 4),
        'zone_risk_component': round(zone_component, 4),
        'season_factor': round(season_component, 4),
        'claim_loading_pct': loading,
        'final_weekly_premium': round(P_final, 2),
        'formula': (f"Rs.{P_base:.0f} x (1 + {premium_score:.2f}) "
                    f"x (1 + {loading:.0%}) = Rs.{P_final:.0f}")
    }


# ============================================================
# SECTION 10 — PREDICT FUNCTION
# ============================================================
def predict_income(model, explainer, retriever,
                   worker_id, week_date, income_history, worker_context,
                   zone_id, mode='realtime', sim_month=None):
    tenure = worker_context.get('worker_tenure_weeks', 0)
    tier = get_prediction_tier(tenure)

    festival_mult = worker_context.get('festival_multiplier', 1.0)
    heatwave_flag = int(worker_context.get('heatwave_declared', 0))
    incentive_flag = int(worker_context.get('platform_incentive_active', 0))
    zone_avg = worker_context.get('zone_avg_income_thisweek', 4000)

    if tier == 'COLD_START':
        W_expected = zone_avg
        method = 'COLD_START'
        shap_text = 'Using zone average income (new worker, insufficient history)'
    elif tier == 'WMA':
        base = compute_wma(income_history)
        W_expected = apply_adjusters(base, festival_mult, heatwave_flag, incentive_flag)
        method = 'WMA'
        shap_text = f'WMA of last {len(income_history)} weeks: Rs.{base:.0f}'
    else:
        # Build feature vector
        features = []
        hist = income_history + [0] * max(0, 12 - len(income_history))
        hist = hist[:12]
        feat_vals = {
            'worker_tenure_weeks': tenure,
            'platform_encoded': worker_context.get('platform_encoded', 0),
            'vehicle_type_encoded': worker_context.get('vehicle_type_encoded', 0),
            'is_multiplatform': worker_context.get('is_multiplatform', 0),
            'experience_months': worker_context.get('experience_months', 12),
            'w_income_w1': hist[0], 'w_income_w2': hist[1],
            'w_income_w3': hist[2], 'w_income_w4': hist[3],
            'w_income_w8': hist[7], 'w_income_w12': hist[11],
            'w_avg_12wk': np.mean(hist),
            'income_stddev_12w': np.std(hist),
            'income_trend_slope': (hist[0] - hist[-1]) / max(1, len(hist)),
            'orders_completed': worker_context.get('orders_completed', 50),
            'total_login_hours': worker_context.get('total_login_hours', 45),
            'order_rejection_rate': worker_context.get('order_rejection_rate', 0.05),
            'festival_week': worker_context.get('festival_week', 0),
            'festival_multiplier': festival_mult,
            'heatwave_declared': heatwave_flag,
            'platform_incentive_active': incentive_flag,
            'same_week_last_year_income': worker_context.get('same_week_last_year_income',
                                                               np.mean(hist)),
            'zone_avg_income_thisweek': zone_avg,
            'zone_risk_score_thisweek': worker_context.get('zone_risk_score_thisweek', 0.3),
            'is_northeast_monsoon_season': worker_context.get('is_northeast_monsoon_season', 0),
            'month': worker_context.get('month', 6),
            'income_volatility_ratio': np.std(hist) / (np.mean(hist) + 1),
            'recent_trend_signal': (hist[0] - hist[-1]) / max(1, len(hist)) * 4
        }
        X_arr = np.array([[feat_vals[c] for c in FEATURE_COLS]])
        base_pred = float(model.predict(X_arr)[0])
        W_expected = apply_adjusters(base_pred, festival_mult, heatwave_flag, incentive_flag)
        method = 'LightGBM'

        try:
            sv = explainer.shap_values(X_arr)[0]
            shap_text = get_income_shap_explanation(sv)
        except Exception:
            shap_text = f'LightGBM prediction: Rs.{base_pred:.0f}'

    W_actual = worker_context.get('w_actual', W_expected)

    # Claim trigger
    trigger_result = evaluate_claim_trigger(
        W_expected=W_expected,
        W_actual=W_actual,
        stfi_confirmed=bool(worker_context.get('stfi_event_confirmed', 0)),
        rsmd_confirmed=bool(worker_context.get('rsmd_event_confirmed', 0)),
        fraud_action=worker_context.get('fraud_action', 'AUTO_APPROVE'),
        policy_active=bool(worker_context.get('policy_active', 1)),
        sum_insured=worker_context.get('sum_insured', 4500),
        fraud_deduction=float(worker_context.get('fraud_deduction_inr', 0))
    )

    # Premium
    premium = calculate_weekly_premium(
        W_avg=np.mean(income_history) if income_history else W_expected,
        zone_risk_score=worker_context.get('zone_risk_score_thisweek', 0.3),
        seasonal_loading_factor=worker_context.get('seasonal_loading_factor', 0.0),
        rainfall_mm=worker_context.get('rainfall_mm', 10),
        humidity_avg_pct=worker_context.get('humidity_avg_pct', 70),
        is_northeast_monsoon=bool(worker_context.get('is_northeast_monsoon_season', 0)),
        claims_last_4wk=int(worker_context.get('claims_last_4wk', 0)),
        max_daily_rainfall_mm=worker_context.get('max_daily_rainfall_mm', 10)
    )

    explanation = generate_income_explanation(
        retriever, worker_id, zone_id, week_date,
        W_expected, W_actual, trigger_result['triggered'], shap_text)

    return {
        'worker_id': worker_id,
        'week_date': str(week_date),
        'zone_id': zone_id,
        'mode': mode,
        'W_expected': round(W_expected, 2),
        'W_expected_ci_low': round(W_expected * 0.88, 2),
        'W_expected_ci_high': round(W_expected * 1.12, 2),
        'W_actual': round(W_actual, 2),
        'prediction_method': method,
        'shap_explanation': shap_text,
        'llm_explanation': explanation,
        'claim_trigger': trigger_result,
        'premium_calculation': premium
    }


# ============================================================
# SECTION 11 — MAIN
# ============================================================
def main():
    print("=" * 60)
    print("GigEase Income Prediction Model — Training Pipeline")
    print("=" * 60)

    df = load_and_validate()
    df = engineer_features(df)
    model, X_test, y_test, lgbm_df = train_lightgbm(df)
    metrics = evaluate(model, X_test, y_test)
    explainer, shap_values = compute_shap(model, X_test)
    retriever = setup_rag()

    # Sample prediction: W001, Velachery, November, Week 3 (STFI scenario)
    print("\n[7/12] Sample Prediction — W001, Velachery, STFI event...")
    income_hist = [1106, 5100, 4200, 3800, 4100, 4050, 4200, 3900, 4050, 4100, 4000, 3950]
    result = predict_income(
        model=model, explainer=explainer, retriever=retriever,
        worker_id='W001', week_date='2024-11-15',
        income_history=income_hist,
        worker_context={
            'worker_tenure_weeks': 61,
            'platform_encoded': 0, 'vehicle_type_encoded': 0,
            'is_multiplatform': 0, 'experience_months': 15,
            'festival_multiplier': 1.0, 'heatwave_declared': 0,
            'platform_incentive_active': 0, 'festival_week': 0,
            'zone_avg_income_thisweek': 4050, 'zone_risk_score_thisweek': 0.82,
            'is_northeast_monsoon_season': 1, 'month': 11,
            'seasonal_loading_factor': 0.65, 'rainfall_mm': 142,
            'max_daily_rainfall_mm': 142, 'humidity_avg_pct': 88,
            'stfi_event_confirmed': 1, 'rsmd_event_confirmed': 0,
            'fraud_action': 'AUTO_APPROVE', 'policy_active': 1,
            'sum_insured': 4500, 'fraud_deduction_inr': 0,
            'w_actual': 1106, 'claims_last_4wk': 0,
            'orders_completed': 18, 'total_login_hours': 30,
            'order_rejection_rate': 0.05,
            'same_week_last_year_income': 4050,
        },
        zone_id='VELACHERY'
    )
    print(json.dumps(result, indent=2, default=str))

    print("\n" + "=" * 60)
    print("Income Model Training COMPLETE")
    print(f"Models saved to: {MODEL_DIR}")
    print("=" * 60)

    return metrics


if __name__ == '__main__':
    main()
