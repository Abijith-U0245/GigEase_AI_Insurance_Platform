import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, PartyPopper } from 'lucide-react';
import { useToast } from '../shared/Toast';
import { ClaimSimulationTimeline } from '../simulation/ClaimSimulationTimeline';

/** Human-readable steps — horizontal detail strip below the same timeline as admin. */
const PIPELINE_STEPS = [
  { id: 1, title: 'Disruption confirmed', detail: 'National and weather agencies verified heavy rain in your zone · 04 Nov 06:00', status: 'done' as const },
  { id: 2, title: 'Affected workers listed', detail: 'Velachery pool locked — you are included in this event', status: 'done' as const },
  { id: 3, title: 'Policy check', detail: 'Cover GE-2024-VEL-001 is active for STFI', status: 'done' as const },
  { id: 4, title: 'Weekly income from platform', detail: 'Zomato reported ₹1,600 for this week', status: 'done' as const },
  { id: 5, title: 'Below safety line', detail: '₹1,600 is under 60% of your usual ₹5,000 — trigger applies', status: 'done' as const },
  { id: 6, title: 'Income gap', detail: 'Covered shortfall ₹3,400 for this week', status: 'done' as const },
  { id: 7, title: 'Gross payout (before checks)', detail: '80% of gap → ₹2,720', status: 'done' as const },
  { id: 8, title: 'Fraud and risk review', detail: '17 automated checks · score 0.12 · cleared', status: 'done' as const },
  { id: 9, title: 'Within your cover limit', detail: 'Payout fits inside ₹7,500 sum insured', status: 'done' as const },
  { id: 10, title: 'Pool health', detail: 'Shared fund above 30% reserve — OK to pay', status: 'done' as const },
  { id: 11, title: 'UPI payout', detail: 'pay_demo_001 → arunS@okaxis', status: 'processing' as const },
  { id: 12, title: 'Phone alert', detail: 'Push when transfer completes', status: 'pending' as const },
  { id: 13, title: 'Policy record', detail: 'Small premium loading until pool balances', status: 'pending' as const },
];

type StepStatus = 'done' | 'processing' | 'pending';

const springHover = { scale: 1.03, y: -2 };

const PipelineTracker: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToast } = useToast();
  const [steps, setSteps] = useState(PIPELINE_STEPS);
  const [simulating, setSimulating] = useState(false);
  const [complete, setComplete] = useState(false);

  const simulate = () => {
    setSimulating(true);
    const toProcess = [11, 12, 13];
    toProcess.forEach((stepId, i) => {
      setTimeout(() => {
        setSteps((prev) =>
          prev.map((s) => {
            if (s.id === stepId)
              return {
                ...s,
                status: 'done' as StepStatus,
                detail:
                  stepId === 11 ? 'Paid · UPI success' : stepId === 12 ? 'Notification sent' : '5% claim loading on next premium',
              };
            if (s.id === stepId + 1) return { ...s, status: 'processing' as StepStatus };
            return s;
          }),
        );
        if (i === toProcess.length - 1) {
          setTimeout(() => {
            setSimulating(false);
            setComplete(true);
            addToast('success', t('pipeline_toast_done'));
          }, 1200);
        }
      }, i * 1500);
    });
  };

  const getBadge = (status: StepStatus) => {
    if (status === 'done')
      return (
        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-500/40">
          {t('pipeline_badge_done')}
        </span>
      );
    if (status === 'processing')
      return (
        <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-sky-300 ring-1 ring-sky-500/40">
          {t('pipeline_badge_active')}
        </span>
      );
    return (
      <span className="rounded-full bg-neutral-600/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-neutral-400">
        {t('pipeline_badge_waiting')}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 md:px-4">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          onClick={() => navigate(`/claims/${id || 'GE-CLM-001'}`)}
          aria-label={t('back')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-orange-500/30 bg-black/40 text-orange-400 backdrop-blur-md transition-colors hover:bg-orange-500/10"
        >
          <ArrowLeft size={22} strokeWidth={2} />
        </button>
        <div className="min-w-0">
          <h1 className="font-sans text-2xl font-black tracking-tight text-white md:text-3xl">{t('pipeline_title')}</h1>
          <p className="mt-0.5 text-sm font-semibold text-neutral-400">{t('pipeline_subtitle')}</p>
        </div>
      </div>

      <div className="mb-5 overflow-hidden rounded-2xl border border-orange-500/25 bg-gradient-to-br from-amber-950/30 via-[#141008] to-black p-4 text-center shadow-[0_0_40px_rgba(234,88,12,0.12)] backdrop-blur-md md:p-5">
        <p className="text-lg font-black text-white md:text-xl">
          Arun S · <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-red-400">₹1,243.50</span>
        </p>
        <p className="mt-1 text-sm font-semibold text-amber-200/80">GE-CLM-001 · STFI flood · 04 Nov 2024</p>
      </div>

      <div className="mb-6 overflow-hidden rounded-2xl border border-orange-500/20 bg-black/45 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-md">
        <div className="border-b border-orange-500/15 bg-gradient-to-r from-orange-950/35 to-transparent px-4 py-3">
          <p className="text-xs font-black uppercase tracking-widest text-orange-400">{t('pipeline_timeline_heading')}</p>
          <p className="mt-1 text-sm text-neutral-400">{t('pipeline_timeline_sub')}</p>
        </div>
        <div className="max-h-[min(520px,70vh)] min-h-[280px] overflow-hidden p-3 md:max-h-[min(580px,75vh)] md:p-4">
          <ClaimSimulationTimeline workerId="T001" isAdmin={false} />
        </div>
      </div>

      <div className="relative mb-6 overflow-hidden rounded-2xl border border-neutral-800/80 bg-black/40 p-3 shadow-inner backdrop-blur-md md:p-4">
        <p className="mb-3 text-xs font-black uppercase tracking-widest text-orange-400/90">{t('pipeline_steps_heading')}</p>
        <div className="flex gap-2 overflow-x-auto pb-3 pt-1 [scrollbar-width:thin] md:gap-3">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 380, damping: 26 }}
                whileHover={springHover}
                className={`flex w-[min(200px,78vw)] shrink-0 flex-col rounded-2xl border px-3 py-3 shadow-lg md:w-[220px] md:px-4 md:py-4 ${
                  s.status === 'processing'
                    ? 'border-orange-500 bg-gradient-to-b from-orange-950/50 to-black/90 shadow-orange-500/20 ring-2 ring-orange-500/40'
                    : s.status === 'done'
                      ? 'border-emerald-600/40 bg-gradient-to-b from-emerald-950/25 to-neutral-950/90'
                      : 'border-neutral-700/80 bg-neutral-950/80'
                }`}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-orange-500/40 bg-orange-500/10 font-mono text-xs font-black text-orange-300">
                    {i + 1}
                  </span>
                  {s.status === 'done' && <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" strokeWidth={2.2} />}
                </div>
                <p className="text-sm font-bold leading-snug text-white md:text-base">{s.title}</p>
                {s.detail ? <p className="mt-2 text-xs font-medium leading-relaxed text-neutral-300 md:text-sm">{s.detail}</p> : null}
                <div className="mt-3">{getBadge(s.status)}</div>
              </motion.div>
              {i < steps.length - 1 && (
                <div className="flex shrink-0 items-center text-lg font-black text-orange-500/50" aria-hidden>
                  →
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {complete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 rounded-2xl border-2 border-emerald-500/50 bg-emerald-950/30 p-5 text-center backdrop-blur-md"
          >
            <PartyPopper className="mx-auto mb-2 h-10 w-10 text-emerald-400" strokeWidth={1.8} aria-hidden />
            <p className="text-2xl font-black text-emerald-300">{t('pipeline_complete_title')}</p>
            <p className="mt-1 text-base font-semibold text-white">{t('pipeline_complete_sub')}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!complete && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={simulate}
          disabled={simulating}
          className="w-full rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 py-4 text-base font-black text-black shadow-[0_8px_32px_rgba(234,88,12,0.45)] disabled:opacity-50"
        >
          {simulating ? t('pipeline_finishing') : t('pipeline_finish_btn')}
        </motion.button>
      )}
    </div>
  );
};

export default PipelineTracker;
