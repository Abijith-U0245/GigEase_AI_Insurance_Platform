import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Short route-change hint — gradient pulse (no sticker; logo lives on auth + corner only).
 */
export const NavigationTransition: React.FC = () => {
  const location = useLocation();
  const [burst, setBurst] = useState(0);
  const [visible, setVisible] = useState(false);
  const firstNav = useRef(true);

  useEffect(() => {
    if (firstNav.current) {
      firstNav.current = false;
      return;
    }
    const adminMobile =
      location.pathname.startsWith('/admin') &&
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 767px)').matches;
    if (adminMobile) return;
    setBurst((n) => n + 1);
  }, [location.pathname, location.key]);

  useEffect(() => {
    if (burst === 0) return;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 420);
    return () => window.clearTimeout(t);
  }, [burst]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={burst}
          className="pointer-events-none fixed inset-0 z-[500] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.12, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 shadow-[0_0_48px_rgba(168,85,247,0.55)]"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
