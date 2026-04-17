import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import LanguageSwitcher from '../shared/LanguageSwitcher';
import { useToast } from '../shared/Toast';

const RECENT = [
  {
    id: '1',
    title: 'Premium deducted this week',
    body: '₹170 was collected on Monday for your weekly cover. This keeps STFI and RSMD protection active for Velachery.',
    time: '2h ago',
    accent: 'from-amber-500/20 to-orange-950/40',
  },
  {
    id: '2',
    title: 'Payout on the way',
    body: '₹1,243.50 STFI claim is in UPI processing. You will get a push when it lands.',
    time: 'Yesterday',
    accent: 'from-emerald-500/15 to-neutral-900',
  },
];

const TOGGLES = [
  { key: 'payout', label: 'Payout credited', icon: '💰' },
  { key: 'premium', label: 'Premium deducted', icon: '💳' },
  { key: 'disruption', label: 'Disruption detected', icon: '🚨' },
  { key: 'renewal', label: 'Policy renewed', icon: '🛡️' },
  { key: 'zone', label: 'Zone savings tip', icon: '📍' },
];

const Toggle: React.FC<{ on: boolean; onChange: () => void }> = ({ on, onChange }) => (
  <motion.button
    type="button"
    onClick={onChange}
    className={`relative h-7 w-12 rounded-full transition-colors ${on ? 'bg-orange-500' : 'bg-neutral-700'}`}
    aria-label="toggle"
  >
    <motion.div
      className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md"
      animate={{ x: on ? 20 : 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
    />
  </motion.button>
);

const NotificationPrefs: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [prefs, setPrefs] = useState(Object.fromEntries(TOGGLES.map((t) => [t.key, true])));

  const save = () => {
    addToast('success', 'Preferences saved!');
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={() => navigate('/profile')}
          aria-label="Back"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-orange-500/25 bg-black/40 text-orange-400 hover:bg-orange-500/10"
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="font-sans text-2xl font-black text-white">Notifications</h1>
          <p className="text-sm font-semibold text-neutral-400">Recent alerts and your preferences</p>
        </div>
      </div>

      <p className="mb-2 text-xs font-black uppercase tracking-widest text-orange-400/90">This week</p>
      <div className="mb-6 space-y-3">
        {RECENT.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border border-orange-500/20 bg-gradient-to-br ${n.accent} p-4 backdrop-blur-md`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-base font-black text-white">{n.title}</p>
              <span className="shrink-0 text-[11px] font-bold text-neutral-500">{n.time}</span>
            </div>
            <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-200">{n.body}</p>
          </motion.div>
        ))}
      </div>

      <div className="mb-6">
        <p className="mb-2 text-xs text-neutral-500">Language</p>
        <LanguageSwitcher />
      </div>

      <p className="mb-2 text-xs font-black uppercase tracking-widest text-neutral-500">Alert types</p>
      <div className="mb-5 divide-y divide-neutral-800 overflow-hidden rounded-2xl border border-neutral-800 bg-[#111]/80 backdrop-blur-md">
        <div className="flex items-center justify-between p-4">
          <span className="text-base font-bold text-white">All notifications</span>
          <Toggle
            on={Object.values(prefs).every(Boolean)}
            onChange={() => {
              const allOn = Object.values(prefs).every(Boolean);
              setPrefs(Object.fromEntries(TOGGLES.map((t) => [t.key, !allOn])));
            }}
          />
        </div>
        {TOGGLES.map((t) => (
          <div key={t.key} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">{t.icon}</span>
              <span className="text-sm font-semibold text-neutral-200">{t.label}</span>
            </div>
            <Toggle on={prefs[t.key]} onChange={() => setPrefs((p) => ({ ...p, [t.key]: !p[t.key] }))} />
          </div>
        ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={save}
        className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-4 text-base font-black text-black shadow-lg shadow-orange-900/40"
      >
        Save preferences
      </motion.button>
    </div>
  );
};

export default NotificationPrefs;
