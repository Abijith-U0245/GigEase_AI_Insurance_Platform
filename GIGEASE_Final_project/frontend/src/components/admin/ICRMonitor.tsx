import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
  Cell,
} from 'recharts';

const ICR_VALUE = 62;
const ICR_BAR_DATA = [48, 55, 61, 58, 62, 70, 68, 65, 62, 66, 71, 62].map((v, i) => ({
  month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
  icr: v,
}));
const POOL_DATA = ICR_BAR_DATA.map((d, i) => ({ ...d, pool: 6350000 - i * 40000 }));

const ZONE_COLOR = (v: number) => (v < 50 ? '#34d399' : v < 70 ? '#60a5fa' : v < 85 ? '#fbbf24' : '#f87171');

const cardClass =
  'rounded-2xl border border-violet-500/20 bg-gradient-to-br from-[#12081c]/90 to-black/80 p-5 md:p-6 shadow-[0_24px_64px_rgba(0,0,0,0.45)] backdrop-blur-md';

const ICRMonitor: React.FC = () => {
  const r = 80;
  const circ = Math.PI * r;
  const [dash, setDash] = useState(circ);
  useEffect(() => {
    setTimeout(() => setDash(circ - (ICR_VALUE / 150) * circ), 300);
  }, [circ]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-cyan-200">
          ICR monitor
        </h1>
        <p className="mt-2 text-base text-violet-200/75">Pool health, loss ratio, and twelve-month trend</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className={`${cardClass} flex flex-col items-center`}
      >
        <div className="relative">
          <svg viewBox="0 0 220 130" width="320" height="190" className="drop-shadow-[0_0_40px_rgba(139,92,246,0.35)]">
            <defs>
              <linearGradient id="gaugeStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="55%" stopColor="#e879f9" />
                <stop offset="100%" stopColor="#fb923c" />
              </linearGradient>
            </defs>
            <path
              d="M20,120 A100,100 0 0,1 200,120"
              fill="none"
              stroke="rgba(139,92,246,0.2)"
              strokeWidth="20"
              strokeLinecap="round"
            />
            <motion.path
              d="M20,120 A100,100 0 0,1 200,120"
              fill="none"
              stroke="url(#gaugeStroke)"
              strokeWidth="20"
              strokeLinecap="round"
              strokeDasharray={`${circ}`}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: dash }}
              transition={{ duration: 1.25, ease: 'easeOut' }}
            />
            <text x="110" y="98" textAnchor="middle" fontSize="40" fontWeight="800" fill="#faf5ff" className="tabular-nums">
              {ICR_VALUE}%
            </text>
            <text x="110" y="118" textAnchor="middle" fontSize="13" fill="#c4b5fd" fontWeight="600">
              Loss ratio
            </text>
          </svg>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full shadow-[0_0_12px_currentColor]" style={{ backgroundColor: ZONE_COLOR(ICR_VALUE), color: ZONE_COLOR(ICR_VALUE) }} />
          <span className="text-base font-bold text-cyan-300">Target zone — healthy</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {[
          { range: '<50%', color: '#22C55E', action: 'Reduce loading' },
          { range: '50–70%', color: '#3B82F6', action: 'Target zone' },
          { range: '70–85%', color: '#F59E0B', action: 'Tighten fraud checks' },
          { range: '>85%', color: '#EF4444', action: 'Suspend enrollment' },
        ].map((z, i) => (
          <motion.div
            key={z.range}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-violet-500/15 bg-black/40 p-4 md:p-5"
            style={{ borderLeftWidth: 4, borderLeftColor: z.color }}
          >
            <p className="text-sm font-black" style={{ color: z.color }}>
              {z.range}
            </p>
            <p className="mt-1 text-base font-semibold text-white">{z.action}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cardClass}>
        <p className="text-lg font-black text-white">ICR trend (12 months)</p>
        <p className="mb-4 text-sm text-neutral-400">Gradient bars — hover for exact %</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={ICR_BAR_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="barTop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e879f9" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(139,92,246,0.15)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#a78bfa', fontSize: 12, fontWeight: 600 }} axisLine={{ stroke: 'rgba(139,92,246,0.3)' }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(139,92,246,0.08)' }}
              contentStyle={{
                background: '#0c0614',
                border: '1px solid rgba(139,92,246,0.35)',
                borderRadius: 12,
                color: '#fff',
              }}
              formatter={(v) => [`${v ?? 0}%`, 'ICR']}
            />
            <Bar dataKey="icr" radius={[8, 8, 0, 0]} maxBarSize={36}>
              {ICR_BAR_DATA.map((d, i) => (
                <Cell
                  key={i}
                  fill="url(#barTop)"
                  stroke={ZONE_COLOR(d.icr)}
                  strokeWidth={1}
                  style={{
                    filter: 'drop-shadow(0 4px 12px rgba(139,92,246,0.35))',
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cardClass}>
        <p className="text-lg font-black text-white">Pool balance trend</p>
        <p className="mb-4 text-sm text-neutral-400">Smoothed area with gradient fill</p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={POOL_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="poolArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(139,92,246,0.12)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#a78bfa', fontSize: 12, fontWeight: 600 }} axisLine={{ stroke: 'rgba(139,92,246,0.3)' }} />
            <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: '#0c0614',
                border: '1px solid rgba(139,92,246,0.35)',
                borderRadius: 12,
                color: '#fff',
              }}
              formatter={(v) => [`₹${(Number(v) / 100000).toFixed(1)}L`, 'Pool']}
            />
            <Area
              type="monotone"
              dataKey="pool"
              stroke="#ddd6fe"
              strokeWidth={3}
              fill="url(#poolArea)"
              dot={{ r: 3, fill: '#e9d5ff', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default ICRMonitor;
