import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { REG_DECLARATION_STORAGE_KEY } from '../constants/regDeclaration';

/** Redirects to /register/declare if worker registration consent was not recorded. */
export function useRegDeclarationGuard() {
  const navigate = useNavigate();
  useEffect(() => {
    if (sessionStorage.getItem(REG_DECLARATION_STORAGE_KEY) !== '1') {
      navigate('/register/declare', { replace: true });
    }
  }, [navigate]);
}
