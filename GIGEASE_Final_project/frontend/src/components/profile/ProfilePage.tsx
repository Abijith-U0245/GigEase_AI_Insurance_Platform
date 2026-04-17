import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="px-4 py-4">
      <h1 className="text-xl font-bold text-textPrimary mb-6">My Profile</h1>
      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold mb-3">AS</div>
        <h2 className="text-xl font-bold text-textPrimary">Arun S</h2>
        <p className="text-textSecondary text-sm">+91 98XXX XX456</p>
        <div className="flex gap-2 mt-2">
          <span className="bg-[#E23744] text-white font-bold text-xs px-2 py-0.5 rounded-pill">Zomato</span>
          <span className="bg-success/10 text-success font-bold text-xs px-2 py-0.5 rounded-pill border border-success">✓ Aadhaar Verified</span>
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[{ label: 'Active Days', val: '22' }, { label: 'Total Claims', val: '1' }, { label: 'Total Payouts', val: '₹1,243' }].map(s => (
          <div key={s.label} className="bg-white rounded-card shadow-card p-3 text-center">
            <p className="text-lg font-bold text-primary">{s.val}</p>
            <p className="text-[10px] text-textSecondary leading-tight mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      {/* Links */}
      {[{ label: 'Edit Profile', to: '/profile/edit' }, { label: 'Notifications', to: '/profile/notifications' }, { label: 'Help & FAQs', to: '/profile/help' }].map(({ label, to }) => (
        <motion.button key={to} whileTap={{ scale: 0.98 }} onClick={() => navigate(to)}
          className="w-full bg-white rounded-card shadow-card p-4 flex justify-between items-center mb-3 text-sm font-semibold text-textPrimary">
          {label} <ChevronRight size={16} className="text-textSecondary" />
        </motion.button>
      ))}
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/login')}
        className="w-full border border-danger text-danger font-bold py-3 rounded-btn flex items-center justify-center gap-2 mt-2">
        <LogOut size={16} /> Logout
      </motion.button>
    </div>
  );
};

export default ProfilePage;
