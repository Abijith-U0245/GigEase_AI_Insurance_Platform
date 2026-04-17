import { useEffect, useState } from 'react';
import { API_BASE } from '../config/api';

export type SimulationMode = 'claims' | 'premium';

export function useSimulationData(workerId: string, mode: SimulationMode) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const endpoint =
      mode === 'claims'
        ? `/worker/${workerId}/simulate/claims`
        : `/worker/${workerId}/simulate/premium`;

    fetch(`${API_BASE}${endpoint}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText || `HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [workerId, mode]);

  return { data, loading, error };
}
