import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Download } from 'lucide-react';
import { CardSkeleton } from '../shared/Skeleton';

const PolicyPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  if (loading)
    return (
      <div className="px-4 py-6 space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/home')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-orange-500/25 bg-black/30 backdrop-blur-sm hover:bg-orange-500/10"
          aria-label="Back"
        >
          <ArrowLeft size={22} className="text-orange-400" />
        </button>
        <h1 className="font-sans text-2xl font-black tracking-tight text-white md:text-3xl">My policy</h1>
      </div>

      <div className="mb-5 overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-[#1a1208] to-black p-5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-block rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-300">
              Active
            </span>
            <p className="mt-2 font-mono text-base font-bold text-orange-400">GE-2024-VEL-001</p>
            <p className="mt-1 text-sm font-semibold text-neutral-400">Since 15 Jan 2024</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#E23744] px-3 py-1 text-xs font-black text-white shadow-lg">Zomato</span>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-neutral-800 pt-4 text-sm">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">12-week avg income</p>
            <p className="mt-1 text-lg font-black text-white">₹5,000</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Coverage</p>
            <p className="mt-1 text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">
              ₹7,500 <span className="text-sm font-semibold text-neutral-500">(1.5× avg)</span>
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Weekly premium</p>
            <p className="mt-1 text-lg font-black text-white">₹170</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Claim loading</p>
            <p className="mt-1 text-lg font-black text-amber-400">5%</p>
            <p className="mt-0.5 text-[11px] font-medium leading-snug text-neutral-500">Added after a paid claim until the pool recovers</p>
          </div>
          <div className="col-span-2 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Zone risk score</p>
            <p className="mt-1 text-lg font-black text-orange-300">0.9991</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-100/15 to-orange-950/40 px-4 py-3 text-sm font-bold text-amber-200 shadow-inner">
          <span className="mr-1.5" aria-hidden>
            🌧
          </span>
          Oct–Dec: 0.65× seasonal loading on premium
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/policy/stfi')}
          className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/40 to-black p-5 text-left shadow-lg backdrop-blur-md"
        >
          <span className="mb-2 block text-3xl">🌊</span>
          <p className="text-lg font-black text-white">STFI coverage</p>
          <p className="mt-1 text-sm font-semibold text-cyan-200/80">Flood, storm, tempest</p>
          <ChevronRight size={18} className="mt-3 text-cyan-400" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/policy/rsmd')}
          className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/50 to-black p-5 text-left shadow-lg backdrop-blur-md"
        >
          <span className="mb-2 block text-3xl">⚖️</span>
          <p className="text-lg font-black text-white">RSMD coverage</p>
          <p className="mt-1 text-sm font-semibold text-violet-200/85">Riots, strikes, disturbances</p>
          <ChevronRight size={18} className="mt-3 text-violet-400" />
        </motion.button>
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/policy/events')}
        className="mb-4 flex w-full items-center justify-between rounded-2xl border border-orange-500/20 bg-black/40 p-4 text-left backdrop-blur-md"
      >
        <span className="text-base font-bold text-white">Policy activity log</span>
        <ChevronRight size={20} className="text-orange-400" />
      </motion.button>

      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-orange-500/50 py-4 text-base font-black text-orange-400 transition-colors hover:bg-orange-500/10"
      >
        <Download size={18} /> Download policy PDF
      </button>
    </div>
  );
};

export default PolicyPage;
