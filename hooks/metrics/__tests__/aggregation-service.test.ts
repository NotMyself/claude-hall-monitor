/**
 * Tests for AggregationService
 *
 * Following TDD principles: These tests are written BEFORE implementation.
 * They verify all requirements from F011 including hourly, daily, weekly, and monthly aggregations.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../database';
import { AggregationService } from '../aggregation-service';
import type { MetricEntry, AggregationOptions } from '../types';

describe('AggregationService', () => {
  let db: Database;
  let service: AggregationService;

  beforeEach(() => {
    db = new Database(':memory:');
    service = new AggregationService(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('Constructor', () => {
    test('initializes correctly with Database instance', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(AggregationService);
    });
  });

  describe('aggregate() - count metric', () => {
    beforeEach(() => {
      // Insert test metrics spanning multiple hours/days
      const metrics: MetricEntry[] = [
        // Hour 1: 2025-12-20 10:00
        {
          id: 'metric-1',
          timestamp: '2025-12-20T10:15:00Z',
          session_id: 'session-1',
          project_path: '/test',
          source: 'hook',
          event_type: 'tool_executed',
          event_category: 'tool',
          model: 'claude-opus-4-5',
          data: {},
          tags: [],
        },
        {
          id: 'metric-2',
          timestamp: '2025-12-20T10:45:00Z',
          session_id: 'session-1',
          project_path: '/test',
          source: 'hook',
          event_type: 'api_call',
          event_category: 'api',
          model: 'claude-opus-4-5',
          data: {},
          tags: [],
        },
        // Hour 2: 2025-12-20 11:00
        {
          id: 'metric-3',
          timestamp: '2025-12-20T11:30:00Z',
          session_id: 'session-1',
          project_path: '/test',
          source: 'hook',
          event_type: 'tool_executed',
          event_category: 'tool',
          model: 'claude-sonnet-4-5',
          data: {},
          tags: [],
        },
        // Day 2: 2025-12-21
        {
          id: 'metric-4',
          timestamp: '2025-12-21T10:15:00Z',
          session_id: 'session-2',
          project_path: '/test',
          source: 'hook',
          event_type: 'tool_executed',
          event_category: 'tool',
          model: 'claude-opus-4-5',
          data: {},
          tags: [],
        },
      ];

      db.insertBatch(metrics);
    });

    test('hourly aggregation returns correct counts', () => {
      const options: AggregationOptions = {
        period: 'hour',
        start_time: '2025-12-20T10:00:00Z',
        end_time: '2025-12-20T12:00:00Z',
        metric: 'count',
      };

      const results = service.aggregate(options);

      expect(results).toHaveLength(2);

      // First hour: 10:00-11:00 should have 2 events
      expect(results[0]!.period_start).toBe('2025-12-20T10:00:00Z');
      expect(results[0]!.value).toBe(2);

      // Second hour: 11:00-12:00 should have 1 event
      expect(results[1]!.period_start).toBe('2025-12-20T11:00:00Z');
      expect(results[1]!.value).toBe(1);
    });

    test('daily aggregation returns correct counts', () => {
      const options: AggregationOptions = {
        period: 'day',
        start_time: '2025-12-20T00:00:00Z',
        end_time: '2025-12-22T00:00:00Z',
        metric: 'count',
      };

      const results = service.aggregate(options);

      expect(results).toHaveLength(2);

      // Day 1: 2025-12-20 should have 3 events
      expect(results[0]!.period_start).toBe('2025-12-20T00:00:00Z');
      expect(results[0]!.value).toBe(3);

      // Day 2: 2025-12-21 should have 1 event
      expect(results[1]!.period_start).toBe('2025-12-21T00:00:00Z');
      expect(results[1]!.value).toBe(1);
    });

    test('weekly aggregation returns correct counts', () => {
      const options: AggregationOptions = {
        period: 'week',
        start_time: '2025-12-15T00:00:00Z',
        end_time: '2025-12-28T00:00:00Z',
        metric: 'count',
      };

      const results = service.aggregate(options);

      expect(results.length).toBeGreaterThan(0);
      // All events should be in the same week
      expect(results[0]!.value).toBe(4);
    });

    test('monthly aggregation returns correct counts', () => {
      const options: AggregationOptions = {
        period: 'month',
        start_time: '2025-12-01T00:00:00Z',
        end_time: '2025-12-31T23:59:59Z',
        metric: 'count',
      };

      const results = service.aggregate(options);

      expect(results).toHaveLength(1);
      expect(results[0]!.period_start).toBe('2025-12-01T00:00:00Z');
      expect(results[0]!.value).toBe(4);
    });
  });

  describe('aggregate() - cost metric', () => {
    beforeEach(() => {
      const metrics: MetricEntry[] = [
        {
          id: 'cost-1',
          timestamp: '2025-12-20T10:15:00Z',
          session_id: 'session-1',
          project_path: '/test',
          source: 'hook',
          event_type: 'api_call',
          event_category: 'api',
          model: 'claude-opus-4-5',
          cost: {
            input_cost_usd: 0.01,
            output_cost_usd: 0.02,
            cache_read_cost_usd: 0.001,
            cache_creation_cost_usd: 0.002,
            total_cost_usd: 0.033,
          },
          data: {},
          tags: [],
        },
        {
          id: 'cost-2',
          timestamp: '2025-12-20T10:45:00Z',
          session_id: 'session-1',
          project_path: '/test',
          source: 'hook',
          event_type: 'api_call',
          event_category: 'api',
          model: 'claude-opus-4-5',
          cost: {
            input_cost_usd: 0.015,
            output_cost_usd: 0.03,
            cache_read_cost_usd: 0.0015,
            cache_creation_cost_usd: 0.003,
            total_cost_usd: 0.0495,
          },
          data: {},
          tags: [],
        },
      ];

      db.insertBatch(metrics);
    });

    test('hourly aggregation sums costs correctly', () => {
      const options: AggregationOptions = {
        period: 'hour',
        start_time: '2025-12-20T10:00:00Z',
        end_time: '2025-12-20T11:00:00Z',
        metric: 'cost',
      };

      const results = service.aggregate(options);

      expect(results).toHaveLength(1);
      expect(results[0]!.period_start).toBe('2025-12-20T10:00:00Z');
      // Total cost should be 0.033 + 0.0495 = 0.0825
      expect(results[0]!.value).toBeCloseTo(0.0825, 4);
    });

    test('daily aggregation sums costs correctly', () => {
      const options: AggregationOptions = {
        period: 'day',
        start_time: '2025-12-20T00:00:00Z',
        end_time: '2025-12-21T00:00:00Z',
        metric: 'cost',
      };

      const results = service.aggregate(options);

      expect(results).toHaveLength(1);
      expect(results[0]!.period_start).toBe('2025-12-20T00:00:00Z');
      expect(results[0]!.value).toBeCloseTo(0.0825, 4);
    });
  });

  describe('aggregate() - tokens metric', () => {
    beforeEach(() => {
      const metrics: MetricEntry[] = [
        {
          id: 'token-1',
          timestamp: '2025-12-20T10:15:00Z',
          session_id: 'session-1',
          project_path: '/test',
          source: 'hook',
          event_type: 'api_call',
          event_category: 'api',
          model: 'claude-opus-4-5',
          tokens: {
            input_tokens: 100,
            output_tokens: 200,
            cache_read_input_tokens: 50,
            cache_creation_input_tokens: 25,
          },
          data: {},
          tags: [],
        },
        {
          id: 'token-2',
          timestamp: '2025-12-20T10:45:00Z',
          session_id: 'session-1',
          project_path: '/test',
          source: 'hook',
          event_type: 'api_call',
          event_category: 'api',
          model: 'claude-opus-4-5',
          tokens: {
            input_tokens: 150,
            output_tokens: 250,
            cache_read_input_tokens: 75,
            cache_creation_input_tokens: 30,
          },
          data: {},
          tags: [],
        },
      ];

      db.insertBatch(metrics);
    });

    test('hourly aggregation sums total tokens correctly', () => {
      const options: AggregationOptions = {
        period: 'hour',
        start_time: '2025-12-20T10:00:00Z',
        end_time: '2025-12-20T11:00:00Z',
        metric: 'tokens',
      };

      const results = service.aggregate(options);

      expect(results).toHaveLength(1);
      expect(results[0]!.period_start).toBe('2025-12-20T10:00:00Z');
      // Total tokens: (100+200+50+25) + (150+250+75+30) = 375 + 505 = 880
      expect(results[0]!.value).toBe(880);
    });
  });

  describe('aggregate() - group by model', () => {
    beforeEach(() => {
      const metrics: MetricEntry[] = [
        {
          id: 'm1',
          timestamp: '2025-12-20T10:15:00Z',
          session_id: 'session-1',
          project_path: '/test',
          source: 'hook',
          event_type: 'api_call',
          event_category: 'api',
          model: 'claude-opus-4-5',
          data: {},
          tags: [],
        },
        {
          id: 'm2',
          timestamp: '2025-12-20T10:30:00Z',
          session_id: 'session-1',
          project_path: '/test',
          source: 'hook',
          event_type: 'api_call',
          event_category: 'api',
          model: 'claude-opus-4-5',
          data: {},
          tags: [],
        },
        {
          id: 'm3',
          timestamp: '2025-12-20T10:45:00Z',
          session_id: 'session-1',
          project_path: '/test',
          source: 'hook',
          event_type: 'api_call',
          event_category: 'api',
          model: 'claude-sonnet-4-5',
          data: {},
          tags: [],
        },
      ];

      db.insertBatch(metrics);
    });

    test('groups by model correctly', () => {
      const options: AggregationOptions = {
        period: 'hour',
        start_time: '2025-12-20T10:00:00Z',
        end_time: '2025-12-20T11:00:00Z',
        metric: 'count',
        group_by: 'model',
      };

      const results = service.aggregate(options);

      // Should have 2 results: one for opus, one for sonnet
      expect(results).toHaveLength(2);

      const opusResult = results.find(r => r.group === 'claude-opus-4-5');
      const sonnetResult = results.find(r => r.group === 'claude-sonnet-4-5');

      expect(opusResult).toBeDefined();
      expect(opusResult!.value).toBe(2);

      expect(sonnetResult).toBeDefined();
      expect(sonnetResult!.value).toBe(1);
    });
  });

  describe('aggregate() - group by event_type', () => {
    beforeEach(() => {
      const metrics: MetricEntry[] = [
        {
          id: 'e1',
          timestamp: '2025-12-20T10:15:00Z',
          session_id: 'session-1',
          project_path: '/test',
          source: 'hook',
          event_type: 'tool_executed',
          event_category: 'tool',
          data: {},
          tags: [],
        },
        {
          id: 'e2',
          timestamp: '2025-12-20T10:30:00Z',
          session_id: 'session-1',
          project_path: '/test',
          source: 'hook',
          event_type: 'tool_executed',
          event_category: 'tool',
          data: {},
          tags: [],
        },
        {
          id: 'e3',
          timestamp: '2025-12-20T10:45:00Z',
          session_id: 'session-1',
          project_path: '/test',
          source: 'hook',
          event_type: 'api_call',
          event_category: 'api',
          data: {},
          tags: [],
        },
      ];

      db.insertBatch(metrics);
    });

    test('groups by event_type correctly', () => {
      const options: AggregationOptions = {
        period: 'hour',
        start_time: '2025-12-20T10:00:00Z',
        end_time: '2025-12-20T11:00:00Z',
        metric: 'count',
        group_by: 'event_type',
      };

      const results = service.aggregate(options);

      expect(results).toHaveLength(2);

      const toolResult = results.find(r => r.group === 'tool_executed');
      const apiResult = results.find(r => r.group === 'api_call');

      expect(toolResult).toBeDefined();
      expect(toolResult!.value).toBe(2);

      expect(apiResult).toBeDefined();
      expect(apiResult!.value).toBe(1);
    });
  });

  describe('aggregate() - group by session', () => {
    beforeEach(() => {
      const metrics: MetricEntry[] = [
        {
          id: 's1',
          timestamp: '2025-12-20T10:15:00Z',
          session_id: 'session-1',
          project_path: '/test',
          source: 'hook',
          event_type: 'api_call',
          event_category: 'api',
          data: {},
          tags: [],
        },
        {
          id: 's2',
          timestamp: '2025-12-20T10:30:00Z',
          session_id: 'session-1',
          project_path: '/test',
          source: 'hook',
          event_type: 'api_call',
          event_category: 'api',
          data: {},
          tags: [],
        },
        {
          id: 's3',
          timestamp: '2025-12-20T10:45:00Z',
          session_id: 'session-2',
          project_path: '/test',
          source: 'hook',
          event_type: 'api_call',
          event_category: 'api',
          data: {},
          tags: [],
        },
      ];

      db.insertBatch(metrics);
    });

    test('groups by session correctly', () => {
      const options: AggregationOptions = {
        period: 'hour',
        start_time: '2025-12-20T10:00:00Z',
        end_time: '2025-12-20T11:00:00Z',
        metric: 'count',
        group_by: 'session',
      };

      const results = service.aggregate(options);

      expect(results).toHaveLength(2);

      const session1Result = results.find(r => r.group === 'session-1');
      const session2Result = results.find(r => r.group === 'session-2');

      expect(session1Result).toBeDefined();
      expect(session1Result!.value).toBe(2);

      expect(session2Result).toBeDefined();
      expect(session2Result!.value).toBe(1);
    });
  });

  describe('aggregate() - empty results', () => {
    test('returns empty array when no data matches time range', () => {
      const options: AggregationOptions = {
        period: 'hour',
        start_time: '2025-01-01T00:00:00Z',
        end_time: '2025-01-01T23:59:59Z',
        metric: 'count',
      };

      const results = service.aggregate(options);

      expect(results).toHaveLength(0);
    });

    test('returns empty array when database is empty', () => {
      const options: AggregationOptions = {
        period: 'day',
        start_time: '2025-12-20T00:00:00Z',
        end_time: '2025-12-21T00:00:00Z',
        metric: 'count',
      };

      const results = service.aggregate(options);

      expect(results).toHaveLength(0);
    });
  });

  describe('aggregate() - period_end calculation', () => {
    beforeEach(() => {
      const metrics: MetricEntry[] = [
        {
          id: 'p1',
          timestamp: '2025-12-20T10:15:00Z',
          session_id: 'session-1',
          project_path: '/test',
          source: 'hook',
          event_type: 'api_call',
          event_category: 'api',
          data: {},
          tags: [],
        },
      ];

      db.insertBatch(metrics);
    });

    test('hourly period_end is start + 1 hour', () => {
      const options: AggregationOptions = {
        period: 'hour',
        start_time: '2025-12-20T10:00:00Z',
        end_time: '2025-12-20T11:00:00Z',
        metric: 'count',
      };

      const results = service.aggregate(options);

      expect(results).toHaveLength(1);
      expect(results[0]!.period_start).toBe('2025-12-20T10:00:00Z');
      expect(results[0]!.period_end).toBe('2025-12-20T11:00:00Z');
    });

    test('daily period_end is start + 1 day', () => {
      const options: AggregationOptions = {
        period: 'day',
        start_time: '2025-12-20T00:00:00Z',
        end_time: '2025-12-21T00:00:00Z',
        metric: 'count',
      };

      const results = service.aggregate(options);

      expect(results).toHaveLength(1);
      expect(results[0]!.period_start).toBe('2025-12-20T00:00:00Z');
      expect(results[0]!.period_end).toBe('2025-12-21T00:00:00Z');
    });
  });
});
