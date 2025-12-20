import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { type Plan, type Feature } from '@/types/plans';
import { formatDuration, cn } from '@/lib/utils';

interface OrchestrationTimelineProps {
  plans: Plan[];
  showEvents?: boolean;
}

interface TimelineFeature extends Feature {
  planName: string;
  startTime: number;
  endTime: number;
}

interface TimelineData {
  startTime: number;
  endTime: number;
  duration: number;
  features: TimelineFeature[];
}

function calculateTimelineData(plans: Plan[]): TimelineData {
  const features: TimelineFeature[] = [];
  let globalStartTime = Infinity;
  let globalEndTime = -Infinity;

  plans.forEach((plan) => {
    const planStartTime = new Date(plan.startedAt).getTime();
    let featureOffset = 0;

    plan.features.forEach((feature) => {
      const featureDuration = (feature.duration || 0) * 1000; // Convert to ms
      const startTime = planStartTime + featureOffset;
      const endTime = startTime + featureDuration;

      features.push({
        ...feature,
        planName: plan.name,
        startTime,
        endTime,
      });

      globalStartTime = Math.min(globalStartTime, startTime);
      globalEndTime = Math.max(globalEndTime, endTime);

      // Features run sequentially within a plan
      featureOffset += featureDuration;
    });

    // If plan is still active, extend end time to now
    if (plan.status === 'active') {
      globalEndTime = Math.max(globalEndTime, Date.now());
    }
  });

  return {
    startTime: globalStartTime === Infinity ? Date.now() : globalStartTime,
    endTime: globalEndTime === -Infinity ? Date.now() : globalEndTime,
    duration: globalEndTime - globalStartTime,
    features,
  };
}

function getStatusColor(status: Feature['status']): string {
  switch (status) {
    case 'pending':
      return 'bg-gray-200 dark:bg-gray-700';
    case 'in_progress':
      return 'bg-blue-500 animate-pulse';
    case 'completed':
      return 'bg-green-500';
    case 'failed':
      return 'bg-red-500';
  }
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function OrchestrationTimeline({ plans }: OrchestrationTimelineProps) {
  const timelineData = useMemo(() => calculateTimelineData(plans), [plans]);

  if (plans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orchestration Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No plan data available</p>
        </CardContent>
      </Card>
    );
  }

  const LANE_HEIGHT = 60;
  const HEADER_WIDTH = 200;
  const TIMELINE_WIDTH = 800;
  const PIXELS_PER_MS = TIMELINE_WIDTH / Math.max(timelineData.duration, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orchestration Timeline</CardTitle>
        <p className="text-sm text-muted-foreground">
          Visualizes parallel plan execution and helps identify bottlenecks
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full">
          <div className="relative">
            {/* Time axis */}
            <div className="mb-4 flex" style={{ marginLeft: HEADER_WIDTH }}>
              <div className="relative" style={{ width: TIMELINE_WIDTH }}>
                <div className="border-b-2 border-[#D4A27F]" />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>{formatTimestamp(timelineData.startTime)}</span>
                  <span>{formatTimestamp(timelineData.endTime)}</span>
                </div>
                <div className="mt-1 text-center text-xs text-muted-foreground">
                  Total duration: {formatDuration(Math.floor(timelineData.duration / 1000))}
                </div>
              </div>
            </div>

            {/* Plan lanes */}
            {plans.map((plan) => {
              const planFeatures = timelineData.features.filter(
                (f) => f.planName === plan.name
              );

              return (
                <div
                  key={plan.name}
                  className="flex border-b border-border"
                  style={{ height: LANE_HEIGHT }}
                >
                  {/* Plan name header */}
                  <div
                    className="flex items-center border-r border-border px-4 py-2"
                    style={{ width: HEADER_WIDTH }}
                  >
                    <div className="flex-1 overflow-hidden">
                      <div className="truncate font-medium text-sm">{plan.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {plan.completedCount}/{plan.featureCount} features
                      </div>
                    </div>
                  </div>

                  {/* Timeline lane */}
                  <div className="relative flex-1" style={{ width: TIMELINE_WIDTH }}>
                    <TooltipProvider>
                      {planFeatures.map((feature) => {
                        const featureDuration = feature.endTime - feature.startTime;
                        const left = (feature.startTime - timelineData.startTime) * PIXELS_PER_MS;
                        const width = featureDuration * PIXELS_PER_MS;

                        return (
                          <Tooltip key={feature.id}>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  'absolute top-2 rounded',
                                  getStatusColor(feature.status),
                                  'cursor-pointer transition-all hover:opacity-80'
                                )}
                                style={{
                                  left: `${left}px`,
                                  width: `${Math.max(width, 2)}px`,
                                  height: `${LANE_HEIGHT - 16}px`,
                                }}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                <div className="font-medium">{feature.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  ID: {feature.id}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Layer: {feature.layer}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Status: {feature.status}
                                </div>
                                {feature.duration && (
                                  <div className="text-xs text-muted-foreground">
                                    Duration: {formatDuration(feature.duration)}
                                  </div>
                                )}
                                {feature.error && (
                                  <div className="text-xs text-red-500">
                                    Error: {feature.error}
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </TooltipProvider>
                  </div>
                </div>
              );
            })}

            {/* Legend */}
            <div className="mt-6 flex gap-6 justify-center text-xs">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-700" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-blue-500" />
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-green-500" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-red-500" />
                <span>Failed</span>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
