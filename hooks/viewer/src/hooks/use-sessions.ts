import { useEffect, useState, useCallback } from 'react';
import { getSessions, getSession } from '@/lib/api';
import type { Session } from '@/types/sessions';

interface SessionFilters {
  project?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export function useSessions(filters?: SessionFilters) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSessions(filters);
      setSessions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, error, refetch: fetchSessions };
}

export function useSession(id: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    getSession(id)
      .then(setSession)
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, [id]);

  return { session, loading, error };
}
