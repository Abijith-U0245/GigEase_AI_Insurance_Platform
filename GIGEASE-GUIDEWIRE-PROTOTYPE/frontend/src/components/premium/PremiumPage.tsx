import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { CardSkeleton } from '../shared/Skeleton';

const STEPS = [
  { step: 1, label: '12-week average income', calc: 'Rolling average from platform', result: '₹5,000', color: '#6B7280' },
  { step: 2, label: 'Base premium = 2% of average', calc: '2% × ₹5,000', result: '₹100', color: '#6B7280' },
  { step: 3, label: 'Zone risk → seasonal factor 65%', calc: 'High flood risk band', result: '65%', color: '#6B7280' },
  { step: 4, label: 'Seasonal part = 65% × ₹100', calc: '0.65 × 100', result: '₹65', color: '#6B7280' },
  { step: 5, label: 'Recent claim in window → 5% loading', calc: 'One claim in last 4 weeks', result: '5%', color: '#6B7280' },
  { step: 6, label: 'Claim loading = 5% × ₹100', calc: '0.05 × 100', result: '₹5', color: '#6B7280' },
  { step: 7, label: 'Add parts: ₹100 + ₹65 + ₹5', calc: 'Base + seasonal + loading', result: '₹170', color: '#6B7280' },
  { step: 8, label: 'Premium guard: min ₹50 · max ₹200', calc: 'Keeps fair floor and ceiling', result: '₹170 ✓', color: '#FF5722', final: true },
];

const PremiumPage: React.FC = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
      STEPS.forEach((_, i) => {
        setTimeout(() => setVisible(prev => [...prev, i]), i * 150);
      });
    }, 800);
  }, []);

  if (loading) return <div className="px-4 py-6 space-y-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>;

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/home')} aria-label="Back" className="w-10 h-10 rounded-full hover:bg-background flex items-center justify-center"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold text-textPrimary">My Premium</h1>
      </div>

      {/* Hero premium */}
      <div className="bg-white rounded-card shadow-card p-5 mb-5 text-center">
        <p className="text-xs text-textSecondary uppercase tracking-widest mb-1">Current Weekly Premium</p>
        <p className="text-[40px] font-bold text-primary">₹170<span className="text-base font-normal text-textSecondary">/week</span></p>
        <p className="text-xs text-textSecondary mt-1">Recalculated every Sunday at 11:00 PM</p>
      </div>

      {/* 8-step breakdown */}
      <p className="text-[17px] font-bold text-textPrimary mb-3">How is ₹170 calculated?</p>
      <div className="space-y-3 mb-5">
        {STEPS.map((s, i) => (
          visible.includes(i) && (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className={`bg-white rounded-card shadow-card p-4 flex items-center gap-3 ${s.final ? 'border-2 border-accent' : ''}`}
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{s.step}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-textPrimary">{s.label}</p>
                <p className="text-xs text-textSecondary">{s.calc}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${s.final ? 'text-accent text-lg' : 'text-textPrimary'}`}>{s.result}</p>
                {s.final && <span className="text-xs bg-accent/10 text-accent font-bold px-2 py-0.5 rounded-pill">CONFIRMED</span>}
              </div>
            </motion.div>
          )
        ))}
      </div>

      {/* Quick links */}
      {[
        { label: 'Premium History', to: '/premium/history' },
        { label: 'Zone Savings Tip', to: '/premium/zones' },
        { label: 'AI Premium Explainer', to: '/premium/model' },
      ].map(({ label, to }) => (
        <motion.button key={to} whileTap={{ scale: 0.98 }} onClick={() => navigate(to)}
          className="w-full bg-white rounded-card shadow-card p-4 flex justify-between items-center mb-3 text-sm font-semibold text-textPrimary">
          {label} <ChevronRight size={16} className="text-textSecondary" />
        </motion.button>
      ))}
    </div>
  );
};

export default PremiumPage;
