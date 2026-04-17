import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';

const zones = [
  { name: 'Anna Nagar', save: 34, color: 'text-success' },
  { name: 'Guindy', save: 18, color: 'text-success' },
  { name: 'Sholinganallur', save: 11, color: 'text-success' },
];

const ZoneTip: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/premium')} aria-label="Back" className="w-10 h-10 rounded-full hover:bg-background flex items-center justify-center"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold text-textPrimary">Zone Savings Tip</h1>
      </div>
      <div className="bg-orange-50 border border-accent rounded-card p-4 mb-5">
        <p className="font-bold text-accent">📍 You're in Velachery — High Risk Zone</p>
        <p className="text-sm text-textSecondary mt-1">Working from nearby zones could reduce your weekly premium.</p>
      </div>
      <div className="space-y-3">
        {zones.map(z => (
          <div key={z.name} className="bg-white rounded-card shadow-card p-4 flex justify-between items-center">
            <p className="font-semibold text-textPrimary">{z.name}</p>
            <span className={`font-bold text-sm bg-success/10 px-3 py-1 rounded-pill ${z.color}`}>save ₹{z.save}/week</span>
          </div>
        ))}
      </div>
      <div className="mt-5 bg-background border border-borderColor rounded-card p-4 flex gap-2">
        <Info size={16} className="text-textSecondary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-textSecondary">Zone is based on your registered home address. Actual savings depend on your income pattern.</p>
      </div>
    </div>
  );
};

export default ZoneTip;
