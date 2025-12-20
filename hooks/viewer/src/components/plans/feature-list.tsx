import { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type Feature } from '@/types/plans';
import { formatDuration, cn } from '@/lib/utils';

interface FeatureListProps {
  features: Feature[];
}

interface FeaturesByLayer {
  [layer: number]: Feature[];
}

function getStatusIcon(status: Feature['status']): { icon: string; className: string } {
  switch (status) {
    case 'completed':
      return { icon: '✓', className: 'text-green-500' };
    case 'in_progress':
      return { icon: '◐', className: 'text-blue-500 animate-spin' };
    case 'failed':
      return { icon: '✗', className: 'text-red-500' };
    case 'pending':
      return { icon: '○', className: 'text-gray-400 dark:text-gray-600' };
  }
}

function getStatusBadgeVariant(status: Feature['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
      return 'secondary';
    case 'in_progress':
      return 'default';
    case 'failed':
      return 'destructive';
    case 'pending':
      return 'outline';
  }
}

export function FeatureList({ features }: FeatureListProps) {
  const featuresByLayer = useMemo(() => {
    const grouped: FeaturesByLayer = {};
    features.forEach(feature => {
      if (!grouped[feature.layer]) {
        grouped[feature.layer] = [];
      }
      grouped[feature.layer].push(feature);
    });
    return grouped;
  }, [features]);

  const layers = Object.keys(featuresByLayer)
    .map(Number)
    .sort((a, b) => a - b);

  if (features.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        No features found
      </div>
    );
  }

  const shouldUseVirtualScrolling = features.length > 50;

  return (
    <ScrollArea className={cn("w-full", shouldUseVirtualScrolling ? "h-[600px]" : "h-full")}>
      <div className="space-y-6 pr-4">
        {layers.map(layer => (
          <div key={layer} className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Layer {layer}
            </h3>
            <div className="space-y-2">
              {featuresByLayer[layer].map(feature => {
                const { icon, className: iconClassName } = getStatusIcon(feature.status);
                return (
                  <Card key={feature.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <span className={cn("mt-0.5 text-lg", iconClassName)}>
                          {icon}
                        </span>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {feature.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                ID: {feature.id}
                              </p>
                            </div>
                            <Badge variant={getStatusBadgeVariant(feature.status)}>
                              {feature.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          {feature.duration !== undefined && (
                            <p className="text-xs text-muted-foreground">
                              Duration: {formatDuration(feature.duration)}
                            </p>
                          )}
                          {feature.error && (
                            <div className="mt-2 rounded-md bg-destructive/10 p-2">
                              <p className="text-xs text-destructive font-medium">
                                Error: {feature.error}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
