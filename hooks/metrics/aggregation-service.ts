/**
 * AggregationService - Calculates hourly/daily/weekly/monthly aggregations
 *
 * Implements: F011 - Aggregation Service
 * Decisions: D003 (SQLite for hot data)
 *
 * This service provides time-window aggregations for metrics using SQL queries
 * for high performance. Supports grouping by model, event_type, and session.
 */

import { Database } from './database';
import type { AggregationOptions, AggregationResult } from './types';

/**
 * Service for calculating time-window aggregations
 */
export class AggregationService {
  private database: Database;

  /**
   * Create a new AggregationService
   *
   * @param database - Database instance to query
   */
  constructor(database: Database) {
    this.database = database;
  }

  /**
   * Calculate aggregations for a time period
   *
   * Uses SQL GROUP BY for efficient aggregation of large datasets.
   * Supports hourly, daily, weekly, and monthly time windows.
   *
   * @param options - Aggregation parameters
   * @returns Array of aggregation results
   */
  aggregate(options: AggregationOptions): AggregationResult[] {
    const { period, start_time, end_time, metric, group_by } = options;

    // Build the time window expression based on period
    const timeFormat = this.getTimeFormat(period);

    // Build the SELECT clause based on metric type
    const metricSelect = this.getMetricSelect(metric);

    // Build the GROUP BY clause
    const groupByClause = group_by ? `, ${this.getGroupByField(group_by)}` : '';
    const groupBySelect = group_by ? `, ${this.getGroupByField(group_by)} as group_value` : '';

    // Build the SQL query
    const query = `
      SELECT
        ${timeFormat} as period_start,
        ${metricSelect} as value
        ${groupBySelect}
      FROM metrics
      WHERE timestamp >= ? AND timestamp < ?
        ${group_by ? `AND ${this.getGroupByField(group_by)} IS NOT NULL` : ''}
      GROUP BY period_start${groupByClause}
      ORDER BY period_start ASC
    `.trim();

    // Execute the query
    const db = (this.database as any).db;
    const stmt = db.prepare(query);
    const rows = stmt.all(start_time, end_time) as any[];

    // Transform rows to AggregationResult with calculated period_end
    return rows.map(row => {
      const periodEnd = this.calculatePeriodEnd(row.period_start, period);

      const result: AggregationResult = {
        period_start: row.period_start,
        period_end: periodEnd,
        value: row.value ?? 0,
      };

      if (group_by && row.group_value !== undefined) {
        result.group = row.group_value;
      }

      return result;
    });
  }

  /**
   * Get the SQL time format expression for the period type
   */
  private getTimeFormat(period: 'hour' | 'day' | 'week' | 'month'): string {
    switch (period) {
      case 'hour':
        return "strftime('%Y-%m-%dT%H:00:00Z', timestamp)";
      case 'day':
        return "strftime('%Y-%m-%dT00:00:00Z', timestamp)";
      case 'week':
        // ISO week: start on Monday
        return "strftime('%Y-%m-%dT00:00:00Z', timestamp, 'weekday 1', '-6 days')";
      case 'month':
        return "strftime('%Y-%m-01T00:00:00Z', timestamp)";
    }
  }

  /**
   * Get the SQL expression for the metric value
   */
  private getMetricSelect(metric: 'count' | 'cost' | 'tokens'): string {
    switch (metric) {
      case 'count':
        return 'COUNT(*)';
      case 'cost':
        return "COALESCE(SUM(json_extract(cost_json, '$.total_cost_usd')), 0)";
      case 'tokens':
        // Sum all token types
        return `COALESCE(SUM(
          json_extract(tokens_json, '$.input_tokens') +
          json_extract(tokens_json, '$.output_tokens') +
          json_extract(tokens_json, '$.cache_read_input_tokens') +
          json_extract(tokens_json, '$.cache_creation_input_tokens')
        ), 0)`;
    }
  }

  /**
   * Get the database field name for the group_by option
   */
  private getGroupByField(groupBy: 'model' | 'event_type' | 'session'): string {
    switch (groupBy) {
      case 'model':
        return 'model';
      case 'event_type':
        return 'event_type';
      case 'session':
        return 'session_id';
    }
  }

  /**
   * Calculate the period end time based on period start and type
   */
  private calculatePeriodEnd(periodStart: string, period: 'hour' | 'day' | 'week' | 'month'): string {
    const date = new Date(periodStart);

    switch (period) {
      case 'hour':
        date.setUTCHours(date.getUTCHours() + 1);
        break;
      case 'day':
        date.setUTCDate(date.getUTCDate() + 1);
        break;
      case 'week':
        date.setUTCDate(date.getUTCDate() + 7);
        break;
      case 'month':
        date.setUTCMonth(date.getUTCMonth() + 1);
        break;
    }

    // Format without milliseconds to match expected format
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
  }
}
