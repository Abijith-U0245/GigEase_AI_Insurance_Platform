import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Bike, ShieldCheck } from 'lucide-react';
import { useRole } from '../../contexts/RoleContext';
import { BrandLogo } from '../shared/BrandLogo';
import { PENDING_OTP_STORAGE_KEY } from '../../constants/authStorage';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setRole } = useRole();
  const [role, setRoleLocal] = useState<'worker' | 'admin' | null>(null);
  const [platform, setPlatform] = useState<'Zomato' | 'Swiggy' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGetOTP = async () => {
    setErrorMsg('');
    if (role === 'worker' && !platform) {
      setErrorMsg("Please select Zomato or Swiggy first.");
      return;
    }
    
    if (role === 'admin') {
      setRole('admin');
      navigate('/admin');
      return;
    }

    if (role === 'worker' && (!phoneNumber || phoneNumber.length < 10)) {
      setErrorMsg("Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/send_otp_whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber })
      });
      const data = (await response.json()) as { status?: string; message?: string; otp?: number };
      setLoading(false);

      if (data.status === 'success') {
        setRole('worker');
        try {
          if (data.otp != null) {
            sessionStorage.setItem(PENDING_OTP_STORAGE_KEY, String(data.otp));
          } else {
            sessionStorage.removeItem(PENDING_OTP_STORAGE_KEY);
          }
        } catch {
          /* ignore */
        }
        navigate('/otp');
      } else {
        setErrorMsg(data.message || "Unknown WhatsApp error");
      }
    } catch (e) {
      setLoading(false);
      setErrorMsg("Network connection error to backend.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-8 md:px-6 md:py-24">
      <div className="w-full max-w-md bg-black md:border md:border-neutral-800 md:shadow-2xl md:rounded-3xl md:p-10 px-2">
        
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center mb-8 mt-4">
          <div className="mb-4 flex justify-center drop-shadow-[0_0_28px_rgba(234,88,12,0.35)]">
            <BrandLogo variant="hero" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">GigEase</h1>
          <p className="text-xs md:text-sm text-orange-500 mt-2 font-semibold uppercase tracking-widest">{t('welcome')}</p>
        </motion.div>

        {/* Role selector */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="w-full mb-6">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em] mb-3">Register As</p>
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: 'worker' as const, label: 'Gig Worker', icon: Bike, desc: 'Delivery partner' },
              { key: 'admin' as const, label: 'Admin', icon: ShieldCheck, desc: 'Manage platform' },
            ]).map(r => (
              <motion.button
                key={r.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setErrorMsg(''); setRoleLocal(r.key); if (r.key === 'admin') setPlatform(null); }}
                className={`rounded-2xl p-4 text-center border-2 transition-all flex flex-col items-center gap-2 ${
                  role === r.key
                    ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(234,88,12,0.3)]'
                    : 'border-neutral-800 bg-[#111] hover:border-neutral-600'
                }`}
              >
                <r.icon size={24} className={role === r.key ? 'text-orange-500' : 'text-neutral-400'} />
                <span className={`font-extrabold text-sm ${role === r.key ? 'text-orange-500' : 'text-white'}`}>{r.label}</span>
                <span className="text-[10px] text-neutral-500">{r.desc}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Platform selector — only for workers */}
        {role === 'worker' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full mb-6">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em] mb-3">Select Platform</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {(['Zomato', 'Swiggy'] as const).map(p => (
                <motion.button
                  key={p}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setErrorMsg(''); setPlatform(p); }}
                  className={`rounded-2xl p-4 text-center font-extrabold text-lg border-2 transition-all ${
                    platform === p
                      ? 'border-orange-500 bg-[#3a1505] shadow-[0_0_15px_rgba(234,88,12,0.3)]'
                      : 'border-neutral-800 bg-[#111] text-white hover:border-neutral-600'
                  }`}
                >
                  <span style={{ color: p === 'Zomato' ? '#E23744' : '#FC8019' }}>{p}</span>
                </motion.button>
              ))}
            </div>

            <p className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em] mb-3">WhatsApp Number</p>
            <div className="flex border-2 border-neutral-800 rounded-2xl overflow-hidden focus-within:border-orange-500 transition-colors">
              <div className="bg-[#111] px-4 py-4 border-r border-neutral-800 text-neutral-400 font-bold">+91</div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                maxLength={10}
                placeholder="Enter 10 digit number"
                className="w-full bg-[#111] text-white px-4 py-4 outline-none font-bold placeholder-neutral-700"
              />
            </div>
          </motion.div>
        )}

        {/* Action Button */}
        {role && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full mt-4">
            <button
              onClick={handleGetOTP}
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-extrabold py-4 md:py-5 rounded-2xl text-base md:text-lg disabled:opacity-50 transition-all hover:opacity-90 shadow-[0_10px_20px_-10px_rgba(234,88,12,0.8)]"
            >
              {loading ? 'Transmitting...' : role === 'admin' ? 'Enter Admin Dashboard' : 'Get WhatsApp OTP'}
            </button>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 w-full p-3 bg-red-950/50 border border-red-800 rounded-xl">
            <p className="text-red-400 text-sm font-bold text-center">{errorMsg}</p>
          </motion.div>
        )}

        <p className="text-xs text-neutral-600 mt-6 text-center font-medium">
          By continuing you confirm WhatsApp consent
        </p>

        <button
          type="button"
          onClick={() => navigate('/register')}
          className="w-full mt-4 text-sm text-orange-500/90 hover:text-orange-400 font-bold"
        >
          New here? Register as gig worker or admin
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
