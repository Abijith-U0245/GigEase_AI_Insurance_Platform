import React from 'react';
import { useTranslation } from 'react-i18next';

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'ta', label: 'த' },
  { code: 'hi', label: 'हि' },
  { code: 'te', label: 'తె' },
];

/** Horizontal language pills for worker mobile layout (matches demo reference). */
const LanguageSwitcherRow: React.FC = () => {
  const { i18n } = useTranslation();
  const lng = i18n.resolvedLanguage ?? i18n.language;

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap px-2">
      {LANGS.map(lang => {
        const active = lng === lang.code || lng.startsWith(`${lang.code}-`);
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`w-11 h-11 rounded-full text-xs font-extrabold transition-all border-2 flex items-center justify-center shadow-sm
              ${active
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-indigo-700 border-indigo-300 hover:border-indigo-500'
              }`}
            aria-label={`Language ${lang.label}`}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSwitcherRow;
