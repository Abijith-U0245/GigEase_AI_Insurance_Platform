import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type UserRole = 'worker' | 'admin';

const STORAGE_KEY = 'gigease_role';

type RoleContextValue = {
  role: UserRole;
  setRole: (r: UserRole) => void;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    try {
      const s = sessionStorage.getItem(STORAGE_KEY) as UserRole | null;
      if (s === 'worker' || s === 'admin') return s;
    } catch {
      /* ignore */
    }
    return 'worker';
  });

  const setRole = useCallback((r: UserRole) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, r);
    } catch {
      /* ignore */
    }
    setRoleState(r);
  }, []);

  const value = useMemo(() => ({ role, setRole }), [role, setRole]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}
