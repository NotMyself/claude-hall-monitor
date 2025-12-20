import { useMetrics } from '@/hooks';
import { StatCard } from './stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Zap, Users, CheckCircle } from 'lucide-react';

function formatCost(usd: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(usd);
}

function formatTokens(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}

interface MetricsGridProps {
  period?: '24h' | '7d' | '30d';
}

export function MetricsGrid({ period = '24h' }: MetricsGridProps) {
  const { stats, loading, error } = useMetrics(period);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Cost"
        value={formatCost(stats.total_cost_usd)}
        change={stats.cost_change_percent}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Total Tokens"
        value={formatTokens(stats.total_tokens)}
        change={stats.token_change_percent}
        icon={<Zap className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Active Sessions"
        value={stats.active_sessions.toString()}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Plans Completed"
        value={stats.plans_completed_today.toString()}
        icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  );
}
