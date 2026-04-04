import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, Zap, ClipboardList, Brain, Activity, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BrandLogo } from './BrandLogo';

const navSpring = { type: 'spring' as const, stiffness: 420, damping: 22 };
const adminNav = [
  { to: '/admin', icon: LayoutDashboard, key: 'overview' },
  { to: '/admin/workers', icon: Users, key: 'workers' },
  { to: '/admin/trigger', icon: Zap, key: 'trigger_simulator' },
  { to: '/admin/audit', icon: ClipboardList, key: 'claims_audit' },
  { to: '/admin/model', icon: Brain, key: 'ml_model' },
  { to: '/admin/icr', icon: Activity, key: 'icr_monitor' },
];

/** Desktop admin — violet gradient shell (sticker logo only in dashboard corner + auth). */
const AdminSidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <aside className="w-60 min-h-screen border-r border-violet-500/20 flex flex-col fixed left-0 top-0 z-40 bg-gradient-to-b from-[#100818] via-[#0a0612] to-black">
      <motion.div
        className="border-b border-violet-500/15 px-4 py-5"
        whileHover={{ scale: 1.02 }}
        transition={navSpring}
      >
        <div className="flex items-center gap-3 rounded-xl border border-violet-500/25 bg-violet-950/20 p-2.5 backdrop-blur-md">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-2 ring-violet-500/40">
            <BrandLogo variant="inline" className="h-10 w-10 max-w-none object-cover" blendOnDark={false} alt="" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-sans text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-amber-200">
              GigEase
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-violet-300/70">Admin panel</div>
          </div>
        </div>
      </motion.div>

      <nav className="flex-1 overflow-y-auto py-3">
        {adminNav.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            className={({ isActive }) =>
              `flex min-h-[48px] items-center border-l-[3px] px-4 text-sm font-bold transition-all ${
                isActive
                  ? 'border-violet-500 bg-violet-600/15 text-violet-200 shadow-[inset_0_0_20px_rgba(139,92,246,0.12)]'
                  : 'border-transparent text-neutral-400 hover:bg-violet-950/40 hover:text-white'
              }`
            }
          >
            <motion.span className="flex w-full items-center gap-3" whileHover={{ x: 5 }} transition={navSpring}>
              <Icon size={18} strokeWidth={1.85} className="shrink-0" />
              <span className="leading-snug">{t(key)}</span>
            </motion.span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-neutral-800 space-y-3">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-bold text-violet-400 transition-colors hover:bg-violet-950/50 hover:text-violet-200"
        >
          <ArrowLeft size={16} className="shrink-0" strokeWidth={2} />
          <span className="text-left leading-snug">Back to Worker View</span>
        </button>
        <div className="text-[11px] text-neutral-600 leading-relaxed">
          <div>GigEase v1.0</div>
          <div>DEVTrails 2026</div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
