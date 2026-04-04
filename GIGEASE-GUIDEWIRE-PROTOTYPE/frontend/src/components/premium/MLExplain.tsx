import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '../shared/Toast';
import { humanizeSnake } from '../../utils/humanizeLabel';

const FEATURES = [
  { key: 'zone_risk_score', value: 0.9991, pct: 94, labelKey: 'ml_explain_highest' as const },
  { key: 'seasonal_factor', value: 0.65, pct: 72 },
  { key: 'daily_zero_income_days', value: 4, pct: 61 },
  { key: 'flood_alert_level', value: 4, pct: 58 },
  { key: 'rainfall_mm', value: 187, pct: 54 },
  { key: 'rsmd_news_score', value: 0.048, pct: 47 },
  { key: 'claims_last_4wk', value: 1, pct: 43 },
  { key: 'fraud_model_score', value: 0.12, pct: 38 },
];

const MLExplain: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [key, setKey] = useState(0);

  const rerun = () => {
    setKey((k) => k + 1);
    addToast('success', t('ml_explain_toast'));
  };

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/premium')}
          aria-label={t('back')}
          className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-orange-400"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">{t('ml_explain_title')}</h1>
          <p className="text-sm text-orange-200/80">{t('ml_explain_sub')}</p>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        {FEATURES.map((f, i) => (
          <motion.div
            key={`${key}-${f.key}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 320, damping: 26 }}
            className="rounded-2xl border border-orange-500/25 bg-white/5 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          >
            <div className="flex justify-between items-center mb-2 gap-2">
              <p className="text-sm font-bold text-orange-200">{humanizeSnake(f.key)}</p>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold text-white/90">{f.value}</span>
                {f.labelKey ? (
                  <span className="text-xs bg-gradient-to-r from-red-600 to-orange-500 text-white px-2.5 py-1 rounded-full font-bold shadow-md">
                    {t(f.labelKey)}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="h-2.5 bg-black/40 rounded-full overflow-hidden ring-1 ring-orange-500/20">
              <motion.div
                key={`bar-${key}-${f.key}`}
                initial={{ width: 0 }}
                animate={{ width: `${f.pct}%` }}
                transition={{ duration: 0.65, ease: 'easeOut', delay: i * 0.08 }}
                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
              />
            </div>
            <p className="text-sm font-bold text-orange-100/90 mt-2 text-right tabular-nums">{f.pct}%</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md p-4 mb-4">
        <p className="text-base font-bold text-emerald-300">{t('ml_explain_final')}</p>
        <p className="text-sm text-emerald-100/80 mt-1">{t('ml_explain_guard')}</p>
      </div>

      <div className="text-xs text-neutral-500 mb-4">
        Last trained: 02-Apr-2026 · Model: XGBoost v2.0.3 — GigEase Classifier v1.0
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={rerun}
        className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3.5 shadow-lg shadow-orange-900/40"
      >
        🔄 {t('ml_explain_rerun')}
      </motion.button>
    </div>
  );
};

export default MLExplain;
