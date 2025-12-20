import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCostBreakdown } from '@/hooks';
import { Skeleton } from '@/components/ui/skeleton';

interface CostChartProps {
  period?: '24h' | '7d' | '30d';
}

export function CostChart({ period = '24h' }: CostChartProps) {
  const { data, loading, error } = useCostBreakdown(period);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  const chartData = data.timestamps.map((timestamp, i) => ({
    timestamp,
    cost: data.costs[i]
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
              fontSize={12}
            />
            <YAxis
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              fontSize={12}
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
              labelFormatter={(label) => new Date(label).toLocaleString()}
            />
            <Area
              type="monotone"
              dataKey="cost"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
