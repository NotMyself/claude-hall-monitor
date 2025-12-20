import type { DashboardStats, Session } from '@/types/sessions';
import type { Plan, PlanEvent } from '@/types/plans';
import type { MetricEntry } from '@/types/metrics';

const API_BASE = '/api';  // Proxied through Vite

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
  options?: RequestInit,
  retries = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
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
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

// Dashboard stats
export async function getDashboardStats(
  period: '24h' | '7d' | '30d' = '24h'
): Promise<DashboardStats> {
  return fetchAPI(`/dashboard/stats?period=${period}`);
}

// Plans
export async function getPlans(
  status?: 'active' | 'completed' | 'failed'
): Promise<Plan[]> {
  const query = status ? `?status=${status}` : '';
  return fetchAPI(`/plans${query}`);
}

export async function getPlan(name: string): Promise<Plan> {
  return fetchAPI(`/plans/${encodeURIComponent(name)}`);
}

export async function getPlanEvents(
  planName?: string,
  sessionId?: string
): Promise<PlanEvent[]> {
  const params = new URLSearchParams();
  if (planName) params.set('plan_name', planName);
  if (sessionId) params.set('session_id', sessionId);
  const query = params.toString() ? `?${params}` : '';
  return fetchAPI(`/plans/events${query}`);
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
  const query = params.toString() ? `?${params}` : '';
  return fetchAPI(`/sessions${query}`);
}

export async function getSession(id: string): Promise<Session> {
  return fetchAPI(`/sessions/${encodeURIComponent(id)}`);
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
  const query = params.toString() ? `?${params}` : '';
  return fetchAPI(`/metrics${query}`);
}

export async function getCostBreakdown(
  period: '24h' | '7d' | '30d' = '24h'
): Promise<{ timestamps: string[]; costs: number[] }> {
  return fetchAPI(`/metrics/costs?period=${period}`);
}
