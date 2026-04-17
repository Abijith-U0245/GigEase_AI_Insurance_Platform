import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Info, Zap } from 'lucide-react';
import { useToast } from '../shared/Toast';
import { API_BASE } from '../../config/api';

const ALL_ZONES = [
  'Velachery',
  'Adyar',
  'T Nagar',
  'Anna Nagar',
  'Guindy',
  'Sholinganallur',
  'Tambaram',
  'Perambur',
  'Porur',
  'Chromepet',
];

const LOG_TEMPLATES = [
  (t: string, z: string[]) => `[06:00:01] ${t} trigger received — ${z.join(', ')}`,
  () => `[06:00:02] Fetching affected workers — 12 found`,
  () => `[06:00:03] Processing W001 — Arun S…`,
  () => `[06:00:04] W001 income check: ₹1,600 < ₹3,000 ✓`,
  () => `[06:00:05] W001 fraud check: score 0.12 — auto approve`,
  () => `[06:00:06] W001 payout: ₹1,243.50 — UPI started`,
  () => `[06:00:07] Processing W007 — Kavitha M…`,
  () => `[06:00:08] W007 income check: ₹1,850 < ₹3,200 ✓`,
  () => `[06:00:09] W007 fraud check: score 0.08 — auto approve`,
  () => `[06:00:10] W007 payout: ₹1,105.00 — UPI started`,
  () => `[06:00:11] Processing W099 — Rajan K…`,
  () => `[06:00:12] W099 fraud check: score 0.87 — auto reject`,
  () => `[06:00:18] All claims processed. Total: ₹3,892.00 disbursed`,
];

/**
 * Admin-only demo: simulates a parametric weather or RSMD event and a batch payout log.
 * There is no dedicated `/trigger` API in this repo yet — the UI runs the timeline locally
 * and optionally pings `/health` so you can confirm the backend is reachable.
 */
const TriggerSimulator: React.FC = () => {
  const { addToast } = useToast();
  const [triggerType, setTriggerType] = useState<'STFI' | 'RSMD'>('STFI');
  const [zones, setZones] = useState<string[]>(ALL_ZONES);
  const [rainfall, setRainfall] = useState(187);
  const [wind, setWind] = useState(45);
  const [alertLevel, setAlertLevel] = useState(4);
  const [logs, setLogs] = useState<string[]>([]);
  const [firing, setFiring] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [rsmdSources, setRsmdSources] = useState<string[]>([]);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((r) => r.ok)
      .then(setBackendOk)
      .catch(() => setBackendOk(false));
  }, []);

  const toggleZone = (z: string) =>
    setZones((prev) => (prev.includes(z) ? prev.filter((x) => x !== z) : [...prev, z]));
  const toggleRsmd = (s: string) =>
    setRsmdSources((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const fireRaid = async () => {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    setFiring(true);
    setLogs([]);
    try {
      await fetch(`${API_BASE}/health`);
    } catch {
      /* demo still runs */
    }
    LOG_TEMPLATES.forEach((fn, i) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, fn(triggerType, zones)]);
        if (i === LOG_TEMPLATES.length - 1) {
          setFiring(false);
          setConfirmed(false);
          addToast('success', 'Trigger processed — ₹3,892.00 disbursed (demo log)');
        }
      }, i * 400);
    });
  };

  const RSMD_SOURCES = ['News keyword scan', 'NDMA public alert', 'Maps congestion signal', 'Government advisory'];
  const totalPayout = zones.length * 1200 + rainfall * 0.5;

  const glass = 'rounded-2xl border border-violet-500/25 bg-gradient-to-br from-[#140d1c]/90 to-black/85 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-md md:p-6';

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-violet-500/40 bg-violet-950/50 shadow-lg shadow-violet-900/30">
            <Zap className="h-7 w-7 text-amber-400" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h1 className="font-sans text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-amber-200 md:text-4xl">
              Trigger simulator
            </h1>
            <p className="mt-2 text-base font-semibold text-violet-200/75">
              Rehearse a city-wide STFI or RSMD event and watch how the payout queue would run.
            </p>
          </div>
        </div>
        <span className="shrink-0 self-start rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-amber-200">
          Demo only
        </span>
      </motion.div>

      <div className={`${glass} flex gap-3 border-cyan-500/20`}>
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
        <div className="text-sm font-medium leading-relaxed text-neutral-200">
          <p className="font-bold text-white">What this is for</p>
          <p className="mt-1 text-neutral-400">
            Judges and operators use it to narrate the story: zones selected → workers pulled → income and fraud checks → UPI.
            The animated log is generated in the browser. Backend status:{' '}
            <span className={backendOk ? 'font-black text-emerald-400' : backendOk === false ? 'font-black text-rose-400' : 'text-neutral-500'}>
              {backendOk === null ? 'checking…' : backendOk ? 'API reachable' : 'API offline (demo still works)'}
            </span>
            . A future <code className="rounded bg-black/40 px-1 text-orange-300">POST /trigger</code> could replace the client script.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className={glass}>
          <p className="mb-4 text-lg font-black text-white">Trigger configuration</p>
          <p className="mb-4 text-sm font-semibold text-neutral-400">City: Chennai (fixed demo)</p>

          <div className="mb-5 flex overflow-hidden rounded-xl border border-violet-500/30">
            {(['STFI', 'RSMD'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTriggerType(t)}
                className={`flex-1 py-3 text-sm font-black transition-all ${
                  triggerType === t
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                    : 'bg-black/40 text-neutral-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <p className="mb-2 text-xs font-black uppercase tracking-widest text-violet-300/80">Zones</p>
          <div className="mb-5 grid max-h-48 grid-cols-2 gap-2 overflow-y-auto pr-1 text-sm">
            {ALL_ZONES.map((z) => (
              <label key={z} className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1 hover:border-violet-500/30">
                <input type="checkbox" checked={zones.includes(z)} onChange={() => toggleZone(z)} className="accent-violet-500" />
                <span className="font-semibold text-neutral-200">{z}</span>
              </label>
            ))}
          </div>

          {triggerType === 'STFI' && (
            <div className="space-y-4">
              {[
                { label: 'Rainfall (mm)', val: rainfall, set: setRainfall, min: 0, max: 300 },
                { label: 'Wind speed (km/h)', val: wind, set: setWind, min: 0, max: 150 },
              ].map((s) => (
                <div key={s.label}>
                  <div className="mb-1 flex justify-between text-sm font-semibold">
                    <span className="text-neutral-400">{s.label}</span>
                    <span className="font-black text-amber-400 tabular-nums">{s.val}</span>
                  </div>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    value={s.val}
                    onChange={(e) => s.set(Number(e.target.value))}
                    className="h-2 w-full accent-violet-500"
                  />
                </div>
              ))}
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-widest text-violet-300/80">Flood alert level</p>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAlertLevel(n)}
                      className={`h-10 w-10 rounded-full text-sm font-black transition-all ${
                        alertLevel === n
                          ? 'bg-gradient-to-br from-amber-400 to-orange-600 text-black shadow-lg'
                          : 'border border-violet-500/30 bg-black/50 text-neutral-400 hover:border-violet-400'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {triggerType === 'RSMD' && (
            <div className="space-y-2">
              {RSMD_SOURCES.map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-2 rounded-lg py-1 text-sm font-semibold">
                  <input type="checkbox" checked={rsmdSources.includes(s)} onChange={() => toggleRsmd(s)} className="accent-fuchsia-500" />
                  <span className="text-neutral-200">{s}</span>
                </label>
              ))}
              {rsmdSources.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-center text-xs font-black text-emerald-300"
                >
                  Two-of-four rule satisfied ✓
                </motion.div>
              )}
            </div>
          )}

          <div className="mt-5 space-y-2 rounded-xl border border-violet-500/20 bg-black/40 p-4 text-sm">
            <div className="flex justify-between font-semibold">
              <span className="text-neutral-500">Affected workers (est.)</span>
              <span className="font-black text-white">~{zones.length * 3}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-neutral-500">Est. total payout</span>
              <span className="font-black text-amber-400 tabular-nums">
                ₹{totalPayout.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-neutral-500">Severity</span>
              <span
                className={`font-black ${
                  alertLevel >= 4 ? 'text-rose-400' : alertLevel >= 2 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {alertLevel >= 4 ? 'HIGH' : alertLevel >= 2 ? 'MEDIUM' : 'LOW'}
              </span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={fireRaid}
            disabled={firing}
            className={`mt-5 w-full rounded-2xl py-4 text-base font-black transition-all disabled:opacity-50 ${
              confirmed
                ? 'bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-lg shadow-rose-900/40'
                : 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 text-black shadow-lg shadow-orange-900/30'
            }`}
          >
            {firing ? 'Processing…' : confirmed ? 'Confirm fire?' : 'Fire trigger'}
          </motion.button>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className={`${glass} flex flex-col`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-lg font-black text-white">Live event log</p>
            {logs.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setLogs([]);
                  setConfirmed(false);
                }}
                className="rounded-lg border border-violet-500/40 px-3 py-1 text-xs font-bold text-violet-200 hover:bg-violet-950/50"
              >
                Clear
              </button>
            )}
          </div>
          <div
            ref={logRef}
            className="min-h-[320px] flex-1 space-y-1 overflow-y-auto rounded-xl border border-emerald-500/15 bg-black/70 p-4 font-mono text-xs leading-relaxed text-emerald-400/95 md:min-h-[380px] md:text-sm"
          >
            {logs.length === 0 ? (
              <span className="text-neutral-600">Waiting for trigger…</span>
            ) : (
              logs.map((l, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                  {l.toLowerCase().includes('reject') ? <span className="text-rose-400">{l}</span> : <span>{l}</span>}
                </motion.div>
              ))
            )}
            {firing && <span className="animate-pulse text-amber-400">▋</span>}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TriggerSimulator;
