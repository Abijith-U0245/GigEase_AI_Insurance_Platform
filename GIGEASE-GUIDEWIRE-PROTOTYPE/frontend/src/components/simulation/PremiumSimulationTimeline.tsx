import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSimulationData } from '../../hooks/useSimulationData';
import { useSimulationPlayer } from '../../hooks/useSimulationPlayer';
import { PremiumMonthSection } from './MonthSection';
import { SimulationControls } from './SimulationControls';
import type { ClaimWeek } from './WeekCard';

type MonthBlock = { month_year?: string; month_label?: string; weeks: ClaimWeek[] };

export const PremiumSimulationTimeline: React.FC<{
  workerId: string;
  onWorkerChange?: (id: string) => void;
  isAdmin?: boolean;
  useEnglishControls?: boolean;
  cardSize?: 'sm' | 'comfortable';
}> = ({
  workerId: initialWorker,
  onWorkerChange,
  isAdmin,
  useEnglishControls = false,
  cardSize = 'sm',
}) => {
  const { t } = useTranslation();
  const [workerId, setWorkerId] = useState(initialWorker);
  const [speed, setSpeed] = useState(1);
  const { data, loading, error } = useSimulationData(workerId, 'premium');

  useEffect(() => {
    setWorkerId(initialWorker);
  }, [initialWorker]);

  const months = (data?.months as MonthBlock[]) ?? [];
  const flat = useMemo(() => months.flatMap((m) => m.weeks), [months]);
  const { currentStep, playing, play, pause, reset } = useSimulationPlayer(flat.length, speed);

  const changeWorker = (id: string) => {
    setWorkerId(id);
    reset();
    onWorkerChange?.(id);
  };

  if (loading) {
    return <p className="py-8 text-center text-sm text-neutral-500">{t('sim_loading_prem')}</p>;
  }
  if (error) {
    return <p className="py-8 text-center text-sm text-red-400">{t('sim_err_prem')}</p>;
  }

  let globalStart = 0;
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SimulationControls
        playing={playing}
        onPlay={play}
        onPause={pause}
        onReset={reset}
        speed={speed}
        onSpeed={setSpeed}
        workerId={workerId}
        onWorkerChange={isAdmin ? changeWorker : undefined}
        isAdmin={false}
        useEnglishControls={useEnglishControls}
      />
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto py-3">
        <p className="mb-4 text-sm text-neutral-400">
          {t('sim_prem_meta', {
            avg: (data?.avg_premium as number)?.toFixed(0) ?? '—',
            min: (data?.min_premium as number)?.toFixed(0) ?? '—',
            max: (data?.max_premium as number)?.toFixed(0) ?? '—',
          })}
        </p>
        {months.map((month, mi) => {
          const section = (
            <PremiumMonthSection
              key={String(month.month_year ?? mi)}
              month={month}
              globalIndexStart={globalStart}
              currentStep={currentStep}
              monthIdx={mi}
              cardSize={cardSize}
            />
          );
          globalStart += month.weeks.length;
          return section;
        })}
      </div>
    </div>
  );
};
