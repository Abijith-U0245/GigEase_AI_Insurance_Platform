import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export type ClaimWeek = {
  week_start_date?: string;
  week_number_in_history?: number;
  weekly_premium_inr?: number;
  claim_triggered?: number;
  claim_amount_inr?: number;
  fraud_action?: string;
  soft_flag_hold?: boolean;
  pay_immediate?: number;
  pay_held?: number;
  income_drop_pct?: number;
  stfi_event_confirmed?: number;
  rsmd_event_confirmed?: number;
  w_expected?: number;
  w_actual?: number;
  rsmd_event_type?: string;
  /** Backend ML + rules narrative */
  ml_claim_rationale?: string;
};

type PremiumWeek = ClaimWeek & {
  base_premium?: number;
  seasonal_load?: number;
  claim_load?: number;
  breakdown_steps?: { step: number; label: string; result: number }[];
  premium_rationale?: string;
  claim_triggered_this_week?: number;
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

export const ClaimWeekCard: React.FC<{
  week: ClaimWeek;
  visible: boolean;
  delay: number;
}> = ({ week, visible, delay }) => {
  const fraud = week.fraud_action || 'AUTO_APPROVE';
  const isReject = fraud === 'AUTO_REJECT';
  const isSoft = !isReject && (fraud === 'SOFT_FLAG' || week.soft_flag_hold);
  const isClaim = !isReject && !isSoft && week.claim_triggered === 1 && fraud === 'AUTO_APPROVE';

  if (!visible) {
    const w = isClaim ? 'w-[128px]' : 'w-[80px]';
    return <div className={`${w} shrink-0`} aria-hidden />;
  }

  if (isReject) {
    const estRaw = Math.max(0, Math.round((week.w_expected ?? 0) * 0.35));
    return (
      <motion.div
        initial={{ opacity: 0, x: 12, scale: 0.92 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="flex w-[92px] shrink-0 flex-col items-center rounded-xl border-2 border-[#EF4444] bg-[#141414] px-1.5 py-2"
      >
        <span className="text-[9px] text-neutral-500">{formatDate(week.week_start_date)}</span>
        <span className="mt-0.5 rounded-full bg-red-600 px-1.5 py-0.5 text-[8px] font-black uppercase text-white">
          BLOCKED
        </span>
        <span className="mt-1 text-base" aria-hidden>
          🚫
        </span>
        <span className="text-sm font-black text-white">₹0</span>
        {estRaw > 0 && (
          <span className="text-[9px] text-neutral-500 line-through">est. ₹{estRaw.toLocaleString('en-IN')}</span>
        )}
        <span className="mt-0.5 text-center text-[8px] font-bold leading-tight text-red-300">GPS Fraud Detected</span>
      </motion.div>
    );
  }

  if (isSoft) {
    const paid = Math.round(week.pay_immediate ?? 0);
    const held = Math.round(week.pay_held ?? 0);
    return (
      <motion.div
        initial={{ opacity: 0, x: 12, scale: 0.92 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="flex w-[100px] shrink-0 flex-col items-center rounded-xl border-2 border-[#F59E0B] bg-[#141414] px-1.5 py-2"
      >
        <span className="text-[9px] text-neutral-500">{formatDate(week.week_start_date)}</span>
        <span className="mt-0.5 rounded-full bg-amber-600/90 px-1.5 py-0.5 text-[7px] font-black uppercase text-black">
          UNDER REVIEW
        </span>
        <span className="mt-1 text-base" aria-hidden>
          ⚠️
        </span>
        <span className="text-[10px] font-bold text-green-400">₹{paid.toLocaleString('en-IN')} paid</span>
        <span className="text-[10px] font-bold text-amber-400">₹{held.toLocaleString('en-IN')} held</span>
      </motion.div>
    );
  }

  if (isClaim) {
    const prem = Math.round(week.weekly_premium_inr ?? 0);
    const payout = Math.round(week.claim_amount_inr ?? 0);
    const drop = week.income_drop_pct != null && week.income_drop_pct > 0 ? Math.round(week.income_drop_pct) : null;
    const icon =
      week.stfi_event_confirmed === 1 ? '🌊' : week.rsmd_event_confirmed === 1 ? '✊' : '☀️';

    return (
      <motion.div
        initial={{ opacity: 0, x: 12, scale: 0.92 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="shrink-0"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.55, ease: 'easeInOut', repeat: 2 }}
          className="flex min-h-[132px] w-[128px] flex-col items-center justify-between rounded-xl border-2 border-[#FF5722] bg-[#141414] px-2 py-2.5 shadow-[0_0_16px_rgba(255,87,34,0.45)]"
        >
          <span className="text-[9px] text-neutral-400">{formatDate(week.week_start_date)}</span>
          <span className="mt-0.5 rounded-full bg-red-600 px-2 py-0.5 text-[8px] font-black uppercase text-white">
            CLAIM
          </span>
          <span className="mt-0.5 text-lg leading-none" aria-hidden>
            {icon}
          </span>
          <span className="mt-1 text-base font-black tabular-nums leading-none text-green-400">
            ₹{payout.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] leading-tight text-neutral-400">₹{prem} premium</span>
          {drop != null && <span className="text-[9px] font-bold leading-tight text-red-400">↓{drop}% income</span>}
          {week.ml_claim_rationale ? (
            <p className="mt-1 max-h-[4.5rem] w-full overflow-hidden text-[8px] font-semibold leading-snug text-amber-200/90 [display:-webkit-box] [-webkit-line-clamp:4] [-webkit-box-orient:vertical]">
              {week.ml_claim_rationale}
            </p>
          ) : null}
        </motion.div>
      </motion.div>
    );
  }

  /* Normal week */
  const prem = Math.round(week.weekly_premium_inr ?? 0);
  return (
    <motion.div
      initial={{ opacity: 0, x: 12, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-[104px] w-[80px] shrink-0 flex-col items-center justify-between rounded-xl border border-[#22C55E] bg-[#141414] px-1 py-2"
    >
      <span className="text-[9px] text-neutral-500">{formatDate(week.week_start_date)}</span>
      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#22C55E] bg-green-500/15">
        <Check className="h-4 w-4 text-[#22C55E]" strokeWidth={3} aria-hidden />
      </div>
      <span className="text-[11px] font-bold tabular-nums text-white">₹{prem}</span>
    </motion.div>
  );
};

export const PremiumWeekCard: React.FC<{
  week: PremiumWeek;
  visible: boolean;
  delay: number;
  size?: 'sm' | 'comfortable';
}> = ({ week, visible, delay, size = 'sm' }) => {
  const comfy = size === 'comfortable';
  if (!visible) return <div className={`${comfy ? 'w-[8.5rem]' : 'w-24'} shrink-0`} aria-hidden />;

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className={`flex shrink-0 flex-col rounded-xl border border-orange-500/20 bg-black/50 px-2.5 py-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-md md:px-3 md:py-3 ${
        comfy ? 'min-h-[158px] w-[min(9.25rem,42vw)] md:w-40' : 'w-28 border-neutral-700 bg-[#141414]'
      }`}
    >
      <span className={`text-neutral-500 ${comfy ? 'text-[11px] font-semibold' : 'text-[9px]'}`}>
        {formatDate(week.week_start_date)}
      </span>
      <span className={`text-neutral-400 ${comfy ? 'text-xs font-bold' : 'text-[10px]'}`}>
        W{week.week_number_in_history}
      </span>
      <span className={`mt-1 text-neutral-400 ${comfy ? 'text-xs' : 'text-[10px]'}`}>
        Base ₹{Math.round(week.base_premium ?? 0)}
      </span>
      <span className={`text-neutral-400 ${comfy ? 'text-xs' : 'text-[10px]'}`}>
        +S ₹{Math.round(week.seasonal_load ?? 0)}
      </span>
      <span className={`text-neutral-400 ${comfy ? 'text-xs' : 'text-[10px]'}`}>
        +L ₹{Math.round(week.claim_load ?? 0)}
      </span>
      <span
        className={`mt-1 font-black tabular-nums text-orange-300 ${comfy ? 'text-lg md:text-xl' : 'text-sm text-primary'}`}
      >
        ₹{Math.round(week.weekly_premium_inr ?? 0)}
      </span>
      {(week.claim_triggered === 1 || week.claim_triggered_this_week === 1) && (
        <span className={`font-bold uppercase text-red-400 ${comfy ? 'text-[10px]' : 'text-[8px]'}`}>Claim week</span>
      )}
      {week.premium_rationale ? (
        <p
          className={`mt-1.5 border-t border-orange-500/15 pt-1.5 font-semibold leading-snug text-amber-200/90 [display:-webkit-box] [-webkit-line-clamp:5] [-webkit-box-orient:vertical] ${
            comfy ? 'text-[11px]' : 'max-h-[3.2rem] overflow-hidden text-[8px]'
          }`}
        >
          {week.premium_rationale}
        </p>
      ) : null}
    </motion.div>
  );
};
