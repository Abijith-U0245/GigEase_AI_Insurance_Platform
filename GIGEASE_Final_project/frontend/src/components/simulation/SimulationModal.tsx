import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClaimSimulationTimeline } from './ClaimSimulationTimeline';
import { PremiumSimulationTimeline } from './PremiumSimulationTimeline';
import { SIM_ADMIN_WORKERS } from './simAdminWorkers';

export type SimulationModalProps = {
  open: boolean;
  onClose: () => void;
  workerId: string;
  workerName: string;
  mode?: 'claims' | 'premium';
  isAdmin?: boolean;
};

export const SimulationModal: React.FC<SimulationModalProps> = ({
  open,
  onClose,
  workerId,
  workerName,
  mode: initialMode = 'claims',
  isAdmin = false,
}) => {
  const [tab, setTab] = useState<'claims' | 'premium'>(initialMode);
  const [activeWorkerId, setActiveWorkerId] = useState(workerId);
  const [activeWorkerName, setActiveWorkerName] = useState(workerName);

  useEffect(() => {
    if (!open) return;
    setTab(initialMode);
    setActiveWorkerId(workerId);
    setActiveWorkerName(workerName);
  }, [open, workerId, workerName, initialMode]);

  const activeMeta = SIM_ADMIN_WORKERS.find((w) => w.id === activeWorkerId);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[600] flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className={`flex max-h-[92vh] w-full flex-col rounded-t-3xl border shadow-2xl sm:max-h-[88vh] sm:rounded-3xl ${
              isAdmin
                ? 'max-w-6xl border-violet-500/35 bg-gradient-to-b from-[#160a22] via-[#0a0610] to-black shadow-[0_0_80px_rgba(139,92,246,0.22)]'
                : 'max-w-3xl border-neutral-800 bg-[#0a0a0a]'
            }`}
          >
            <div
              className={`flex shrink-0 items-start justify-between px-5 py-4 sm:px-6 ${
                isAdmin
                  ? 'border-b border-violet-500/25 bg-gradient-to-r from-violet-950/50 to-transparent'
                  : 'border-b border-neutral-800'
              }`}
            >
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
                <h2 className="text-xl sm:text-2xl font-black text-white">History simulation</h2>
                <p className="mt-1 text-sm text-neutral-400">
                  {activeMeta
                    ? `${activeMeta.id} — ${activeMeta.name} · ${activeMeta.zone}`
                    : `${activeWorkerId} — ${activeWorkerName}`}
                </p>
              </motion.div>
              <motion.button
                type="button"
                onClick={onClose}
                whileHover={{ scale: 1.08, rotate: 90 }}
                whileTap={{ scale: 0.92 }}
                className="rounded-full px-3 py-1 text-xl text-neutral-500 hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                ×
              </motion.button>
            </div>

            {isAdmin && (
              <div className="shrink-0 border-b border-violet-500/20 px-3 py-3 sm:px-5">
                <p className="mb-2 px-1 text-xs font-black uppercase tracking-widest text-violet-300/90">Worker</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {SIM_ADMIN_WORKERS.map((w) => {
                    const on = w.id === activeWorkerId;
                    return (
                      <motion.button
                        key={w.id}
                        type="button"
                        layout
                        onClick={() => {
                          setActiveWorkerId(w.id);
                          setActiveWorkerName(w.name);
                        }}
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`min-w-[108px] shrink-0 rounded-2xl border px-3 py-2.5 text-left shadow-lg transition-colors ${
                          on
                            ? 'border-violet-400 bg-gradient-to-br from-violet-600/40 to-fuchsia-700/30 text-white ring-2 ring-violet-400/50'
                            : 'border-violet-500/20 bg-black/40 text-neutral-300 hover:border-violet-400/40 hover:bg-violet-950/30'
                        }`}
                      >
                        <span className="block font-mono text-sm font-black">{w.id}</span>
                        <span className="mt-0.5 block max-w-[140px] truncate text-sm font-semibold leading-tight">{w.name}</span>
                        {w.tag && (
                          <span className="mt-1 block truncate text-[11px] text-violet-200/70">{w.tag}</span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            <div
              className={`flex shrink-0 gap-2 px-4 py-2.5 sm:px-6 ${
                isAdmin ? 'border-b border-violet-500/15 bg-black/20' : 'border-b border-neutral-800'
              }`}
            >
              {(['claims', 'premium'] as const).map((m) => (
                <motion.button
                  key={m}
                  type="button"
                  onClick={() => setTab(m)}
                  whileTap={{ scale: 0.97 }}
                  className={`rounded-xl px-4 py-2 text-sm font-black transition-all ${
                    tab === m
                      ? isAdmin
                        ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-900/40'
                        : 'bg-orange-500 text-black'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {m === 'claims' ? 'Claim history' : 'Premium history'}
                </motion.button>
              ))}
            </div>

            <div className="flex min-h-[52vh] flex-1 flex-col overflow-hidden px-4 pb-0 sm:px-6">
              {tab === 'claims' ? (
                <ClaimSimulationTimeline
                  workerId={activeWorkerId}
                  isAdmin={false}
                  useEnglishControls={isAdmin}
                />
              ) : (
                <PremiumSimulationTimeline
                  workerId={activeWorkerId}
                  isAdmin={false}
                  useEnglishControls={isAdmin}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
