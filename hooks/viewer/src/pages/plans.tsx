import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlanList, PlanDetail, OrchestrationTimeline } from '@/components/plans';
import { PlanCardSkeleton, PlanDetailSkeleton, EmptyState } from '@/components/shared';
import { usePlans } from '@/hooks/use-plans';
import type { Plan } from '@/types/plans';
import { FileText } from 'lucide-react';

interface SplitPanelProps {
  plans: Plan[];
  selectedPlan: Plan | null;
  onSelect: (plan: Plan) => void;
}

function SplitPanel({ plans, selectedPlan, onSelect }: SplitPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
      <div className="md:col-span-1 h-full">
        <PlanList
          plans={plans}
          selectedPlan={selectedPlan || undefined}
          onSelect={onSelect}
        />
      </div>
      <div className="md:col-span-2 h-full overflow-auto">
        {selectedPlan ? (
          <PlanDetail plan={selectedPlan} />
        ) : (
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="Select a plan"
            description="Choose a plan from the list to view its details"
          />
        )}
      </div>
    </div>
  );
}

export function PlansPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const { plans, loading, error } = usePlans();

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="mb-4 h-10 flex items-center">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          <div className="md:col-span-1 space-y-2">
            {[...Array(3)].map((_, i) => (
              <PlanCardSkeleton key={i} />
            ))}
          </div>
          <div className="md:col-span-2">
            <PlanDetailSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="Failed to load plans"
          description={error.message}
        />
      </div>
    );
  }

  const activePlans = plans.filter(p => p.status === 'active');
  const completedPlans = plans.filter(p => p.status === 'completed' || p.status === 'failed');

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="active" className="h-full flex flex-col">
        <TabsList className="mb-3 md:mb-4">
          <TabsTrigger value="active">
            Active ({activePlans.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedPlans.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({plans.length})
          </TabsTrigger>
          <TabsTrigger value="timeline">
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="flex-1 mt-0">
          {activePlans.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="No active plans"
              description="There are currently no active plan orchestrations running"
            />
          ) : (
            <SplitPanel
              plans={activePlans}
              selectedPlan={selectedPlan}
              onSelect={setSelectedPlan}
            />
          )}
        </TabsContent>

        <TabsContent value="completed" className="flex-1 mt-0">
          {completedPlans.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="No completed plans"
              description="No plan orchestrations have been completed yet"
            />
          ) : (
            <SplitPanel
              plans={completedPlans}
              selectedPlan={selectedPlan}
              onSelect={setSelectedPlan}
            />
          )}
        </TabsContent>

        <TabsContent value="all" className="flex-1 mt-0">
          {plans.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="No plans found"
              description="No plan orchestrations have been created yet. Run a plan using /plan-orchestrate to get started."
            />
          ) : (
            <SplitPanel
              plans={plans}
              selectedPlan={selectedPlan}
              onSelect={setSelectedPlan}
            />
          )}
        </TabsContent>

        <TabsContent value="timeline" className="flex-1 mt-0">
          <OrchestrationTimeline plans={plans} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
