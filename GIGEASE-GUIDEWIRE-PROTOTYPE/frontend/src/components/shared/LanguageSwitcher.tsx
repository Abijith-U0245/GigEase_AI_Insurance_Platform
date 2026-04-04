import React from 'react';
import { useTranslation } from 'react-i18next';

import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'ta', label: 'த' },
  { code: 'hi', label: 'हि' },
  { code: 'te', label: 'తె' },
];

const variants = {
  open: { opacity: 1, scale: 1, pointerEvents: "auto" as const, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
  closed: { opacity: 0, scale: 0.5, pointerEvents: "none" as const }
};

const itemVariants = {
  open: { opacity: 1, y: 0, scale: 1 },
  closed: { opacity: 0, y: 15, scale: 0.5 }
};

type LanguageSwitcherProps = { compact?: boolean };

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ compact = false }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const lng = i18n.resolvedLanguage ?? i18n.language;
  const isActive = (code: string) => lng === code || lng.startsWith(`${code}-`);

  const triggerClass = compact
    ? 'w-11 h-11 rounded-full bg-gradient-to-br from-neutral-900 to-neutral-950 shadow-[0_0_20px_rgba(234,88,12,0.45)] border border-orange-500/40 flex items-center justify-center text-orange-400'
    : 'w-14 h-14 rounded-full bg-gradient-to-br from-neutral-900 to-neutral-950 shadow-[0_0_20px_rgba(234,88,12,0.5)] border border-orange-500/30 flex items-center justify-center text-white';

  return (
    <div className="relative flex flex-col items-end gap-2">
      <motion.div
        variants={variants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        className={`flex flex-col gap-2 mb-2 absolute ${compact ? 'top-12' : 'top-14'} right-0`}
      >
        {LANGS.map(lang => (
          <motion.button
            key={lang.code}
            type="button"
            variants={itemVariants}
            whileFocus={{ scale: 1.08 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92, rotate: -3 }}
            onClick={() => { i18n.changeLanguage(lang.code); setIsOpen(false); }}
            className={`w-12 h-12 rounded-full font-extrabold text-sm shadow-[0_5px_15px_rgba(0,0,0,0.4)] transition-all border-2 border-neutral-700 flex items-center justify-center
              ${isActive(lang.code)
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white border-orange-400/50'
                : 'bg-neutral-900 text-neutral-200 hover:bg-neutral-800'
              }`}
          >
            {lang.label}
          </motion.button>
        ))}
      </motion.div>

      <motion.button
        type="button"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92, rotate: 8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        onClick={() => setIsOpen(!isOpen)}
        className={triggerClass}
        aria-label="Toggle language menu"
      >
        <Globe size={compact ? 20 : 24} strokeWidth={1.8} />
      </motion.button>
    </div>
  );
};

export default LanguageSwitcher;
