import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PartialPay: React.FC = () => {
  const navigate = useNavigate();
  const [time, setTime] = useState(31 * 3600 + 22 * 60 + 14);
  useEffect(() => {
    const t = setInterval(() => setTime(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(time / 3600), m = Math.floor((time % 3600) / 60), s = time % 60;
  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/claims')} aria-label="Back" className="w-10 h-10 rounded-full hover:bg-background flex items-center justify-center"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold text-textPrimary">Partial Payout</h1>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-success/10 border border-success rounded-card p-4">
          <p className="text-xs text-textSecondary">Credited Now (50%)</p>
          <p className="text-2xl font-bold text-success">₹621.75</p>
        </div>
        <div className="bg-warning/10 border border-warning rounded-card p-4">
          <p className="text-xs text-textSecondary">Under Review (50%)</p>
          <p className="text-2xl font-bold text-warning">₹621.75</p>
        </div>
      </div>
      <div className="bg-white rounded-card shadow-card p-4 mb-4 text-center">
        <p className="text-xs text-textSecondary mb-1">48-hour Review Window</p>
        <p className="text-3xl font-bold text-textPrimary font-mono">{String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</p>
        <p className="text-xs text-textSecondary mt-1">remaining</p>
      </div>
      <div className="bg-warning/10 border border-warning rounded-card p-3 text-center mb-4">
        <span className="text-warning font-bold text-sm">UNDER REVIEW</span>
      </div>
    </div>
  );
};

export default PartialPay;
