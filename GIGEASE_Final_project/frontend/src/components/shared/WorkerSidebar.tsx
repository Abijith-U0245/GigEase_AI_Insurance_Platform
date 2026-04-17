import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Shield, Zap, Coins, User, HelpCircle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BrandLogo } from './BrandLogo';

const workerNav = [
  { to: '/home', icon: Home, key: 'home' },
  { to: '/policy', icon: Shield, key: 'my_policy' },
  { to: '/claims', icon: Zap, key: 'my_claims' },
  { to: '/premium', icon: Coins, key: 'premium' },
  { to: '/premium/simulate', icon: Coins, key: 'Premium Tools' },
  { to: '/profile', icon: User, key: 'profile' },
  { to: '/profile/payment', icon: User, key: 'Payment Settings' },
  { to: '/profile/help', icon: HelpCircle, key: 'help' },
];

const navSpring = { type: 'spring' as const, stiffness: 420, damping: 22 };

const WorkerSidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <aside className="z-40 hidden min-h-screen w-[260px] flex-col border-r border-neutral-900 bg-[#050505] md:fixed md:left-0 md:top-0 md:flex">
      <motion.div
        className="px-6 py-5 border-b border-neutral-900"
        whileHover={{ scale: 1.02 }}
        transition={navSpring}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-600">
            <BrandLogo variant="inline" className="h-10 w-10 max-w-none object-cover" blendOnDark={false} alt="" />
          </div>
          <div className="min-w-0">
            <div className="font-sans text-lg font-black tracking-tight text-white mb-0.5">
              GigEase
            </div>
            <div className="text-[10px] font-bold text-[#777]">Worker Dashboard</div>
          </div>
        </div>
      </motion.div>

      <nav className="flex-1 py-4">
        {workerNav.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/home'}
            className={({ isActive }) =>
              `group flex items-center border-l-4 px-6 py-3.5 text-sm font-bold transition-colors ${
                isActive
                  ? 'border-orange-500 bg-[#161616] text-[#FF5722]'
                  : 'border-transparent text-[#888] hover:bg-[#111111] hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <motion.span className="flex w-full items-center gap-4" whileHover={{ x: 5 }} transition={navSpring}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} className={isActive ? 'text-[#FF5722]' : 'text-[#888]'} />
                {t(key)}
              </motion.span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 pb-8 border-t border-neutral-900">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-red-900/50 bg-[#111111] p-4 text-left transition-colors hover:border-red-900 hover:bg-[#1a1111] mb-6"
        >
          <motion.span 
            className="flex h-10 w-10 shrink-0 font-bold items-center justify-center rounded-xl bg-black border border-neutral-800"
          >
            <span className="text-white">📱</span>
          </motion.span>
          <span className="text-xs font-bold leading-snug text-red-600 block">Switch to admin panel</span>
        </button>
        <div className="text-[10px] leading-relaxed text-[#555]">
          <div>GigEase v1.0</div>
          <div>DEVTrails 2026</div>
        </div>
      </div>
    </aside>
  );
};

export default WorkerSidebar;
