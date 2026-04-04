import React from 'react';
import { motion } from 'framer-motion';
import { PhoneOutlineIcon } from './icons/PhoneOutlineIcon';
import { MonitorOutlineIcon } from './icons/MonitorOutlineIcon';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useWorkerViewMode } from '../../contexts/WorkerViewModeContext';

/**
 * Desktop-only: outline phone (first tap) opens mobile app shell; monitor outline returns to desktop layout.
 */
const WorkerMobilePreviewToggle: React.FC = () => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { mobilePreview, toggleMobilePreview } = useWorkerViewMode();

  if (!isDesktop) return null;

  /* Sidebar visible only when not in mobile preview — keep control out of sidebar footer. */
  const horizontal = mobilePreview ? 'left-4' : 'left-[calc(15rem+1rem)]';

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      onClick={toggleMobilePreview}
      className={`fixed z-[200] flex h-14 w-14 items-center justify-center rounded-2xl border-2 transition-colors shadow-[0_0_24px_rgba(0,0,0,0.5)] ${horizontal} ${
        mobilePreview
          ? 'bottom-24 border-orange-500/60 bg-black text-orange-400 shadow-[0_0_20px_rgba(234,88,12,0.25)]'
          : 'bottom-8 border-white/25 bg-black text-white hover:border-orange-400/70 hover:text-orange-400'
      }`}
      title={mobilePreview ? 'Back to desktop layout' : 'Open mobile app view'}
      aria-label={mobilePreview ? 'Back to desktop layout' : 'Open mobile app view'}
      aria-pressed={mobilePreview}
    >
      {mobilePreview ? (
        <MonitorOutlineIcon size={24} className="text-orange-400" />
      ) : (
        <PhoneOutlineIcon size={24} className="text-white" />
      )}
    </motion.button>
  );
};

export default WorkerMobilePreviewToggle;
