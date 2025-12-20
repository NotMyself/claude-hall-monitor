/**
 * Tests for type guards in types.ts
 *
 * Uses vitest as the test runner (project standard).
 */

import { describe, it, expect } from 'vitest';
import {
  isTokenUsage,
  isCostBreakdown,
  isMetricEntry,
  isPlanEvent,
  type TokenUsage,
  type CostBreakdown,
  type MetricEntry,
  type PlanEvent,
} from '../types';

describe('isTokenUsage', () => {
  it('should return true for valid TokenUsage', () => {
    const valid: TokenUsage = {
      input_tokens: 100,
      output_tokens: 50,
      cache_read_input_tokens: 10,
      cache_creation_input_tokens: 5,
    };
    expect(isTokenUsage(valid)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isTokenUsage(null)).toBe(false);
  });

  it('should return false for non-object', () => {
    expect(isTokenUsage('not an object')).toBe(false);
    expect(isTokenUsage(123)).toBe(false);
    expect(isTokenUsage([])).toBe(false);
  });

  it('should return false for missing fields', () => {
    expect(isTokenUsage({ input_tokens: 100 })).toBe(false);
    expect(isTokenUsage({
      input_tokens: 100,
      output_tokens: 50,
    })).toBe(false);
  });

  it('should return false for wrong field types', () => {
    expect(isTokenUsage({
      input_tokens: '100',
      output_tokens: 50,
      cache_read_input_tokens: 10,
      cache_creation_input_tokens: 5,
    })).toBe(false);
  });

  it('should allow zero values', () => {
    const valid: TokenUsage = {
      input_tokens: 0,
      output_tokens: 0,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    };
    expect(isTokenUsage(valid)).toBe(true);
  });
});

describe('isCostBreakdown', () => {
  it('should return true for valid CostBreakdown', () => {
    const valid: CostBreakdown = {
      input_cost_usd: 1.5,
      output_cost_usd: 3.75,
      cache_read_cost_usd: 0.15,
      cache_creation_cost_usd: 1.875,
      total_cost_usd: 7.275,
    };
    expect(isCostBreakdown(valid)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isCostBreakdown(null)).toBe(false);
  });

  it('should return false for non-object', () => {
    expect(isCostBreakdown('not an object')).toBe(false);
  });

  it('should return false for missing fields', () => {
    expect(isCostBreakdown({
      input_cost_usd: 1.5,
      output_cost_usd: 3.75,
    })).toBe(false);
  });

  it('should return false for wrong field types', () => {
    expect(isCostBreakdown({
      input_cost_usd: '1.5',
      output_cost_usd: 3.75,
      cache_read_cost_usd: 0.15,
      cache_creation_cost_usd: 1.875,
      total_cost_usd: 7.275,
    })).toBe(false);
  });

  it('should allow zero values', () => {
    const valid: CostBreakdown = {
      input_cost_usd: 0,
      output_cost_usd: 0,
      cache_read_cost_usd: 0,
      cache_creation_cost_usd: 0,
      total_cost_usd: 0,
    };
    expect(isCostBreakdown(valid)).toBe(true);
  });
});

describe('isMetricEntry', () => {
  const validBase: MetricEntry = {
    id: '123',
    timestamp: '2024-12-20T10:00:00Z',
    session_id: 'sess-123',
    project_path: '/path/to/project',
    source: 'hook',
    event_type: 'tool_executed',
    event_category: 'tool',
    data: { foo: 'bar' },
    tags: ['test'],
  };

  it('should return true for valid MetricEntry with only required fields', () => {
    expect(isMetricEntry(validBase)).toBe(true);
  });

  it('should return true for valid MetricEntry with optional fields', () => {
    const valid: MetricEntry = {
      ...validBase,
      model: 'claude-opus-4-5',
      tokens: {
        input_tokens: 100,
        output_tokens: 50,
        cache_read_input_tokens: 10,
        cache_creation_input_tokens: 5,
      },
      cost: {
        input_cost_usd: 1.5,
        output_cost_usd: 3.75,
        cache_read_cost_usd: 0.15,
        cache_creation_cost_usd: 1.875,
        total_cost_usd: 7.275,
      },
      tool_name: 'Bash',
      tool_duration_ms: 1500,
      tool_success: true,
    };
    expect(isMetricEntry(valid)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isMetricEntry(null)).toBe(false);
  });

  it('should return false for missing required fields', () => {
    const { id, ...missing } = validBase;
    expect(isMetricEntry(missing)).toBe(false);
  });

  it('should return false for invalid source', () => {
    expect(isMetricEntry({ ...validBase, source: 'invalid' })).toBe(false);
  });

  it('should return false for invalid event_category', () => {
    expect(isMetricEntry({ ...validBase, event_category: 'invalid' })).toBe(false);
  });

  it('should return false for non-array tags', () => {
    expect(isMetricEntry({ ...validBase, tags: 'not-array' })).toBe(false);
  });

  it('should return false for tags containing non-strings', () => {
    expect(isMetricEntry({ ...validBase, tags: ['valid', 123] })).toBe(false);
  });

  it('should return false for invalid optional field types', () => {
    expect(isMetricEntry({ ...validBase, model: 123 })).toBe(false);
    expect(isMetricEntry({ ...validBase, tool_name: 123 })).toBe(false);
    expect(isMetricEntry({ ...validBase, tool_duration_ms: '1500' })).toBe(false);
    expect(isMetricEntry({ ...validBase, tool_success: 'true' })).toBe(false);
  });

  it('should return false for invalid tokens object', () => {
    expect(isMetricEntry({
      ...validBase,
      tokens: { input_tokens: '100' },
    })).toBe(false);
  });

  it('should return false for invalid cost object', () => {
    expect(isMetricEntry({
      ...validBase,
      cost: { input_cost_usd: '1.5' },
    })).toBe(false);
  });

  it('should allow empty tags array', () => {
    expect(isMetricEntry({ ...validBase, tags: [] })).toBe(true);
  });

  it('should allow empty data object', () => {
    expect(isMetricEntry({ ...validBase, data: {} })).toBe(true);
  });
});

describe('isPlanEvent', () => {
  const validBase: PlanEvent = {
    id: '456',
    timestamp: '2024-12-20T10:00:00Z',
    session_id: 'sess-123',
    event_type: 'plan_created',
    plan_name: 'my-plan',
    plan_path: '/path/to/plan',
    data: { foo: 'bar' },
  };

  it('should return true for valid PlanEvent with only required fields', () => {
    expect(isPlanEvent(validBase)).toBe(true);
  });

  it('should return true for valid PlanEvent with optional fields', () => {
    const valid: PlanEvent = {
      ...validBase,
      feature_id: 'F001',
      feature_description: 'Add metrics',
      status: 'completed',
      pr_url: 'https://github.com/user/repo/pull/123',
    };
    expect(isPlanEvent(valid)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isPlanEvent(null)).toBe(false);
  });

  it('should return false for missing required fields', () => {
    const { id, ...missing } = validBase;
    expect(isPlanEvent(missing)).toBe(false);
  });

  it('should return false for invalid event_type', () => {
    expect(isPlanEvent({ ...validBase, event_type: 'invalid_type' })).toBe(false);
  });

  it('should return true for all valid event_types', () => {
    const validTypes = [
      'plan_created', 'plan_optimized', 'feature_created',
      'orchestration_started', 'feature_started', 'feature_completed',
      'feature_failed', 'orchestration_completed', 'pr_created'
    ];
    validTypes.forEach(event_type => {
      expect(isPlanEvent({ ...validBase, event_type })).toBe(true);
    });
  });

  it('should return false for invalid status', () => {
    expect(isPlanEvent({ ...validBase, status: 'invalid_status' })).toBe(false);
  });

  it('should return true for all valid statuses', () => {
    const validStatuses = ['pending', 'in_progress', 'completed', 'failed'];
    validStatuses.forEach(status => {
      expect(isPlanEvent({ ...validBase, status })).toBe(true);
    });
  });

  it('should return false for invalid optional field types', () => {
    expect(isPlanEvent({ ...validBase, feature_id: 123 })).toBe(false);
    expect(isPlanEvent({ ...validBase, feature_description: 123 })).toBe(false);
    expect(isPlanEvent({ ...validBase, pr_url: 123 })).toBe(false);
  });

  it('should allow empty data object', () => {
    expect(isPlanEvent({ ...validBase, data: {} })).toBe(true);
  });
});
