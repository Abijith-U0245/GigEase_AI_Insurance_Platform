import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import LanguageSwitcherRow from './LanguageSwitcherRow';

/**
 * Mobile admin chrome — dark purple glass (no sticker; corner mark in App layout).
 */
const AdminMobileShell: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className="border-b border-violet-500/25 bg-black/50 backdrop-blur-md py-2.5">
        <LanguageSwitcherRow />
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-violet-500/20 bg-gradient-to-r from-violet-950/50 to-black/80">
        <div className="min-w-0">
          <div className="font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-violet-200 to-fuchsia-200 leading-tight truncate">
            GigEase
          </div>
          <div className="text-xs font-semibold text-violet-300/80">Admin</div>
        </div>
        <div className="relative flex-shrink-0">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => navigate('/admin/audit')}
            className="w-11 h-11 flex items-center justify-center rounded-full border border-violet-500/30 bg-violet-950/40 text-violet-100 shadow-[0_0_20px_rgba(139,92,246,0.25)] transition-transform active:scale-95 hover:bg-violet-900/50"
          >
            <Bell size={22} strokeWidth={1.8} />
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-0.5 bg-gradient-to-br from-fuchsia-500 to-violet-600 rounded-full text-white text-[9px] font-black flex items-center justify-center">
              2
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminMobileShell;
