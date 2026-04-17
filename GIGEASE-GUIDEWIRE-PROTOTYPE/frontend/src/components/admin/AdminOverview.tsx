import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle2 } from 'lucide-react';

const SIM_STEPS = [
  'Detecting 187mm rainfall in Velachery via IMD API...',
  'Scanning policy registry — 12 active workers found in Velachery zone...',
  'Checking policy GE-2024-VEL-001 — Status: ACTIVE ✓',
  "Fetching Arun's income from Zomato API — This week: ₹1,600",
  'Income trigger check — ₹1,600 is below ₹3,000 threshold (60% of ₹5,000) ✓',
  'Calculating income loss — ₹5,000 - ₹1,600 = ₹3,400 loss this week',
  'Computing raw payout — STFI Beta 0.80 × ₹3,400 = ₹2,720',
  'Running 17-point fraud check — GPS ✓, Device ✓, Platform API ✓ — Score: 0.12',
  'Applying coverage cap — ₹2,720 within ₹7,500 limit ✓',
  'Pool reserve check — Current pool: 68% — Minimum required: 30% ✓',
  'Initiating UPI transfer to arunS@okaxis via Razorpay — Txn: pay_demo_001',
  "Sending push notification to Arun's device via FCM...",
  'Updating database — Claim loading 5% applied to next premium calculation ✓',
];

const ICR_CARDS = [
  { label: 'Total Active Policies', value: '847', color: 'text-orange-400' },
  { label: 'Total Coverage Pool', value: '₹63.5L', color: 'text-orange-400' },
  { label: 'Pool Balance', value: '₹58.2L', color: 'text-emerald-400' },
  { label: 'Active Disruptions', value: '2', color: 'text-red-400' },
  { label: 'Pending Claims', value: '14', color: 'text-amber-400' },
  { label: 'Claims Approved Today', value: '7', color: 'text-emerald-400' },
];

const cardBase =
  'rounded-2xl border border-violet-500/20 bg-gradient-to-br from-[#12081c]/80 to-black/70 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm';

const AdminOverview: React.FC = () => {
  const [simMode, setSimMode] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simComplete, setSimComplete] = useState(false);

  const runFullSim = () => {
    setSimMode(true);
    setSimStep(0);
    setSimComplete(false);
    SIM_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setSimStep(i + 1);
        if (i === SIM_STEPS.length - 1) {
          setTimeout(() => setSimComplete(true), 2500);
        }
      }, i * 2500);
    });
  };

  return (
    <div className="max-w-6xl">
      {!simMode ? (
        <>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 md:text-4xl">
                Admin overview
              </h1>
              <p className="mt-2 text-base text-violet-200/70">GigEase control center — DEVTrails 2026</p>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={runFullSim}
              title="Run full claim simulation (demo)"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(234,88,12,0.35)] transition-opacity hover:opacity-95"
            >
              <Play size={18} className="fill-white/90" aria-hidden />
              <span className="whitespace-nowrap">Run simulation</span>
            </motion.button>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ICR_CARDS.map(c => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${cardBase} border-t-2 border-t-orange-500/70`}
              >
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-500">{c.label}</p>
                <p className={`text-2xl font-black tabular-nums ${c.color}`}>{c.value}</p>
              </motion.div>
            ))}
          </div>

          <div className={`${cardBase} mb-4 border-t-2 border-t-emerald-500/50`}>
            <p className="mb-4 text-sm font-bold text-white">System Health</p>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {['Kafka', 'Redis', 'PostgreSQL'].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                  />
                  <span className="text-sm font-semibold text-emerald-400">
                    {s} <span className="text-neutral-500">·</span> LIVE
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${cardBase} border-t-2 border-t-indigo-500/50`}>
            <p className="mb-1 text-sm font-bold text-white">Last Trigger Event</p>
            <p className="text-sm text-neutral-400">STFI Flood — Velachery — 04-Nov-2024 06:00 AM</p>
          </div>
        </>
      ) : (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-6 text-center backdrop-blur-sm">
          <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
            <span className="text-xl font-black text-white sm:text-2xl">GigEase — Claim Simulation</span>
            <span className="rounded-full bg-red-700 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Demo
            </span>
          </div>
          {simStep > 0 && !simComplete && (
            <div className="mb-8 max-w-xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-orange-500 bg-orange-500/15 text-2xl font-black text-orange-400">
                {simStep}
              </div>
              <motion.p
                key={simStep}
                initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                className="text-lg font-semibold leading-relaxed text-neutral-100 sm:text-xl md:text-2xl"
              >
                {SIM_STEPS[simStep - 1]}
              </motion.p>
            </div>
          )}
          {simComplete && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md">
              <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-emerald-500" strokeWidth={1.5} aria-hidden />
              <p className="mb-2 text-2xl font-black text-emerald-400 sm:text-3xl">Claim complete</p>
              <p className="text-lg text-white">₹1,243.50 credited to Arun S</p>
            </motion.div>
          )}
          <div className="mt-8 w-full max-w-md">
            <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-600"
                animate={{ width: `${(simStep / SIM_STEPS.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="mt-2 text-sm text-neutral-500">
              {simStep}/{SIM_STEPS.length} steps
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSimMode(false);
              setSimStep(0);
              setSimComplete(false);
            }}
            className="mt-8 text-sm font-semibold text-neutral-500 hover:text-white"
          >
            Skip →
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminOverview;
