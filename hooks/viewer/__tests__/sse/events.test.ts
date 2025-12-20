/**
 * Unit tests for SSE streaming handlers
 *
 * Tests: F023 - SSE Streaming Endpoints
 * Edge Cases: EC005 - Rate limiting
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EventEmitter } from '../../../utils/event-emitter';
import { RateLimiter } from '../../security';
import { handleMetricsSSE, handlePlansSSE } from '../../sse/events';
import type { MetricEntry, PlanEvent } from '../../../metrics/types';

describe('SSE Events', () => {
  let emitter: EventEmitter;
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    emitter = new EventEmitter();
    // Allow 5 connections per 60 seconds
    rateLimiter = new RateLimiter(5, 60000);
  });

  describe('handleMetricsSSE', () => {
    it('should return SSE response with correct headers', () => {
      const req = new Request('http://localhost:3456/events/metrics');
      const response = handleMetricsSSE(req, emitter, rateLimiter);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
      expect(response.headers.get('Connection')).toBe('keep-alive');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3456');
    });

    it('should enforce rate limiting', () => {
      const req1 = new Request('http://localhost:3456/events/metrics', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const req2 = new Request('http://localhost:3456/events/metrics', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const req3 = new Request('http://localhost:3456/events/metrics', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const req4 = new Request('http://localhost:3456/events/metrics', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const req5 = new Request('http://localhost:3456/events/metrics', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const req6 = new Request('http://localhost:3456/events/metrics', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      // First 5 should succeed
      expect(handleMetricsSSE(req1, emitter, rateLimiter).status).toBe(200);
      expect(handleMetricsSSE(req2, emitter, rateLimiter).status).toBe(200);
      expect(handleMetricsSSE(req3, emitter, rateLimiter).status).toBe(200);
      expect(handleMetricsSSE(req4, emitter, rateLimiter).status).toBe(200);
      expect(handleMetricsSSE(req5, emitter, rateLimiter).status).toBe(200);

      // 6th should be rate limited
      const response = handleMetricsSSE(req6, emitter, rateLimiter);
      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');
    });

    it('should use x-real-ip header if x-forwarded-for is not present', () => {
      const req = new Request('http://localhost:3456/events/metrics', {
        headers: { 'x-real-ip': '192.168.1.2' },
      });
      const response = handleMetricsSSE(req, emitter, rateLimiter);

      expect(response.status).toBe(200);
    });

    it('should use "unknown" IP if no headers present', () => {
      const req = new Request('http://localhost:3456/events/metrics');
      const response = handleMetricsSSE(req, emitter, rateLimiter);

      expect(response.status).toBe(200);
    });

    it('should create readable stream', () => {
      const req = new Request('http://localhost:3456/events/metrics');
      const response = handleMetricsSSE(req, emitter, rateLimiter);

      expect(response.body).toBeDefined();
      expect(response.body instanceof ReadableStream).toBe(true);
    });

    it('should stream metric events in SSE format', async () => {
      const req = new Request('http://localhost:3456/events/metrics');
      const response = handleMetricsSSE(req, emitter, rateLimiter);

      const reader = response.body!.getReader();

      // Read initial connection message
      const { value: initialValue } = await reader.read();
      // In Bun, ReadableStream can return strings directly
      const initialMessage = typeof initialValue === 'string' ? initialValue : new TextDecoder().decode(initialValue);
      expect(initialMessage).toContain(': SSE connection established');

      // Emit a metric event
      const metric: MetricEntry = {
        id: 'test-metric',
        timestamp: '2025-01-01T10:00:00Z',
        session_id: 'test-session',
        project_path: '/test',
        source: 'hook',
        event_type: 'test',
        event_category: 'tool',
        data: { test: true },
        tags: [],
      };

      // Emit asynchronously to avoid blocking
      setTimeout(() => emitter.emit('metric:collected', metric), 10);

      // Read the streamed event
      const { value, done } = await reader.read();
      expect(done).toBe(false);

      const message = typeof value === 'string' ? value : new TextDecoder().decode(value);
      expect(message).toContain('event: metric');
      expect(message).toContain(`data: ${JSON.stringify(metric)}`);

      // Cancel the stream
      await reader.cancel();
    });

    it('should handle encoding errors gracefully', async () => {
      const req = new Request('http://localhost:3456/events/metrics');
      const response = handleMetricsSSE(req, emitter, rateLimiter);

      const reader = response.body!.getReader();

      // Read initial message
      await reader.read();

      // Create a metric with circular reference (will cause JSON.stringify to fail)
      const circularMetric: any = {
        id: 'test',
        timestamp: '2025-01-01T10:00:00Z',
        session_id: 'test',
        project_path: '/test',
        source: 'hook',
        event_type: 'test',
        event_category: 'tool',
        data: {},
        tags: [],
      };
      circularMetric.data.self = circularMetric;

      // This should not crash the stream
      await emitter.emit('metric:collected', circularMetric);

      // Stream should still be active
      await reader.cancel();
    });
  });

  describe('handlePlansSSE', () => {
    it('should return SSE response with correct headers', () => {
      const req = new Request('http://localhost:3456/events/plans');
      const response = handlePlansSSE(req, emitter, rateLimiter);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
      expect(response.headers.get('Connection')).toBe('keep-alive');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3456');
    });

    it('should enforce rate limiting', () => {
      const req1 = new Request('http://localhost:3456/events/plans', {
        headers: { 'x-forwarded-for': '192.168.1.3' },
      });
      const req2 = new Request('http://localhost:3456/events/plans', {
        headers: { 'x-forwarded-for': '192.168.1.3' },
      });
      const req3 = new Request('http://localhost:3456/events/plans', {
        headers: { 'x-forwarded-for': '192.168.1.3' },
      });
      const req4 = new Request('http://localhost:3456/events/plans', {
        headers: { 'x-forwarded-for': '192.168.1.3' },
      });
      const req5 = new Request('http://localhost:3456/events/plans', {
        headers: { 'x-forwarded-for': '192.168.1.3' },
      });
      const req6 = new Request('http://localhost:3456/events/plans', {
        headers: { 'x-forwarded-for': '192.168.1.3' },
      });

      // First 5 should succeed
      expect(handlePlansSSE(req1, emitter, rateLimiter).status).toBe(200);
      expect(handlePlansSSE(req2, emitter, rateLimiter).status).toBe(200);
      expect(handlePlansSSE(req3, emitter, rateLimiter).status).toBe(200);
      expect(handlePlansSSE(req4, emitter, rateLimiter).status).toBe(200);
      expect(handlePlansSSE(req5, emitter, rateLimiter).status).toBe(200);

      // 6th should be rate limited
      const response = handlePlansSSE(req6, emitter, rateLimiter);
      expect(response.status).toBe(429);
    });

    it('should create readable stream', () => {
      const req = new Request('http://localhost:3456/events/plans');
      const response = handlePlansSSE(req, emitter, rateLimiter);

      expect(response.body).toBeDefined();
      expect(response.body instanceof ReadableStream).toBe(true);
    });

    it('should stream plan events in SSE format', async () => {
      const req = new Request('http://localhost:3456/events/plans');
      const response = handlePlansSSE(req, emitter, rateLimiter);

      const reader = response.body!.getReader();

      // Read initial connection message
      const { value: initialValue } = await reader.read();
      // In Bun, ReadableStream can return strings directly
      const initialMessage = typeof initialValue === 'string' ? initialValue : new TextDecoder().decode(initialValue);
      expect(initialMessage).toContain(': SSE connection established');

      // Emit a plan event
      const planEvent: PlanEvent = {
        id: 'test-plan',
        timestamp: '2025-01-01T10:00:00Z',
        session_id: 'test-session',
        event_type: 'plan_created',
        plan_name: 'test-plan',
        plan_path: '/test/.plans/active/test-plan',
        data: { features: 10 },
      };

      // Emit asynchronously to avoid blocking
      setTimeout(() => emitter.emit('plan:event', planEvent), 10);

      // Read the streamed event
      const { value, done } = await reader.read();
      expect(done).toBe(false);

      const message = typeof value === 'string' ? value : new TextDecoder().decode(value);
      expect(message).toContain('event: plan');
      expect(message).toContain(`data: ${JSON.stringify(planEvent)}`);

      // Cancel the stream
      await reader.cancel();
    });

    it('should handle different IP sources correctly', () => {
      // Test with x-forwarded-for
      const req1 = new Request('http://localhost:3456/events/plans', {
        headers: { 'x-forwarded-for': '192.168.1.4' },
      });
      expect(handlePlansSSE(req1, emitter, rateLimiter).status).toBe(200);

      // Test with x-real-ip
      const req2 = new Request('http://localhost:3456/events/plans', {
        headers: { 'x-real-ip': '192.168.1.5' },
      });
      expect(handlePlansSSE(req2, emitter, rateLimiter).status).toBe(200);

      // Test with no IP headers (should use 'unknown')
      const req3 = new Request('http://localhost:3456/events/plans');
      expect(handlePlansSSE(req3, emitter, rateLimiter).status).toBe(200);
    });
  });

  describe('Rate limiting across endpoints', () => {
    it('should share rate limiter between metrics and plans endpoints', () => {
      const req1 = new Request('http://localhost:3456/events/metrics', {
        headers: { 'x-forwarded-for': '192.168.1.6' },
      });
      const req2 = new Request('http://localhost:3456/events/plans', {
        headers: { 'x-forwarded-for': '192.168.1.6' },
      });

      // Use up the rate limit with metrics endpoint
      handleMetricsSSE(req1, emitter, rateLimiter);
      handleMetricsSSE(req1, emitter, rateLimiter);
      handleMetricsSSE(req1, emitter, rateLimiter);
      handleMetricsSSE(req1, emitter, rateLimiter);
      handleMetricsSSE(req1, emitter, rateLimiter);

      // Plans endpoint should now be rate limited for the same IP
      const response = handlePlansSSE(req2, emitter, rateLimiter);
      expect(response.status).toBe(429);
    });
  });
});
