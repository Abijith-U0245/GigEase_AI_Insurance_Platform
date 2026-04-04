import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { PremiumSimulationTimeline } from '../simulation/PremiumSimulationTimeline';

const chartPoints = [165, 165, 165, 165, 170, 178, 178, 170, 165, 165, 165, 170].map((v, i) => ({
  week: `W${i + 1}`,
  premium: v,
}));

const PremiumHistory: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const stats = useMemo(() => {
    const vals = chartPoints.map((d) => d.premium);
    return {
      low: Math.min(...vals),
      high: Math.max(...vals),
      cur: vals[vals.length - 1],
    };
  }, []);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-3 py-4 md:px-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => navigate('/premium')}
          aria-label="Back"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-orange-500/30 bg-black/40 text-orange-400 backdrop-blur-md hover:bg-orange-500/10"
        >
          <ArrowLeft size={22} strokeWidth={2} />
        </button>
        <div className="min-w-0">
          <h1 className="font-sans text-2xl font-black tracking-tight text-white md:text-3xl">{t('premium_hist_title')}</h1>
          <p className="mt-1 text-sm font-semibold text-neutral-400">{t('premium_hist_sub')}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-[#1a1008] to-black p-4 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-md md:p-5">
        <p className="mb-1 text-xs font-black uppercase tracking-widest text-orange-400/90">{t('premium_hist_trend')}</p>
        <p className="mb-4 text-sm font-semibold text-neutral-400">{t('premium_hist_trend_sub')}</p>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartPoints} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="premFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb923c" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#ea580c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(234,88,12,0.12)" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: '#fdba74', fontSize: 12, fontWeight: 700 }} />
            <YAxis domain={[150, 185]} tick={{ fill: '#a3a3a3', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: '#0c0a09',
                border: '1px solid rgba(251,146,60,0.4)',
                borderRadius: 12,
                color: '#fff',
              }}
              formatter={(v) => [`₹${v}`, 'Premium']}
            />
            <ReferenceLine x="W5" stroke="#f97316" strokeDasharray="5 5" />
            <Area
              type="monotone"
              dataKey="premium"
              stroke="#fed7aa"
              strokeWidth={3}
              fill="url(#premFill)"
              dot={{ r: 3, fill: '#fdba74' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'low', label: t('premium_stat_low'), val: `₹${stats.low}`, className: 'text-emerald-400' },
          { key: 'high', label: t('premium_stat_high'), val: `₹${stats.high}`, className: 'text-amber-400' },
          { key: 'cur', label: t('premium_stat_cur'), val: `₹${stats.cur}`, className: 'text-orange-400' },
        ].map((s) => (
          <motion.div
            key={s.key}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-3 text-center backdrop-blur-md md:p-4"
          >
            <p className="text-xs font-black uppercase tracking-wide text-neutral-500">{s.label}</p>
            <p className={`mt-1 text-xl font-black tabular-nums md:text-2xl ${s.className}`}>{s.val}</p>
          </motion.div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-orange-500/25 bg-gradient-to-b from-orange-950/20 via-black/80 to-black shadow-[0_24px_60px_rgba(234,88,12,0.12)] backdrop-blur-md">
        <div className="border-b border-orange-500/20 bg-gradient-to-r from-orange-950/40 to-transparent px-4 py-3 md:px-5">
          <p className="text-xs font-black uppercase tracking-widest text-orange-400">{t('premium_hist_weeks_title')}</p>
          <p className="mt-1 text-sm font-semibold text-neutral-400">{t('premium_hist_weeks_sub')}</p>
        </div>
        <div className="min-h-[min(520px,72vh)] max-h-[min(640px,78vh)] overflow-hidden p-3 md:min-h-[560px] md:max-h-[min(680px,80vh)] md:p-5">
          <PremiumSimulationTimeline workerId="T001" isAdmin={false} cardSize="comfortable" />
        </div>
      </div>
    </div>
  );
};

export default PremiumHistory;
