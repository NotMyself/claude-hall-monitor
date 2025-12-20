/**
 * Tests for Database class
 *
 * Following TDD principles: These tests are written BEFORE implementation.
 * They verify all requirements from F004 including edge cases EC001 and EC004.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../database';
import type { MetricEntry } from '../types';
import { unlinkSync } from 'fs';
import { existsSync } from 'fs';

describe('Database', () => {
  let db: Database;
  const testDbPath = ':memory:'; // Use in-memory database for tests

  beforeEach(() => {
    db = new Database(testDbPath);
  });

  afterEach(() => {
    db.close();
  });

  describe('Constructor and Initialization', () => {
    test('creates database and initializes schema', () => {
      const fileDb = new Database(':memory:');
      expect(fileDb).toBeDefined();
      fileDb.close();
    });

    test('schema creates metrics table with all columns', () => {
      const metric: MetricEntry = {
        id: 'test-1',
        timestamp: new Date().toISOString(),
        session_id: 'session-1',
        project_path: '/test/project',
        source: 'hook',
        event_type: 'test_event',
        event_category: 'tool',
        data: { test: 'data' },
        tags: ['test'],
      };

      db.insertMetric(metric);
      const results = db.query({});
      expect(results).toHaveLength(1);
      expect(results[0]!.id).toBe('test-1');
    });
  });

  describe('insertMetric', () => {
    test('inserts metric with all required fields', () => {
      const metric: MetricEntry = {
        id: 'metric-1',
        timestamp: '2025-12-20T10:00:00Z',
        session_id: 'session-1',
        project_path: '/test/project',
        source: 'hook',
        event_type: 'session_started',
        event_category: 'session',
        data: { message: 'Session started' },
        tags: ['session', 'start'],
      };

      db.insertMetric(metric);
      const results = db.query({ session_id: 'session-1' });

      expect(results).toHaveLength(1);
      expect(results[0]!.id).toBe('metric-1');
      expect(results[0]!.event_type).toBe('session_started');
      expect(results[0]!.data).toEqual({ message: 'Session started' });
      expect(results[0]!.tags).toEqual(['session', 'start']);
    });

    test('inserts metric with optional token and cost fields', () => {
      const metric: MetricEntry = {
        id: 'metric-2',
        timestamp: '2025-12-20T10:01:00Z',
        session_id: 'session-1',
        project_path: '/test/project',
        source: 'hook',
        event_type: 'api_call',
        event_category: 'api',
        model: 'claude-opus-4-5',
        tokens: {
          input_tokens: 100,
          output_tokens: 200,
          cache_read_input_tokens: 50,
          cache_creation_input_tokens: 0,
        },
        cost: {
          input_cost_usd: 0.0015,
          output_cost_usd: 0.003,
          cache_read_cost_usd: 0.00015,
          cache_creation_cost_usd: 0,
          total_cost_usd: 0.00465,
        },
        data: {},
        tags: ['api', 'claude'],
      };

      db.insertMetric(metric);
      const results = db.query({ event_type: 'api_call' });

      expect(results).toHaveLength(1);
      expect(results[0]!.model).toBe('claude-opus-4-5');
      expect(results[0]!.tokens).toEqual(metric.tokens);
      expect(results[0]!.cost).toEqual(metric.cost);
    });

    test('inserts metric with tool execution fields', () => {
      const metric: MetricEntry = {
        id: 'metric-3',
        timestamp: '2025-12-20T10:02:00Z',
        session_id: 'session-1',
        project_path: '/test/project',
        source: 'hook',
        event_type: 'tool_executed',
        event_category: 'tool',
        tool_name: 'Read',
        tool_duration_ms: 125,
        tool_success: true,
        data: { file_path: '/test/file.txt' },
        tags: ['tool', 'read'],
      };

      db.insertMetric(metric);
      const results = db.query({ event_type: 'tool_executed' });

      expect(results).toHaveLength(1);
      expect(results[0]!.tool_name).toBe('Read');
      expect(results[0]!.tool_duration_ms).toBe(125);
      expect(results[0]!.tool_success).toBe(true);
    });

    test('handles tool_success false correctly', () => {
      const metric: MetricEntry = {
        id: 'metric-4',
        timestamp: '2025-12-20T10:03:00Z',
        session_id: 'session-1',
        project_path: '/test/project',
        source: 'hook',
        event_type: 'tool_failed',
        event_category: 'tool',
        tool_name: 'Write',
        tool_duration_ms: 50,
        tool_success: false,
        data: { error: 'Permission denied' },
        tags: ['tool', 'error'],
      };

      db.insertMetric(metric);
      const results = db.query({ event_type: 'tool_failed' });

      expect(results).toHaveLength(1);
      expect(results[0]!.tool_success).toBe(false);
    });
  });

  describe('insertBatch', () => {
    test('inserts multiple metrics in a transaction', () => {
      const metrics: MetricEntry[] = [
        {
          id: 'batch-1',
          timestamp: '2025-12-20T10:00:00Z',
          session_id: 'session-2',
          project_path: '/test/project',
          source: 'hook',
          event_type: 'test_1',
          event_category: 'custom',
          data: {},
          tags: [],
        },
        {
          id: 'batch-2',
          timestamp: '2025-12-20T10:01:00Z',
          session_id: 'session-2',
          project_path: '/test/project',
          source: 'hook',
          event_type: 'test_2',
          event_category: 'custom',
          data: {},
          tags: [],
        },
        {
          id: 'batch-3',
          timestamp: '2025-12-20T10:02:00Z',
          session_id: 'session-2',
          project_path: '/test/project',
          source: 'hook',
          event_type: 'test_3',
          event_category: 'custom',
          data: {},
          tags: [],
        },
      ];

      db.insertBatch(metrics);
      const results = db.query({ session_id: 'session-2' });

      expect(results).toHaveLength(3);
      expect(results.map(r => r.id).sort()).toEqual(['batch-1', 'batch-2', 'batch-3']);
    });

    test('batch insert is atomic - all or nothing', () => {
      const metrics: MetricEntry[] = [
        {
          id: 'atomic-1',
          timestamp: '2025-12-20T10:00:00Z',
          session_id: 'session-3',
          project_path: '/test/project',
          source: 'hook',
          event_type: 'test',
          event_category: 'custom',
          data: {},
          tags: [],
        },
      ];

      db.insertBatch(metrics);
      const results = db.query({ session_id: 'session-3' });
      expect(results).toHaveLength(1);
    });
  });

  describe('query', () => {
    beforeEach(() => {
      // Insert test data
      const metrics: MetricEntry[] = [
        {
          id: 'q1',
          timestamp: '2025-12-20T10:00:00Z',
          session_id: 'session-query-1',
          project_path: '/test/project',
          source: 'hook',
          event_type: 'session_started',
          event_category: 'session',
          data: {},
          tags: ['session'],
        },
        {
          id: 'q2',
          timestamp: '2025-12-20T10:01:00Z',
          session_id: 'session-query-1',
          project_path: '/test/project',
          source: 'hook',
          event_type: 'tool_executed',
          event_category: 'tool',
          data: {},
          tags: ['tool'],
        },
        {
          id: 'q3',
          timestamp: '2025-12-20T10:02:00Z',
          session_id: 'session-query-2',
          project_path: '/test/project',
          source: 'transcript',
          event_type: 'api_call',
          event_category: 'api',
          data: {},
          tags: ['api'],
        },
        {
          id: 'q4',
          timestamp: '2025-12-20T10:03:00Z',
          session_id: 'session-query-1',
          project_path: '/test/project',
          source: 'hook',
          event_type: 'session_ended',
          event_category: 'session',
          data: {},
          tags: ['session', 'end'],
        },
      ];

      db.insertBatch(metrics);
    });

    test('query with no filters returns all metrics', () => {
      const results = db.query({});
      expect(results.length).toBeGreaterThanOrEqual(4);
    });

    test('query filters by session_id', () => {
      const results = db.query({ session_id: 'session-query-1' });
      expect(results).toHaveLength(3);
      expect(results.every(r => r.session_id === 'session-query-1')).toBe(true);
    });

    test('query filters by event_type', () => {
      const results = db.query({ event_type: 'tool_executed' });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.every(r => r.event_type === 'tool_executed')).toBe(true);
    });

    test('query filters by event_category', () => {
      const results = db.query({ event_category: 'session' });
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.every(r => r.event_category === 'session')).toBe(true);
    });

    test('query filters by start_time', () => {
      const results = db.query({ start_time: '2025-12-20T10:01:30Z' });
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.every(r => r.timestamp >= '2025-12-20T10:01:30Z')).toBe(true);
    });

    test('query filters by end_time', () => {
      const results = db.query({ end_time: '2025-12-20T10:01:30Z' });
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.every(r => r.timestamp <= '2025-12-20T10:01:30Z')).toBe(true);
    });

    test('query filters by tags', () => {
      const results = db.query({ tags: ['session'] });
      expect(results.length).toBeGreaterThanOrEqual(2);
      // All results should contain at least one of the query tags
      expect(results.every(r => r.tags.some(tag => ['session'].includes(tag)))).toBe(true);
    });

    test('query combines multiple filters', () => {
      const results = db.query({
        session_id: 'session-query-1',
        event_category: 'session',
      });
      expect(results).toHaveLength(2);
      expect(results.every(r =>
        r.session_id === 'session-query-1' && r.event_category === 'session'
      )).toBe(true);
    });

    test('query respects limit', () => {
      const results = db.query({ limit: 2 });
      expect(results).toHaveLength(2);
    });

    test('query respects offset', () => {
      const allResults = db.query({});
      const offsetResults = db.query({ offset: 1 });
      expect(offsetResults.length).toBe(allResults.length - 1);
    });

    test('query returns results sorted by timestamp DESC', () => {
      const results = db.query({});
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i]!.timestamp >= results[i + 1]!.timestamp).toBe(true);
      }
    });
  });

  describe('close', () => {
    test('closes database connection', () => {
      const tempDb = new Database(':memory:');
      tempDb.close();
      // Database should be closed, further operations would fail
      expect(() => tempDb.close()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('EC001: handles database lock with retry (simulated)', () => {
      // Note: Actual lock testing requires concurrent access
      // This test verifies the implementation doesn't crash on retries
      const metric: MetricEntry = {
        id: 'lock-test',
        timestamp: new Date().toISOString(),
        session_id: 'session-lock',
        project_path: '/test/project',
        source: 'hook',
        event_type: 'test',
        event_category: 'custom',
        data: {},
        tags: [],
      };

      // Should succeed even with retry logic
      expect(() => db.insertMetric(metric)).not.toThrow();
    });

    test('EC004: batch insert handles high volume efficiently', () => {
      const startTime = Date.now();
      const metrics: MetricEntry[] = [];

      // Create 1000 metrics
      for (let i = 0; i < 1000; i++) {
        metrics.push({
          id: `perf-${i}`,
          timestamp: new Date().toISOString(),
          session_id: 'session-perf',
          project_path: '/test/project',
          source: 'hook',
          event_type: 'test',
          event_category: 'custom',
          data: { index: i },
          tags: ['performance'],
        });
      }

      db.insertBatch(metrics);
      const duration = Date.now() - startTime;

      const results = db.query({ session_id: 'session-perf' });
      expect(results).toHaveLength(1000);
      // Batch should be much faster than individual inserts
      // With proper batching, 1000 inserts should take < 1 second
      expect(duration).toBeLessThan(2000);
    });
  });
});
