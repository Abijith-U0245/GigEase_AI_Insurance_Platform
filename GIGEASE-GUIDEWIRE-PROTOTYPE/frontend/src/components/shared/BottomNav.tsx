import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Shield, Zap, Coins, User } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/policy', icon: Shield, label: 'Policy' },
  { to: '/claims', icon: Zap, label: 'Claims' },
  { to: '/premium', icon: Coins, label: 'Premium' },
  { to: '/profile', icon: User, label: 'Profile' },
];

type Props = { variant?: 'dark' | 'light' };

const BottomNav: React.FC<Props> = ({ variant = 'dark' }) => {
  const light = variant === 'light';
  return (
    <nav
      className={
        light
          ? 'fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-indigo-100 shadow-[0_-4px_24px_rgba(79,70,229,0.08)] flex items-center z-40'
          : 'fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-xl border-t border-neutral-800 flex items-center z-40'
      }
    >
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px]">
          {({ isActive }) => (
            <motion.div
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 450, damping: 20 }}
              className="flex flex-col items-center gap-0.5"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className={
                    light
                      ? 'w-6 h-1 rounded-full bg-indigo-600 mb-0.5'
                      : 'w-6 h-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 mb-0.5'
                  }
                />
              )}
              <Icon
                size={22}
                className={
                  light
                    ? isActive
                      ? 'text-indigo-600'
                      : 'text-gray-400'
                    : isActive
                      ? 'text-orange-500'
                      : 'text-neutral-500'
                }
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] font-bold ${
                  light ? (isActive ? 'text-indigo-600' : 'text-gray-500') : isActive ? 'text-orange-500' : 'text-neutral-500'
                }`}
              >
                {label}
              </span>
            </motion.div>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
