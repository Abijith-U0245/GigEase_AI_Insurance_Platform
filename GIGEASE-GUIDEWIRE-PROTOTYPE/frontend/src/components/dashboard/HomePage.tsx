import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Bell, Shield, Zap, Headset, Hand, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DEMO_WORKERS, DEMO_ACTIVE_DISRUPTION } from '../../data/demoData';
import { PageLoadFallback } from '../shared/PageLoadFallback';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useWorkerViewMode } from '../../contexts/WorkerViewModeContext';
import { BrandLogo } from '../shared/BrandLogo';

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
  /** Real phone or desktop “mobile app view” preview — matches mobile dashboard reference. */
  const mobileAppShell = !isDesktop || mobilePreview;
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
    <div className="w-full max-w-6xl space-y-5 overflow-x-hidden md:space-y-7">
      {/* Title row — aligned with content column; bell vertically centered to greeting block */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          {mobileAppShell && (
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-2 ring-orange-500/35">
                <BrandLogo variant="inline" className="h-9 w-9 max-w-none object-cover" blendOnDark={false} alt="" />
              </div>
              <span className="font-sans text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-300">
                GigEase
              </span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
              {t('hi_worker')}
              {mobileAppShell && (
                <span className="ml-0.5" aria-hidden>
                  👋
                </span>
              )}
            </h1>
            {!mobileAppShell && <Hand className="w-6 h-6 text-orange-500 hidden sm:inline-block" strokeWidth={2} aria-hidden />}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="bg-red-950/80 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-900/80">
              Zomato
            </span>
            <span className="text-sm font-semibold text-neutral-300">Velachery zone</span>
          </div>
        </div>
        <motion.div className="relative flex-shrink-0 self-start sm:self-center" whileTap={jiggleTap} whileHover={jiggleHover} transition={springTap}>
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => navigate('/profile/notifications')}
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-neutral-900 border border-transparent hover:border-neutral-800"
          >
            <Bell size={22} className="text-white" strokeWidth={1.8} />
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-0.5 bg-gradient-to-br from-red-600 to-red-800 rounded-full text-white text-[9px] font-black flex items-center justify-center border border-red-950">
              2
            </span>
          </button>
        </motion.div>
      </div>

      <div className="space-y-5 md:grid md:grid-cols-2 md:items-stretch md:gap-8 md:space-y-0">
        {/* LEFT: disruption + coverage */}
        <div className="flex flex-col space-y-4 min-h-0 md:h-full">
          {w.claimTriggered && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={jiggleHover}
              whileTap={jiggleTap}
              transition={springTap}
              onClick={() => setShowDisruption(true)}
              className="w-full overflow-hidden rounded-2xl border-2 border-orange-400/50 bg-gradient-to-br from-amber-100/[0.14] via-[#1a1208] to-black p-4 text-left shadow-[0_12px_40px_rgba(234,88,12,0.18)] backdrop-blur-md md:p-5"
            >
              <div className="flex items-start gap-3">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(234,88,12,0.8)]"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-black leading-snug text-white md:text-lg">STFI flood alert · Velachery</p>
                  <p className="mt-1 text-sm font-semibold text-amber-100/80">{t('claim_in_progress')}</p>
                  <p className="mt-3 font-sans text-3xl font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-red-400 md:text-4xl">
                    ₹1,243.5 {t('payout_incoming')}
                  </p>
                  <span className="mt-2 inline-block text-sm font-black text-orange-400">{t('track')} →</span>
                </div>
              </div>
            </motion.button>
          )}

          <div className="overflow-hidden rounded-2xl border border-neutral-800 border-t-4 border-t-orange-500 bg-gradient-to-b from-[#141210] to-[#0a0a0a] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.45)] md:p-6">
            <p className="text-xs font-black uppercase tracking-widest text-orange-400/80">{t('coverage')}</p>
            <motion.p className="text-[36px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-red-400 tabular-nums drop-shadow-[0_0_16px_rgba(255,87,34,0.35)] md:text-[44px]">
              ₹<motion.span>{coverageDisplay}</motion.span>
            </motion.p>
            <div className="mt-5 grid grid-cols-2 gap-0 border-t border-neutral-800 pt-5">
              <div className="min-w-0 pr-3">
                <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{t('this_weeks_income')}</p>
                <p className="mt-1 text-2xl font-black tabular-nums text-white md:text-3xl">
                  ₹<motion.span>{incomeDisplay}</motion.span>
                </p>
              </div>
              <div className="min-w-0 border-l border-neutral-800 pl-4 text-right">
                <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{t('expected')}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-neutral-400 md:text-3xl">₹5,000</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: threshold, premium, actions — top-aligned with left column */}
        <div className="flex flex-col space-y-4 min-h-0 md:h-full">
          <div className="overflow-hidden rounded-2xl border border-neutral-800 border-t-2 border-t-orange-500/80 bg-[#111111] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.45)] md:p-5">
            <p className="mb-3 text-sm font-bold text-neutral-300">
              {t('threshold')}: ₹{threshold.toLocaleString('en-IN')}{' '}
              <span className="font-semibold text-neutral-500">(60% of expected)</span>
            </p>
            <div className="relative h-3 bg-neutral-900 rounded-full overflow-visible mb-1 border border-neutral-800">
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-neutral-500 z-10 rounded-full"
                style={{ left: `${thresholdPct}%` }}
                title="Threshold"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${incomeBarPct}%` }}
                transition={{ duration: 0.85, ease: 'easeOut' }}
                className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-[0_0_12px_rgba(234,88,12,0.5)]"
              />
            </div>
            <div className="mt-1 flex justify-between font-mono text-xs tabular-nums text-neutral-500">
              <span>₹1,600</span>
              <span>₹5,000</span>
            </div>
            {belowThreshold && (
              <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-3">
                <span className="inline-block rounded-full border border-red-800 bg-red-950/60 px-3 py-1.5 text-sm font-black text-red-300">
                  {t('below_threshold')}
                </span>
              </motion.div>
            )}
          </div>

          <motion.button
            type="button"
            whileHover={jiggleHover}
            whileTap={jiggleTap}
            transition={springTap}
            onClick={() => navigate('/premium')}
            className="relative w-full overflow-hidden rounded-2xl border border-neutral-800 border-t-2 border-t-orange-500/80 bg-[#111111] p-4 text-left shadow-[0_4px_24px_rgba(0,0,0,0.45)] hover:border-orange-500/40 md:p-5"
          >
            <p className="text-xs font-black uppercase tracking-widest text-orange-400/90">{t('this_weeks_premium')}</p>
            <p className="mt-1 text-3xl font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 drop-shadow-[0_0_12px_rgba(255,87,34,0.35)] md:text-4xl">
              ₹170<span className="text-lg font-bold text-neutral-500">/week</span>
            </p>
            <p className="mt-2 text-sm font-semibold tabular-nums text-neutral-400">Next deduction: Monday 07-Apr-2026</p>
          </motion.button>

          <motion.button
            type="button"
            whileHover={jiggleHover}
            whileTap={jiggleTap}
            transition={springTap}
            onClick={() => navigate('/premium/history')}
            className="w-full rounded-2xl border border-orange-500/25 bg-gradient-to-r from-orange-950/40 to-neutral-950 px-4 py-3.5 text-left shadow-[0_4px_24px_rgba(234,88,12,0.15)] hover:border-orange-500/45"
          >
            <p className="text-xs font-black uppercase tracking-widest text-orange-500">Premium</p>
            <p className="text-sm font-bold text-white">View premium history &amp; breakdown</p>
            <p className="text-xs text-neutral-500 mt-1">8-step formula · same data as your policy</p>
          </motion.button>

          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {[
              { icon: Shield, label: t('my_policy'), to: '/policy', color: '#FF5722' },
              { icon: Zap, label: t('my_claims'), to: '/claims', color: '#EF4444' },
              { icon: Headset, label: t('contact_support'), to: '/profile/help', color: '#FB923C' },
            ].map(({ icon: Icon, label, to, color }) => (
              <motion.button
                key={to}
                type="button"
                whileHover={jiggleHover}
                whileTap={jiggleTap}
                transition={springTap}
                onClick={() => navigate(to)}
                className="flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-2xl border border-neutral-800 border-t-2 border-t-orange-500/60 bg-[#111111] p-3 shadow-[0_4px_20px_rgba(0,0,0,0.35)] hover:border-orange-500/30 md:min-h-[112px] md:p-4"
                aria-label={label}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-neutral-800"
                  style={{ background: `${color}14`, boxShadow: `0 0 16px ${color}22` }}
                >
                  <Icon size={20} style={{ color }} strokeWidth={2.2} />
                </div>
                <span className="text-[11px] md:text-xs font-bold text-neutral-200 text-center leading-tight">{label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {mobileAppShell && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          transition={springTap}
          onClick={() => navigate('/profile')}
          className="fixed bottom-28 right-4 z-[90] w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-[0_4px_24px_rgba(234,88,12,0.55)] border border-orange-400/40 flex items-center justify-center md:bottom-28"
          aria-label="Profile & settings"
          title="Profile & settings"
        >
          <Settings size={24} strokeWidth={2} />
        </motion.button>
      )}

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
                <p className="text-2xl font-black text-primary tabular-nums">₹{DEMO_ACTIVE_DISRUPTION.estimatedPayout.toLocaleString('en-IN')}</p>
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
