import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TokensChartProps {
  data: { model: string; tokens: number }[];
}

export function TokensChart({ data }: TokensChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tokens by Model</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical">
            <XAxis type="number" fontSize={12} />
            <YAxis
              dataKey="model"
              type="category"
              width={100}
              fontSize={12}
            />
            <Tooltip
              formatter={(value: number) => [value.toLocaleString(), 'Tokens']}
            />
            <Bar
              dataKey="tokens"
              fill="hsl(var(--primary))"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
