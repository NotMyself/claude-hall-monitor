import { useEffect, useState, useCallback } from 'react';
import { getPlans, getPlan } from '@/lib/api';
import type { Plan, PlanEvent } from '@/types/plans';
import { useSSE } from './use-sse';

export function usePlans(status?: 'active' | 'completed' | 'failed') {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPlans(status);
      setPlans(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [status]);

  // Initial fetch
  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Realtime updates via SSE
  useSSE('/events/plans', {
    onMessage: (event) => {
      try {
        const planEvent: PlanEvent = JSON.parse(event.data);

        // Update plans list based on event type
        if (planEvent.event_type === 'feature_completed' ||
            planEvent.event_type === 'feature_failed' ||
            planEvent.event_type === 'orchestration_started' ||
            planEvent.event_type === 'orchestration_completed') {
          // Re-fetch the specific plan to get updated data
          getPlan(planEvent.plan_name).then((updated) => {
            setPlans((prev) => prev.map((p) =>
              p.name === planEvent.plan_name ? updated : p
            ));
          }).catch(console.error);
        }
      } catch (e) {
        console.error('Failed to parse plan event:', e);
      }
    }
  });

  return { plans, loading, error, refetch: fetchPlans };
}
