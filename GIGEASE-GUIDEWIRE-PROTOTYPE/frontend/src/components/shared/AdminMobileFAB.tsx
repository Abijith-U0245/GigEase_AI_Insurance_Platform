import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { motion } from 'framer-motion';

/** Floating action — ICR monitor (sidebar item not in five-tab dock). */
const AdminMobileFAB: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={() => navigate('/admin/icr')}
      className="md:hidden fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/35 border border-indigo-500/50 flex items-center justify-center"
      aria-label="ICR Monitor"
      title="ICR Monitor"
    >
      <Activity size={24} strokeWidth={2} />
    </motion.button>
  );
};

export default AdminMobileFAB;
