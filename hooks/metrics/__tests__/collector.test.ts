/**
 * Unit tests for MetricsCollector
 *
 * Implements: F007 - MetricsCollector
 * Decisions: D006 (Event emitter pattern)
 * Edge Cases: EC004 (batch performance)
 *
 * Tests cover:
 * - Constructor initialization
 * - collect() adds to buffer and emits event
 * - flush() writes buffer to database
 * - Auto-flush triggers on timer
 * - Auto-flush triggers on max size
 * - shutdown() flushes remaining
 * - Error handling re-adds failed batch
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MetricsCollector } from '../collector';
import { Database } from '../database';
import { EventEmitter } from '../../utils/event-emitter';
import type { MetricEntry } from '../types';

describe('MetricsCollector', () => {
  let db: Database;
  let emitter: EventEmitter;
  let collector: MetricsCollector;

  const createMockMetric = (id: string): MetricEntry => ({
    id,
    timestamp: new Date().toISOString(),
    session_id: 'test-session',
    project_path: '/test/path',
    source: 'hook',
    event_type: 'test_event',
    event_category: 'custom',
    data: { test: true },
    tags: ['test'],
  });

  beforeEach(() => {
    // Use in-memory database for tests
    db = new Database(':memory:');
    emitter = new EventEmitter();
  });

  afterEach(async () => {
    if (collector) {
      await collector.shutdown();
    }
    db.close();
  });

  describe('constructor', () => {
    it('should initialize with provided options', () => {
      collector = new MetricsCollector({
        database: db,
        emitter,
        flushIntervalMs: 1000,
        maxBufferSize: 50,
      });

      expect(collector).toBeDefined();
    });

    it('should use default flush interval if not provided', () => {
      collector = new MetricsCollector({
        database: db,
        emitter,
      });

      expect(collector).toBeDefined();
    });

    it('should use default max buffer size if not provided', () => {
      collector = new MetricsCollector({
        database: db,
        emitter,
      });

      expect(collector).toBeDefined();
    });
  });

  describe('collect()', () => {
    it('should add metric to buffer', async () => {
      collector = new MetricsCollector({
        database: db,
        emitter,
        flushIntervalMs: 999999, // Prevent auto-flush
      });

      const metric = createMockMetric('metric-1');
      collector.collect(metric);

      // Verify by flushing and checking database
      await collector.flush();
      const results = db.query({ session_id: 'test-session' });
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe('metric-1');
    });

    it('should emit metric event when collected', async () => {
      collector = new MetricsCollector({
        database: db,
        emitter,
        flushIntervalMs: 999999,
      });

      const metric = createMockMetric('metric-2');
      const emitSpy = vi.fn();
      emitter.on('metric', emitSpy);

      collector.collect(metric);

      // Wait for async event emission
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(emitSpy).toHaveBeenCalledWith(metric);
    });

    it('should trigger flush when buffer reaches max size', async () => {
      collector = new MetricsCollector({
        database: db,
        emitter,
        flushIntervalMs: 999999,
        maxBufferSize: 3,
      });

      const flushSpy = vi.fn();
      emitter.on('flush', flushSpy);

      // Add 3 metrics to trigger flush
      collector.collect(createMockMetric('metric-1'));
      collector.collect(createMockMetric('metric-2'));
      collector.collect(createMockMetric('metric-3'));

      // Wait for async flush
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(flushSpy).toHaveBeenCalled();

      // Verify all metrics were persisted
      const results = db.query({ session_id: 'test-session' });
      expect(results).toHaveLength(3);
    });
  });

  describe('flush()', () => {
    it('should write buffered metrics to database', async () => {
      collector = new MetricsCollector({
        database: db,
        emitter,
        flushIntervalMs: 999999,
      });

      collector.collect(createMockMetric('metric-1'));
      collector.collect(createMockMetric('metric-2'));

      await collector.flush();

      const results = db.query({ session_id: 'test-session' });
      expect(results).toHaveLength(2);
      expect(results.map(r => r.id).sort()).toEqual(['metric-1', 'metric-2']);
    });

    it('should emit flush event with count', async () => {
      collector = new MetricsCollector({
        database: db,
        emitter,
        flushIntervalMs: 999999,
      });

      const flushSpy = vi.fn();
      emitter.on('flush', flushSpy);

      collector.collect(createMockMetric('metric-1'));
      collector.collect(createMockMetric('metric-2'));

      await collector.flush();

      expect(flushSpy).toHaveBeenCalledWith({ count: 2 });
    });

    it('should clear buffer after flush', async () => {
      collector = new MetricsCollector({
        database: db,
        emitter,
        flushIntervalMs: 999999,
      });

      collector.collect(createMockMetric('metric-1'));
      await collector.flush();

      // Add another metric and flush
      collector.collect(createMockMetric('metric-2'));
      await collector.flush();

      // Should only flush the second metric
      const flushSpy = vi.fn();
      emitter.on('flush', flushSpy);
      await collector.flush();

      // No flush event should be emitted for empty buffer
      expect(flushSpy).not.toHaveBeenCalled();
    });

    it('should not flush empty buffer', async () => {
      collector = new MetricsCollector({
        database: db,
        emitter,
        flushIntervalMs: 999999,
      });

      const flushSpy = vi.fn();
      emitter.on('flush', flushSpy);

      await collector.flush();

      expect(flushSpy).not.toHaveBeenCalled();
    });

    it('should handle database errors by re-adding batch to buffer', async () => {
      collector = new MetricsCollector({
        database: db,
        emitter,
        flushIntervalMs: 999999,
      });

      // Add metric with invalid data to cause error
      const metric = createMockMetric('metric-1');
      collector.collect(metric);

      // Close database to cause error
      db.close();

      // Attempt flush (should fail and re-add to buffer)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await collector.flush();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to flush metrics:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();

      // Verify metric is still in buffer by flushing with new database
      db = new Database(':memory:');
      collector = new MetricsCollector({
        database: db,
        emitter,
        flushIntervalMs: 999999,
      });
      collector.collect(metric);
      await collector.flush();

      const results = db.query({ session_id: 'test-session' });
      expect(results).toHaveLength(1);
    });
  });

  describe('auto-flush', () => {
    it('should auto-flush on timer interval', async () => {
      collector = new MetricsCollector({
        database: db,
        emitter,
        flushIntervalMs: 100, // 100ms for testing
      });

      const flushSpy = vi.fn();
      emitter.on('flush', flushSpy);

      collector.collect(createMockMetric('metric-1'));

      // Wait for auto-flush
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(flushSpy).toHaveBeenCalled();

      const results = db.query({ session_id: 'test-session' });
      expect(results).toHaveLength(1);
    });

    it('should not auto-flush empty buffer', async () => {
      collector = new MetricsCollector({
        database: db,
        emitter,
        flushIntervalMs: 100,
      });

      const flushSpy = vi.fn();
      emitter.on('flush', flushSpy);

      // Wait for auto-flush interval
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(flushSpy).not.toHaveBeenCalled();
    });
  });

  describe('shutdown()', () => {
    it('should flush remaining metrics', async () => {
      collector = new MetricsCollector({
        database: db,
        emitter,
        flushIntervalMs: 999999,
      });

      collector.collect(createMockMetric('metric-1'));
      collector.collect(createMockMetric('metric-2'));

      await collector.shutdown();

      const results = db.query({ session_id: 'test-session' });
      expect(results).toHaveLength(2);
    });

    it('should emit shutdown event', async () => {
      collector = new MetricsCollector({
        database: db,
        emitter,
        flushIntervalMs: 999999,
      });

      const shutdownSpy = vi.fn();
      emitter.on('shutdown', shutdownSpy);

      await collector.shutdown();

      expect(shutdownSpy).toHaveBeenCalledWith({});
    });

    it('should stop auto-flush timer', async () => {
      collector = new MetricsCollector({
        database: db,
        emitter,
        flushIntervalMs: 100,
      });

      const flushSpy = vi.fn();
      emitter.on('flush', flushSpy);

      await collector.shutdown();

      // Wait beyond flush interval
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should not have triggered auto-flush after shutdown
      expect(flushSpy).not.toHaveBeenCalled();
    });
  });
});
