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
  { to: '/profile', icon: User, key: 'profile' },
  { to: '/profile/help', icon: HelpCircle, key: 'help' },
];

const navSpring = { type: 'spring' as const, stiffness: 420, damping: 22 };

const WorkerSidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <aside className="z-40 hidden min-h-screen w-60 flex-col border-r border-orange-500/15 bg-gradient-to-b from-black via-[#0a0806] to-black md:fixed md:left-0 md:top-0 md:flex">
      <motion.div
        className="border-b border-orange-500/15 px-4 py-5"
        whileHover={{ scale: 1.02 }}
        transition={navSpring}
      >
        <div className="flex items-center gap-3 rounded-xl border border-orange-500/20 bg-orange-950/10 p-2.5 shadow-[0_8px_32px_rgba(234,88,12,0.08)] backdrop-blur-md">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-2 ring-orange-500/40">
            <BrandLogo variant="inline" className="h-10 w-10 max-w-none object-cover" blendOnDark={false} alt="" />
          </div>
          <div className="min-w-0">
            <div className="font-sans text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300">
              GigEase
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-orange-200/70">Worker dashboard</div>
          </div>
        </div>
      </motion.div>

      <nav className="flex-1 py-3">
        {workerNav.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/home'}
            className={({ isActive }) =>
              `group flex items-center border-l-[3px] px-4 py-3 text-sm font-bold transition-all ${
                isActive
                  ? 'border-orange-500 bg-orange-500/10 text-orange-400 shadow-[inset_0_0_24px_rgba(234,88,12,0.08)]'
                  : 'border-transparent text-neutral-400 hover:bg-neutral-900/80 hover:text-white'
              }`
            }
          >
            <motion.span className="flex w-full items-center gap-3" whileHover={{ x: 5 }} transition={navSpring}>
              <Icon size={18} strokeWidth={1.8} />
              {t(key)}
            </motion.span>
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 border-t border-orange-500/15 p-4">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="flex w-full items-center gap-3 rounded-xl border border-orange-500/25 bg-black/40 px-3 py-2.5 text-left backdrop-blur-md transition-colors hover:border-orange-500/45 hover:bg-orange-950/20"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-orange-500/30 bg-orange-500/10">
            <ShieldCheck size={18} className="text-orange-500" strokeWidth={2} aria-hidden />
          </span>
          <span className="text-xs font-bold leading-snug text-orange-400">Switch to admin panel</span>
        </button>
        <div className="text-[11px] leading-relaxed text-neutral-600">
          <div>GigEase v1.0</div>
          <div>DEVTrails 2026</div>
        </div>
      </div>
    </aside>
  );
};

export default WorkerSidebar;
