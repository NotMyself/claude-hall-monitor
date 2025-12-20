/**
 * Unit tests for plans API handlers
 *
 * Tests: F021 - Plans API Endpoints
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../../metrics/database';
import { handlePlanEvents, handlePlanEventsByPlan } from '../../api/plans';
import type { PlanEvent } from '../../../metrics/types';

describe('Plans API', () => {
  let db: Database;
  let testEvents: PlanEvent[];

  beforeEach(() => {
    // Create in-memory database for testing
    db = new Database(':memory:');

    // Create test plan events
    testEvents = [
      {
        id: 'plan-event-1',
        timestamp: '2025-01-01T10:00:00Z',
        session_id: 'session-1',
        event_type: 'plan_created',
        plan_name: 'realtime-data-collection',
        plan_path: '/test/.plans/active/realtime-data-collection',
        data: { features: 24 },
      },
      {
        id: 'plan-event-2',
        timestamp: '2025-01-01T10:05:00Z',
        session_id: 'session-1',
        event_type: 'plan_optimized',
        plan_name: 'realtime-data-collection',
        plan_path: '/test/.plans/active/realtime-data-collection',
        data: { optimizations: ['progressive-disclosure'] },
      },
      {
        id: 'plan-event-3',
        timestamp: '2025-01-01T10:10:00Z',
        session_id: 'session-1',
        event_type: 'feature_started',
        plan_name: 'realtime-data-collection',
        plan_path: '/test/.plans/active/realtime-data-collection',
        feature_id: 'F001',
        feature_description: 'Database schema',
        status: 'in_progress',
        data: { startedBy: 'orchestrator' },
      },
      {
        id: 'plan-event-4',
        timestamp: '2025-01-01T10:15:00Z',
        session_id: 'session-1',
        event_type: 'feature_completed',
        plan_name: 'realtime-data-collection',
        plan_path: '/test/.plans/active/realtime-data-collection',
        feature_id: 'F001',
        feature_description: 'Database schema',
        status: 'completed',
        data: { duration_ms: 300000 },
      },
      {
        id: 'plan-event-5',
        timestamp: '2025-01-01T11:00:00Z',
        session_id: 'session-1',
        event_type: 'plan_created',
        plan_name: 'api-endpoints',
        plan_path: '/test/.plans/active/api-endpoints',
        data: { features: 12 },
      },
    ];

    // Insert test events
    testEvents.forEach(event => db.insertPlanEvent(event));
  });

  afterEach(() => {
    db.close();
  });

  describe('handlePlanEvents', () => {
    it('should return all plan events', async () => {
      const req = new Request('http://localhost:3456/api/plans/events');
      const response = await handlePlanEvents(req, db);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3456');

      const body = await response.json();
      expect(body.data).toHaveLength(5);
    });

    it('should return events ordered by timestamp (newest first)', async () => {
      const req = new Request('http://localhost:3456/api/plans/events');
      const response = await handlePlanEvents(req, db);

      const body = await response.json();
      expect(body.data[0].timestamp).toBe('2025-01-01T11:00:00Z');
      expect(body.data[4].timestamp).toBe('2025-01-01T10:00:00Z');
    });

    it('should include all event properties', async () => {
      const req = new Request('http://localhost:3456/api/plans/events');
      const response = await handlePlanEvents(req, db);

      const body = await response.json();
      const event = body.data.find((e: PlanEvent) => e.id === 'plan-event-3');
      expect(event).toBeDefined();
      expect(event.event_type).toBe('feature_started');
      expect(event.plan_name).toBe('realtime-data-collection');
      expect(event.feature_id).toBe('F001');
      expect(event.feature_description).toBe('Database schema');
      expect(event.status).toBe('in_progress');
      expect(event.data).toEqual({ startedBy: 'orchestrator' });
    });

    it('should handle empty database', async () => {
      const emptyDb = new Database(':memory:');
      const req = new Request('http://localhost:3456/api/plans/events');
      const response = await handlePlanEvents(req, emptyDb);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toHaveLength(0);
      emptyDb.close();
    });

    it('should handle errors gracefully', async () => {
      // Create a fresh database and close it to simulate error
      const closedDb = new Database(':memory:');
      closedDb.close();

      const req = new Request('http://localhost:3456/api/plans/events');
      const response = await handlePlanEvents(req, closedDb);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('handlePlanEventsByPlan', () => {
    it('should return events for specific plan', async () => {
      const req = new Request('http://localhost:3456/api/plans/events/realtime-data-collection');
      const response = await handlePlanEventsByPlan(req, 'realtime-data-collection', db);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toHaveLength(4);
      expect(body.data.every((e: PlanEvent) => e.plan_name === 'realtime-data-collection')).toBe(true);
    });

    it('should handle URL-encoded plan names', async () => {
      const req = new Request('http://localhost:3456/api/plans/events/api%2Dendpoints');
      const response = await handlePlanEventsByPlan(req, 'api%2Dendpoints', db);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].plan_name).toBe('api-endpoints');
    });

    it('should return events ordered by timestamp (newest first)', async () => {
      const req = new Request('http://localhost:3456/api/plans/events/realtime-data-collection');
      const response = await handlePlanEventsByPlan(req, 'realtime-data-collection', db);

      const body = await response.json();
      expect(body.data[0].timestamp).toBe('2025-01-01T10:15:00Z');
      expect(body.data[3].timestamp).toBe('2025-01-01T10:00:00Z');
    });

    it('should return empty array for non-existent plan', async () => {
      const req = new Request('http://localhost:3456/api/plans/events/non-existent');
      const response = await handlePlanEventsByPlan(req, 'non-existent', db);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toHaveLength(0);
    });

    it('should handle errors gracefully', async () => {
      // Create a fresh database and close it to simulate error
      const closedDb = new Database(':memory:');
      closedDb.close();

      const req = new Request('http://localhost:3456/api/plans/events/realtime-data-collection');
      const response = await handlePlanEventsByPlan(req, 'realtime-data-collection', closedDb);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Internal server error');
    });
  });
});
