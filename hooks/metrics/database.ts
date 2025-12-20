/**
 * Database class for metrics storage using bun:sqlite
 *
 * Implements: F004 - Database Layer
 * Decisions: D003 (SQLite for hot data), D005 (Use bun:sqlite)
 * Edge Cases: EC001 (database lock retry), EC004 (batch performance)
 *
 * This class wraps bun:sqlite and provides CRUD operations for metrics.
 * It uses the schema defined in schema.sql and follows patterns from code/typescript.md.
 */

import { Database as BunDatabase } from 'bun:sqlite';
import type { MetricEntry, QueryOptions, AggregationOptions, AggregationResult, PlanEvent } from './types';
import { join } from 'path';
import { readFileSync } from 'fs';

/**
 * Maximum number of retries for database lock errors
 */
const MAX_RETRIES = 5;

/**
 * Initial retry delay in milliseconds
 */
const INITIAL_RETRY_DELAY_MS = 100;

/**
 * Database class for metrics CRUD operations
 */
export class Database {
  private db: BunDatabase;
  private schemaPath: string;

  /**
   * Create a new Database instance
   *
   * @param path - Path to the SQLite database file (use ':memory:' for in-memory)
   */
  constructor(path: string) {
    this.db = new BunDatabase(path);
    this.schemaPath = join(import.meta.dir, 'schema.sql');
    this.initialize();
  }

  /**
   * Initialize database schema and performance settings
   */
  private initialize(): void {
    // Apply performance optimizations (from code/sql.md#performance-optimization)
    this.db.exec('PRAGMA journal_mode = WAL');
    this.db.exec('PRAGMA cache_size = 10000');
    this.db.exec('PRAGMA synchronous = NORMAL');
    this.db.exec('PRAGMA temp_store = MEMORY');

    // Read and execute schema using synchronous file read
    const schema = readFileSync(this.schemaPath, 'utf-8');
    this.db.exec(schema);
  }

  /**
   * Insert a single metric entry
   *
   * @param metric - The metric to insert
   */
  insertMetric(metric: MetricEntry): void {
    this.executeWithRetry(() => {
      const stmt = this.db.prepare(`
        INSERT INTO metrics (
          id, timestamp, session_id, project_path, source, event_type,
          event_category, model, tokens_json, cost_json, tool_name,
          tool_duration_ms, tool_success, data_json, tags_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        metric.id,
        metric.timestamp,
        metric.session_id,
        metric.project_path,
        metric.source,
        metric.event_type,
        metric.event_category,
        metric.model ?? null,
        metric.tokens ? JSON.stringify(metric.tokens) : null,
        metric.cost ? JSON.stringify(metric.cost) : null,
        metric.tool_name ?? null,
        metric.tool_duration_ms ?? null,
        metric.tool_success !== undefined ? (metric.tool_success ? 1 : 0) : null,
        JSON.stringify(metric.data),
        JSON.stringify(metric.tags)
      );
    });
  }

  /**
   * Batch insert metrics for high performance (EC004)
   *
   * Uses a transaction to insert all metrics atomically.
   *
   * @param metrics - Array of metrics to insert
   */
  insertBatch(metrics: MetricEntry[]): void {
    this.executeWithRetry(() => {
      const stmt = this.db.prepare(`
        INSERT INTO metrics (
          id, timestamp, session_id, project_path, source, event_type,
          event_category, model, tokens_json, cost_json, tool_name,
          tool_duration_ms, tool_success, data_json, tags_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = this.db.transaction((entries: MetricEntry[]) => {
        for (const metric of entries) {
          stmt.run(
            metric.id,
            metric.timestamp,
            metric.session_id,
            metric.project_path,
            metric.source,
            metric.event_type,
            metric.event_category,
            metric.model ?? null,
            metric.tokens ? JSON.stringify(metric.tokens) : null,
            metric.cost ? JSON.stringify(metric.cost) : null,
            metric.tool_name ?? null,
            metric.tool_duration_ms ?? null,
            metric.tool_success !== undefined ? (metric.tool_success ? 1 : 0) : null,
            JSON.stringify(metric.data),
            JSON.stringify(metric.tags)
          );
        }
      });

      transaction(metrics);
    });
  }

  /**
   * Query metrics with filters
   *
   * @param options - Query filters and pagination
   * @returns Array of matching metrics
   */
  query(options: QueryOptions): MetricEntry[] {
    const conditions: string[] = [];
    const params: any[] = [];

    if (options.session_id) {
      conditions.push('session_id = ?');
      params.push(options.session_id);
    }

    if (options.event_type) {
      conditions.push('event_type = ?');
      params.push(options.event_type);
    }

    if (options.event_category) {
      conditions.push('event_category = ?');
      params.push(options.event_category);
    }

    if (options.start_time) {
      conditions.push('timestamp >= ?');
      params.push(options.start_time);
    }

    if (options.end_time) {
      conditions.push('timestamp <= ?');
      params.push(options.end_time);
    }

    if (options.tags && options.tags.length > 0) {
      // Tags are stored as JSON array, so we need to check if any tag matches
      // SQLite doesn't have native JSON array contains, so we use LIKE
      const tagConditions = options.tags.map(() => 'tags_json LIKE ?');
      conditions.push(`(${tagConditions.join(' OR ')})`);
      for (const tag of options.tags) {
        params.push(`%"${tag}"%`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // OFFSET requires LIMIT in SQLite, so if offset is specified without limit, use a large limit
    let limitClause = '';
    let offsetClause = '';
    if (options.limit || options.offset) {
      limitClause = `LIMIT ${options.limit ?? 999999}`;
      offsetClause = options.offset ? `OFFSET ${options.offset}` : '';
    }

    const query = `
      SELECT * FROM metrics
      ${whereClause}
      ORDER BY timestamp DESC
      ${limitClause} ${offsetClause}
    `.trim();

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => this.rowToMetric(row));
  }

  /**
   * Convert database row to MetricEntry
   *
   * @param row - Raw database row
   * @returns Typed MetricEntry
   */
  private rowToMetric(row: any): MetricEntry {
    return {
      id: row.id,
      timestamp: row.timestamp,
      session_id: row.session_id,
      project_path: row.project_path,
      source: row.source,
      event_type: row.event_type,
      event_category: row.event_category,
      model: row.model ?? undefined,
      tokens: row.tokens_json ? JSON.parse(row.tokens_json) : undefined,
      cost: row.cost_json ? JSON.parse(row.cost_json) : undefined,
      tool_name: row.tool_name ?? undefined,
      tool_duration_ms: row.tool_duration_ms ?? undefined,
      tool_success: row.tool_success !== null ? Boolean(row.tool_success) : undefined,
      data: JSON.parse(row.data_json),
      tags: JSON.parse(row.tags_json),
    };
  }

  /**
   * Execute a database operation with retry logic for lock errors (EC001)
   *
   * Implements exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms
   *
   * @param operation - The operation to execute
   */
  private executeWithRetry<T>(operation: () => T): T {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return operation();
      } catch (error) {
        if (error instanceof Error) {
          // Check if this is a database lock error (SQLITE_BUSY)
          if (error.message.includes('BUSY') || error.message.includes('LOCKED')) {
            lastError = error;
            const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);

            // Wait before retrying
            Bun.sleepSync(delay);
            continue;
          }
        }
        // If it's not a lock error, throw immediately
        throw error;
      }
    }

    // All retries exhausted
    console.warn(`Database operation failed after ${MAX_RETRIES} retries:`, lastError);
    throw lastError;
  }

  /**
   * Insert a single plan event
   *
   * @param event - The plan event to insert
   */
  insertPlanEvent(event: PlanEvent): void {
    this.executeWithRetry(() => {
      const stmt = this.db.prepare(`
        INSERT INTO plan_events (
          id, timestamp, session_id, event_type, plan_name, plan_path,
          feature_id, feature_description, status, pr_url, data_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        event.id,
        event.timestamp,
        event.session_id,
        event.event_type,
        event.plan_name,
        event.plan_path,
        event.feature_id ?? null,
        event.feature_description ?? null,
        event.status ?? null,
        event.pr_url ?? null,
        JSON.stringify(event.data)
      );
    });
  }

  /**
   * Query all plan events
   *
   * @returns Array of all plan events ordered by timestamp
   */
  queryPlanEvents(): PlanEvent[] {
    const stmt = this.db.prepare('SELECT * FROM plan_events ORDER BY timestamp DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => this.rowToPlanEvent(row));
  }

  /**
   * Query plan events by plan name
   *
   * @param planName - The plan name to filter by
   * @returns Array of plan events for the specified plan
   */
  queryPlanEventsByPlan(planName: string): PlanEvent[] {
    const stmt = this.db.prepare('SELECT * FROM plan_events WHERE plan_name = ? ORDER BY timestamp DESC');
    const rows = stmt.all(planName) as any[];
    return rows.map(row => this.rowToPlanEvent(row));
  }

  /**
   * Convert database row to PlanEvent
   *
   * @param row - Raw database row
   * @returns Typed PlanEvent
   */
  private rowToPlanEvent(row: any): PlanEvent {
    return {
      id: row.id,
      timestamp: row.timestamp,
      session_id: row.session_id,
      event_type: row.event_type,
      plan_name: row.plan_name,
      plan_path: row.plan_path,
      feature_id: row.feature_id ?? undefined,
      feature_description: row.feature_description ?? undefined,
      status: row.status ?? undefined,
      pr_url: row.pr_url ?? undefined,
      data: JSON.parse(row.data_json),
    };
  }

  /**
   * Close the database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Get aggregated metrics (optional - for future use)
   *
   * @param options - Aggregation options
   * @returns Array of aggregation results
   */
  aggregate(options: AggregationOptions): AggregationResult[] {
    // TODO: Implement aggregation in future feature
    // This is a placeholder for F005 - Aggregation System
    return [];
  }
}
