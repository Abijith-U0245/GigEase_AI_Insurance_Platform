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

// Lazy load admin (desktop-only)
const AdminOverview = lazy(() => import('./components/admin/AdminOverview'));
const WorkerTable = lazy(() => import('./components/admin/WorkerTable'));
const TriggerSimulator = lazy(() => import('./components/admin/TriggerSimulator'));
const AuditLog = lazy(() => import('./components/admin/AuditLog'));
const MLDashboard = lazy(() => import('./components/admin/MLDashboard'));
const ICRMonitor = lazy(() => import('./components/admin/ICRMonitor'));

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
// True Black & Neon Orange. Phone-sized shell when "mobile view" is chosen on desktop.
const WorkerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { mobilePreview } = useWorkerViewMode();
  const showMobileChrome = !isDesktop || mobilePreview;
  const showDesktopChrome = isDesktop && !mobilePreview;

  const shellClass =
    showMobileChrome && isDesktop
      ? 'max-w-md mx-auto w-full border-x border-neutral-800 shadow-[0_0_48px_rgba(0,0,0,0.65)]'
      : 'w-full';

  return (
    <div className="min-h-screen bg-black text-white">
      {showDesktopChrome && <WorkerSidebar />}
      <div className={`flex flex-col min-h-screen ${showDesktopChrome ? 'md:ml-60' : ''} ${shellClass}`}>
        {showMobileChrome ? (
          <div className="flex items-center justify-end px-3 py-2 border-b border-neutral-800 bg-black">
            <LanguageSwitcher compact />
          </div>
        ) : (
          <div className="hidden md:block fixed top-4 right-6 z-[100]">
            <LanguageSwitcher />
          </div>
        )}
        <CornerBrandMark variant="worker" />
        <main
          className={`flex-1 w-full max-md:pl-[3.35rem] px-3 pt-3 md:px-6 md:py-6 ${showDesktopChrome ? 'max-w-6xl md:pl-24' : 'max-w-full'} ${
            showMobileChrome ? 'pb-24' : 'pb-8 md:pb-12'
          } md:pt-2`}
        >
          {children}
        </main>
      </div>
      {showMobileChrome && <BottomNav variant="dark" />}
      <WorkerMobilePreviewToggle />
    </div>
  );
};

// ─── Admin Layout ────────────────────────────────────────────────
// Desktop (md+): unchanged — sidebar + main + globe language control.
// Mobile: reference orientation — demo banner, language row, brand + bell, stacked content, five-tab dock + ICR FAB.
const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#0b0618] via-[#0a0a0f] to-black">
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
