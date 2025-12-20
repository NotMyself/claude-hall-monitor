import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { type Plan } from '@/types/plans';
import { formatRelativeTime, formatDuration } from '@/lib/utils';
import { FeatureList } from './feature-list';

interface PlanDetailProps {
  plan: Plan;
}

function getStatusBadgeVariant(status: Plan['status']): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'active':
      return 'default';
    case 'completed':
      return 'secondary';
    case 'failed':
      return 'destructive';
  }
}

export function PlanDetail({ plan }: PlanDetailProps) {
  const progress = plan.featureCount > 0
    ? (plan.completedCount / plan.featureCount) * 100
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <CardTitle className="text-xl break-words">{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground break-all">
                {plan.path}
              </p>
            </div>
            <Badge
              variant={getStatusBadgeVariant(plan.status)}
              className="ml-4 shrink-0"
            >
              {plan.status === 'active' && (
                <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
              )}
              {plan.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Started</p>
              <p className="font-medium">{formatRelativeTime(plan.startedAt)}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(plan.startedAt).toLocaleString()}
              </p>
            </div>
            {plan.completedAt && (
              <div>
                <p className="text-muted-foreground">Completed</p>
                <p className="font-medium">{formatRelativeTime(plan.completedAt)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(plan.completedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">
                {plan.completedCount} / {plan.featureCount} features
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex gap-4 text-xs text-muted-foreground">
              {plan.inProgressCount > 0 && (
                <span className="text-blue-500">
                  {plan.inProgressCount} in progress
                </span>
              )}
              {plan.failedCount > 0 && (
                <span className="text-destructive">
                  {plan.failedCount} failed
                </span>
              )}
            </div>
          </div>

          {plan.duration !== undefined && (
            <>
              <Separator />
              <div className="text-sm">
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">{formatDuration(plan.duration)}</p>
              </div>
            </>
          )}

          {plan.eta !== undefined && plan.status === 'active' && (
            <>
              <Separator />
              <div className="text-sm">
                <p className="text-muted-foreground">Estimated Time Remaining</p>
                <p className="font-medium">~{plan.eta} minutes</p>
              </div>
            </>
          )}

          {plan.prUrl && (
            <>
              <Separator />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(plan.prUrl, '_blank')}
              >
                View Pull Request
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Features</CardTitle>
        </CardHeader>
        <CardContent>
          <FeatureList features={plan.features} />
        </CardContent>
      </Card>
    </div>
  );
}
