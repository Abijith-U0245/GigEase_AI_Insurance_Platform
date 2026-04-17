"""
GigEase Fraud Detection Pipeline — Model 3 of 3
Ensemble: L1 (Rules) + L2 (Isolation Forest) + L3 (Network) + L4 (DBSCAN)
Produces fraud_score, action flags, deductions, Mapbox animation data, and LLM explanation.
"""

import os
import json
import warnings
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
import shap
from sklearn.ensemble import IsolationForest
from sklearn.cluster import DBSCAN
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix
from haversine import haversine, Unit

warnings.filterwarnings('ignore')
os.environ['HUGGINGFACEHUB_API_TOKEN'] = os.environ.get(
    'HF_TOKEN', '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')

# ============================================================
# CONFIGURATION
# ============================================================
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models', 'fraud')
os.makedirs(MODEL_DIR, exist_ok=True)
DATA_FILE = 'gigease_fraud_detection_training.csv'

L2_FEATURES = [
    'orders_ratio_event_vs_normal', 'income_ratio_event_vs_normal',
    'login_ratio_event_vs_normal', 'order_acceptance_rate_event',
    'income_vs_peer_ratio_event', 'pre_event_rejection_spike',
    'rejection_spike_magnitude', 'claim_frequency_90d',
    'earnings_drop_pct', 'login_hours_event_day', 'days_since_last_claim'
]


# ============================================================
# DATA PIPELINE (Load & Preprocess)
# ============================================================
def load_and_validate():
    print("[1/10] Loading Fraud dataset...")
    df = pd.read_csv(os.path.join(os.path.dirname(__file__), DATA_FILE))
    print(f"  Shape: {df.shape}")
    assert df.shape[0] >= 5000, f"Expected >= 5000 rows, got {df.shape[0]}"
    assert 'is_fraud' in df.columns, "is_fraud label missing"

    fraud_pct = (df['is_fraud'] == 1).mean() * 100
    print(f"  Distribution: {100 - fraud_pct:.1f}% Genuine / {fraud_pct:.1f}% Fraud")
    return df


# ============================================================
# L1 — GPS HARDWARE
# ============================================================
def compute_l1_hardware_score(row):
    score = 0.0
    flags = []

    if row.get('is_mocked_location', 0) == 1:
        score += 0.60
        flags.append('GPS_MOCK_APP_DETECTED')

    max_spd = row.get('max_speed_kmh', 0)
    if max_spd > 120:
        score += 0.45
        flags.append(f"IMPOSSIBLE_SPEED_{max_spd:.0f}kmh")

    max_jmp = row.get('max_location_jump_km', 0)
    if max_jmp > 2.0:
        score += 0.40
        flags.append(f"LOCATION_JUMP_{max_jmp:.1f}km")

    if row.get('accelerometer_vs_gps_delta', 0) > 5.0:
        score += 0.55
        flags.append('ACCEL_GPS_MISMATCH_PHONE_STATIONARY')

    ct_dist = row.get('cell_tower_gps_distance_km', 0)
    if ct_dist > 2.0:
        score += 0.35
        flags.append(f"CELL_TOWER_MISMATCH_{ct_dist:.1f}km")

    if row.get('gps_perfect_during_storm', 0) == 1:
        score += 0.25
        flags.append('PERFECT_GPS_DURING_STORM')

    route_dev = row.get('route_deviation_from_road_pct', 0)
    if route_dev > 0.20:
        score += 0.20
        flags.append(f"ROUTE_DEVIATION_{route_dev:.0%}")

    l1_score = min(1.0, score)

    # Mapbox colors
    if l1_score > 0.70:
        anim_color, anim_label = 'red', 'FRAUD_DETECTED'
    elif l1_score > 0.35:
        anim_color, anim_label = 'amber', 'SUSPICIOUS'
    else:
        anim_color, anim_label = 'green', 'NORMAL'

    return l1_score, flags, anim_color, anim_label


# ============================================================
# L2 — BEHAVIORAL ISOLATION FOREST
# ============================================================
def train_l2_behavioral(df):
    print("[2/10] Training L2 Isolation Forest...")

    for c in L2_FEATURES:
        if c not in df.columns:
            df[c] = 0

    genuine = df[df['is_fraud'] == 0][L2_FEATURES].fillna(0)

    iso = IsolationForest(
        n_estimators=200, contamination=0.05, max_samples='auto',
        random_state=42, n_jobs=-1
    )
    iso.fit(genuine)
    joblib.dump(iso, os.path.join(MODEL_DIR, 'isolation_forest_model.pkl'))

    raw_scores = iso.score_samples(df[L2_FEATURES].fillna(0))
    df['l2_behavioral_score'] = np.clip((-raw_scores - 0.3) / 0.7, 0, 1)
    df['behavioral_anomaly_flag'] = (df['l2_behavioral_score'] > 0.50).astype(int)

    # SHAP explanations
    print("  Computing L2 SHAP anomalies...")
    explainer = shap.Explainer(iso, genuine[:100])
    shap_vals = explainer(df[L2_FEATURES].fillna(0)).values

    top_feats = []
    top_vals = []
    for sv in shap_vals:
        idx = np.argmax(np.abs(sv))
        top_feats.append(L2_FEATURES[idx])
        top_vals.append(np.abs(sv[idx]))

    df['l2_top_anomaly_feature'] = top_feats
    df['l2_shap_value'] = top_vals

    return iso, df


# ============================================================
# L3 — NETWORK
# ============================================================
def compute_l3_network_score(row):
    score = 0.0
    flags = []

    if row.get('vpn_detected', 0) == 1:
        score += 0.30
        flags.append('VPN_DETECTED')
    if row.get('ip_gps_mismatch', 0) == 1:
        score += 0.25
        flags.append(f"IP_GPS_MISMATCH_{row.get('ip_gps_distance_km',0):.0f}km")
    if row.get('device_changed_mid_shift', 0) == 1:
        score += 0.40
        flags.append('DEVICE_CHANGED_MID_SHIFT')
    if row.get('simultaneous_login_diff_location', 0) == 1:
        score += 0.70
        flags.append('SIMULTANEOUS_LOGIN_DIFF_LOCATION')
    if row.get('shared_device_flag', 0) == 1:
        score += 0.50
        wkr_cnt = row.get('shared_device_worker_count', 2)
        flags.append(f"SHARED_DEVICE_{wkr_cnt}_WORKERS")
    if row.get('developer_mode_on', 0) == 1:
        score += 0.35
        flags.append('DEVELOPER_MODE_ENABLED')
    if row.get('rooted_device', 0) == 1:
        score += 0.40
        flags.append('ROOTED_DEVICE')

    return min(1.0, score), flags


# ============================================================
# L4 — SYNDICATE DBSCAN
# ============================================================
def run_l4_syndicate(df):
    print("[3/10] Running L4 DBSCAN clustering...")

    coords = df[['home_gps_lat', 'home_gps_lon']].fillna(0).values
    db = DBSCAN(eps=0.003, min_samples=3, metric='haversine',
                algorithm='ball_tree', n_jobs=-1)
    labels = db.fit_predict(np.radians(coords))
    df['dbscan_cluster_id'] = labels

    l4_scores = []
    cluster_dfs_cache = {}

    for idx, row in df.iterrows():
        cid = row['dbscan_cluster_id']
        if cid == -1:
            l4_scores.append((0.0, []))
            continue

        if cid not in cluster_dfs_cache:
            cluster_dfs_cache[cid] = df[df['dbscan_cluster_id'] == cid]

        cdf = cluster_dfs_cache[cid]
        score = 0.0
        flags = []

        spike = cdf['cluster_claim_volume_spike'].mean() if 'cluster_claim_volume_spike' in cdf else 0
        sync = cdf['cluster_temporal_sync_minutes'].mean() if 'cluster_temporal_sync_minutes' in cdf else 999
        sh_devs = cdf['cluster_shared_device_count'].sum() if 'cluster_shared_device_count' in cdf else 0
        p_var = cdf['payout_held_inr'].var() if 'payout_held_inr' in cdf else 999
        same_ip = cdf['cluster_same_ip_count'].sum() if 'cluster_same_ip_count' in cdf else 0

        if spike > 3.0:
            score += 0.30
            flags.append(f"VOLUME_SPIKE_{spike:.1f}x")
        if sync < 10.0:
            score += 0.25
            flags.append(f"TEMPORAL_SYNC_{sync:.1f}min")
        if sh_devs > 0:
            score += 0.20
            flags.append(f"SHARED_DEVICES_{sh_devs}")
        if p_var < 100:
            score += 0.15
            flags.append('UNIFORM_PAYOUT_AMOUNTS')
        if same_ip > 1:
            score += 0.10
            flags.append('SHARED_IP_IN_CLUSTER')

        size_mult = min(2.0, len(cdf) / 5)
        l4_scores.append((min(1.0, score * size_mult), flags))

    df['l4_syndicate_score'] = [s[0] for s in l4_scores]
    return df


# ============================================================
# FINAL ENSEMBLE + META XGBOOST
# ============================================================
def train_meta_ensemble(df):
    print("[4/10] Building meta-ensemble...")

    l1_data = df.apply(compute_l1_hardware_score, axis=1)
    df['l1_hardware_score'] = [x[0] for x in l1_data]

    l3_data = df.apply(compute_l3_network_score, axis=1)
    df['l3_network_score'] = [x[0] for x in l3_data]

    # Combine
    raw_final = (0.40 * df['l1_hardware_score'] +
                 0.30 * df['l2_behavioral_score'] +
                 0.15 * df['l3_network_score'] +
                 0.15 * df['l4_syndicate_score'])

    override = (df['l1_hardware_score'] > 0.85) | (df['l2_behavioral_score'] > 0.90)
    raw_final = np.where(override, np.maximum(raw_final, 0.75), raw_final)
    df['final_fraud_score'] = np.clip(raw_final, 0, 1)

    def get_action(score):
        if score < 0.30: return 'AUTO_APPROVE', 1.0
        elif score < 0.50: return 'SOFT_FLAG', 0.5
        elif score < 0.70: return 'HARD_FLAG', 0.0
        else: return 'AUTO_REJECT', 0.0

    df[['fraud_action', 'payout_modifier']] = df.apply(
        lambda r: pd.Series(get_action(r['final_fraud_score'])), axis=1)

    # GPS Deduction
    gps_dist = df.get('gps_total_distance_km', df.get('cell_tower_estimated_distance_km', 0))
    ct_dist = df.get('cell_tower_estimated_distance_km', gps_dist)
    ratio = df.get('gps_vs_celltower_distance_ratio', gps_dist / (ct_dist + 0.1))

    df['fraud_deduction_inr'] = np.where(
        ratio > 1.5,
        (gps_dist - ct_dist) * 4.5,
        0.0
    ).clip(0)

    # Meta XGBoost (explains which layer triggered fraud)
    print("  Training Meta XGBoost...")
    meta_feats = ['l1_hardware_score', 'l2_behavioral_score',
                  'l3_network_score', 'l4_syndicate_score']

    y = df['is_fraud']
    n0, n1 = (y == 0).sum(), (y == 1).sum()
    scale_pos = n0 / n1 if n1 > 0 else 1.0

    meta_model = xgb.XGBClassifier(
        n_estimators=100, max_depth=3, random_state=42,
        scale_pos_weight=scale_pos, verbosity=0)
    meta_model.fit(df[meta_feats], y)
    joblib.dump(meta_model, os.path.join(MODEL_DIR, 'meta_fraud_xgb.pkl'))

    try:
        explainer = shap.Explainer(meta_model, df[meta_feats][:100])
        sv = explainer(df[meta_feats]).values
        df['top_fraud_layer'] = [meta_feats[np.argmax(np.abs(row))] for row in sv]
    except Exception as e:
        print(f"  SHAP meta failed ({e}), using feature importance fallback...")
        # Use layer scores directly to determine top layer per row
        layer_vals = df[meta_feats].values
        df['top_fraud_layer'] = [meta_feats[np.argmax(np.abs(row))] for row in layer_vals]

    return meta_model, df


# ============================================================
# EVALUATION
# ============================================================
def evaluate(df):
    print("[5/10] Evaluation...")
    y_true = df['is_fraud']
    y_pred = (df['final_fraud_score'] >= 0.50).astype(int)

    pr = precision_score(y_true, y_pred, zero_division=0)
    rc = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    cm = confusion_matrix(y_true, y_pred)

    print(f"  Precision: {pr:.4f}  Recall: {rc:.4f}  F1: {f1:.4f}")
    if pr < 0.85: print("  WARNING: Precision below 0.85")
    if rc < 0.75: print("  WARNING: Recall below 0.75")
    print(f"  Confusion Matrix:\n{cm}")

    fps = df[(df['is_fraud'] == 0) & (y_pred == 1)]
    fpr = len(fps) / len(df[df['is_fraud'] == 0]) * 100
    print(f"  False Positive Rate (genuine flagged): {fpr:.2f}% (target: <5%)")

    dist = df['fraud_action'].value_counts(normalize=True) * 100
    print("  Action Distribution:")
    for k, v in dist.items():
        print(f"    {k}: {v:.1f}%")

    return {'precision': pr, 'recall': rc, 'f1': f1, 'fpr': fpr}


# ============================================================
# RAG PIPELINE
# ============================================================
def setup_rag():
    print("[6/10] Setting up Fraud RAG...")
    try:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        from langchain_community.vectorstores import Chroma
        from langchain_text_splitters import RecursiveCharacterTextSplitter

        emb = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

        docs_text = []
        base = os.path.dirname(__file__)
        for fname in ['gigease_fraud_cases.txt']:
            fp = os.path.join(base, fname)
            if os.path.exists(fp):
                with open(fp, 'r', encoding='utf-8') as f:
                    docs_text.append(f.read())

        if not docs_text: return None

        spl = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = spl.split_text('\n'.join(docs_text))

        db_path = os.path.join(base, 'gigease_fraud_vectordb')
        db = Chroma.from_texts(chunks, emb, persist_directory=db_path)
        print(f"  Fraud RAG created: {len(chunks)} chunks")
        return db.as_retriever(search_kwargs={'k': 2})
    except Exception as e:
        print(f"  Fraud RAG setup failed: {e}")
        return None

def generate_fraud_explanation(retriever, worker_id, fraud_score, action,
                               l1, l2, l3, l4, top_signal, l1_flags, l2_top):
    if not retriever:
        return f"Score {fraud_score:.2f} -> {action}. Top signal: {top_signal}."
    try:
        q = f"GPS fraud detection {top_signal} {','.join(l1_flags)}"
        docs = retriever.invoke(q)
        ctx = '\n'.join([d.page_content for d in docs])

        return (f"Claim for {worker_id} resulted in {action} (Score: {fraud_score:.2f}). "
                f"L1: {l1:.2f}, L2: {l2:.2f}, L3: {l3:.2f}, L4: {l4:.2f}. "
                f"Primary anomaly: {top_signal}. "
                f"Matches historical pattern: {ctx[:100]}...")
    except Exception as e:
        return f"Warning — LLM explainer err: {e}"


# ============================================================
# MAPBOX ANIMATION DATA BUILDER
# ============================================================
def get_mapbox_animation_data(worker_id, gps_logs_df, fraud_score, l1_flags):
    frames = []
    for i, row in gps_logs_df.iterrows():
        f = {
            'timestamp': row['timestamp'], 'lat': row['lat'], 'lon': row['lon'],
            'speed_kmh': row['speed_kmh'], 'dot_color': 'green',
            'dot_size': 'normal', 'label': '', 'show_speed_badge': False,
            'show_jump_line': False
        }

        if row['speed_kmh'] > 80:
            f['dot_color'] = 'red'
            f['show_speed_badge'] = True
            f['label'] = f"Suspicious speed: {row['speed_kmh']:.0f} km/h"

        if i > 0:
            prev = gps_logs_df.iloc[i-1]
            dist = haversine((prev['lat'], prev['lon']), (row['lat'], row['lon']))
            if dist > 2.0:
                f['show_jump_line'] = True
                f['jump_from'] = [prev['lat'], prev['lon']]
                f['label'] = f"GPS jump detected: {dist:.1f}km"
                f['dot_color'] = 'red'

        if 'accel_magnitude' in row and row['speed_kmh'] > 10:
            if abs(row['accel_magnitude'] - 9.81) < 0.15:
                f['dot_color'] = 'amber'
                f['dot_pulsing'] = True
                f['label'] = "No accelerometer movement detected"

        frames.append(f)

    return {
        'worker_id': worker_id,
        'fraud_score': fraud_score,
        'overall_color': 'red' if fraud_score > 0.7 else 'amber' if fraud_score > 0.3 else 'green',
        'animation_frames': frames,
        'fraud_flags': l1_flags
    }


# ============================================================
# PREDICT FUNCTION
# ============================================================
def predict_fraud(iso_forest, retriever, worker_id, claim_id, event_type,
                  gps_logs_df, bhv_feats, net_feats, clstr_feats):
    # L1
    l1_row = pd.Series({'gps_total_distance_km': 10,
                        'cell_tower_estimated_distance_km': 10,
                        'is_mocked_location': 0})
    if not gps_logs_df.empty:
        l1_row['max_speed_kmh'] = gps_logs_df['speed_kmh'].max()
        l1_row['is_mocked_location'] = gps_logs_df.get('is_mocked', pd.Series([0])).max()

    l1, l1_flg, anim_c, anim_l = compute_l1_hardware_score(l1_row)

    # L2
    l2_df = pd.DataFrame([bhv_feats], columns=L2_FEATURES).fillna(0)
    l2_raw = iso_forest.score_samples(l2_df)[0]
    l2 = float(np.clip((-l2_raw - 0.3)/0.7, 0, 1))

    # Generic SHAP for IF
    exp = shap.Explainer(iso_forest, l2_df)
    sv = exp(l2_df).values[0]
    l2_top = L2_FEATURES[np.argmax(np.abs(sv))]

    # L3 & L4
    l3, l3_flg = compute_l3_network_score(pd.Series(net_feats))
    l4 = clstr_feats.get('l4_syndicate_score', 0.0)

    # Combine
    raw = 0.40*l1 + 0.30*l2 + 0.15*l3 + 0.15*l4
    if l1 > 0.85 or l2 > 0.90: raw = max(raw, 0.75)
    f_score = float(np.clip(raw, 0, 1))

    def act(s):
        if s<0.3: return 'AUTO_APPROVE',1.0
        if s<0.5: return 'SOFT_FLAG',0.5
        if s<0.7: return 'HARD_FLAG',0.0
        return 'AUTO_REJECT',0.0

    action, mod = act(f_score)
    top_sgnl = l1_flg[0] if (l1_flg and l1 >= l2) else l2_top

    expl = generate_fraud_explanation(retriever, worker_id, f_score, action,
                                      l1, l2, l3, l4, top_sgnl, l1_flg, l2_top)
    anim = get_mapbox_animation_data(worker_id, gps_logs_df, f_score, l1_flg)

    return {
        'worker_id': worker_id, 'claim_id': claim_id,
        'final_fraud_score': round(f_score, 4), 'fraud_action': action,
        'payout_modifier': mod, 'top_fraud_signal': top_sgnl,
        'l1_flags': l1_flg, 'l2_top_anomaly': l2_top,
        'layer_scores': {'L1': round(l1,4), 'L2': round(l2,4),
                         'L3': round(l3,4), 'L4': round(l4,4)},
        'llm_explanation': expl, 'mapbox_animation': anim
    }


# ============================================================
# MAIN
# ============================================================
def main():
    print("=" * 60)
    print("GigEase Fraud Detection Model Pipeline")
    print("=" * 60)

    df = load_and_validate()
    iso, df = train_l2_behavioral(df)
    df = run_l4_syndicate(df)
    meta, df = train_meta_ensemble(df)
    metrics = evaluate(df)
    ret = setup_rag()

    # Sample Worker T003 - Mock App fraud
    print("\n[7/10] Sample Prediction T003 (GPS Fraud)")
    logs = pd.DataFrame([
        {'timestamp': '10:00', 'lat': 12.9, 'lon': 80.2, 'speed_kmh': 40, 'accel_magnitude': 9.81},
        {'timestamp': '10:05', 'lat': 12.92, 'lon': 80.21, 'speed_kmh': 185, 'accel_magnitude': 9.81, 'is_mocked': 1}
    ])
    bhv = {c: 0 for c in L2_FEATURES}
    res = predict_fraud(iso, ret, 'T003', 'CLM-99', 'STFI', logs, bhv, {}, {})
    print(json.dumps(res, indent=2))

    print("\n" + "=" * 60)
    print("Fraud Model Training COMPLETE")
    print("=" * 60)

if __name__ == '__main__':
    main()
