import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlanList, PlanDetail, OrchestrationTimeline } from '@/components/plans';
import { usePlans } from '@/hooks/use-plans';
import type { Plan } from '@/types/plans';

interface SplitPanelProps {
  plans: Plan[];
  selectedPlan: Plan | null;
  onSelect: (plan: Plan) => void;
}

function SplitPanel({ plans, selectedPlan, onSelect }: SplitPanelProps) {
  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      <div className="col-span-1 h-full">
        <PlanList
          plans={plans}
          selectedPlan={selectedPlan || undefined}
          onSelect={onSelect}
        />
      </div>
      <div className="col-span-2 h-full overflow-auto">
        {selectedPlan ? (
          <PlanDetail plan={selectedPlan} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a plan to view details
          </div>
        )}
      </div>
    </div>
  );
}

export function PlansPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const { plans, loading } = usePlans();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading plans...</p>
      </div>
    );
  }

  const activePlans = plans.filter(p => p.status === 'active');
  const completedPlans = plans.filter(p => p.status === 'completed' || p.status === 'failed');

  return (
    <div className="h-full flex flex-col p-6">
      <Tabs defaultValue="active" className="h-full flex flex-col">
        <TabsList className="mb-4">
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
          <SplitPanel
            plans={activePlans}
            selectedPlan={selectedPlan}
            onSelect={setSelectedPlan}
          />
        </TabsContent>

        <TabsContent value="completed" className="flex-1 mt-0">
          <SplitPanel
            plans={completedPlans}
            selectedPlan={selectedPlan}
            onSelect={setSelectedPlan}
          />
        </TabsContent>

        <TabsContent value="all" className="flex-1 mt-0">
          <SplitPanel
            plans={plans}
            selectedPlan={selectedPlan}
            onSelect={setSelectedPlan}
          />
        </TabsContent>

        <TabsContent value="timeline" className="flex-1 mt-0">
          <OrchestrationTimeline plans={plans} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
