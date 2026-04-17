import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const SOURCES = [
  { name: 'News keyword scan', icon: '📰', status: 'CONFIRMED' },
  { name: 'NDMA public alert', icon: '🚨', status: 'CONFIRMED' },
  { name: 'Maps congestion signal', icon: '🗺️', status: 'CHECKING' },
  { name: 'Government advisory', icon: '📋', status: 'PENDING' },
];

const RSMDDetails: React.FC = () => {
  const navigate = useNavigate();
  const [sources, setSources] = useState(SOURCES);
  const [simRunning, setSimRunning] = useState(false);
  const confirmed = sources.filter((s) => s.status === 'CONFIRMED').length;

  const simulateBandh = () => {
    setSimRunning(true);
    [2, 3].forEach((idx, i) => {
      setTimeout(() => {
        setSources((prev) => prev.map((s, si) => (si === idx ? { ...s, status: 'CONFIRMED' } : s)));
      }, 800 * (i + 1));
    });
    setTimeout(() => setSimRunning(false), 2000);
  };

  const cardStyle = (status: string) => {
    if (status === 'CONFIRMED')
      return 'border-rose-500/40 bg-gradient-to-br from-rose-950/50 to-black shadow-[0_0_24px_rgba(244,63,94,0.12)]';
    if (status === 'CHECKING')
      return 'border-amber-500/40 bg-gradient-to-br from-amber-950/40 to-black';
    return 'border-violet-500/30 bg-gradient-to-br from-violet-950/30 to-neutral-950';
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-4">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          onClick={() => navigate('/policy')}
          aria-label="Back"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-black/50 text-violet-300 hover:bg-violet-500/10"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-500/40 bg-violet-950/50 text-2xl shadow-lg backdrop-blur-md">
            ⚖️
          </div>
          <div className="min-w-0">
            <h1 className="font-sans text-2xl font-black tracking-tight text-white md:text-3xl">RSMD coverage</h1>
            <p className="text-sm font-semibold text-violet-200/75">Riots, strikes, military action, disturbances</p>
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-violet-400/35 bg-gradient-to-r from-violet-950/60 via-fuchsia-950/40 to-black p-4 backdrop-blur-md md:p-5">
        <p className="text-base font-black text-violet-100 md:text-lg">
          At least two of four signals must agree before a city-wide RSMD trigger can pay claims.
        </p>
        <p className="mt-2 text-sm font-medium leading-relaxed text-violet-200/70">
          This protects you from false alarms: news, official alerts, traffic stress, and advisories are checked together.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sources.map((s, i) => (
          <motion.div
            key={i}
            layout
            className={`rounded-2xl border-2 p-5 backdrop-blur-md transition-shadow ${cardStyle(s.status)}`}
          >
            <span className="mb-3 block text-3xl">{s.icon}</span>
            <p className="text-base font-bold leading-snug text-white md:text-lg">{s.name}</p>
            <span
              className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${
                s.status === 'CONFIRMED'
                  ? 'bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/40'
                  : s.status === 'CHECKING'
                    ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40'
                    : 'bg-neutral-700/50 text-neutral-400'
              }`}
            >
              {s.status === 'CONFIRMED' ? 'Confirmed' : s.status === 'CHECKING' ? 'Checking' : 'Pending'}
            </span>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {confirmed >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/50 to-black p-4 text-center backdrop-blur-md"
          >
            <p className="text-base font-black text-emerald-300">
              ✓ Trigger rules met — {confirmed} of 4 sources confirmed
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={simulateBandh}
        disabled={simRunning}
        className="w-full rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 py-4 text-base font-black text-white shadow-[0_12px_40px_rgba(109,40,217,0.35)] disabled:opacity-50"
      >
        {simRunning ? 'Simulating…' : 'Simulate bandh event (demo)'}
      </motion.button>
    </div>
  );
};

export default RSMDDetails;
