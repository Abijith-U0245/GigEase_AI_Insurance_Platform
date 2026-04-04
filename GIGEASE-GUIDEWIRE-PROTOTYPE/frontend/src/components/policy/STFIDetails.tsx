import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown } from 'lucide-react';

const triggers = [
  { name: 'Rainfall over 80 mm in 24 hours (IMD)', icon: '🌧', status: 'TRIGGERED', threshold: '80 mm', current: '187 mm', source: 'IMD feed' },
  { name: 'Wind over 50 km/h', icon: '💨', status: 'NORMAL', threshold: '50 km/h', current: '45 km/h', source: 'IMD feed' },
  { name: 'Flood alert level (NDMA)', icon: '🚨', status: 'TRIGGERED', threshold: 'Level 2', current: 'Level 4', source: 'NDMA' },
  { name: 'Cyclone warning (IMD)', icon: '🌀', status: 'NORMAL', threshold: 'Active', current: 'None', source: 'IMD feed' },
  { name: 'Visibility under 50 m', icon: '🌫️', status: 'NORMAL', threshold: 'Under 50 m', current: '200 m', source: 'Open-Meteo' },
  { name: 'Heatwave over 45°C', icon: '🌡️', status: 'NORMAL', threshold: '45°C', current: '32°C', source: 'IMD feed' },
];

const STFIDetails: React.FC = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={() => navigate('/policy')}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-500/30 bg-black/40 text-cyan-400 hover:bg-cyan-500/10"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="font-sans text-2xl font-black text-white md:text-3xl">STFI coverage</h1>
          <p className="text-sm font-semibold text-cyan-200/75">Storm, tempest, flood, inundation</p>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 to-black p-5 backdrop-blur-md">
        <p className="text-xs font-black uppercase tracking-widest text-cyan-400/90">Weekly cap example</p>
        <p className="mt-2 text-lg font-black text-white">
          About <span className="text-cyan-300">3.5%</span> of ₹7,500 sum insured →{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">₹262.50</span> max per week
          from this cover slice (demo numbers).
        </p>
      </div>

      <div className="space-y-3">
        {triggers.map((t, i) => (
          <motion.div
            key={i}
            layout
            className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-[#0c1214] to-black shadow-lg backdrop-blur-md"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between p-4 text-left"
              onClick={() => setExpanded(expanded === i ? null : i)}
              aria-label={t.name}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <p className="text-base font-bold text-white">{t.name}</p>
                  <p className="text-sm font-medium text-cyan-200/60">Source: {t.source}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-black uppercase ${
                    t.status === 'TRIGGERED'
                      ? 'bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/40'
                      : 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                  }`}
                >
                  {t.status === 'TRIGGERED' ? 'Triggered' : 'Normal'}
                </span>
                <motion.div animate={{ rotate: expanded === i ? 180 : 0 }}>
                  <ChevronDown size={18} className="text-cyan-400" />
                </motion.div>
              </div>
            </button>
            <AnimatePresence>
              {expanded === i && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="space-y-2 border-t border-cyan-500/15 px-4 pb-4 pt-3 text-sm">
                    <div className="flex justify-between font-semibold">
                      <span className="text-neutral-500">Rule threshold</span>
                      <span className="text-white">{t.threshold}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-neutral-500">Live reading</span>
                      <span className={t.status === 'TRIGGERED' ? 'font-black text-amber-400' : 'text-emerald-300'}>{t.current}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default STFIDetails;
