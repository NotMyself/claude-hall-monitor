import { usePlans } from '@/hooks';
import { PlanCard, PlanCardCompact } from './';
import { PlanCardSkeleton, PlanCardCompactSkeleton, EmptyState } from '@/components/shared';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Rocket } from 'lucide-react';
import type { Plan } from '@/types/plans';

interface ActiveOrchestrationsProps {
  onPlanClick?: (plan: Plan) => void;
}

export function ActiveOrchestrations({ onPlanClick }: ActiveOrchestrationsProps) {
  const { plans, loading, error } = usePlans('active');

  // Use compact view for 5+ plans (EC003)
  const useCompactView = plans.length >= 5;

  if (loading) {
    return (
      <div className={useCompactView ? 'space-y-2' : 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'}>
        {[...Array(3)].map((_, i) => 
          useCompactView ? (
            <PlanCardCompactSkeleton key={i} />
          ) : (
            <PlanCardSkeleton key={i} />
          )
        )}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading plans</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (plans.length === 0) {
    return (
      <EmptyState
        icon={<Rocket className="h-12 w-12" />}
        title="No active orchestrations"
        description="Plans will appear here when started. Use /plan-orchestrate to begin a new plan execution."
      />
    );
  }

  if (useCompactView) {
    return (
      <div className="space-y-2">
        {plans.map((plan) => (
          <PlanCardCompact
            key={plan.name}
            plan={plan}
            onClick={() => onPlanClick?.(plan)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <PlanCard
          key={plan.name}
          plan={plan}
          onClick={() => onPlanClick?.(plan)}
        />
      ))}
    </div>
  );
}
