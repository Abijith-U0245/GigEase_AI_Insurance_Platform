import React from 'react';
import { motion } from 'framer-motion';
import { ClaimWeekCard, PremiumWeekCard, type ClaimWeek } from './WeekCard';

type MonthBlock = {
  month_year?: string;
  month_label?: string;
  weeks: ClaimWeek[];
};

export const ClaimMonthSection: React.FC<{
  month: MonthBlock;
  globalIndexStart: number;
  currentStep: number;
  monthIdx: number;
}> = ({ month, globalIndexStart, currentStep, monthIdx }) => (
  <motion.section
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: monthIdx * 0.08, duration: 0.35 }}
    className="mb-6"
  >
    <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-orange-500/90">
      {month.month_year ?? month.month_label}
    </h3>
    <div className="flex flex-wrap items-stretch gap-2 overflow-x-auto pb-2">
      {month.weeks.map((w, i) => {
        const g = globalIndexStart + i;
        const visible = currentStep < 0 ? true : g <= currentStep;
        return (
          <div key={`${w.week_start_date}-${i}`} className="flex items-center gap-1">
            <ClaimWeekCard week={w} visible={visible} delay={i * 0.05} />
            {i < month.weeks.length - 1 && (
              <span className="text-neutral-600 text-xs px-0.5" aria-hidden>
                →
              </span>
            )}
          </div>
        );
      })}
    </div>
  </motion.section>
);

export const PremiumMonthSection: React.FC<{
  month: MonthBlock;
  globalIndexStart: number;
  currentStep: number;
  monthIdx: number;
  cardSize?: 'sm' | 'comfortable';
}> = ({ month, globalIndexStart, currentStep, monthIdx, cardSize = 'sm' }) => (
  <motion.section
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: monthIdx * 0.08, duration: 0.35, type: 'spring', stiffness: 320, damping: 28 }}
    className="mb-6"
  >
    <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-orange-500/90 md:text-sm">
      {month.month_year ?? month.month_label}
    </h3>
    <div className="flex flex-wrap gap-2 md:gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
      {month.weeks.map((w, i) => {
        const g = globalIndexStart + i;
        const visible = currentStep < 0 ? true : g <= currentStep;
        return (
          <div key={`${w.week_start_date}-${i}`} className="flex items-center gap-1 md:gap-1.5">
            <PremiumWeekCard week={w} visible={visible} delay={i * 0.05} size={cardSize} />
            {i < month.weeks.length - 1 && <span className="text-neutral-600 text-xs">→</span>}
          </div>
        );
      })}
    </div>
  </motion.section>
);
