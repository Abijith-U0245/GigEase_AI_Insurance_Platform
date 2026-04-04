import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Info } from 'lucide-react';

const ClaimsOverview: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/home')}
          aria-label="Back"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-orange-500/25 bg-black/40 text-orange-400 hover:bg-orange-500/10"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-sans text-2xl font-black text-white md:text-3xl">My claims</h1>
      </div>

      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        animate={{ boxShadow: ['0 0 0 0 rgba(249,115,22,0)', '0 0 28px 0 rgba(249,115,22,0.25)', '0 0 0 0 rgba(249,115,22,0)'] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="mb-5 cursor-pointer overflow-hidden rounded-2xl border-2 border-orange-400/60 bg-gradient-to-br from-amber-100/[0.12] via-orange-950/50 to-black p-5 shadow-[0_12px_40px_rgba(234,88,12,0.2)] backdrop-blur-md"
        onClick={() => navigate('/claims/GE-CLM-001/pipeline')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && navigate('/claims/GE-CLM-001/pipeline')}
      >
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <span className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1 text-xs font-black uppercase tracking-wide text-black">
            Claim in progress
          </span>
          <span className="rounded-full border border-sky-400/50 bg-sky-500/15 px-3 py-1 text-xs font-black text-sky-200">STFI</span>
        </div>
        <p className="text-sm font-bold text-neutral-300">GE-CLM-001 · 04 Nov 2024</p>
        <p className="mt-2 font-sans text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-red-400 tabular-nums">
          ₹1,243.50
        </p>
        <p className="mt-3 text-base font-black text-orange-400">Track timeline →</p>
      </motion.div>

      <div className="mb-5 overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-b from-[#141414] to-black p-5 backdrop-blur-md">
        <p className="mb-4 text-lg font-black text-white">Past claims</p>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 py-3">
          <div className="min-w-0">
            <p className="text-base font-bold text-white">GE-CLM-001</p>
            <p className="text-sm font-semibold text-neutral-400">04 Nov 2024 · STFI flood</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-orange-400 tabular-nums">₹1,243.50</p>
            <span className="mt-1 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-black text-emerald-300">
              Auto approved
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 rounded-2xl border border-orange-500/25 bg-orange-950/20 p-4 backdrop-blur-md">
        <Info size={22} className="mt-0.5 shrink-0 text-orange-400" strokeWidth={2} />
        <p className="text-sm font-semibold leading-relaxed text-orange-100/90">
          You do not need to upload bills. Payouts run when a certified event and your platform income both match the rules.
        </p>
      </div>
    </div>
  );
};

export default ClaimsOverview;
