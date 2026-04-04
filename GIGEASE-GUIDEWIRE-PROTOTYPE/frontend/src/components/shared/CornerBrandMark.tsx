import React from 'react';
import { motion } from 'framer-motion';
import { BRAND_LOGO_SRC } from './BrandLogo';

/** Sticker logo: fixed corner, worker (orange glow) vs admin (violet glow). Auth pages use full hero logo instead. */
export const CornerBrandMark: React.FC<{ variant: 'worker' | 'admin' }> = ({ variant }) => {
  const ring =
    variant === 'admin'
      ? 'shadow-[0_0_24px_rgba(139,92,246,0.45)] ring-2 ring-violet-500/50'
      : 'shadow-[0_0_24px_rgba(249,115,22,0.4)] ring-2 ring-orange-500/45';
  const top =
    variant === 'admin'
      ? 'top-14 md:top-[3.25rem]'
      : 'top-14 md:top-[3.25rem]';
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
      className={`pointer-events-none fixed left-3 z-[95] w-11 h-11 md:w-12 md:h-12 md:left-[248px] rounded-xl bg-black/60 backdrop-blur-md ${top} ${ring}`}
      aria-hidden
    >
      <img
        src={BRAND_LOGO_SRC}
        alt=""
        className="h-full w-full object-contain p-0.5 select-none"
        draggable={false}
      />
    </motion.div>
  );
};
