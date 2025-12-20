import { ActiveOrchestrations } from '@/components/plans/active-orchestrations';
import { MetricsGrid } from '@/components/metrics/metrics-grid';
import { CostChart } from '@/components/metrics/cost-chart';
import { TokensChart } from '@/components/metrics/tokens-chart';

export function OverviewPage() {
  // TODO: Integrate token breakdown data when API endpoint is available
  // TokensChart expects data from a useTokenBreakdown hook (not yet implemented)
  const tokenData: { model: string; tokens: number }[] = [];

  return (
    <div className="p-6 space-y-6">
      <section>
        <h2 className="text-2xl font-bold mb-4">Active Orchestrations</h2>
        <ActiveOrchestrations />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Metrics Today</h2>
        <MetricsGrid />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CostChart />
        <TokensChart data={tokenData} />
      </section>
    </div>
  );
}
