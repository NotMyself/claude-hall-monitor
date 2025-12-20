/**
 * Sessions API handlers
 *
 * Implements: F022 - Sessions API Endpoints
 *
 * Provides REST API endpoints for querying session information and metrics.
 * All endpoints return JSON with CORS headers for localhost access.
 */

import type { Database } from '../../metrics/database';

/**
 * Session summary interface
 */
interface SessionSummary {
  session_id: string;
  start_time: string;
  end_time?: string;
  total_cost_usd: number;
  tool_calls: number;
  api_calls: number;
  total_tokens: number;
  models_used: string[];
}

/**
 * GET /api/sessions - List all sessions with summary
 *
 * Returns a summary of all sessions including start/end times, costs, and counts.
 *
 * @param req - HTTP request object
 * @param db - Database instance
 * @returns JSON response with session summaries
 */
export async function handleSessionsList(req: Request, db: Database): Promise<Response> {
  try {
    // Get all metrics
    const allMetrics = db.query({});

    // Group by session_id
    const sessionMap = new Map<string, SessionSummary>();

    for (const metric of allMetrics) {
      let summary = sessionMap.get(metric.session_id);

      if (!summary) {
        summary = {
          session_id: metric.session_id,
          start_time: metric.timestamp,
          end_time: undefined,
          total_cost_usd: 0,
          tool_calls: 0,
          api_calls: 0,
          total_tokens: 0,
          models_used: [],
        };
        sessionMap.set(metric.session_id, summary);
      }

      // Update start_time if this metric is earlier
      if (metric.timestamp < summary.start_time) {
        summary.start_time = metric.timestamp;
      }

      // Update end_time if this metric is later
      if (!summary.end_time || metric.timestamp > summary.end_time) {
        summary.end_time = metric.timestamp;
      }

      // Accumulate costs
      if (metric.cost) {
        summary.total_cost_usd += metric.cost.total_cost_usd;
      }

      // Count tool and API calls
      if (metric.event_category === 'tool') {
        summary.tool_calls++;
      } else if (metric.event_category === 'api') {
        summary.api_calls++;
      }

      // Accumulate tokens
      if (metric.tokens) {
        summary.total_tokens +=
          metric.tokens.input_tokens +
          metric.tokens.output_tokens +
          metric.tokens.cache_read_input_tokens +
          metric.tokens.cache_creation_input_tokens;
      }

      // Track unique models
      if (metric.model && !summary.models_used.includes(metric.model)) {
        summary.models_used.push(metric.model);
      }
    }

    // Convert map to array and sort by start_time (newest first)
    const sessions = Array.from(sessionMap.values()).sort((a, b) => {
      return b.start_time.localeCompare(a.start_time);
    });

    return new Response(JSON.stringify({ data: sessions }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'http://localhost:3456',
      },
    });
  } catch (error) {
    console.error('Error in handleSessionsList:', error);
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
 * GET /api/sessions/:id - Session details with full metrics
 *
 * Returns detailed information about a specific session including all metrics.
 *
 * @param req - HTTP request object
 * @param sessionId - The session ID to query
 * @param db - Database instance
 * @returns JSON response with session details
 */
export async function handleSessionDetails(req: Request, sessionId: string, db: Database): Promise<Response> {
  try {
    // Decode the session ID in case it's URL-encoded
    const decodedSessionId = decodeURIComponent(sessionId);

    // Query metrics for this session
    const metrics = db.query({ session_id: decodedSessionId });

    if (metrics.length === 0) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'http://localhost:3456',
        },
      });
    }

    // Calculate session summary
    const summary: SessionSummary = {
      session_id: decodedSessionId,
      start_time: metrics[metrics.length - 1].timestamp, // Last in DESC order
      end_time: metrics[0].timestamp, // First in DESC order
      total_cost_usd: 0,
      tool_calls: 0,
      api_calls: 0,
      total_tokens: 0,
      models_used: [],
    };

    for (const metric of metrics) {
      if (metric.cost) {
        summary.total_cost_usd += metric.cost.total_cost_usd;
      }

      if (metric.event_category === 'tool') {
        summary.tool_calls++;
      } else if (metric.event_category === 'api') {
        summary.api_calls++;
      }

      if (metric.tokens) {
        summary.total_tokens +=
          metric.tokens.input_tokens +
          metric.tokens.output_tokens +
          metric.tokens.cache_read_input_tokens +
          metric.tokens.cache_creation_input_tokens;
      }

      if (metric.model && !summary.models_used.includes(metric.model)) {
        summary.models_used.push(metric.model);
      }
    }

    return new Response(JSON.stringify({
      summary,
      metrics,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'http://localhost:3456',
      },
    });
  } catch (error) {
    console.error('Error in handleSessionDetails:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'http://localhost:3456',
      },
    });
  }
}
