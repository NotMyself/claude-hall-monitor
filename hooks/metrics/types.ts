/**
 * Core type definitions for the metrics system
 *
 * This module defines all TypeScript interfaces for metric collection,
 * storage, and querying. It follows the patterns from code/typescript.md.
 */

/**
 * Token usage from Claude API responses
 */
export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
}

/**
 * Cost breakdown in USD
 */
export interface CostBreakdown {
  input_cost_usd: number;
  output_cost_usd: number;
  cache_read_cost_usd: number;
  cache_creation_cost_usd: number;
  total_cost_usd: number;
}

/**
 * Core metric entry captured from any data source
 */
export interface MetricEntry {
  id: string;
  timestamp: string; // ISO 8601
  session_id: string;
  project_path: string;
  source: 'hook' | 'transcript' | 'telemetry' | 'custom';
  event_type: string; // e.g., 'session_started', 'tool_executed'
  event_category: 'tool' | 'api' | 'session' | 'user' | 'custom';
  model?: string;
  tokens?: TokenUsage;
  cost?: CostBreakdown;
  tool_name?: string;
  tool_duration_ms?: number;
  tool_success?: boolean;
  data: Record<string, unknown>; // Flexible additional data
  tags: string[];
}

/**
 * Plan orchestration event
 */
export interface PlanEvent {
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

/**
 * Transcript configuration
 */
export interface TranscriptConfig {
  useFsWatch: boolean;
  projectsDir: string;
  fallbackPollIntervalMs: number;
}

/**
 * Plans configuration
 */
export interface PlansConfig {
  activeDir: string;
  completeDir: string;
  watchManifest: boolean;
}

/**
 * Metrics system configuration
 */
export interface MetricsConfig {
  databasePath: string;
  archiveDir: string;
  aggregationIntervalMs: number;
  archiveAfterDays: number;
  deleteArchivesAfterDays: number;
  transcript: TranscriptConfig;
  plans: PlansConfig;
}

/**
 * Query options for retrieving metrics
 */
export interface QueryOptions {
  session_id?: string;
  event_type?: string;
  event_category?: string;
  start_time?: string;
  end_time?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Aggregation options for time-window aggregations
 */
export interface AggregationOptions {
  period: 'hour' | 'day' | 'week' | 'month';
  start_time: string;
  end_time: string;
  metric: 'count' | 'cost' | 'tokens';
  group_by?: 'model' | 'event_type' | 'session';
}

/**
 * Result of an aggregation query
 */
export interface AggregationResult {
  period_start: string;
  period_end: string;
  value: number;
  group?: string;
}

/**
 * Type guard for TokenUsage
 */
export function isTokenUsage(value: unknown): value is TokenUsage {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.input_tokens === 'number' &&
    typeof obj.output_tokens === 'number' &&
    typeof obj.cache_read_input_tokens === 'number' &&
    typeof obj.cache_creation_input_tokens === 'number'
  );
}

/**
 * Type guard for CostBreakdown
 */
export function isCostBreakdown(value: unknown): value is CostBreakdown {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.input_cost_usd === 'number' &&
    typeof obj.output_cost_usd === 'number' &&
    typeof obj.cache_read_cost_usd === 'number' &&
    typeof obj.cache_creation_cost_usd === 'number' &&
    typeof obj.total_cost_usd === 'number'
  );
}

/**
 * Type guard for MetricEntry
 */
export function isMetricEntry(value: unknown): value is MetricEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;

  // Required fields
  const validSources = ['hook', 'transcript', 'telemetry', 'custom'];
  const validCategories = ['tool', 'api', 'session', 'user', 'custom'];

  if (
    typeof obj.id !== 'string' ||
    typeof obj.timestamp !== 'string' ||
    typeof obj.session_id !== 'string' ||
    typeof obj.project_path !== 'string' ||
    validSources.indexOf(obj.source as string) === -1 ||
    typeof obj.event_type !== 'string' ||
    validCategories.indexOf(obj.event_category as string) === -1 ||
    typeof obj.data !== 'object' ||
    obj.data === null ||
    !Array.isArray(obj.tags)
  ) {
    return false;
  }

  // Optional fields - if present, must be correct type
  if (obj.model !== undefined && typeof obj.model !== 'string') {
    return false;
  }
  if (obj.tokens !== undefined && !isTokenUsage(obj.tokens)) {
    return false;
  }
  if (obj.cost !== undefined && !isCostBreakdown(obj.cost)) {
    return false;
  }
  if (obj.tool_name !== undefined && typeof obj.tool_name !== 'string') {
    return false;
  }
  if (obj.tool_duration_ms !== undefined && typeof obj.tool_duration_ms !== 'number') {
    return false;
  }
  if (obj.tool_success !== undefined && typeof obj.tool_success !== 'boolean') {
    return false;
  }

  // Validate tags array contains only strings
  if (!obj.tags.every((tag: unknown) => typeof tag === 'string')) {
    return false;
  }

  return true;
}

/**
 * Type guard for PlanEvent
 */
export function isPlanEvent(value: unknown): value is PlanEvent {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;

  const validEventTypes = [
    'plan_created', 'plan_optimized', 'feature_created',
    'orchestration_started', 'feature_started', 'feature_completed',
    'feature_failed', 'orchestration_completed', 'pr_created'
  ];

  const validStatuses = ['pending', 'in_progress', 'completed', 'failed'];

  // Required fields
  if (
    typeof obj.id !== 'string' ||
    typeof obj.timestamp !== 'string' ||
    typeof obj.session_id !== 'string' ||
    validEventTypes.indexOf(obj.event_type as string) === -1 ||
    typeof obj.plan_name !== 'string' ||
    typeof obj.plan_path !== 'string' ||
    typeof obj.data !== 'object' ||
    obj.data === null
  ) {
    return false;
  }

  // Optional fields
  if (obj.feature_id !== undefined && typeof obj.feature_id !== 'string') {
    return false;
  }
  if (obj.feature_description !== undefined && typeof obj.feature_description !== 'string') {
    return false;
  }
  if (obj.status !== undefined && validStatuses.indexOf(obj.status as string) === -1) {
    return false;
  }
  if (obj.pr_url !== undefined && typeof obj.pr_url !== 'string') {
    return false;
  }

  return true;
}
