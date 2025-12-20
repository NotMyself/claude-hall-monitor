import { useEffect, useState, useCallback } from 'react';
import { getDashboardStats, getCostBreakdown } from '@/lib/api';
import type { DashboardStats } from '@/types/sessions';

export function useMetrics(period: '24h' | '7d' | '30d' = '24h') {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats(period);
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { stats, loading, error, refetch: fetchMetrics };
}

export function useCostBreakdown(period: '24h' | '7d' | '30d' = '24h') {
  const [data, setData] = useState<{ timestamps: string[]; costs: number[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getCostBreakdown(period)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, [period]);

  return { data, loading, error };
}
