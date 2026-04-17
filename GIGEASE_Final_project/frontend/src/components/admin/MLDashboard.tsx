import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../shared/Toast';
import { humanizeSnake } from '../../utils/humanizeLabel';

const FEATURES = [
  { name: 'zone_risk_score', pct: 94 },
  { name: 'seasonal_factor', pct: 72 },
  { name: 'daily_zero_income_days', pct: 61 },
  { name: 'flood_alert_level', pct: 58 },
  { name: 'rainfall_mm', pct: 54 },
  { name: 'rsmd_news_score', pct: 47 },
  { name: 'claims_last_4wk', pct: 43 },
  { name: 'fraud_model_score', pct: 38 },
];

const DAG_NODES = [
  { id: 'fetch_weather', x: 20, y: 76 },
  { id: 'score_rsmd_news', x: 180, y: 20 },
  { id: 'enrich_features', x: 340, y: 76 },
  { id: 'run_classifier', x: 500, y: 20 },
  { id: 'run_regressor', x: 500, y: 132 },
  { id: 'compute_formula', x: 660, y: 76 },
  { id: 'fraud_check', x: 820, y: 76 },
  { id: 'send_payouts', x: 980, y: 76 },
];

const DAG_EDGES = [
  [0, 1],
  [0, 2],
  [1, 2],
  [2, 3],
  [2, 4],
  [3, 5],
  [4, 5],
  [5, 6],
  [6, 7],
];

const cardClass =
  'rounded-2xl border border-violet-500/20 bg-gradient-to-br from-[#12081c]/90 to-black/80 p-5 md:p-6 shadow-[0_24px_64px_rgba(0,0,0,0.45)] backdrop-blur-md';

const MLDashboard: React.FC = () => {
  const { addToast } = useToast();
  const [dagKey, setDagKey] = useState(0);
  const [dagFlashing, setDagFlashing] = useState(false);
  const [flashIdx, setFlashIdx] = useState(-1);

  const triggerDag = () => {
    setDagFlashing(true);
    DAG_NODES.forEach((_, i) => {
      setTimeout(() => setFlashIdx(i), i * 250);
    });
    setTimeout(() => {
      setDagFlashing(false);
      setFlashIdx(-1);
      setDagKey((k) => k + 1);
      addToast('success', 'DAG run triggered — next execution queued');
    }, DAG_NODES.length * 250 + 500);
  };

  const metrics = [
    { l: 'Trained', v: '02-Apr-2026' },
    { l: 'Training rows', v: '520' },
    { l: 'Features', v: '70' },
    { l: 'AUC', v: '1.000' },
    { l: 'Recall', v: '0.933' },
    { l: 'F1', v: '0.931' },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-fuchsia-200">
          ML model dashboard
        </h1>
        <p className="mt-2 text-base text-violet-200/80">Live-style view of the GigEase classifier pipeline</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className={cardClass}
      >
        <p className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
          GigEase XGBoost classifier v1.0
        </p>
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {metrics.map((m, i) => (
            <motion.div
              key={m.l}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.04 }}
              className="rounded-xl border border-violet-500/15 bg-black/35 px-3 py-3"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-violet-300/80">{m.l}</p>
              <p className="mt-1 text-lg font-black tabular-nums text-white">{m.v}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className={cardClass}
      >
        <p className="text-lg font-black text-white">Feature importance (SHAP)</p>
        <p className="mb-5 text-sm text-neutral-400">Relative contribution — animated on load</p>
        <div className="space-y-4" key={dagKey}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 24 }}
            >
              <div className="mb-1.5 flex justify-between text-sm gap-2">
                <span className="font-semibold text-fuchsia-100">{humanizeSnake(f.name)}</span>
                <span className="font-black tabular-nums text-white shrink-0">{f.pct}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-neutral-900 ring-1 ring-violet-500/20">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${f.pct}%` }}
                  transition={{ duration: 0.75, delay: i * 0.08, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 shadow-[0_0_16px_rgba(168,85,247,0.45)]"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className={cardClass}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-lg font-black text-white">Airflow DAG</p>
          <div className="text-sm text-violet-200/70">Last run: Sun 30-Mar-2026 23:00</div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-violet-500/10 bg-black/30 p-2">
          <svg viewBox="0 0 1200 200" width="100%" height="180" className="min-w-[720px]">
            <defs>
              <linearGradient id="dagEdge" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#e879f9" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="nodeFill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1e1035" />
                <stop offset="100%" stopColor="#0a0612" />
              </linearGradient>
              <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#c4b5fd" />
              </marker>
            </defs>
            {DAG_EDGES.map(([f, t], i) => {
              const from = DAG_NODES[f],
                to = DAG_NODES[t];
              const fx = from.x + 70,
                fy = from.y + 24,
                tx = to.x,
                ty = to.y + 24;
              return (
                <path
                  key={i}
                  d={`M${fx},${fy} C${(fx + tx) / 2},${fy} ${(fx + tx) / 2},${ty} ${tx},${ty}`}
                  stroke="url(#dagEdge)"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#arr)"
                />
              );
            })}
            {DAG_NODES.map((n, i) => (
              <g key={n.id}>
                <rect
                  x={n.x}
                  y={n.y}
                  width="140"
                  height="48"
                  rx="10"
                  fill="url(#nodeFill)"
                  stroke={flashIdx === i ? '#fb923c' : dagKey > 0 && flashIdx === -1 ? '#4ade80' : '#8b5cf6'}
                  strokeWidth={flashIdx === i ? 2.5 : 1.5}
                />
                <text x={n.x + 70} y={n.y + 30} textAnchor="middle" fontSize="11" fontWeight="700" fill="#f5f3ff">
                  {n.id.replace(/_/g, ' ')}
                </text>
                <text x={n.x + 130} y={n.y + 14} textAnchor="middle" fontSize="13" fill="#e9d5ff">
                  {dagKey > 0 && flashIdx === -1 ? '✓' : '○'}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={triggerDag}
          disabled={dagFlashing}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 py-4 text-base font-black text-white shadow-[0_12px_40px_rgba(109,40,217,0.4)] ring-1 ring-white/10 disabled:opacity-50"
        >
          {dagFlashing ? 'Running…' : 'Trigger DAG'}
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cardClass}
      >
        <p className="text-lg font-black text-white">Redis snapshot</p>
        <p className="mb-3 text-sm text-neutral-500">Policy cache (demo strings)</p>
        <pre className="overflow-x-auto rounded-xl border border-emerald-500/20 bg-black/60 p-4 font-mono text-sm leading-relaxed text-emerald-400/95">
          {`policy:W001 → {premium: 170, claim_loading: 5%, sum_insured: 7500}
policy:W002 → {premium: 82, claim_loading: 0%, sum_insured: 6750}
policy:W099 → {premium: 150, claim_loading: 0%, sum_insured: 6000}`}
        </pre>
      </motion.div>
    </div>
  );
};

export default MLDashboard;
