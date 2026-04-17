import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const ClaimDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const r = 60;
  const circ = 2 * Math.PI * r;
  const fraudScore = 0.12;
  const dash = circ * fraudScore;

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/claims')} aria-label="Back" className="w-10 h-10 rounded-full hover:bg-background flex items-center justify-center"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-xl font-bold text-textPrimary">Claim Details</h1>
          <p className="text-xs font-mono text-textSecondary">{id || 'GE-CLM-001'}</p>
        </div>
      </div>

      {/* Income Analysis */}
      <div className="bg-white rounded-card shadow-card p-4 mb-4">
        <p className="text-sm font-bold text-textPrimary mb-3">Income Analysis</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-xs text-textSecondary">12-wk Avg</p><p className="font-bold">₹5,000</p></div>
          <div><p className="text-xs text-textSecondary">This week's income</p><p className="font-bold text-danger">₹1,600</p></div>
          <div><p className="text-xs text-textSecondary">Threshold (60%)</p><p className="font-bold">₹3,000</p></div>
          <div><p className="text-xs text-textSecondary">Income drop</p><p className="font-bold text-danger">68%</p></div>
        </div>
        <div className="mt-3">
          <span className="bg-danger/10 text-danger font-bold text-xs px-2 py-1 rounded-pill border border-danger">THRESHOLD CROSSED ✓</span>
        </div>
      </div>

      {/* Payout Calculation */}
      <div className="bg-white rounded-card shadow-card p-4 mb-4">
        <p className="text-sm font-bold text-textPrimary mb-3">Payout Calculation</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-textSecondary">Event</span><span className="font-semibold">STFI Flood Level 4</span></div>
          <div className="flex justify-between"><span className="text-textSecondary">Beta</span><span className="font-semibold">0.80</span></div>
          <div className="flex justify-between"><span className="text-textSecondary">Income loss</span><span className="font-semibold">₹3,400</span></div>
          <div className="flex justify-between"><span className="text-textSecondary">Raw payout (80% × ₹3,400)</span><span className="font-semibold">₹2,720</span></div>
          <div className="flex justify-between"><span className="text-textSecondary">Coverage cap</span><span className="font-semibold">₹7,500</span></div>
          <div className="flex justify-between"><span className="text-textSecondary">Fraud deduction</span><span className="font-semibold text-success">₹0</span></div>
          <div className="flex justify-between border-t border-borderColor pt-2">
            <span className="font-bold text-textPrimary">Final Payout</span>
            <span className="text-2xl font-bold text-success">₹1,243.50</span>
          </div>
        </div>
      </div>

      {/* Fraud Check */}
      <div className="bg-white rounded-card shadow-card p-4 mb-4">
        <p className="text-sm font-bold text-textPrimary mb-3">Fraud Check</p>
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 160 160" width="96" height="96">
              <circle cx="80" cy="80" r={r} fill="none" stroke="#E5E1FF" strokeWidth="14" />
              <motion.circle cx="80" cy="80" r={r} fill="none" stroke="#22C55E" strokeWidth="14"
                strokeDasharray={`${circ}`}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: circ - dash }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                strokeLinecap="round" transform="rotate(-90 80 80)" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-success">{fraudScore}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-textSecondary">Fraud Score: 0.12</p>
            <span className="bg-success/10 text-success font-bold text-xs px-2 py-1 rounded-pill border border-success mt-1 inline-block">AUTO APPROVE</span>
          </div>
        </div>
      </div>

      {/* Payment */}
      <div className="bg-white rounded-card shadow-card p-4 mb-4">
        <p className="text-sm font-bold text-textPrimary mb-3">Payment</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-textSecondary">UPI ID</span><span className="font-mono">arunS@okaxis</span></div>
          <div className="flex justify-between"><span className="text-textSecondary">Razorpay reference</span><span className="font-mono text-xs">pay demo 001</span></div>
          <div className="flex justify-between"><span className="text-textSecondary">Status</span><span className="text-success font-bold">CREDITED ✓</span></div>
        </div>
      </div>

      <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate(`/claims/${id || 'GE-CLM-001'}/pipeline`)}
        className="w-full bg-primary text-white font-bold py-4 rounded-btn">
        View Full Pipeline →
      </motion.button>
    </div>
  );
};

export default ClaimDetail;
