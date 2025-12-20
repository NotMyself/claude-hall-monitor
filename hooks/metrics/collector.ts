/**
 * MetricsCollector class for buffering, event emission, and database persistence
 *
 * Implements: F007 - MetricsCollector
 * Decisions: D006 (Event emitter pattern for pub/sub)
 * Edge Cases: EC004 (High volume metric writes via batching)
 *
 * This class:
 * - Buffers metrics in memory for batch writes
 * - Emits events for realtime streaming
 * - Auto-flushes on timer or buffer size threshold
 * - Handles errors by re-adding failed batches to buffer
 * - Provides graceful shutdown with final flush
 */

import type { MetricEntry } from './types';
import type { Database } from './database';
import type { EventEmitter } from '../utils/event-emitter';

/**
 * Configuration options for MetricsCollector
 */
export interface CollectorOptions {
  database: Database;
  emitter: EventEmitter;
  flushIntervalMs?: number;
  maxBufferSize?: number;
}

/**
 * MetricsCollector class for collecting, buffering, and persisting metrics
 */
export class MetricsCollector {
  private buffer: MetricEntry[] = [];
  private flushTimer: Timer | null = null;
  private database: Database;
  private emitter: EventEmitter;
  private flushIntervalMs: number;
  private maxBufferSize: number;

  /**
   * Create a new MetricsCollector instance
   *
   * @param options - Configuration options
   */
  constructor(options: CollectorOptions) {
    this.database = options.database;
    this.emitter = options.emitter;
    this.flushIntervalMs = options.flushIntervalMs ?? 5000;
    this.maxBufferSize = options.maxBufferSize ?? 100;
    this.startAutoFlush();
  }

  /**
   * Add metric to buffer and emit for realtime streaming
   *
   * @param metric - The metric to collect
   */
  collect(metric: MetricEntry): void {
    this.buffer.push(metric);
    this.emitter.emit('metric', metric);

    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  /**
   * Flush buffer to database
   *
   * Writes all buffered metrics to the database in a single batch transaction.
   * On error, re-adds the failed batch to the buffer for retry on next flush.
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const batch = [...this.buffer];
    this.buffer = [];

    try {
      await this.database.insertBatch(batch);
      await this.emitter.emit('flush', { count: batch.length });
    } catch (error) {
      console.error('Failed to flush metrics:', error);
      // Re-add failed batch to buffer (at the start for FIFO order)
      this.buffer = [...batch, ...this.buffer];
    }
  }

  /**
   * Graceful shutdown: stop timer, flush remaining metrics, emit shutdown event
   */
  async shutdown(): Promise<void> {
    this.stopAutoFlush();
    await this.flush();
    await this.emitter.emit('shutdown', {});
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => this.flush(), this.flushIntervalMs);
  }

  /**
   * Stop auto-flush timer
   */
  private stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}
