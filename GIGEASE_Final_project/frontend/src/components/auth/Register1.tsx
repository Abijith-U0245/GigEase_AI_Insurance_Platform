import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import RegStepper from './RegStepper';
import { useRegDeclarationGuard } from '../../hooks/useRegDeclarationGuard';

const LABELS = ['You', 'Location', 'KYC', 'Payment'];

const Register1: React.FC = () => {
  useRegDeclarationGuard();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  return (
    <div className="px-6 py-6">
      <RegStepper current={0} total={4} labels={LABELS} />
      <h2 className="text-xl font-bold text-textPrimary mb-6">Personal Details</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="fullname" className="text-xs text-textSecondary uppercase tracking-widest font-medium block mb-1">Full Name</label>
          <input id="fullname" value={name} onChange={e => setName(e.target.value)} placeholder="Arun S" className="w-full px-4 py-3 border border-borderColor rounded-input bg-white text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="text-xs text-textSecondary uppercase tracking-widest font-medium block mb-1">Phone</label>
          <input value="+91 98765 43210" disabled className="w-full px-4 py-3 border border-borderColor rounded-input bg-gray-50 text-textSecondary" />
        </div>
        <div>
          <label className="text-xs text-textSecondary uppercase tracking-widest font-medium block mb-1">Platform</label>
          <div className="px-4 py-3 border border-borderColor rounded-input bg-gray-50 flex items-center gap-2">
            <span className="font-bold" style={{ color: '#E23744' }}>Zomato</span>
            <span className="text-xs text-textSecondary ml-1">(locked)</span>
          </div>
        </div>
        <div>
          <label htmlFor="gigid" className="text-xs text-textSecondary uppercase tracking-widest font-medium block mb-1">Zomato Partner ID</label>
          <input id="gigid" placeholder="ZMT-12345678" className="w-full px-4 py-3 border border-borderColor rounded-input bg-white text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary" />
          <p className="text-xs text-textSecondary mt-1">Your Zomato partner ID</p>
        </div>
      </div>
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/register/2')} className="w-full bg-accent text-white font-bold py-4 rounded-btn shadow-button mt-8">
        Next →
      </motion.button>
    </div>
  );
};

export default Register1;
