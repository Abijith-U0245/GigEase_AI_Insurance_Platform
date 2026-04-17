import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const FullHold: React.FC = () => {
  const navigate = useNavigate();
  const [days] = useState(7);
  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/claims')} aria-label="Back" className="w-10 h-10 rounded-full hover:bg-background flex items-center justify-center"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold text-textPrimary">Claim on Hold</h1>
      </div>
      <div className="bg-danger/10 border-2 border-danger rounded-card p-4 mb-4">
        <p className="text-danger font-bold text-base mb-1">⚠ Claim placed on hold</p>
        <p className="text-2xl font-bold text-textSecondary line-through">₹1,243.50</p>
      </div>
      <div className="bg-white rounded-card shadow-card p-4 mb-4">
        <p className="text-sm font-bold mb-1">WhatsApp verification required</p>
        <p className="text-xs text-textSecondary mb-3">Please verify your identity to release your claim</p>
        <button className="w-full bg-[#25D366] text-white font-bold py-3 rounded-btn">💬 Verify via WhatsApp</button>
      </div>
      <div className="bg-white rounded-card shadow-card p-4 mb-4">
        <p className="text-sm font-bold mb-2">Review Window</p>
        <p className="text-2xl font-bold text-danger">{days} days remaining</p>
      </div>
      <div className="bg-white rounded-card shadow-card p-4">
        <p className="text-sm font-bold mb-2">Documents Accepted</p>
        {['Aadhaar Card', 'Platform earnings screenshot', 'Zone location proof'].map(d => (
          <p key={d} className="text-sm text-textSecondary py-1">• {d}</p>
        ))}
      </div>
    </div>
  );
};

export default FullHold;
