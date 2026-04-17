import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Download } from 'lucide-react';
import { REG_DECLARATION_STORAGE_KEY } from '../../constants/regDeclaration';

// CSS confetti
const CONFETTI_COLORS = ['#3B28CC', '#FF5722', '#22C55E', '#F59E0B', '#3B82F6', '#EC4899'];

const RegisterSuccess: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.removeItem(REG_DECLARATION_STORAGE_KEY);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Confetti */}
      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-3 rounded-sm opacity-80"
          style={{
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}px`,
            animation: `confetti ${1.5 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s forwards`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}

      {/* Content */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.3 }}
        className="flex flex-col items-center text-center z-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="w-20 h-20 bg-success rounded-full flex items-center justify-center mb-6 shadow-lg"
        >
          <CheckCircle className="text-white" size={42} />
        </motion.div>

        <h1 className="text-[24px] font-bold text-primary mb-2">Welcome to GigEase, Arun!</h1>
        <p className="text-textSecondary mb-8">You're now protected every week.</p>

        {/* Policy card */}
        <div className="w-full bg-white rounded-card shadow-card p-5 mb-6 text-left">
          <p className="text-xs text-textSecondary uppercase tracking-widest mb-1">Policy Number</p>
          <p className="font-mono font-bold text-primary text-lg mb-4">GE-2024-VEL-001</p>
          <div className="flex justify-between items-center border-t border-borderColor pt-4">
            <div>
              <p className="text-xs text-textSecondary">Coverage</p>
              <p className="text-[40px] font-bold text-primary leading-none">₹7,500</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-textSecondary">Weekly Premium</p>
              <p className="text-xl font-bold text-textPrimary">₹170</p>
              <p className="text-xs text-textSecondary">Every Monday</p>
            </div>
          </div>
        </div>

        <button className="w-full border-2 border-primary text-primary font-bold py-3 rounded-btn mb-3 flex items-center justify-center gap-2">
          <Download size={16} /> Download Policy Summary
        </button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/home')}
          className="w-full bg-accent text-white font-bold py-4 rounded-btn shadow-button"
        >
          Go to Dashboard →
        </motion.button>
      </motion.div>
    </div>
  );
};

export default RegisterSuccess;
