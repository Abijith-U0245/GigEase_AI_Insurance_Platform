import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SimulationModal } from '../simulation/SimulationModal';
import { SIM_ADMIN_WORKERS } from '../simulation/simAdminWorkers';

const platformFor = (i: number) => (i % 2 === 0 ? 'Zomato' : 'Swiggy');

const workers = SIM_ADMIN_WORKERS.map((w, i) => ({
  id: w.id,
  name: w.name,
  platform: platformFor(i),
  zone: w.zone,
  status: 'ACTIVE' as const,
  premium: 120 + i * 8,
  tenureWeeks: 12 + i * 2,
  fraudScore: w.tag.includes('fraud') ? 0.87 : 0.08 + i * 0.02,
  lastClaim: w.tag.includes('claims') || w.id === 'T001' ? '2024' : '—',
  isFraud: w.tag.includes('fraud'),
  tag: w.tag,
}));

const rowAnim = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.008, y: -1, transition: { type: 'spring' as const, stiffness: 420, damping: 22 } },
  tap: { scale: 0.995 },
};

const WorkerTable: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [simOpen, setSimOpen] = useState(false);
  const [simWorkerId, setSimWorkerId] = useState('T001');
  const [simWorkerName, setSimWorkerName] = useState('Arun S');

  const filtered = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.id.toLowerCase().includes(search.toLowerCase()) ||
      w.zone.toLowerCase().includes(search.toLowerCase()),
  );

  const openSimulate = (e: React.MouseEvent, w: (typeof workers)[0]) => {
    e.stopPropagation();
    setSimWorkerId(w.id);
    setSimWorkerName(w.name);
    setSimOpen(true);
  };

  return (
    <div className="space-y-5">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-fuchsia-200"
      >
        Worker management
      </motion.h1>
      <div className="flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search workers…"
          className="flex-1 rounded-xl border border-violet-500/30 bg-black/40 px-4 py-3 text-base text-white placeholder:text-neutral-500 shadow-inner shadow-black/40 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
        />
      </div>
      <div className="overflow-hidden overflow-x-auto rounded-2xl border border-violet-500/25 bg-gradient-to-b from-[#140d1f]/95 to-black/90 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <table className="w-full min-w-[760px] text-sm md:text-[15px]">
          <thead className="border-b border-violet-500/25 bg-violet-950/35">
            <tr>
              {['ID', 'Name', 'Platform', 'Zone', 'Status', 'Premium', 'Weeks', 'Fraud', 'Last', ''].map((h) => (
                <th
                  key={h || 'sim'}
                  className="px-4 py-3.5 text-left text-xs font-black uppercase tracking-widest text-violet-200/90"
                >
                  {h || 'Simulate'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => (
              <motion.tr
                key={w.id}
                onClick={() => setSelected(w.id)}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                variants={rowAnim}
                className={`cursor-pointer border-b border-violet-500/10 transition-colors hover:bg-violet-600/[0.12] ${
                  w.isFraud ? 'bg-red-950/25' : 'bg-transparent'
                }`}
              >
                <td className="px-4 py-3.5 font-mono text-sm font-bold text-fuchsia-300">{w.id}</td>
                <td className="px-4 py-3.5 font-semibold text-white">
                  {w.name}{' '}
                  {w.tag && <span className="text-xs text-violet-300/80 font-normal">({w.tag})</span>}{' '}
                  {w.isFraud && (
                    <span className="ml-1 rounded-pill bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">
                      FRAUD
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className="text-sm font-bold"
                    style={{ color: w.platform === 'Zomato' ? '#E23744' : '#FC8019' }}
                  >
                    {w.platform}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-neutral-300">{w.zone}</td>
                <td className="px-4 py-3.5">
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                    {w.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-base font-bold tabular-nums text-white">₹{w.premium}</td>
                <td className="px-4 py-3.5 text-neutral-300 tabular-nums">{w.tenureWeeks}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-14 rounded-full bg-neutral-800">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, w.fraudScore * 100)}%`,
                          background:
                            w.fraudScore < 0.3
                              ? 'linear-gradient(90deg,#22c55e,#4ade80)'
                              : w.fraudScore < 0.5
                                ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                                : 'linear-gradient(90deg,#ef4444,#f87171)',
                        }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-neutral-300">{w.fraudScore.toFixed(2)}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-neutral-400">{w.lastClaim}</td>
                <td className="px-4 py-3.5">
                  <motion.button
                    type="button"
                    onClick={(e) => openSimulate(e, w)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                    className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-2 text-xs font-black text-white shadow-lg shadow-violet-900/40 ring-1 ring-white/10"
                  >
                    Simulate
                  </motion.button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <SimulationModal
        open={simOpen}
        onClose={() => setSimOpen(false)}
        workerId={simWorkerId}
        workerName={simWorkerName}
        mode="claims"
        isAdmin
      />

      {selected && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto border-l border-violet-500/30 bg-[#0c0614] p-6 shadow-2xl shadow-black/60 backdrop-blur-lg">
          <div className="mb-4 flex items-start justify-between">
            <h3 className="text-lg font-black text-white">Worker details</h3>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xl text-violet-300 hover:text-white"
            >
              ✕
            </button>
          </div>
          <pre className="overflow-auto rounded-xl border border-violet-500/20 bg-black/50 p-3 text-xs text-violet-100/90">
            {JSON.stringify(workers.find((x) => x.id === selected), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default WorkerTable;
