import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import RegStepper from './RegStepper';
import { useRegDeclarationGuard } from '../../hooks/useRegDeclarationGuard';

const LABELS = ['You', 'Location', 'KYC', 'Payment'];

const Register2: React.FC = () => {
  useRegDeclarationGuard();
  const navigate = useNavigate();
  const [zone, setZone] = useState('');
  const showRiskBadge = zone.toLowerCase().includes('velachery');

  return (
    <div className="px-6 py-6">
      <RegStepper current={1} total={4} labels={LABELS} />
      <h2 className="text-xl font-bold text-textPrimary mb-6">Location</h2>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-textSecondary uppercase tracking-widest font-medium block mb-1">City</label>
          <select className="w-full px-4 py-3 border border-borderColor rounded-input bg-white text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary">
            <option>Chennai</option>
          </select>
        </div>
        <div>
          <label htmlFor="zone" className="text-xs text-textSecondary uppercase tracking-widest font-medium block mb-1">Zone / Pincode</label>
          <input id="zone" value={zone} onChange={e => setZone(e.target.value)} placeholder="e.g. Velachery" className="w-full px-4 py-3 border border-borderColor rounded-input bg-white text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <AnimatePresence>
          {showRiskBadge && (
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 bg-red-50 border border-danger rounded-pill px-4 py-2">
                <span className="w-2 h-2 rounded-full bg-danger" />
                <span className="text-danger font-semibold text-sm">High Flood Risk — Zone Score 0.9991</span>
              </div>
              <div className="flex items-center gap-2 bg-orange-50 border border-accent rounded-pill px-4 py-2">
                <span className="text-accent font-semibold text-sm">🌧 Oct–Dec: +65% seasonal loading</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex gap-3 mt-8">
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/register/1')} className="flex-1 border border-primary text-primary font-bold py-4 rounded-btn">← Back</motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/register/3')} className="flex-1 bg-accent text-white font-bold py-4 rounded-btn shadow-button">Next →</motion.button>
      </div>
    </div>
  );
};

export default Register2;
