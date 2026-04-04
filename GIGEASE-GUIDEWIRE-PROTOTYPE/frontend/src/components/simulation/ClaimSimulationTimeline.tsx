import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSimulationData } from '../../hooks/useSimulationData';
import { useSimulationPlayer } from '../../hooks/useSimulationPlayer';
import { ClaimMonthSection } from './MonthSection';
import { SimulationControls } from './SimulationControls';
import { SimulationSummaryBar } from './SimulationSummaryBar';
import type { ClaimWeek } from './WeekCard';

type MonthBlock = { month_year?: string; month_label?: string; weeks: ClaimWeek[] };

function flattenWeeks(months: MonthBlock[] | undefined): ClaimWeek[] {
  if (!months) return [];
  return months.flatMap((m) => m.weeks);
}

export const ClaimSimulationTimeline: React.FC<{
  workerId: string;
  onWorkerChange?: (id: string) => void;
  isAdmin?: boolean;
  useEnglishControls?: boolean;
}> = ({ workerId: initialWorker, onWorkerChange, isAdmin, useEnglishControls = false }) => {
  const { t } = useTranslation();
  const [workerId, setWorkerId] = useState(initialWorker);
  const [speed, setSpeed] = useState(1);
  const { data, loading, error } = useSimulationData(workerId, 'claims');

  useEffect(() => {
    setWorkerId(initialWorker);
  }, [initialWorker]);

  const months = (data?.months as MonthBlock[]) ?? [];
  const flat = useMemo(() => flattenWeeks(months), [months]);
  const { currentStep, playing, play, pause, reset } = useSimulationPlayer(flat.length, speed);

  const changeWorker = (id: string) => {
    setWorkerId(id);
    reset();
    onWorkerChange?.(id);
  };

  if (loading) {
    return <p className="py-8 text-center text-sm text-neutral-500">{t('sim_loading_claim')}</p>;
  }
  if (error) {
    return <p className="py-8 text-center text-sm text-red-400">{t('sim_err_claim')}</p>;
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
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto py-3">
          <p className="mb-4 text-sm text-neutral-400">
            {t('sim_claim_meta', {
              name: (data?.worker_name as string) ?? workerId,
              zone: (data?.primary_zone as string) ?? '',
              weeks: (data?.total_weeks as number) ?? flat.length,
              claims: (data?.total_claims as number) ?? 0,
            })}
          </p>
          {months.map((month, mi) => {
            const section = (
              <ClaimMonthSection
                key={month.month_year ?? mi}
                month={month}
                globalIndexStart={globalStart}
                currentStep={currentStep}
                monthIdx={mi}
              />
            );
            globalStart += month.weeks.length;
            return section;
          })}
        </div>
        <SimulationSummaryBar weeks={flat} upToIndex={currentStep} forceEnglish={useEnglishControls} />
      </div>
    </div>
  );
};
