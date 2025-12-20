import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type Plan } from '@/types/plans';
import { cn } from '@/lib/utils';

interface PlanListProps {
  plans: Plan[];
  selectedPlan?: Plan;
  onSelect: (plan: Plan) => void;
}

type PlanStatus = 'all' | 'active' | 'completed' | 'failed';

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

export function PlanList({ plans, selectedPlan, onSelect }: PlanListProps) {
  const [statusFilter, setStatusFilter] = useState<PlanStatus>('all');

  const filteredPlans = plans.filter(plan => {
    if (statusFilter === 'all') return true;
    return plan.status === statusFilter;
  });

  const statusCounts = {
    all: plans.length,
    active: plans.filter(p => p.status === 'active').length,
    completed: plans.filter(p => p.status === 'completed').length,
    failed: plans.filter(p => p.status === 'failed').length,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'active', 'completed', 'failed'] as PlanStatus[]).map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={cn(
                statusFilter === status && status === 'active' && 'bg-[#D4A27F] hover:bg-[#C4927F] dark:bg-[#D4A27F] dark:hover:bg-[#C4927F]'
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filteredPlans.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            No plans found
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filteredPlans.map(plan => {
              const isSelected = selectedPlan?.name === plan.name;
              return (
                <Card
                  key={plan.name}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    isSelected && "ring-2 ring-[#D4A27F] dark:ring-[#D4A27F]"
                  )}
                  onClick={() => onSelect(plan)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {plan.completedCount}/{plan.featureCount} features
                        </p>
                      </div>
                      <Badge
                        variant={getStatusBadgeVariant(plan.status)}
                        className="shrink-0"
                      >
                        {plan.status === 'active' && (
                          <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                        )}
                        {plan.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
