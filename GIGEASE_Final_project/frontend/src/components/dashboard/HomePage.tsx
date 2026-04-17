import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Bell, Shield, Zap, Headset, Settings } from 'lucide-react';
import { DEMO_WORKERS, DEMO_ACTIVE_DISRUPTION } from '../../data/demoData';
import { PageLoadFallback } from '../shared/PageLoadFallback';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useWorkerViewMode } from '../../contexts/WorkerViewModeContext';

const springTap = { type: 'spring' as const, stiffness: 500, damping: 22 };
const jiggleHover = { scale: 1.02 };
const jiggleTap = { scale: 0.95 };

function useAnimatedNumber(target: number, duration = 1200) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration, bounce: 0 });
  const display = useTransform(spring, v => Math.round(v).toLocaleString('en-IN'));
  useEffect(() => {
    motionVal.set(target);
  }, [target, motionVal]);
  return display;
}

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { mobilePreview } = useWorkerViewMode();
  // Single-column layout when: real mobile device OR desktop mobile-preview mode
  const isMobileLayout = !isDesktop || mobilePreview;
  const [loading, setLoading] = useState(true);
  const [showDisruption, setShowDisruption] = useState(false);
  const w = DEMO_WORKERS.W001;

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  const coverageDisplay = useAnimatedNumber(w.sumInsured);
  const incomeDisplay = useAnimatedNumber(w.weeklyActual);

  const threshold = w.weeklyExpected * 0.6;
  const incomeBarPct = Math.min(100, (w.weeklyActual / w.weeklyExpected) * 100);
  const thresholdPct = (threshold / w.weeklyExpected) * 100;
  const belowThreshold = w.weeklyActual < threshold;

  if (loading) {
    return <PageLoadFallback />;
  }

  return (
    <div className="w-full animate-in fade-in zoom-in-95 duration-500">

      {/* ── Page Header: Greeting + Bell ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="font-sans text-[13px] font-black tracking-tight text-[#FF7A00] mb-0.5">
            GigEase
          </div>
          <h1 className="text-[26px] font-black text-white leading-tight tracking-tight mb-2">
            {t('hi_worker')}
            <span className="ml-1.5" aria-hidden>👋</span>
          </h1>
          <div className="flex items-center gap-2">
            <span className="bg-red-950/80 text-red-500 text-[10px] font-bold px-3 py-1 rounded-full border border-red-900/60 uppercase">
              Zomato
            </span>
            <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
              <span className="text-neutral-600">⌇</span> Velachery
            </span>
          </div>
        </div>
        <motion.div className="flex-shrink-0 mt-1" whileTap={jiggleTap} whileHover={jiggleHover} transition={springTap}>
          <button
            type="button"
            onClick={() => navigate('/profile/notifications')}
            className="flex items-center justify-center rounded-full transition-colors relative h-12 w-12"
          >
            <Bell size={24} className="text-white drop-shadow-md" strokeWidth={2} />
            <span className="absolute top-1 right-2 min-w-[20px] h-[20px] bg-red-600 rounded-full text-white text-[11px] font-bold flex items-center justify-center border-2 border-[#0a0808]">
              3
            </span>
          </button>
        </motion.div>
      </div>

      {/* ── Main card grid ── single col on mobile/preview, 2-col on desktop */}
      <div className={`grid grid-cols-1 gap-5 pb-8 ${!isMobileLayout ? 'md:grid-cols-2' : ''}`}>

        {/* Active Disruption Card */}
        {w.claimTriggered && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={jiggleHover}
            whileTap={jiggleTap}
            transition={springTap}
            onClick={() => setShowDisruption(true)}
            className="w-full rounded-[24px] border border-orange-500/40 bg-gradient-to-b from-[#16100c] to-[#0d0906] p-6 text-left shadow-[0_4px_30px_rgba(234,88,12,0.1)] overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full bg-[#FF7A00] animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-[#FF7A00]">
                ACTIVE DISRUPTION
              </span>
            </div>
            <p className="text-sm font-semibold text-neutral-400 mb-6">Flood Level 4 — Velachery, Adyar</p>
            <p className="text-[40px] leading-none font-black tabular-nums text-[#FF7A00] tracking-tight mb-2">
              ₹1,243.5
            </p>
            <p className="text-xs font-semibold text-neutral-500">Estimated Payout</p>
          </motion.button>
        )}

        {/* Income Threshold Card */}
        <div className="rounded-[24px] border border-neutral-800 bg-gradient-to-b from-[#141210] to-[#0a0a0a] p-6">
          <p className="mb-5 text-[11px] font-black uppercase tracking-widest text-neutral-400">
            {t('threshold')}
          </p>
          <div className="relative h-2 bg-neutral-900 rounded-full mb-3 shadow-inner">
            <div
              className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-neutral-500 z-10"
              style={{ left: `${thresholdPct}%` }}
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${incomeBarPct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-red-600 via-[#FF7A00] to-[#FF7A00]"
            />
          </div>
          <div className="flex justify-between font-sans text-[10px] tabular-nums text-neutral-500 font-bold mb-6">
            <span>Current: ₹{w.weeklyActual.toLocaleString('en-IN')}</span>
            <span>Threshold: ₹{Math.round(w.weeklyExpected).toLocaleString('en-IN')}</span>
          </div>
          {belowThreshold && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <div className="inline-flex items-center rounded-xl border border-red-900/50 bg-[#1a0a0a] px-4 py-2">
                <span className="text-[11px] font-bold text-red-500 px-1">
                  Below Threshold
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Coverage Card */}
        <div className="rounded-[24px] border border-neutral-800 bg-gradient-to-b from-[#141210] to-[#0a0a0a] flex flex-col justify-between overflow-hidden relative shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="p-6 pb-8">
            <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-4">
              {t('coverage')}
            </p>
            <motion.p className="text-[44px] leading-none font-black text-[#FF7A00] tabular-nums tracking-tight">
              ₹<motion.span>{coverageDisplay}</motion.span>
            </motion.p>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-neutral-800/80 bg-black/40 p-5 mt-auto">
            <div className="min-w-0 border-r border-neutral-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1.5">MONTHLY INCOME</p>
              <p className="text-[19px] font-black tabular-nums text-white">
                ₹<motion.span>{incomeDisplay}</motion.span>
              </p>
            </div>
            <div className="min-w-0 pl-1 relative">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1.5">EXPECTED PAYOUT</p>
              <p className="text-[19px] font-black tabular-nums text-[#FF7A00]">₹1,243</p>
              <div className="absolute -right-1 -top-4 w-[42px] h-[42px] rounded-full bg-gradient-to-br from-[#FF7A00] to-[#E65100] flex items-center justify-center shadow-[0_0_20px_rgba(255,122,0,0.4)]">
                <Settings size={18} className="text-white" strokeWidth={2} />
              </div>
            </div>
          </div>
        </div>

        {/* Premium Amount Card */}
        <div className="w-full rounded-[24px] border border-neutral-800 bg-gradient-to-b from-[#141210] to-[#0a0a0a] p-6 text-left">
          <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-3">{t('premium')}</p>
          <p className="text-[40px] leading-none font-black tabular-nums text-[#FF7A00] mb-2 tracking-tight">
            ₹249
          </p>
          <p className="text-[11px] font-semibold text-neutral-500">per month</p>
        </div>

        {/* Premium History Row */}
        <motion.button
          whileHover={jiggleHover}
          whileTap={jiggleTap}
          onClick={() => navigate('/premium/history')}
          className="w-full rounded-[20px] border border-neutral-800 bg-[#0f0f0f] py-5 px-6 flex justify-between items-center group transition-colors hover:bg-[#1a120d] hover:border-orange-500/30"
        >
          <span className="text-[13px] font-bold text-neutral-300">Premium History</span>
          <span className="text-neutral-500 group-hover:text-orange-500 transition-colors">›</span>
        </motion.button>

        {/* Quick Actions */}
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-4 px-1">QUICK ACTIONS</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Zap, label: 'File Claim', to: '/claims', color: '#EF4444' },
              { icon: Shield, label: 'View Policy', to: '/policy', color: '#3B82F6' },
              { icon: Headset, label: 'Pay Premium', to: '/profile/help', color: '#10B981' },
            ].map(({ icon: Icon, label, to, color }) => (
              <motion.button
                key={to}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={jiggleTap}
                transition={springTap}
                onClick={() => navigate(to)}
                className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-neutral-800/80 bg-[#121212] p-5 transition-colors hover:border-neutral-600 aspect-square"
                aria-label={label}
              >
                <Icon size={24} style={{ color }} strokeWidth={2} />
                <span className="text-[10px] font-bold text-neutral-300 text-center leading-tight whitespace-nowrap overflow-hidden text-ellipsis w-full px-1">{label}</span>
              </motion.button>
            ))}
          </div>
        </div>

      </div>

      {/* Disruption Sheet */}
      <AnimatePresence>
        {showDisruption && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={() => setShowDisruption(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#111111] border-t border-neutral-800 w-full max-w-lg rounded-t-3xl p-6 shadow-[0_-8px_40px_rgba(0,0,0,0.6)]"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="bg-gradient-to-r from-red-700 to-red-900 text-white text-xs font-black px-3 py-1 rounded-full border border-red-950">
                  STFI
                </span>
                <button
                  type="button"
                  onClick={() => setShowDisruption(false)}
                  className="text-neutral-500 text-lg font-black hover:text-white w-10 h-10 rounded-full hover:bg-neutral-900"
                >
                  ×
                </button>
              </div>
              <h3 className="text-lg font-black text-white mb-1">{DEMO_ACTIVE_DISRUPTION.title}</h3>
              <p className="text-sm text-neutral-400 mb-4">
                {DEMO_ACTIVE_DISRUPTION.startDate} to {DEMO_ACTIVE_DISRUPTION.endDate} | Rainfall: {DEMO_ACTIVE_DISRUPTION.rainfallMm}mm
              </p>
              <div className="bg-black rounded-xl p-3 mb-4 border border-neutral-800">
                <p className="text-xs text-neutral-500">Estimated payout</p>
                <p className="text-2xl font-black text-[#FF7A00] tabular-nums">₹{DEMO_ACTIVE_DISRUPTION.estimatedPayout.toLocaleString('en-IN')}</p>
              </div>
              <motion.button
                type="button"
                whileHover={jiggleHover}
                whileTap={jiggleTap}
                transition={springTap}
                onClick={() => navigate('/claims/GE-CLM-001/pipeline')}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(234,88,12,0.5)] border border-orange-400/20"
              >
                Track your claim
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;
