import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Zap, ClipboardList, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

/** Five primary admin destinations — mobile dock only (desktop sidebar unchanged). */
const tabs = [
  { to: '/admin', icon: LayoutDashboard, labelKey: 'overview' as const, end: true },
  { to: '/admin/workers', icon: Users, labelKey: 'workers' as const },
  { to: '/admin/trigger', icon: Zap, labelKey: 'admin_tab_trigger' as const },
  { to: '/admin/audit', icon: ClipboardList, labelKey: 'admin_tab_audit' as const },
  { to: '/admin/model', icon: Brain, labelKey: 'admin_tab_model' as const },
];

const AdminBottomNav: React.FC = () => {
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-[4.25rem] items-center border-t border-violet-500/25 bg-black/85 backdrop-blur-xl shadow-[0_-8px_32px_rgba(88,28,135,0.25)]">
      {tabs.map(({ to, icon: Icon, labelKey, end }) => (
        <NavLink key={to} to={to} end={end} className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px]">
          {({ isActive }) => (
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-0.5"
            >
              {isActive && (
                <motion.div
                  layoutId="admin-nav-indicator"
                  className="mb-0.5 h-1 w-6 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500"
                />
              )}
              <Icon
                size={22}
                className={isActive ? 'text-violet-300' : 'text-neutral-500'}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] font-bold text-center leading-tight px-0.5 ${
                  isActive ? 'text-violet-200' : 'text-neutral-500'
                }`}
              >
                {t(labelKey)}
              </span>
            </motion.div>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default AdminBottomNav;
