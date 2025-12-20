import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Plan } from '@/types/plans';

interface PlanCardProps {
  plan: Plan;
  onClick?: () => void;
}

function calculateETA(plan: Plan): number | undefined {
  if (plan.completedCount === 0) return undefined;
  const avgDuration = (plan.duration || 0) / plan.completedCount;
  const remaining = plan.featureCount - plan.completedCount;
  return Math.ceil((avgDuration * remaining) / 60); // minutes
}

export function PlanCard({ plan, onClick }: PlanCardProps) {
  const progress = (plan.completedCount / plan.featureCount) * 100;
  const eta = calculateETA(plan);

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base md:text-lg">{plan.name}</CardTitle>
        <Badge
          variant={plan.status === 'active' ? 'default' :
                   plan.status === 'completed' ? 'secondary' : 'destructive'}
        >
          {plan.status === 'active' && (
            <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
          )}
          {plan.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-xs md:text-sm flex-wrap gap-1">
          <span>Feature {plan.completedCount}/{plan.featureCount}</span>
          {eta && <span className="text-muted-foreground">ETA: ~{eta}m</span>}
        </div>
        <Progress value={progress} />
        {plan.inProgressCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {plan.inProgressCount} feature{plan.inProgressCount > 1 ? 's' : ''} in progress
          </p>
        )}
        {plan.failedCount > 0 && (
          <p className="text-sm text-destructive">
            {plan.failedCount} feature{plan.failedCount > 1 ? 's' : ''} failed
          </p>
        )}
      </CardContent>
    </Card>
  );
}
