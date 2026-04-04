import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BrandLogo } from '../shared/BrandLogo';
import { REG_DECLARATION_STORAGE_KEY, REG_DECLARER_INSURER_NAME } from '../../constants/regDeclaration';

const INSURER = REG_DECLARER_INSURER_NAME;

const RegisterDeclaration: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);

  const proceed = () => {
    if (!accepted) return;
    sessionStorage.setItem(REG_DECLARATION_STORAGE_KEY, '1');
    navigate('/register/1');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center px-4 py-8 md:px-6 md:py-12">
      <div className="w-full max-w-lg md:max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-6"
        >
          <div className="mb-3 drop-shadow-[0_0_24px_rgba(234,88,12,0.3)]">
            <BrandLogo variant="hero" />
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white text-center tracking-tight">
            {t('reg_declare_title')}
          </h1>
          <p className="text-xs text-orange-500/90 mt-2 font-semibold uppercase tracking-widest text-center">
            {t('reg_declare_subtitle')}
          </p>
        </motion.div>

        <div className="max-h-[min(52vh,420px)] md:max-h-[min(50vh,480px)] overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4 md:p-5 shadow-inner [scrollbar-width:thin]">
          <div className="text-[13px] md:text-sm leading-relaxed text-neutral-300 space-y-4">
            <p>
              I/We hereby declare that the particulars contained herein are true and correct and that no material fact
              has been withheld, mis-stated or misrepresented. I/We confirm that this proposal-cum-schedule shall form
              part of XYZ&apos;s standard policy and shall be the basis of the contract between me/us and {INSURER}. I/We
              further declare that:
            </p>
            <ul className="list-none space-y-3 pl-0">
              <li>
                <span className="font-bold text-orange-400/95">(a)</span> The W<sub>avg</sub> income figures are derived
                from verified Zomato platform earnings and have not been manipulated.
              </li>
              <li>
                <span className="font-bold text-orange-400/95">(b)</span> My Aadhaar-linked identity as verified via
                DigiLocker is accurate and belongs to me.
              </li>
              <li>
                <span className="font-bold text-orange-400/95">(c)</span> I consent to weekly premium auto-deduction from
                my Zomato platform earnings.
              </li>
              <li>
                <span className="font-bold text-orange-400/95">(d)</span> I consent to {INSURER} accessing my GPS data
                and platform activity logs solely for the purpose of fraud verification and claim processing.
              </li>
              <li>
                <span className="font-bold text-orange-400/95">(e)</span> I understand this is a parametric policy —
                payouts are triggered automatically by objective data thresholds and not by manual claim assessment.
              </li>
            </ul>
            <div className="pt-2 border-t border-neutral-800">
              <p className="font-bold text-white text-sm mb-2">Assignment clause</p>
              <p>
                I hereby assign the money payable in the event of a qualifying disruption to my UPI account registered at
                enrolment. I further declare that the UPI receipt shall be sufficient discharge to {INSURER}.
              </p>
            </div>
          </div>
        </div>

        <label
          htmlFor="reg-declaration-accept"
          className="mt-5 flex items-start gap-3 cursor-pointer select-none rounded-xl border border-neutral-800 bg-neutral-900/50 p-4"
        >
          <input
            id="reg-declaration-accept"
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-neutral-600 text-orange-500 focus:ring-orange-500 focus:ring-offset-0 focus:ring-offset-black"
          />
          <span className="text-sm font-semibold text-neutral-200 leading-snug">{t('reg_declare_checkbox')}</span>
        </label>

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          disabled={!accepted}
          onClick={proceed}
          className="w-full mt-5 bg-gradient-to-r from-orange-500 to-red-600 text-white font-extrabold py-4 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t('reg_declare_continue')}
        </motion.button>

        <button
          type="button"
          onClick={() => navigate('/register')}
          className="w-full mt-3 text-sm text-neutral-500 hover:text-neutral-300 font-medium py-2"
        >
          {t('reg_declare_back')}
        </button>
      </div>
    </div>
  );
};

export default RegisterDeclaration;
