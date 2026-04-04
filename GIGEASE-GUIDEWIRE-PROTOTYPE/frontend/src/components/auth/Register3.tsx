import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import RegStepper from './RegStepper';
import { useRegDeclarationGuard } from '../../hooks/useRegDeclarationGuard';

const LABELS = ['You', 'Location', 'KYC', 'Payment'];

const Register3: React.FC = () => {
  useRegDeclarationGuard();
  const navigate = useNavigate();
  const [aadhaar, setAadhaar] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleDigiLocker = () => {
    setVerifying(true);
    setTimeout(() => { setVerifying(false); setVerified(true); }, 2000);
  };

  return (
    <div className="px-6 py-6">
      <RegStepper current={2} total={4} labels={LABELS} />
      <h2 className="text-xl font-bold text-textPrimary mb-6">KYC via DigiLocker</h2>

      {/* Aadhaar input */}
      <div className="mb-4">
        <label htmlFor="aadhaar" className="text-xs text-textSecondary uppercase tracking-widest font-medium block mb-1">Aadhaar Number</label>
        <input id="aadhaar" type="tel" maxLength={12} value={aadhaar} onChange={e => setAadhaar(e.target.value.replace(/\D/,'').slice(0,12))} placeholder="•••• •••• ••••" className="w-full px-4 py-3 border border-borderColor rounded-input bg-white text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary tracking-widest" />
      </div>

      {/* DigiLocker button */}
      {!verified && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleDigiLocker} disabled={verifying} className="w-full border-2 border-blue-500 bg-blue-50 text-blue-700 font-bold py-4 rounded-btn flex items-center justify-center gap-3 text-base">
          {verifying ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> : '🔐'} Verify via DigiLocker
        </motion.button>
      )}

      {/* Verified card */}
      <AnimatePresence>
        {verified && (
          <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-green-50 border border-success rounded-card p-4 flex items-center gap-3 mt-4">
            <CheckCircle className="text-success" size={28} />
            <div>
              <p className="font-bold text-textPrimary">Arun S — Aadhaar Verified</p>
              <span className="bg-success text-white text-xs px-2 py-0.5 rounded-pill font-medium">✓ VERIFIED</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay */}
      <AnimatePresence>
        {verifying && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-primary/90 flex items-center justify-center z-50">
            <div className="text-center text-white">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-lg font-bold">Connecting to DigiLocker...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3 mt-8">
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/register/2')} className="flex-1 border border-primary text-primary font-bold py-4 rounded-btn">← Back</motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/register/4')} disabled={!verified} className="flex-1 bg-accent text-white font-bold py-4 rounded-btn shadow-button disabled:opacity-50">Next →</motion.button>
      </div>
    </div>
  );
};

export default Register3;
