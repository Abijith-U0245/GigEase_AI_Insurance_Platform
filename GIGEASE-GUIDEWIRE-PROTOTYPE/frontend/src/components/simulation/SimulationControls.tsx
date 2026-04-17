import React from 'react';
import { useTranslation } from 'react-i18next';

export const SimulationControls: React.FC<{
  playing: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  speed: number;
  onSpeed: (s: number) => void;
  workerId: string;
  onWorkerChange?: (id: string) => void;
  isAdmin?: boolean;
  useEnglishControls?: boolean;
}> = ({
  playing,
  onPlay,
  onPause,
  onReset,
  speed,
  onSpeed,
  workerId,
  onWorkerChange,
  isAdmin,
  useEnglishControls = false,
}) => {
  const { t } = useTranslation();
  const playLabel = useEnglishControls ? 'Play' : t('sim_play');
  const pauseLabel = useEnglishControls ? 'Pause' : t('sim_pause');
  const resetLabel = useEnglishControls ? 'Reset' : t('sim_reset');
  const speedLabel = useEnglishControls ? 'Speed' : t('sim_speed');

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-neutral-800 pb-3">
      <button
        type="button"
        onClick={playing ? onPause : onPlay}
        className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-black text-black"
      >
        {playing ? pauseLabel : playLabel}
      </button>
      <button
        type="button"
        onClick={onReset}
        className="rounded-lg border border-neutral-600 px-3 py-1.5 text-xs font-bold text-neutral-300"
      >
        {resetLabel}
      </button>
      <div className="flex items-center gap-1 text-[10px] text-neutral-500">
        <span>{speedLabel}</span>
        {[1, 2, 3].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSpeed(s)}
            className={`rounded px-2 py-0.5 font-bold ${
              speed === s ? 'bg-neutral-700 text-white' : 'text-neutral-400'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
      {isAdmin && onWorkerChange && (
        <select
          value={workerId}
          onChange={(e) => onWorkerChange(e.target.value)}
          className="ml-auto rounded-lg border border-neutral-700 bg-black px-2 py-1.5 text-xs text-white"
        >
          {['T001', 'T002', 'T003', 'T004', 'T005', 'T006', 'T007', 'T008'].map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};
