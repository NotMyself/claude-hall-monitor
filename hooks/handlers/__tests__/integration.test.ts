import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../metrics/database';
import { MetricsCollector } from '../../metrics/collector';
import { EventEmitter } from '../../utils/event-emitter';
import type { MetricEntry } from '../../metrics/types';

describe('Integration: Data Pipeline', () => {
  let db: Database;
  let emitter: EventEmitter;
  let collector: MetricsCollector;

  beforeEach(() => {
    db = new Database(':memory:');
    emitter = new EventEmitter();
    collector = new MetricsCollector({ database: db, emitter, flushIntervalMs: 100, maxBufferSize: 10 });
  });

  afterEach(async () => {
    await collector.shutdown();
    db.close();
  });

  test('metric flows from collector to database', async () => {
    const metric: MetricEntry = {
      id: 'int-test-1',
      timestamp: new Date().toISOString(),
      session_id: 'integration-test',
      project_path: '/test',
      source: 'hook',
      event_type: 'test_event',
      event_category: 'custom',
      data: { test: true },
      tags: ['integration'],
    };

    collector.collect(metric);
    await collector.flush();

    const results = db.query({ session_id: 'integration-test' });
    expect(results).toHaveLength(1);
    expect(results[0]!.event_type).toBe('test_event');
  });

  test('event emitter receives collected metrics', async () => {
    let emittedMetric: MetricEntry | null = null;
    emitter.on('metric', (m: MetricEntry) => {
      emittedMetric = m;
    });

    const metric: MetricEntry = {
      id: 'int-test-2',
      timestamp: new Date().toISOString(),
      session_id: 'integration-test-2',
      project_path: '/test',
      source: 'hook',
      event_type: 'emit_test',
      event_category: 'custom',
      data: {},
      tags: [],
    };

    collector.collect(metric);

    // Wait for async event emission
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(emittedMetric).not.toBeNull();
    expect(emittedMetric!.event_type).toBe('emit_test');
  });

  test('buffer auto-flushes when maxBufferSize is reached', async () => {
    const metrics: MetricEntry[] = [];
    for (let i = 0; i < 11; i++) {
      metrics.push({
        id: `buffer-test-${i}`,
        timestamp: new Date().toISOString(),
        session_id: 'buffer-test',
        project_path: '/test',
        source: 'hook',
        event_type: 'buffer_event',
        event_category: 'custom',
        data: { index: i },
        tags: [],
      });
    }

    // Collect 11 metrics (buffer size is 10)
    for (const metric of metrics) {
      collector.collect(metric);
    }

    // Give time for auto-flush
    await new Promise(resolve => setTimeout(resolve, 50));

    const results = db.query({ session_id: 'buffer-test' });
    expect(results.length).toBeGreaterThanOrEqual(10);
  });

  test('collector handles concurrent metric collection', async () => {
    const promises = [];
    for (let i = 0; i < 50; i++) {
      const metric: MetricEntry = {
        id: `concurrent-${i}`,
        timestamp: new Date().toISOString(),
        session_id: 'concurrent-test',
        project_path: '/test',
        source: 'hook',
        event_type: 'concurrent_event',
        event_category: 'custom',
        data: { index: i },
        tags: [],
      };
      collector.collect(metric);
    }

    await collector.flush();

    const results = db.query({ session_id: 'concurrent-test' });
    expect(results).toHaveLength(50);
  });

  test('database query filters work correctly', async () => {
    const metrics: MetricEntry[] = [
      {
        id: 'filter-1',
        timestamp: new Date().toISOString(),
        session_id: 'session-1',
        project_path: '/test',
        source: 'hook',
        event_type: 'event_a',
        event_category: 'session',
        data: {},
        tags: ['tag1'],
      },
      {
        id: 'filter-2',
        timestamp: new Date().toISOString(),
        session_id: 'session-2',
        project_path: '/test',
        source: 'hook',
        event_type: 'event_b',
        event_category: 'user',
        data: {},
        tags: ['tag2'],
      },
    ];

    for (const metric of metrics) {
      collector.collect(metric);
    }
    await collector.flush();

    const bySession = db.query({ session_id: 'session-1' });
    expect(bySession).toHaveLength(1);
    expect(bySession[0]!.event_type).toBe('event_a');

    const byEventType = db.query({ event_type: 'event_b' });
    expect(byEventType).toHaveLength(1);
    expect(byEventType[0]!.session_id).toBe('session-2');

    const byCategory = db.query({ event_category: 'session' });
    expect(byCategory).toHaveLength(1);
    expect(byCategory[0]!.id).toBe('filter-1');
  });

  test('periodic flush works correctly', async () => {
    const metric: MetricEntry = {
      id: 'periodic-test',
      timestamp: new Date().toISOString(),
      session_id: 'periodic-test',
      project_path: '/test',
      source: 'hook',
      event_type: 'periodic_event',
      event_category: 'custom',
      data: {},
      tags: [],
    };

    collector.collect(metric);

    // Wait for periodic flush (flushIntervalMs is 100ms)
    await new Promise(resolve => setTimeout(resolve, 150));

    const results = db.query({ session_id: 'periodic-test' });
    expect(results).toHaveLength(1);
  });

  test('event emitter receives multiple events', async () => {
    const emittedMetrics: MetricEntry[] = [];
    emitter.on('metric', (m: MetricEntry) => {
      emittedMetrics.push(m);
    });

    for (let i = 0; i < 5; i++) {
      const metric: MetricEntry = {
        id: `multi-emit-${i}`,
        timestamp: new Date().toISOString(),
        session_id: 'multi-emit-test',
        project_path: '/test',
        source: 'hook',
        event_type: 'multi_event',
        event_category: 'custom',
        data: { index: i },
        tags: [],
      };
      collector.collect(metric);
    }

    // Wait for async event emissions
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(emittedMetrics).toHaveLength(5);
    expect(emittedMetrics[0]!.data.index).toBe(0);
    expect(emittedMetrics[4]!.data.index).toBe(4);
  });

  test('shutdown stops periodic flushing', async () => {
    const metric: MetricEntry = {
      id: 'shutdown-test',
      timestamp: new Date().toISOString(),
      session_id: 'shutdown-test',
      project_path: '/test',
      source: 'hook',
      event_type: 'shutdown_event',
      event_category: 'custom',
      data: {},
      tags: [],
    };

    collector.collect(metric);
    await collector.shutdown();

    // Try to collect after shutdown (should be handled gracefully)
    const metric2: MetricEntry = {
      id: 'shutdown-test-2',
      timestamp: new Date().toISOString(),
      session_id: 'shutdown-test',
      project_path: '/test',
      source: 'hook',
      event_type: 'shutdown_event_2',
      event_category: 'custom',
      data: {},
      tags: [],
    };

    collector.collect(metric2);
    await new Promise(resolve => setTimeout(resolve, 150));

    const results = db.query({ session_id: 'shutdown-test' });
    // Should only have the first metric (flushed before shutdown)
    expect(results).toHaveLength(1);
  });
});
