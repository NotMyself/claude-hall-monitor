/**
 * Public exports for the metrics system
 *
 * This module provides a unified interface for all metrics-related functionality.
 */

// Type definitions
export type {
  MetricEntry,
  TokenUsage,
  CostBreakdown,
  PlanEvent,
  TranscriptConfig,
  PlansConfig,
  MetricsConfig,
  QueryOptions,
  AggregationOptions,
  AggregationResult,
} from './types';

// Type guards
export {
  isTokenUsage,
  isCostBreakdown,
  isMetricEntry,
  isPlanEvent,
} from './types';

// Database layer
export { Database } from './database';

// Collector
export { MetricsCollector, type CollectorOptions } from './collector';
