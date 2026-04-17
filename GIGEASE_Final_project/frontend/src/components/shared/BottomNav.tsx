import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Shield, Zap, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// 4 tabs matching the mobile reference (Image 4): Home, Policy, Claims, Premium
const tabs = [
  { to: '/home', icon: Home, labelKey: 'home' },
  { to: '/policy', icon: Shield, labelKey: 'my_policy' },
  { to: '/claims', icon: Zap, labelKey: 'my_claims' },
  { to: '/premium', icon: Coins, labelKey: 'premium' },
];

type Props = { variant?: 'dark' | 'light' };

const BottomNav: React.FC<Props> = ({ variant = 'dark' }) => {
  const { t } = useTranslation();
  const light = variant === 'light';
  return (
    <nav
      className={
        light
          ? 'h-16 bg-white border-t border-indigo-100 shadow-[0_-4px_24px_rgba(79,70,229,0.08)] flex items-center z-40'
          : 'h-16 bg-black/95 backdrop-blur-xl border-t border-neutral-800/80 flex items-center z-40'
      }
    >
      {tabs.map(({ to, icon: Icon, labelKey }) => (
        <NavLink key={to} to={to} end={to === '/home'} className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] relative">
          {({ isActive }) => (
            <motion.div
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 450, damping: 20 }}
              className="flex flex-col items-center gap-0.5 w-full"
            >
              {/* Active top indicator — matches Image 4 style */}
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className={
                    light
                      ? 'absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-indigo-600'
                      : 'absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-gradient-to-r from-orange-500 to-red-500'
                  }
                />
              )}
              <Icon
                size={22}
                className={
                  light
                    ? isActive ? 'text-indigo-600' : 'text-gray-400'
                    : isActive ? 'text-orange-500' : 'text-neutral-500'
                }
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] font-bold whitespace-nowrap overflow-hidden text-ellipsis px-1 w-full text-center ${
                  light
                    ? isActive ? 'text-indigo-600' : 'text-gray-500'
                    : isActive ? 'text-orange-500' : 'text-neutral-500'
                }`}
              >
                {t(labelKey).replace('My ', '').replace('என் ', '')}
              </span>
            </motion.div>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
