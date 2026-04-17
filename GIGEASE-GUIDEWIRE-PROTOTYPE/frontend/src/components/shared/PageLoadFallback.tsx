import React from 'react';
import { motion } from 'framer-motion';

/** Lazy-route loading — no brand mark (sticker only on auth + dashboard corner). */
export const PageLoadFallback: React.FC = () => (
  <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 py-20 pointer-events-none">
    <motion.div
      className="relative h-14 w-14"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
    >
      <motion.span
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-600 to-orange-500 opacity-90 blur-md"
        animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="absolute inset-1 rounded-full border-2 border-white/20 bg-black/80" />
      <motion.span
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-orange-400 border-r-violet-400"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="text-sm font-bold tracking-wide text-neutral-500"
    >
      Loading…
    </motion.p>
  </div>
);
