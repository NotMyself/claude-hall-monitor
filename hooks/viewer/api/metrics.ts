/**
 * Metrics API handlers
 *
 * Implements: F020 - Metrics API Endpoints
 *
 * Provides REST API endpoints for querying metrics, aggregations, and costs.
 * All endpoints return JSON with CORS headers for localhost access.
 */

import type { Database } from '../../metrics/database';
import { AggregationService } from '../../metrics/aggregation-service';
import type { QueryOptions, AggregationOptions } from '../../metrics/types';
import { join } from 'path';

/**
 * GET /api/metrics - Query metrics with filters from URL params
 *
 * Query Parameters:
 * - session_id: Filter by session ID
 * - event_type: Filter by event type
 * - event_category: Filter by category
 * - start_time: Filter by timestamp >= start_time (ISO 8601)
 * - end_time: Filter by timestamp <= end_time (ISO 8601)
 * - limit: Maximum number of results
 * - offset: Number of results to skip
 *
 * @param req - HTTP request object
 * @param db - Database instance
 * @returns JSON response with metrics array
 */
export async function handleMetricsQuery(req: Request, db: Database): Promise<Response> {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    const options: QueryOptions = {};

    if (params.has('session_id')) {
      options.session_id = params.get('session_id')!;
    }
    if (params.has('event_type')) {
      options.event_type = params.get('event_type')!;
    }
    if (params.has('event_category')) {
      options.event_category = params.get('event_category')!;
    }
    if (params.has('start_time')) {
      options.start_time = params.get('start_time')!;
    }
    if (params.has('end_time')) {
      options.end_time = params.get('end_time')!;
    }
    if (params.has('limit')) {
      options.limit = parseInt(params.get('limit')!, 10);
    }
    if (params.has('offset')) {
      options.offset = parseInt(params.get('offset')!, 10);
    }
    if (params.has('tags')) {
      options.tags = params.get('tags')!.split(',');
    }

    const metrics = db.query(options);

    return new Response(JSON.stringify({ data: metrics }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'http://localhost:3456',
      },
    });
  } catch (error) {
    console.error('Error in handleMetricsQuery:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'http://localhost:3456',
      },
    });
  }
}

/**
 * GET /api/metrics/aggregations - Time-window aggregations
 *
 * Query Parameters:
 * - period: Time period (hour/day/week/month) - REQUIRED
 * - start_time: Start of time range (ISO 8601) - REQUIRED
 * - end_time: End of time range (ISO 8601) - REQUIRED
 * - metric: Metric type (count/cost/tokens) - REQUIRED
 * - group_by: Group by field (model/event_type/session) - OPTIONAL
 *
 * @param req - HTTP request object
 * @param db - Database instance
 * @returns JSON response with aggregation results
 */
export async function handleMetricsAggregations(req: Request, db: Database): Promise<Response> {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    // Validate required parameters
    const period = params.get('period');
    const start_time = params.get('start_time');
    const end_time = params.get('end_time');
    const metric = params.get('metric');

    if (!period || !start_time || !end_time || !metric) {
      return new Response(JSON.stringify({
        error: 'Missing required parameters: period, start_time, end_time, metric'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'http://localhost:3456',
        },
      });
    }

    // Validate period
    if (!['hour', 'day', 'week', 'month'].includes(period)) {
      return new Response(JSON.stringify({
        error: 'Invalid period. Must be one of: hour, day, week, month'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'http://localhost:3456',
        },
      });
    }

    // Validate metric
    if (!['count', 'cost', 'tokens'].includes(metric)) {
      return new Response(JSON.stringify({
        error: 'Invalid metric. Must be one of: count, cost, tokens'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'http://localhost:3456',
        },
      });
    }

    const options: AggregationOptions = {
      period: period as 'hour' | 'day' | 'week' | 'month',
      start_time,
      end_time,
      metric: metric as 'count' | 'cost' | 'tokens',
    };

    // Optional group_by parameter
    if (params.has('group_by')) {
      const group_by = params.get('group_by')!;
      if (!['model', 'event_type', 'session'].includes(group_by)) {
        return new Response(JSON.stringify({
          error: 'Invalid group_by. Must be one of: model, event_type, session'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'http://localhost:3456',
          },
        });
      }
      options.group_by = group_by as 'model' | 'event_type' | 'session';
    }

    const aggregationService = new AggregationService(db);
    const results = aggregationService.aggregate(options);

    return new Response(JSON.stringify({ data: results }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'http://localhost:3456',
      },
    });
  } catch (error) {
    console.error('Error in handleMetricsAggregations:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'http://localhost:3456',
      },
    });
  }
}

/**
 * GET /api/metrics/costs - Cost analysis
 *
 * Returns total costs grouped by model. Aggregates all cost data from metrics
 * where cost information is available.
 *
 * @param req - HTTP request object
 * @param db - Database instance
 * @returns JSON response with cost breakdown by model
 */
export async function handleMetricsCosts(req: Request, db: Database): Promise<Response> {
  try {
    // Query metrics with cost data
    const metrics = db.query({});

    // Aggregate costs by model
    const costsByModel = new Map<string, number>();
    let totalCost = 0;

    for (const metric of metrics) {
      if (metric.cost && metric.model) {
        const currentCost = costsByModel.get(metric.model) || 0;
        costsByModel.set(metric.model, currentCost + metric.cost.total_cost_usd);
        totalCost += metric.cost.total_cost_usd;
      }
    }

    // Convert Map to array of objects
    const data = Array.from(costsByModel.entries()).map(([model, cost]) => ({
      model,
      total_cost_usd: cost,
    }));

    // Sort by cost descending
    data.sort((a, b) => b.total_cost_usd - a.total_cost_usd);

    return new Response(JSON.stringify({
      data,
      total_cost_usd: totalCost,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'http://localhost:3456',
      },
    });
  } catch (error) {
    console.error('Error in handleMetricsCosts:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'http://localhost:3456',
      },
    });
  }
}

/**
 * POST /api/metrics/export - Trigger export to JSONL file
 *
 * Request Body:
 * - start_time: Start of time range (ISO 8601) - OPTIONAL
 * - end_time: End of time range (ISO 8601) - OPTIONAL
 * - format: Export format (currently only 'jsonl' supported) - OPTIONAL
 *
 * Exports metrics to a JSONL file in the metrics archive directory.
 * Returns the path to the generated file.
 *
 * @param req - HTTP request object
 * @param db - Database instance
 * @returns JSON response with export file path
 */
export async function handleMetricsExport(req: Request, db: Database): Promise<Response> {
  try {
    const body = await req.json();
    const { start_time, end_time, format = 'jsonl' } = body;

    // Validate format
    if (format !== 'jsonl') {
      return new Response(JSON.stringify({
        error: 'Unsupported format. Only "jsonl" is currently supported.'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'http://localhost:3456',
        },
      });
    }

    // Build query options
    const options: QueryOptions = {};
    if (start_time) {
      options.start_time = start_time;
    }
    if (end_time) {
      options.end_time = end_time;
    }

    // Query metrics
    const metrics = db.query(options);

    // Generate export filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `metrics-export-${timestamp}.jsonl`;
    const filepath = join(process.cwd(), 'hooks', 'metrics', 'exports', filename);

    // Create exports directory if it doesn't exist
    const { mkdirSync, writeFileSync } = await import('fs');
    const { dirname } = await import('path');
    mkdirSync(dirname(filepath), { recursive: true });

    // Write JSONL file (one JSON object per line)
    const lines = metrics.map(metric => JSON.stringify(metric));
    writeFileSync(filepath, lines.join('\n'));

    return new Response(JSON.stringify({
      message: 'Export completed successfully',
      filepath,
      count: metrics.length,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'http://localhost:3456',
      },
    });
  } catch (error) {
    console.error('Error in handleMetricsExport:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'http://localhost:3456',
      },
    });
  }
}
