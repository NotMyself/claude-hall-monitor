/**
 * Unit tests for sessions API handlers
 *
 * Tests: F022 - Sessions API Endpoints
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../../metrics/database';
import { handleSessionsList, handleSessionDetails } from '../../api/sessions';
import type { MetricEntry } from '../../../metrics/types';

describe('Sessions API', () => {
  let db: Database;
  let testMetrics: MetricEntry[];

  beforeEach(() => {
    // Create in-memory database for testing
    db = new Database(':memory:');

    // Create test metrics for multiple sessions
    testMetrics = [
      // Session 1 - early metric
      {
        id: 'metric-1',
        timestamp: '2025-01-01T10:00:00Z',
        session_id: 'session-1',
        project_path: '/test/project',
        source: 'hook',
        event_type: 'session_started',
        event_category: 'session',
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
        data: {},
        tags: ['session'],
      },
      // Session 1 - tool call
      {
        id: 'metric-2',
        timestamp: '2025-01-01T10:05:00Z',
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
        tool_name: 'Read',
        tool_duration_ms: 150,
        tool_success: true,
        data: { file: 'test.ts' },
        tags: ['tool'],
      },
      // Session 1 - late metric
      {
        id: 'metric-3',
        timestamp: '2025-01-01T10:10:00Z',
        session_id: 'session-1',
        project_path: '/test/project',
        source: 'hook',
        event_type: 'session_ended',
        event_category: 'session',
        model: 'claude-opus-4.5',
        tokens: {
          input_tokens: 50,
          output_tokens: 25,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        },
        cost: {
          input_cost_usd: 0.0005,
          output_cost_usd: 0.00025,
          cache_read_cost_usd: 0,
          cache_creation_cost_usd: 0,
          total_cost_usd: 0.00075,
        },
        data: {},
        tags: ['session'],
      },
      // Session 2
      {
        id: 'metric-4',
        timestamp: '2025-01-01T11:00:00Z',
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
        tags: ['api'],
      },
      // Session 2 - tool call
      {
        id: 'metric-5',
        timestamp: '2025-01-01T11:05:00Z',
        session_id: 'session-2',
        project_path: '/test/project',
        source: 'hook',
        event_type: 'tool_executed',
        event_category: 'tool',
        model: 'claude-sonnet-4.5',
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
        tool_name: 'Write',
        tool_duration_ms: 200,
        tool_success: true,
        data: { file: 'output.ts' },
        tags: ['tool'],
      },
    ];

    // Insert test metrics
    testMetrics.forEach(metric => db.insertMetric(metric));
  });

  afterEach(() => {
    db.close();
  });

  describe('handleSessionsList', () => {
    it('should return list of all sessions', async () => {
      const req = new Request('http://localhost:3456/api/sessions');
      const response = await handleSessionsList(req, db);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3456');

      const body = await response.json();
      expect(body.data).toHaveLength(2);
    });

    it('should include session summaries with correct data', async () => {
      const req = new Request('http://localhost:3456/api/sessions');
      const response = await handleSessionsList(req, db);

      const body = await response.json();
      const session1 = body.data.find((s: any) => s.session_id === 'session-1');

      expect(session1).toBeDefined();
      expect(session1.start_time).toBe('2025-01-01T10:00:00Z');
      expect(session1.end_time).toBe('2025-01-01T10:10:00Z');
      expect(session1.total_cost_usd).toBeCloseTo(0.00525, 5);
      expect(session1.tool_calls).toBe(1);
      expect(session1.api_calls).toBe(0);
      expect(session1.total_tokens).toBe(525); // Sum of all tokens
      expect(session1.models_used).toEqual(['claude-opus-4.5']);
    });

    it('should track multiple models used in a session', async () => {
      // Add a metric with different model to session-1
      db.insertMetric({
        id: 'metric-6',
        timestamp: '2025-01-01T10:07:00Z',
        session_id: 'session-1',
        project_path: '/test/project',
        source: 'hook',
        event_type: 'api_call',
        event_category: 'api',
        model: 'claude-sonnet-4.5',
        tokens: {
          input_tokens: 50,
          output_tokens: 25,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        },
        cost: {
          input_cost_usd: 0.0005,
          output_cost_usd: 0.00025,
          cache_read_cost_usd: 0,
          cache_creation_cost_usd: 0,
          total_cost_usd: 0.00075,
        },
        data: {},
        tags: [],
      });

      const req = new Request('http://localhost:3456/api/sessions');
      const response = await handleSessionsList(req, db);

      const body = await response.json();
      const session1 = body.data.find((s: any) => s.session_id === 'session-1');
      expect(session1.models_used).toContain('claude-opus-4.5');
      expect(session1.models_used).toContain('claude-sonnet-4.5');
    });

    it('should sort sessions by start_time (newest first)', async () => {
      const req = new Request('http://localhost:3456/api/sessions');
      const response = await handleSessionsList(req, db);

      const body = await response.json();
      expect(body.data[0].session_id).toBe('session-2');
      expect(body.data[1].session_id).toBe('session-1');
    });

    it('should handle empty database', async () => {
      const emptyDb = new Database(':memory:');
      const req = new Request('http://localhost:3456/api/sessions');
      const response = await handleSessionsList(req, emptyDb);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toHaveLength(0);
      emptyDb.close();
    });

    it('should handle errors gracefully', async () => {
      // Create a fresh database and close it to simulate error
      const closedDb = new Database(':memory:');
      closedDb.close();

      const req = new Request('http://localhost:3456/api/sessions');
      const response = await handleSessionsList(req, closedDb);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('handleSessionDetails', () => {
    it('should return detailed session information', async () => {
      const req = new Request('http://localhost:3456/api/sessions/session-1');
      const response = await handleSessionDetails(req, 'session-1', db);

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.summary).toBeDefined();
      expect(body.summary.session_id).toBe('session-1');
      expect(body.summary.start_time).toBe('2025-01-01T10:00:00Z');
      expect(body.summary.end_time).toBe('2025-01-01T10:10:00Z');

      expect(body.metrics).toBeDefined();
      expect(body.metrics).toHaveLength(3);
    });

    it('should handle URL-encoded session IDs', async () => {
      const req = new Request('http://localhost:3456/api/sessions/session%2D1');
      const response = await handleSessionDetails(req, 'session%2D1', db);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.summary.session_id).toBe('session-1');
    });

    it('should return 404 for non-existent session', async () => {
      const req = new Request('http://localhost:3456/api/sessions/non-existent');
      const response = await handleSessionDetails(req, 'non-existent', db);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Session not found');
    });

    it('should calculate correct summary statistics', async () => {
      const req = new Request('http://localhost:3456/api/sessions/session-2');
      const response = await handleSessionDetails(req, 'session-2', db);

      const body = await response.json();
      expect(body.summary.total_cost_usd).toBeCloseTo(0.006, 4);
      expect(body.summary.tool_calls).toBe(1);
      expect(body.summary.api_calls).toBe(1);
      expect(body.summary.total_tokens).toBe(600);
      expect(body.summary.models_used).toEqual(['claude-sonnet-4.5']);
    });

    it('should include all metrics for the session', async () => {
      const req = new Request('http://localhost:3456/api/sessions/session-1');
      const response = await handleSessionDetails(req, 'session-1', db);

      const body = await response.json();
      expect(body.metrics).toHaveLength(3);
      expect(body.metrics.every((m: MetricEntry) => m.session_id === 'session-1')).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Create a fresh database and close it to simulate error
      const closedDb = new Database(':memory:');
      closedDb.close();

      const req = new Request('http://localhost:3456/api/sessions/session-1');
      const response = await handleSessionDetails(req, 'session-1', closedDb);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Internal server error');
    });
  });
});
