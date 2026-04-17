import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bike, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRole } from '../../contexts/RoleContext';
import { BrandLogo } from '../shared/BrandLogo';

/**
 * Entry step: register as gig worker (full KYC flow) or admin (demo → admin dashboard).
 */
const RegisterRole: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setRole } = useRole();
  const [choice, setChoice] = useState<'worker' | 'admin' | null>(null);

  const continueAs = () => {
    if (!choice) return;
    if (choice === 'admin') {
      setRole('admin');
      navigate('/admin');
      return;
    }
    setRole('worker');
    navigate('/register/declare');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-8 md:px-6 md:py-24">
      <div className="w-full max-w-md bg-black md:border md:border-neutral-800 md:shadow-2xl md:rounded-3xl md:p-10 px-2">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center mb-8 mt-4">
          <div className="mb-4 flex justify-center drop-shadow-[0_0_28px_rgba(234,88,12,0.35)]">
            <BrandLogo variant="hero" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Create account</h1>
          <p className="text-xs md:text-sm text-orange-500 mt-2 font-semibold uppercase tracking-widest">{t('welcome')}</p>
        </motion.div>

        <p className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em] mb-3">Register as</p>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {([
            { key: 'worker' as const, label: 'Gig worker', icon: Bike, desc: 'Coverage & claims' },
            { key: 'admin' as const, label: 'Admin', icon: ShieldCheck, desc: 'Platform tools' },
          ]).map(r => (
            <motion.button
              key={r.key}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setChoice(r.key)}
              className={`rounded-2xl p-4 text-center border-2 transition-all flex flex-col items-center gap-2 ${
                choice === r.key
                  ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(234,88,12,0.3)]'
                  : 'border-neutral-800 bg-[#111] hover:border-neutral-600'
              }`}
            >
              <r.icon size={24} className={choice === r.key ? 'text-orange-500' : 'text-neutral-400'} />
              <span className={`font-extrabold text-sm ${choice === r.key ? 'text-orange-500' : 'text-white'}`}>{r.label}</span>
              <span className="text-[10px] text-neutral-500">{r.desc}</span>
            </motion.button>
          ))}
        </div>

        {choice === 'admin' && (
          <p className="text-xs text-neutral-500 mb-4 text-center">
            Admin registration opens the desktop admin dashboard (no mobile worker-style app for admins).
          </p>
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          disabled={!choice}
          onClick={continueAs}
          className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-extrabold py-4 rounded-2xl disabled:opacity-40"
        >
          {choice === 'admin' ? 'Continue to admin setup' : choice === 'worker' ? 'Continue registration' : 'Choose an option'}
        </motion.button>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full mt-4 text-sm text-neutral-500 hover:text-neutral-300 font-medium"
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );
};

export default RegisterRole;
