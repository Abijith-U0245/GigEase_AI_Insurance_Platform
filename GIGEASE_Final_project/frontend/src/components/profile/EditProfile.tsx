import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../shared/Toast';

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [upi, setUpi] = useState('arunS@okaxis');
  const [zone, setZone] = useState('Velachery');

  const save = () => {
    addToast('success', 'Profile updated successfully!');
    setTimeout(() => navigate('/profile'), 800);
  };

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/profile')} aria-label="Back" className="w-10 h-10 rounded-full hover:bg-background flex items-center justify-center"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold text-textPrimary">Edit Profile</h1>
      </div>
      <div className="space-y-4">
        <div><label className="text-xs text-textSecondary uppercase tracking-widest font-medium block mb-1">UPI ID</label><input value={upi} onChange={e => setUpi(e.target.value)} className="w-full px-4 py-3 border border-borderColor rounded-input bg-white focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-xs text-textSecondary uppercase tracking-widest font-medium block mb-1">Zone / Pincode</label><input value={zone} onChange={e => setZone(e.target.value)} className="w-full px-4 py-3 border border-borderColor rounded-input bg-white focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        <div><label className="text-xs text-textSecondary uppercase tracking-widest font-medium block mb-1">Platform</label><div className="px-4 py-3 border border-borderColor rounded-input bg-gray-50 flex items-center justify-between"><span className="font-bold" style={{ color: '#E23744' }}>Zomato</span><span className="text-xs text-textSecondary">Locked after KYC</span></div></div>
      </div>
      <div className="flex gap-3 mt-8">
        <button onClick={() => navigate('/profile')} className="flex-1 border border-borderColor text-textSecondary font-bold py-4 rounded-btn">Cancel</button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={save} className="flex-1 bg-accent text-white font-bold py-4 rounded-btn shadow-button">Save Changes</motion.button>
      </div>
    </div>
  );
};

export default EditProfile;
