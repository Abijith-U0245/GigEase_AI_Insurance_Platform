import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { useRole } from '../../contexts/RoleContext';
import { PENDING_OTP_STORAGE_KEY } from '../../constants/authStorage';

const OTPPage: React.FC = () => {
  const navigate = useNavigate();
  const { setRole } = useRole();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    try {
      const v = sessionStorage.getItem(PENDING_OTP_STORAGE_KEY);
      setDemoOtp(v && /^\d{6}$/.test(v) ? v : null);
    } catch {
      setDemoOtp(null);
    }
  }, []);

  const copyOtp = async () => {
    if (!demoOtp) return;
    try {
      await navigator.clipboard.writeText(demoOtp);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleDigit = (idx: number, val: string) => {
    const v = val.replace(/\D/, '').slice(-1);
    const next = [...digits];
    next[idx] = v;
    setDigits(next);
    if (v && idx < 5) refs.current[idx + 1]?.focus();
    if (next.every((d) => d)) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        try {
          sessionStorage.removeItem(PENDING_OTP_STORAGE_KEY);
        } catch {
          /* ignore */
        }
        setRole('worker');
        navigate('/register/1');
      }, 1500);
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 md:bg-neutral-950 md:py-24">
      <div className="w-full max-w-md bg-black md:border md:border-neutral-800 md:shadow-2xl md:rounded-3xl md:p-10 flex flex-col items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          <div className="text-center mb-8">
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight"
            >
              Verification
            </motion.h2>
            <p className="text-base font-semibold text-neutral-400 leading-snug">
              Enter the 6-digit code we sent to Telegram
            </p>
          </div>

          {demoOtp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              className="mb-8 rounded-2xl border border-orange-500/40 bg-gradient-to-br from-orange-950/50 to-neutral-950 p-4 shadow-[0_0_32px_rgba(234,88,12,0.2)]"
            >
              <p className="text-xs font-black uppercase tracking-widest text-orange-400/90 mb-2">
                Judge / demo — copy OTP
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-2xl md:text-3xl font-black tracking-[0.25em] text-white tabular-nums">
                  {demoOtp}
                </span>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={copyOtp}
                  className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-black text-black shadow-lg shadow-orange-500/30"
                >
                  {copied ? <Check size={18} strokeWidth={2.5} /> : <Copy size={18} strokeWidth={2.5} />}
                  {copied ? 'Copied' : 'Copy'}
                </motion.button>
              </div>
              <p className="mt-2 text-xs text-neutral-500">Same value was sent to Telegram for production flow.</p>
            </motion.div>
          )}

          <div className="flex justify-center gap-2 mb-8">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                type="tel"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-black border-2 rounded-xl transition-all outline-none ${
                  d
                    ? 'border-orange-500 bg-[#3a1505] text-orange-400 shadow-[0_0_15px_rgba(234,88,12,0.4)]'
                    : 'border-neutral-800 bg-[#111] text-white focus:border-neutral-500'
                }`}
                aria-label={`OTP digit ${i + 1}`}
              />
            ))}
          </div>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center mt-4"
            >
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(234,88,12,0.5)] mb-4" />
              <p className="text-orange-500 font-bold text-sm uppercase tracking-widest">Verifying…</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default OTPPage;
