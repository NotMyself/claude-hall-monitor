/**
 * Unit tests for metrics API handlers
 *
 * Tests: F020 - Metrics API Endpoints
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../../metrics/database';
import {
  handleMetricsQuery,
  handleMetricsAggregations,
  handleMetricsCosts,
  handleMetricsExport,
} from '../../api/metrics';
import type { MetricEntry } from '../../../metrics/types';
import { unlinkSync, existsSync, mkdirSync, rmdirSync } from 'fs';
import { join } from 'path';

describe('Metrics API', () => {
  let db: Database;
  let testMetrics: MetricEntry[];

  beforeEach(() => {
    // Create in-memory database for testing
    db = new Database(':memory:');

    // Create test metrics
    testMetrics = [
      {
        id: 'metric-1',
        timestamp: '2025-01-01T10:00:00Z',
        session_id: 'session-1',
        project_path: '/test/project',
        source: 'hook',
        event_type: 'tool_executed',
        event_category: 'tool',
        model: 'claude-opus-4.5',
        tokens: {
          input_tokens: 100,
          output_tokens: 50,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        },
        cost: {
          input_cost_usd: 0.001,
          output_cost_usd: 0.0005,
          cache_read_cost_usd: 0,
          cache_creation_cost_usd: 0,
          total_cost_usd: 0.0015,
        },
        tool_name: 'Read',
        tool_duration_ms: 150,
        tool_success: true,
        data: { file: 'test.ts' },
        tags: ['test', 'read'],
      },
      {
        id: 'metric-2',
        timestamp: '2025-01-01T11:00:00Z',
        session_id: 'session-1',
        project_path: '/test/project',
        source: 'hook',
        event_type: 'tool_executed',
        event_category: 'tool',
        model: 'claude-opus-4.5',
        tokens: {
          input_tokens: 200,
          output_tokens: 100,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        },
        cost: {
          input_cost_usd: 0.002,
          output_cost_usd: 0.001,
          cache_read_cost_usd: 0,
          cache_creation_cost_usd: 0,
          total_cost_usd: 0.003,
        },
        tool_name: 'Write',
        tool_duration_ms: 200,
        tool_success: true,
        data: { file: 'output.ts' },
        tags: ['test', 'write'],
      },
      {
        id: 'metric-3',
        timestamp: '2025-01-01T12:00:00Z',
        session_id: 'session-2',
        project_path: '/test/project',
        source: 'hook',
        event_type: 'api_call',
        event_category: 'api',
        model: 'claude-sonnet-4.5',
        tokens: {
          input_tokens: 300,
          output_tokens: 150,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        },
        cost: {
          input_cost_usd: 0.003,
          output_cost_usd: 0.0015,
          cache_read_cost_usd: 0,
          cache_creation_cost_usd: 0,
          total_cost_usd: 0.0045,
        },
        data: { endpoint: '/api/chat' },
        tags: ['test', 'api'],
      },
    ];

    // Insert test metrics
    testMetrics.forEach(metric => db.insertMetric(metric));
  });

  afterEach(() => {
    db.close();
  });

  describe('handleMetricsQuery', () => {
    it('should return all metrics when no filters are provided', async () => {
      const req = new Request('http://localhost:3456/api/metrics');
      const response = await handleMetricsQuery(req, db);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const body = await response.json();
      expect(body.data).toHaveLength(3);
    });

    it('should filter by session_id', async () => {
      const req = new Request('http://localhost:3456/api/metrics?session_id=session-1');
      const response = await handleMetricsQuery(req, db);

      const body = await response.json();
      expect(body.data).toHaveLength(2);
      expect(body.data.every((m: MetricEntry) => m.session_id === 'session-1')).toBe(true);
    });

    it('should filter by event_type', async () => {
      const req = new Request('http://localhost:3456/api/metrics?event_type=tool_executed');
      const response = await handleMetricsQuery(req, db);

      const body = await response.json();
      expect(body.data).toHaveLength(2);
      expect(body.data.every((m: MetricEntry) => m.event_type === 'tool_executed')).toBe(true);
    });

    it('should filter by event_category', async () => {
      const req = new Request('http://localhost:3456/api/metrics?event_category=api');
      const response = await handleMetricsQuery(req, db);

      const body = await response.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].event_category).toBe('api');
    });

    it('should filter by time range', async () => {
      const req = new Request('http://localhost:3456/api/metrics?start_time=2025-01-01T11:00:00Z&end_time=2025-01-01T12:00:00Z');
      const response = await handleMetricsQuery(req, db);

      const body = await response.json();
      expect(body.data).toHaveLength(2);
    });

    it('should support pagination with limit and offset', async () => {
      const req = new Request('http://localhost:3456/api/metrics?limit=1&offset=1');
      const response = await handleMetricsQuery(req, db);

      const body = await response.json();
      expect(body.data).toHaveLength(1);
    });

    it('should filter by tags', async () => {
      const req = new Request('http://localhost:3456/api/metrics?tags=read');
      const response = await handleMetricsQuery(req, db);

      const body = await response.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].tags).toContain('read');
    });

    it('should handle errors gracefully', async () => {
      // Create a fresh database and close it to simulate error
      const closedDb = new Database(':memory:');
      closedDb.close();

      const req = new Request('http://localhost:3456/api/metrics');
      const response = await handleMetricsQuery(req, closedDb);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('handleMetricsAggregations', () => {
    it('should reject requests without required parameters', async () => {
      const req = new Request('http://localhost:3456/api/metrics/aggregations');
      const response = await handleMetricsAggregations(req, db);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Missing required parameters');
    });

    it('should reject invalid period', async () => {
      const req = new Request('http://localhost:3456/api/metrics/aggregations?period=invalid&start_time=2025-01-01T00:00:00Z&end_time=2025-01-02T00:00:00Z&metric=count');
      const response = await handleMetricsAggregations(req, db);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Invalid period');
    });

    it('should reject invalid metric', async () => {
      const req = new Request('http://localhost:3456/api/metrics/aggregations?period=day&start_time=2025-01-01T00:00:00Z&end_time=2025-01-02T00:00:00Z&metric=invalid');
      const response = await handleMetricsAggregations(req, db);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Invalid metric');
    });

    it('should return count aggregations by hour', async () => {
      const req = new Request('http://localhost:3456/api/metrics/aggregations?period=hour&start_time=2025-01-01T00:00:00Z&end_time=2025-01-02T00:00:00Z&metric=count');
      const response = await handleMetricsAggregations(req, db);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('should return cost aggregations', async () => {
      const req = new Request('http://localhost:3456/api/metrics/aggregations?period=day&start_time=2025-01-01T00:00:00Z&end_time=2025-01-02T00:00:00Z&metric=cost');
      const response = await handleMetricsAggregations(req, db);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('should support group_by parameter', async () => {
      const req = new Request('http://localhost:3456/api/metrics/aggregations?period=day&start_time=2025-01-01T00:00:00Z&end_time=2025-01-02T00:00:00Z&metric=count&group_by=model');
      const response = await handleMetricsAggregations(req, db);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('should reject invalid group_by', async () => {
      const req = new Request('http://localhost:3456/api/metrics/aggregations?period=day&start_time=2025-01-01T00:00:00Z&end_time=2025-01-02T00:00:00Z&metric=count&group_by=invalid');
      const response = await handleMetricsAggregations(req, db);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Invalid group_by');
    });
  });

  describe('handleMetricsCosts', () => {
    it('should return costs grouped by model', async () => {
      const req = new Request('http://localhost:3456/api/metrics/costs');
      const response = await handleMetricsCosts(req, db);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.total_cost_usd).toBeCloseTo(0.009, 4); // Sum of all costs
    });

    it('should sort costs by model descending', async () => {
      const req = new Request('http://localhost:3456/api/metrics/costs');
      const response = await handleMetricsCosts(req, db);

      const body = await response.json();
      expect(body.data[0].model).toBe('claude-opus-4.5'); // Has higher total (0.0045 total)
      expect(body.data[1].model).toBe('claude-sonnet-4.5'); // Has lower cost (0.0045)
    });

    it('should handle empty database', async () => {
      const emptyDb = new Database(':memory:');
      const req = new Request('http://localhost:3456/api/metrics/costs');
      const response = await handleMetricsCosts(req, emptyDb);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toHaveLength(0);
      expect(body.total_cost_usd).toBe(0);
      emptyDb.close();
    });
  });

  describe('handleMetricsExport', () => {
    const exportsDir = join(process.cwd(), 'hooks', 'metrics', 'exports');

    afterEach(() => {
      // Cleanup exported files
      if (existsSync(exportsDir)) {
        const files = require('fs').readdirSync(exportsDir);
        files.forEach((file: string) => {
          unlinkSync(join(exportsDir, file));
        });
        rmdirSync(exportsDir);
      }
    });

    it('should export metrics to JSONL file', async () => {
      const req = new Request('http://localhost:3456/api/metrics/export', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await handleMetricsExport(req, db);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.message).toContain('Export completed');
      expect(body.filepath).toContain('.jsonl');
      expect(body.count).toBe(3);
      expect(existsSync(body.filepath)).toBe(true);
    });

    it('should filter exports by time range', async () => {
      const req = new Request('http://localhost:3456/api/metrics/export', {
        method: 'POST',
        body: JSON.stringify({
          start_time: '2025-01-01T11:00:00Z',
          end_time: '2025-01-01T12:00:00Z',
        }),
      });
      const response = await handleMetricsExport(req, db);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.count).toBe(2);
    });

    it('should reject unsupported formats', async () => {
      const req = new Request('http://localhost:3456/api/metrics/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'csv' }),
      });
      const response = await handleMetricsExport(req, db);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Unsupported format');
    });
  });
});
