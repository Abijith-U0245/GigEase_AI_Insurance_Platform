import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ClaimWeek } from './WeekCard';

export const SimulationSummaryBar: React.FC<{
  weeks: ClaimWeek[];
  upToIndex: number;
  /** Admin modal: English labels regardless of language switcher */
  forceEnglish?: boolean;
}> = ({ weeks, upToIndex, forceEnglish = false }) => {
  const { t } = useTranslation();
  /* currentStep -1 = reset: UI shows all weeks; totals must match that “full history” view */
  const slice = upToIndex < 0 ? weeks : weeks.slice(0, upToIndex + 1);
  const premium = slice.reduce((s, w) => s + (w.weekly_premium_inr ?? 0), 0);
  const payout = slice.reduce((s, w) => s + (w.claim_amount_inr ?? 0), 0);
  const net = premium - payout;
  const premR = Math.round(premium);
  const payR = Math.round(payout);
  const netR = Math.round(net);

  const netNegative = net < 0;
  const subLabel =
    payR === 0
      ? forceEnglish
        ? 'No claims yet ✓'
        : t('sim_sum_no_claims')
      : netNegative
        ? forceEnglish
          ? 'You received more than you paid ✓'
          : t('sim_sum_net_neg')
        : '';

  const lp = (key: string, en: string) => (forceEnglish ? en : t(key));

  return (
    <div className="shrink-0 border-t border-violet-500/20 bg-gradient-to-r from-black/95 via-[#0c0614]/98 to-black/95 px-4 py-3.5 backdrop-blur-md">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm md:text-[15px]">
        <span className="text-neutral-400">
          {lp('sim_sum_premium_paid', 'Premium paid:')}{' '}
          <strong className="text-white tabular-nums">₹{premR.toLocaleString('en-IN')}</strong>
        </span>
        <span className="text-neutral-400">
          {lp('sim_sum_payout', 'Payouts received:')}{' '}
          <strong className="text-green-400 tabular-nums">₹{payR.toLocaleString('en-IN')}</strong>
        </span>
        <span className={netNegative ? 'text-red-400' : 'text-green-400'}>
          {lp('sim_sum_net', 'Net:')}{' '}
          <strong className="tabular-nums">
            {netR < 0 ? '−' : ''}₹{Math.abs(netR).toLocaleString('en-IN')}
          </strong>
        </span>
      </div>
      {subLabel && <p className="mt-2 text-center text-xs text-violet-200/70">{subLabel}</p>}
    </div>
  );
};
