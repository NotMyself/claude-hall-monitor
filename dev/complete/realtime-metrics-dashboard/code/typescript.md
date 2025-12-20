# TypeScript Patterns

## Types

### Basic Types

Foundation types from the data collection API:

```typescript
interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
}

interface CostBreakdown {
  input_cost_usd: number;
  output_cost_usd: number;
  cache_read_cost_usd: number;
  cache_creation_cost_usd: number;
  total_cost_usd: number;
}

interface MetricEntry {
  id: string;
  timestamp: string;
  session_id: string;
  project_path: string;
  source: 'hook' | 'transcript' | 'telemetry' | 'custom';
  event_type: string;
  event_category: 'tool' | 'api' | 'session' | 'user' | 'custom';
  model?: string;
  tokens?: TokenUsage;
  cost?: CostBreakdown;
  tool_name?: string;
  tool_duration_ms?: number;
  tool_success?: boolean;
  data: Record<string, unknown>;
  tags: string[];
}

interface PlanEvent {
  id: string;
  timestamp: string;
  session_id: string;
  event_type: 'plan_created' | 'plan_optimized' | 'feature_created'
            | 'orchestration_started' | 'feature_started' | 'feature_completed'
            | 'feature_failed' | 'orchestration_completed' | 'pr_created';
  plan_name: string;
  plan_path: string;
  feature_id?: string;
  feature_description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
  pr_url?: string;
  data: Record<string, unknown>;
}
```

### Dashboard Types

Dashboard-specific aggregated types:

```typescript
interface Feature {
  id: string;
  title: string;
  layer: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  duration?: number;  // seconds
  error?: string;
}

interface Plan {
  name: string;
  path: string;
  status: 'active' | 'completed' | 'failed';
  features: Feature[];
  featureCount: number;
  completedCount: number;
  inProgressCount: number;
  failedCount: number;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  eta?: number;  // estimated minutes remaining
  prUrl?: string;
  sessionId: string;
}

interface DashboardStats {
  total_cost_usd: number;
  cost_change_percent: number;
  total_tokens: number;
  token_change_percent: number;
  active_sessions: number;
  plans_completed_today: number;
}

interface Session {
  session_id: string;
  project_path: string;
  project_name: string;
  started_at: string;
  ended_at?: string;
  duration: number;
  cost_usd: number;
  total_tokens: number;
  model: string;
  tool_usage: Record<string, number>;
  summary?: string;
}
```

## Utilities

### Core Helpers

Pure functions with no dependencies:

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// shadcn/ui utility for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format duration in seconds to human readable
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes < 60) return `${minutes}m ${secs}s`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

// Format timestamp to relative time
export function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// Format cost to currency
export function formatCost(usd: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(usd);
}

// Format token count with K/M suffix
export function formatTokens(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}

// Calculate ETA based on average feature duration
export function calculateETA(plan: Plan): number | undefined {
  if (plan.completedCount === 0) return undefined;
  const avgDuration = (plan.duration || 0) / plan.completedCount;
  const remaining = plan.featureCount - plan.completedCount;
  return Math.ceil((avgDuration * remaining) / 60); // minutes
}
```

## API Functions

### API Client

Fetch wrappers for API endpoints:

```typescript
const API_BASE = 'http://localhost:3456';

export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new APIError(response.status, response.statusText, data);
  }

  return response.json();
}

// Dashboard stats
export async function getDashboardStats(
  period: '24h' | '7d' | '30d' = '24h'
): Promise<DashboardStats> {
  return fetchAPI(`/api/dashboard/stats?period=${period}`);
}

// Plans
export async function getPlans(
  status?: 'active' | 'completed' | 'failed'
): Promise<Plan[]> {
  const query = status ? `?status=${status}` : '';
  return fetchAPI(`/api/plans${query}`);
}

export async function getPlan(name: string): Promise<Plan> {
  return fetchAPI(`/api/plans/${encodeURIComponent(name)}`);
}

export async function getPlanEvents(
  planName?: string,
  sessionId?: string
): Promise<PlanEvent[]> {
  const params = new URLSearchParams();
  if (planName) params.set('plan_name', planName);
  if (sessionId) params.set('session_id', sessionId);
  return fetchAPI(`/api/plans/events?${params}`);
}

// Sessions
export async function getSessions(filters?: {
  project?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<Session[]> {
  const params = new URLSearchParams();
  if (filters?.project) params.set('project', filters.project);
  if (filters?.startDate) params.set('start_date', filters.startDate);
  if (filters?.endDate) params.set('end_date', filters.endDate);
  if (filters?.limit) params.set('limit', filters.limit.toString());
  if (filters?.offset) params.set('offset', filters.offset.toString());
  return fetchAPI(`/api/sessions?${params}`);
}

export async function getSession(id: string): Promise<Session> {
  return fetchAPI(`/api/sessions/${encodeURIComponent(id)}`);
}

// Metrics
export async function getMetrics(filters?: {
  session_id?: string;
  event_category?: string;
  start_time?: string;
  end_time?: string;
}): Promise<MetricEntry[]> {
  const params = new URLSearchParams();
  if (filters?.session_id) params.set('session_id', filters.session_id);
  if (filters?.event_category) params.set('event_category', filters.event_category);
  if (filters?.start_time) params.set('start_time', filters.start_time);
  if (filters?.end_time) params.set('end_time', filters.end_time);
  return fetchAPI(`/api/metrics?${params}`);
}

export async function getCostBreakdown(
  period: '24h' | '7d' | '30d' = '24h'
): Promise<{ timestamps: string[]; costs: number[] }> {
  return fetchAPI(`/api/metrics/costs?period=${period}`);
}
```

## Hooks

### SSE Hook

Server-Sent Events hook with auto-reconnect:

```typescript
import { useEffect, useState, useRef, useCallback } from 'react';

interface UseSSEOptions {
  onMessage?: (event: MessageEvent) => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number; // milliseconds
  maxReconnectInterval?: number;
}

export function useSSE(url: string, options: UseSSEOptions = {}) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectIntervalRef = useRef(options.reconnectInterval || 1000);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
      reconnectIntervalRef.current = options.reconnectInterval || 1000; // Reset backoff
    };

    eventSource.onmessage = (event) => {
      options.onMessage?.(event);
    };

    eventSource.onerror = (err) => {
      setConnected(false);
      const errorObj = new Error('SSE connection failed');
      setError(errorObj);
      options.onError?.(err);

      // Exponential backoff
      const maxInterval = options.maxReconnectInterval || 30000;
      const nextInterval = Math.min(reconnectIntervalRef.current * 2, maxInterval);
      reconnectIntervalRef.current = nextInterval;

      // Reconnect after delay
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, reconnectIntervalRef.current);
    };
  }, [url, options]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect]);

  return { connected, error };
}
```

### Data Hooks

Custom hooks for fetching and managing data:

```typescript
import { useEffect, useState } from 'react';
import { getPlans, getPlanEvents, type Plan, type PlanEvent } from '@/lib/api';
import { useSSE } from './use-sse';

export function usePlans(status?: 'active' | 'completed' | 'failed') {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initial fetch
  useEffect(() => {
    getPlans(status)
      .then(setPlans)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [status]);

  // Realtime updates via SSE
  useSSE('/events/plans', {
    onMessage: (event) => {
      const planEvent: PlanEvent = JSON.parse(event.data);

      // Update plans list based on event type
      if (planEvent.event_type === 'feature_completed' || planEvent.event_type === 'feature_failed') {
        setPlans((prev) =>
          prev.map((plan) => {
            if (plan.name === planEvent.plan_name) {
              // Re-fetch this specific plan to get updated data
              getPlan(plan.name).then((updated) => {
                setPlans((p) => p.map((x) => (x.name === plan.name ? updated : x)));
              });
            }
            return plan;
          })
        );
      }
    }
  });

  return { plans, loading, error, refetch: () => getPlans(status).then(setPlans) };
}

export function useMetrics(period: '24h' | '7d' | '30d' = '24h') {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getDashboardStats(period)
      .then(setStats)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [period]);

  return { stats, loading, error };
}

export function useSessions(filters?: Parameters<typeof getSessions>[0]) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getSessions(filters)
      .then(setSessions)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [JSON.stringify(filters)]);

  return { sessions, loading, error };
}
```

## Components

### Layout Components

Base layout structure:

```typescript
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('flex-1 overflow-auto p-6', className)}>
      {children}
    </div>
  );
}
```

### Theme Toggle

Theme switcher with persistence:

```typescript
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Theme = 'light' | 'dark';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
    >
      {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  );
}
```

### Connection Indicator

SSE connection status display:

```typescript
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  connected: boolean;
}

export function ConnectionStatus({ connected }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div
        className={cn(
          'h-2 w-2 rounded-full',
          connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        )}
      />
      <span className="text-muted-foreground">
        {connected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}
```

### Plan Components

Plan card with progress visualization:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { type Plan } from '@/types/plans';
import { formatDuration, calculateETA } from '@/lib/utils';

interface PlanCardProps {
  plan: Plan;
}

export function PlanCard({ plan }: PlanCardProps) {
  const progress = (plan.completedCount / plan.featureCount) * 100;
  const eta = calculateETA(plan);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{plan.name}</CardTitle>
        <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
          {plan.status === 'active' && <span className="animate-pulse mr-1">●</span>}
          {plan.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span>Feature {plan.completedCount}/{plan.featureCount}</span>
          {eta && <span className="text-muted-foreground">ETA: ~{eta}m</span>}
        </div>
        <Progress value={progress} />
        <div className="flex flex-wrap gap-2">
          {plan.features.map((feature) => (
            <div key={feature.id} className="flex items-center gap-1 text-sm">
              {feature.status === 'completed' && <span className="text-green-500">✓</span>}
              {feature.status === 'in_progress' && <span className="text-blue-500 animate-spin">◐</span>}
              {feature.status === 'failed' && <span className="text-red-500">✗</span>}
              {feature.status === 'pending' && <span className="text-gray-400">○</span>}
              <span className="text-muted-foreground">{feature.title}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Metrics Components

Stat card for dashboard metrics:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon?: React.ReactNode;
}

export function StatCard({ title, value, change, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {change > 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span>{Math.abs(change).toFixed(1)}% from last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Recharts Patterns

Chart components using Recharts:

```typescript
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CostChartProps {
  data: { timestamp: string; cost: number }[];
}

export function CostTrendChart({ data }: CostChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis />
            <Tooltip
              formatter={(value: number) => `$${value.toFixed(2)}`}
              labelFormatter={(label) => new Date(label).toLocaleString()}
            />
            <Area
              type="monotone"
              dataKey="cost"
              stroke="#D4A27F"
              fill="#D4A27F"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

## Error Handling

Error boundary and toast patterns:

```typescript
import { Component, type ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{this.state.error?.message}</AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// Toast usage with sonner (shadcn/ui default)
import { toast } from 'sonner';

export function handleAPIError(error: unknown) {
  if (error instanceof APIError) {
    toast.error(`API Error: ${error.message}`, {
      description: `Status: ${error.status}`
    });
  } else if (error instanceof Error) {
    toast.error('Error', { description: error.message });
  } else {
    toast.error('An unexpected error occurred');
  }
}
```

## Page Assembly

Example page composition:

```typescript
import { PageContainer } from '@/components/layout/page-container';
import { ActiveOrchestrations } from '@/components/plans/active-orchestrations';
import { MetricsGrid } from '@/components/metrics/metrics-grid';
import { CostTrendChart } from '@/components/metrics/cost-chart';
import { TokensByModelChart } from '@/components/metrics/tokens-chart';

export function OverviewPage() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-bold mb-4">Active Orchestrations</h2>
          <ActiveOrchestrations />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Metrics Today</h2>
          <MetricsGrid />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CostTrendChart />
          <TokensByModelChart />
        </section>
      </div>
    </PageContainer>
  );
}
```
