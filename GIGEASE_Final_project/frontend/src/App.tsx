import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ToastProvider } from './components/shared/Toast';
import BottomNav from './components/shared/BottomNav';
import AdminSidebar from './components/shared/AdminSidebar';
import WorkerSidebar from './components/shared/WorkerSidebar';
import LanguageSwitcher from './components/shared/LanguageSwitcher';
import AdminBottomNav from './components/shared/AdminBottomNav';
import AdminMobileShell from './components/shared/AdminMobileShell';
import AdminMobileFAB from './components/shared/AdminMobileFAB';
import { NavigationTransition } from './components/shared/NavigationTransition';
import { PageLoadFallback } from './components/shared/PageLoadFallback';
import WorkerMobilePreviewToggle from './components/shared/WorkerMobilePreviewToggle';
import { CornerBrandMark } from './components/shared/CornerBrandMark';
import { RoleProvider } from './contexts/RoleContext';
import { WorkerViewModeProvider, useWorkerViewMode } from './contexts/WorkerViewModeContext';
import { useMediaQuery } from './hooks/useMediaQuery';

// Eager load worker core screens
import LoginPage from './components/auth/LoginPage';
import OTPPage from './components/auth/OTPPage';
import Register1 from './components/auth/Register1';
import Register2 from './components/auth/Register2';
import Register3 from './components/auth/Register3';
import Register4 from './components/auth/Register4';
import RegisterSuccess from './components/auth/RegisterSuccess';
import RegisterRole from './components/auth/RegisterRole';
import RegisterDeclaration from './components/auth/RegisterDeclaration';
import HomePage from './components/dashboard/HomePage';
import PolicyPage from './components/policy/PolicyPage';
import STFIDetails from './components/policy/STFIDetails';
import RSMDDetails from './components/policy/RSMDDetails';
import PolicyEventLog from './components/policy/PolicyEventLog';
import PremiumPage from './components/premium/PremiumPage';
import PremiumHistory from './components/premium/PremiumHistory';
import ZoneTip from './components/premium/ZoneTip';
import MLExplain from './components/premium/MLExplain';
import ClaimsOverview from './components/claims/ClaimsOverview';
import ClaimDetail from './components/claims/ClaimDetail';
import PipelineTracker from './components/claims/PipelineTracker';
import PartialPay from './components/claims/PartialPay';
import FullHold from './components/claims/FullHold';
import ClaimAppeal from './components/claims/ClaimAppeal';
import DisruptionMap from './components/claims/DisruptionMap';
import ProfilePage from './components/profile/ProfilePage';
import EditProfile from './components/profile/EditProfile';
import NotificationPrefs from './components/profile/NotificationPrefs';
import HelpFAQ from './components/profile/HelpFAQ';

// Phase 3 Worker additions
import PaymentSettings from './components/Payment/PaymentSettings';
import PremiumToggle from './components/RealTimeEngine/PremiumToggle';

// Lazy load admin (desktop-only)
const AdminOverview = lazy(() => import('./components/admin/AdminOverview'));
const WorkerTable = lazy(() => import('./components/admin/WorkerTable'));
const TriggerSimulator = lazy(() => import('./components/admin/TriggerSimulator'));
const AuditLog = lazy(() => import('./components/admin/AuditLog'));
const MLDashboard = lazy(() => import('./components/admin/MLDashboard'));
const ICRMonitor = lazy(() => import('./components/admin/ICRMonitor'));
const FraudMapAdmin = lazy(() => import('./components/FraudMap/FraudMapAdmin'));
const ZoneNewsFeedWrapper = lazy(() => import('./components/News/ZoneNewsFeed').then(m => ({ default: () => <m.default zoneId="VELACHERY" /> })));

// Smooth fade transition
const pageVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 },
};
const pageTransition = { duration: 0.35, ease: 'easeInOut' as const };

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="in"
    exit="out"
    transition={pageTransition}
    className="h-full min-h-screen"
  >
    {children}
  </motion.div>
);

// ─── Worker Layout ────────────────────────────────────────────────
// Desktop: sidebar + header + content + mobile preview toggle FAB.
// Mobile: top lang switcher, stacked content, 4-tab bottom nav.
const WorkerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { mobilePreview } = useWorkerViewMode();

  // On desktop, mobile preview wraps content in a phone frame shell
  const showPhoneFrame = isDesktop && mobilePreview;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#080808] text-white selection:bg-orange-500/30 font-sans">
      {/* Desktop sidebar — hidden in mobile-preview mode */}
      {!showPhoneFrame && (
        <div className="hidden md:block z-[40]">
          <WorkerSidebar />
        </div>
      )}

      <div className={`flex-1 flex flex-col min-h-screen min-w-0 w-full bg-transparent text-neutral-100 relative ${!showPhoneFrame ? 'md:ml-64' : ''}`}>
        {/* Demo banner */}
        <div className="w-full bg-[#FF4500] text-white text-center py-1.5 text-[11px] font-black tracking-[0.2em] uppercase">
          DEMO MODE — ALL DATA IS SIMULATED
        </div>
        <CornerBrandMark variant="worker" />

        {/* Top header bar */}
        {!isDesktop ? (
          // Mobile: compact language switcher sticky header
          <div className="flex items-center justify-end px-4 py-3 border-b border-orange-500/20 bg-black/50 backdrop-blur-lg sticky top-0 z-[30]">
            <LanguageSwitcher compact />
          </div>
        ) : (
          // Desktop: language switcher + mobile-preview toggle hint
          <div className="hidden md:flex items-center justify-between gap-3 px-6 py-4 border-b border-orange-500/10 bg-black/40 backdrop-blur-xl shrink-0 sticky top-0 z-[30]">
            <div className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
              {showPhoneFrame ? '📱 Mobile Preview' : 'Desktop View'}
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
            </div>
          </div>
        )}

        {/* Content area — phone frame when in preview mode */}
        {showPhoneFrame ? (
          // Phone frame shell — 390px iPhone-style frame centered on desktop
          <div className="flex-1 flex items-start justify-center py-10 px-4 overflow-y-auto bg-[#050505]">
            <div
              className="relative flex flex-col overflow-hidden"
              style={{
                width: 390,
                minHeight: 844,
                borderRadius: 44,
                border: '7px solid #2a2a2a',
                background: '#080808',
                boxShadow: '0 0 0 2px #111, 0 40px 120px rgba(0,0,0,0.9), inset 0 0 0 1px #333',
              }}
            >
              {/* Phone status bar + notch */}
              <div className="w-full h-10 bg-black flex items-center justify-between px-6 shrink-0 relative">
                <span className="text-[10px] text-white font-bold">9:41</span>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-b-xl z-50" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-white">●●●</span>
                </div>
              </div>
              {/* Language row — matches Image 4 */}
              <div className="flex items-center justify-center gap-3 py-3 shrink-0 border-b border-neutral-900">
                <div className="h-8 w-8 rounded-full bg-[#FF4500] flex items-center justify-center font-bold text-white text-[11px] shadow-[0_0_12px_rgba(255,69,0,0.4)]">EN</div>
                <div className="h-8 w-8 rounded-full bg-[#1a1a1a] border border-neutral-800 flex items-center justify-center text-neutral-500 text-[11px]">த</div>
                <div className="h-8 w-8 rounded-full bg-[#1a1a1a] border border-neutral-800 flex items-center justify-center text-neutral-500 text-[11px]">हि</div>
                <div className="h-8 w-8 rounded-full bg-[#1a1a1a] border border-neutral-800 flex items-center justify-center text-neutral-500 text-[11px]">ಕ</div>
              </div>
              {/* Scrollable page content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-4">
                {children}
              </div>
              {/* Bottom nav pinned inside phone */}
              <div className="shrink-0">
                <BottomNav variant="dark" />
              </div>
            </div>
          </div>
        ) : (
          // Normal content
          <main className="flex-1 w-full p-4 md:p-8 overflow-x-hidden max-md:pb-24">
            <div className="max-w-[1600px] mx-auto w-full">
              {children}
            </div>
          </main>
        )}

        {/* Mobile real-device bottom nav */}
        {!isDesktop && (
          <div className="fixed bottom-0 left-0 right-0 z-[50]">
            <BottomNav variant="dark" />
          </div>
        )}
      </div>

      {/* Desktop FAB: toggle phone preview */}
      <WorkerMobilePreviewToggle />
    </div>
  );
};

// ─── Admin Layout ────────────────────────────────────────────────
// Desktop (md+): unchanged — sidebar + main + globe language control.
// Mobile: reference orientation — demo banner, language row, brand + bell, stacked content, five-tab dock + ICR FAB.
const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#080808] text-white selection:bg-orange-500/30 font-sans">
      <div className="hidden md:block">
        <AdminSidebar />
      </div>
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen min-w-0 w-full bg-transparent md:text-neutral-100">
        <CornerBrandMark variant="admin" />
        <div className="md:hidden">
          <AdminMobileShell />
        </div>
        <div className="hidden md:flex items-center justify-end gap-3 px-6 py-3 border-b border-violet-500/20 bg-black/35 backdrop-blur-md shrink-0">
          <LanguageSwitcher />
        </div>
        <main className="flex-1 max-md:pl-[3.35rem] p-4 md:ml-0 md:pl-24 md:p-6 md:pt-5 overflow-x-auto max-md:pb-28 md:min-h-0 max-md:pt-3">
          {children}
        </main>
        <div className="md:hidden">
          <AdminBottomNav />
          <AdminMobileFAB />
        </div>
      </div>
    </div>
  );
};

// ─── Auth Layout ─────────────────────────────────────────────────
const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-black">
    <div className="fixed top-4 right-4 z-[100]">
      <LanguageSwitcher />
    </div>
    {children}
  </div>
);

// ─── Animated Routes ─────────────────────────────────────────────
const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Auth */}
        <Route path="/login" element={<AuthLayout><PageWrapper><LoginPage /></PageWrapper></AuthLayout>} />
        <Route path="/otp" element={<AuthLayout><PageWrapper><OTPPage /></PageWrapper></AuthLayout>} />
        <Route path="/register" element={<AuthLayout><PageWrapper><RegisterRole /></PageWrapper></AuthLayout>} />
        <Route path="/register/declare" element={<AuthLayout><PageWrapper><RegisterDeclaration /></PageWrapper></AuthLayout>} />
        <Route path="/register/1" element={<AuthLayout><PageWrapper><Register1 /></PageWrapper></AuthLayout>} />
        <Route path="/register/2" element={<AuthLayout><PageWrapper><Register2 /></PageWrapper></AuthLayout>} />
        <Route path="/register/3" element={<AuthLayout><PageWrapper><Register3 /></PageWrapper></AuthLayout>} />
        <Route path="/register/4" element={<AuthLayout><PageWrapper><Register4 /></PageWrapper></AuthLayout>} />
        <Route path="/register/success" element={<AuthLayout><PageWrapper><RegisterSuccess /></PageWrapper></AuthLayout>} />

        {/* Worker */}
        <Route path="/home" element={<WorkerLayout><PageWrapper><HomePage /></PageWrapper></WorkerLayout>} />
        <Route path="/policy" element={<WorkerLayout><PageWrapper><PolicyPage /></PageWrapper></WorkerLayout>} />
        <Route path="/policy/stfi" element={<WorkerLayout><PageWrapper><STFIDetails /></PageWrapper></WorkerLayout>} />
        <Route path="/policy/rsmd" element={<WorkerLayout><PageWrapper><RSMDDetails /></PageWrapper></WorkerLayout>} />
        <Route path="/policy/events" element={<WorkerLayout><PageWrapper><PolicyEventLog /></PageWrapper></WorkerLayout>} />
        <Route path="/premium" element={<WorkerLayout><PageWrapper><PremiumPage /></PageWrapper></WorkerLayout>} />
        <Route path="/premium/history" element={<WorkerLayout><PageWrapper><PremiumHistory /></PageWrapper></WorkerLayout>} />
        <Route path="/premium/zones" element={<WorkerLayout><PageWrapper><ZoneTip /></PageWrapper></WorkerLayout>} />
        <Route path="/premium/model" element={<WorkerLayout><PageWrapper><MLExplain /></PageWrapper></WorkerLayout>} />
        <Route path="/claims" element={<WorkerLayout><PageWrapper><ClaimsOverview /></PageWrapper></WorkerLayout>} />
        <Route path="/claims/map" element={<WorkerLayout><PageWrapper><DisruptionMap /></PageWrapper></WorkerLayout>} />
        <Route path="/claims/:id" element={<WorkerLayout><PageWrapper><ClaimDetail /></PageWrapper></WorkerLayout>} />
        <Route path="/claims/:id/pipeline" element={<WorkerLayout><PageWrapper><PipelineTracker /></PageWrapper></WorkerLayout>} />
        <Route path="/claims/:id/partial" element={<WorkerLayout><PageWrapper><PartialPay /></PageWrapper></WorkerLayout>} />
        <Route path="/claims/:id/hold" element={<WorkerLayout><PageWrapper><FullHold /></PageWrapper></WorkerLayout>} />
        <Route path="/claims/:id/appeal" element={<WorkerLayout><PageWrapper><ClaimAppeal /></PageWrapper></WorkerLayout>} />
        <Route path="/profile" element={<WorkerLayout><PageWrapper><ProfilePage /></PageWrapper></WorkerLayout>} />
        <Route path="/profile/edit" element={<WorkerLayout><PageWrapper><EditProfile /></PageWrapper></WorkerLayout>} />
        <Route path="/profile/notifications" element={<WorkerLayout><PageWrapper><NotificationPrefs /></PageWrapper></WorkerLayout>} />
        <Route path="/profile/help" element={<WorkerLayout><PageWrapper><HelpFAQ /></PageWrapper></WorkerLayout>} />

        {/* Admin */}
        <Route path="/admin" element={<AdminLayout><Suspense fallback={<PageLoadFallback />}><PageWrapper><AdminOverview /></PageWrapper></Suspense></AdminLayout>} />
        <Route path="/admin/workers" element={<AdminLayout><Suspense fallback={<PageLoadFallback />}><PageWrapper><WorkerTable /></PageWrapper></Suspense></AdminLayout>} />
        <Route path="/admin/trigger" element={<AdminLayout><Suspense fallback={<PageLoadFallback />}><PageWrapper><TriggerSimulator /></PageWrapper></Suspense></AdminLayout>} />
        <Route path="/admin/audit" element={<AdminLayout><Suspense fallback={<PageLoadFallback />}><PageWrapper><AuditLog /></PageWrapper></Suspense></AdminLayout>} />
        <Route path="/admin/model" element={<AdminLayout><Suspense fallback={<PageLoadFallback />}><PageWrapper><MLDashboard /></PageWrapper></Suspense></AdminLayout>} />
        <Route path="/admin/icr" element={<AdminLayout><Suspense fallback={<PageLoadFallback />}><PageWrapper><ICRMonitor /></PageWrapper></Suspense></AdminLayout>} />
        <Route path="/admin/fraud-map" element={<AdminLayout><Suspense fallback={<PageLoadFallback />}><PageWrapper><FraudMapAdmin /></PageWrapper></Suspense></AdminLayout>} />
        <Route path="/admin/news" element={<AdminLayout><Suspense fallback={<PageLoadFallback />}><PageWrapper><ZoneNewsFeedWrapper /></PageWrapper></Suspense></AdminLayout>} />

        <Route path="/premium/simulate" element={<WorkerLayout><PageWrapper><PremiumToggle zoneId="VELACHERY" /></PageWrapper></WorkerLayout>} />
        <Route path="/profile/payment" element={<WorkerLayout><PageWrapper><PaymentSettings workerId="W1234" /></PageWrapper></WorkerLayout>} />

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <RoleProvider>
      <WorkerViewModeProvider>
        <ToastProvider>
          <NavigationTransition />
          <AnimatedRoutes />
        </ToastProvider>
      </WorkerViewModeProvider>
    </RoleProvider>
  </BrowserRouter>
);

export default App;
