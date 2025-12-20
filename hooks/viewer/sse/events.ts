/**
 * SSE (Server-Sent Events) streaming handlers
 *
 * Implements: F023 - SSE Streaming Endpoints
 * Edge Cases: EC005 - Rate limiting for SSE connections
 *
 * Provides real-time streaming of metrics and plan events via SSE.
 * Includes rate limiting to prevent resource exhaustion attacks.
 */

import { EventEmitter } from '../../utils/event-emitter';
import { RateLimiter } from '../security';
import type { MetricEntry, PlanEvent } from '../../metrics/types';

/**
 * GET /events/metrics - Stream new metrics
 *
 * Establishes an SSE connection that streams new metrics in real-time.
 * Rate limited by IP address (5 connections per 60 seconds).
 *
 * Event format:
 * ```
 * event: metric
 * data: <JSON-encoded MetricEntry>
 * ```
 *
 * @param req - HTTP request object
 * @param emitter - EventEmitter instance for metric events
 * @param rateLimiter - RateLimiter instance
 * @returns SSE response stream
 */
export function handleMetricsSSE(req: Request, emitter: EventEmitter, rateLimiter: RateLimiter): Response {
  // Get client IP for rate limiting
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  // Check rate limit
  if (!rateLimiter.isAllowed(ip)) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: {
        'Content-Type': 'text/plain',
        'Retry-After': '60',
      },
    });
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Send initial comment to establish connection
      controller.enqueue(': SSE connection established\n\n');

      // Create event listener for new metrics
      const listener = (metric: MetricEntry) => {
        try {
          const data = JSON.stringify(metric);
          const message = `event: metric\ndata: ${data}\n\n`;
          controller.enqueue(message);
        } catch (error) {
          console.error('Error encoding metric for SSE:', error);
        }
      };

      // Subscribe to metric events
      emitter.on('metric:collected', listener);

      // Store cleanup function
      let cleanupDone = false;
      const cleanup = () => {
        if (cleanupDone) return;
        cleanupDone = true;
        emitter.off('metric:collected', listener);
      };

      // Handle client disconnect
      req.signal.addEventListener('abort', () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // Controller may already be closed
        }
      });

      // Heartbeat to keep connection alive (every 30 seconds)
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(': heartbeat\n\n');
        } catch (error) {
          // Connection closed, stop heartbeat
          clearInterval(heartbeat);
          cleanup();
        }
      }, 30000);

      // Cleanup on stream cancel
      return () => {
        clearInterval(heartbeat);
        cleanup();
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': 'http://localhost:3456',
    },
  });
}

/**
 * GET /events/plans - Stream plan events
 *
 * Establishes an SSE connection that streams plan events in real-time.
 * Rate limited by IP address (5 connections per 60 seconds).
 *
 * Event format:
 * ```
 * event: plan
 * data: <JSON-encoded PlanEvent>
 * ```
 *
 * @param req - HTTP request object
 * @param emitter - EventEmitter instance for plan events
 * @param rateLimiter - RateLimiter instance
 * @returns SSE response stream
 */
export function handlePlansSSE(req: Request, emitter: EventEmitter, rateLimiter: RateLimiter): Response {
  // Get client IP for rate limiting
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  // Check rate limit
  if (!rateLimiter.isAllowed(ip)) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: {
        'Content-Type': 'text/plain',
        'Retry-After': '60',
      },
    });
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Send initial comment to establish connection
      controller.enqueue(': SSE connection established\n\n');

      // Create event listener for plan events
      const listener = (event: PlanEvent) => {
        try {
          const data = JSON.stringify(event);
          const message = `event: plan\ndata: ${data}\n\n`;
          controller.enqueue(message);
        } catch (error) {
          console.error('Error encoding plan event for SSE:', error);
        }
      };

      // Subscribe to plan events
      emitter.on('plan:event', listener);

      // Store cleanup function
      let cleanupDone = false;
      const cleanup = () => {
        if (cleanupDone) return;
        cleanupDone = true;
        emitter.off('plan:event', listener);
      };

      // Handle client disconnect
      req.signal.addEventListener('abort', () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // Controller may already be closed
        }
      });

      // Heartbeat to keep connection alive (every 30 seconds)
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(': heartbeat\n\n');
        } catch (error) {
          // Connection closed, stop heartbeat
          clearInterval(heartbeat);
          cleanup();
        }
      }, 30000);

      // Cleanup on stream cancel
      return () => {
        clearInterval(heartbeat);
        cleanup();
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': 'http://localhost:3456',
    },
  });
}
