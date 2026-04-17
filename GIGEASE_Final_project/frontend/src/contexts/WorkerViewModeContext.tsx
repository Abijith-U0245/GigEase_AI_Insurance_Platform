import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'gigease_worker_mobile_preview';

type Value = {
  /** When true on a wide screen, worker UI uses the mobile shell (nav, compact lang). */
  mobilePreview: boolean;
  setMobilePreview: (v: boolean) => void;
  toggleMobilePreview: () => void;
};

const Ctx = createContext<Value | null>(null);

export const WorkerViewModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobilePreview, setMobilePreviewState] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const setMobilePreview = useCallback((v: boolean) => {
    setMobilePreviewState(v);
    try {
      sessionStorage.setItem(STORAGE_KEY, v ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  const toggleMobilePreview = useCallback(() => {
    setMobilePreviewState(prev => {
      const next = !prev;
      try {
        sessionStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ mobilePreview, setMobilePreview, toggleMobilePreview }),
    [mobilePreview, setMobilePreview, toggleMobilePreview]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useWorkerViewMode(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error('useWorkerViewMode must be used within WorkerViewModeProvider');
  return v;
}
