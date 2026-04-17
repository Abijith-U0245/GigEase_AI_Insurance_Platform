import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import RegStepper from './RegStepper';
import { useRegDeclarationGuard } from '../../hooks/useRegDeclarationGuard';

const LABELS = ['You', 'Location', 'KYC', 'Payment'];

const Register4: React.FC = () => {
  useRegDeclarationGuard();
  const navigate = useNavigate();
  const [upi, setUpi] = useState('');
  const [touched, setTouched] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const isValid = upi.includes('@');

  const handleSubmit = () => {
    if (!isValid || !agreed) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate('/register/success'); }, 1500);
  };

  return (
    <div className="px-6 py-6">
      <RegStepper current={3} total={4} labels={LABELS} />
      <h2 className="text-xl font-bold text-textPrimary mb-6">UPI Setup</h2>

      <div className="mb-6">
        <label htmlFor="upi" className="text-xs text-textSecondary uppercase tracking-widest font-medium block mb-1">UPI ID</label>
        <div className="relative">
          <input
            id="upi"
            value={upi}
            onChange={e => setUpi(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="arunS@okaxis"
            className={`w-full px-4 py-3 pr-10 border rounded-input bg-white text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary ${touched ? (isValid ? 'border-success' : 'border-danger') : 'border-borderColor'}`}
          />
          {touched && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {isValid ? <CheckCircle className="text-success" size={18} /> : <XCircle className="text-danger" size={18} />}
            </span>
          )}
        </div>
        {touched && !isValid && <p className="text-xs text-danger mt-1">Please enter a valid UPI ID (must contain @)</p>}
      </div>

      <div className="flex items-center gap-3 mb-6">
        <input id="terms" type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="w-5 h-5 accent-primary" />
        <label htmlFor="terms" className="text-sm text-textSecondary">I agree to GigEase <span className="text-primary">Terms &amp; Conditions</span></label>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSubmit}
        disabled={!isValid || !agreed || loading}
        className="w-full bg-accent text-white font-bold py-4 rounded-btn shadow-button disabled:opacity-50"
      >
        {loading ? <span className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating Policy...</span> : 'Submit & Get Covered'}
      </motion.button>
    </div>
  );
};

export default Register4;
