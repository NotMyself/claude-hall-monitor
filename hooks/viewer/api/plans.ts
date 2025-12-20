/**
 * Plans API handlers
 *
 * Implements: F021 - Plans API Endpoints
 *
 * Provides REST API endpoints for querying plan orchestration events.
 * All endpoints return JSON with CORS headers for localhost access.
 */

import type { Database } from '../../metrics/database';

/**
 * GET /api/plans/events - All plan events
 *
 * Returns all plan orchestration events ordered by timestamp (newest first).
 *
 * @param req - HTTP request object
 * @param db - Database instance
 * @returns JSON response with plan events array
 */
export async function handlePlanEvents(req: Request, db: Database): Promise<Response> {
  try {
    const events = db.queryPlanEvents();

    return new Response(JSON.stringify({ data: events }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'http://localhost:3456',
      },
    });
  } catch (error) {
    console.error('Error in handlePlanEvents:', error);
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
 * GET /api/plans/events/:plan - Events for specific plan
 *
 * Returns all events for a specific plan ordered by timestamp (newest first).
 *
 * @param req - HTTP request object
 * @param planName - Name of the plan to query
 * @param db - Database instance
 * @returns JSON response with plan events array
 */
export async function handlePlanEventsByPlan(req: Request, planName: string, db: Database): Promise<Response> {
  try {
    // Decode the plan name in case it's URL-encoded
    const decodedPlanName = decodeURIComponent(planName);

    const events = db.queryPlanEventsByPlan(decodedPlanName);

    return new Response(JSON.stringify({ data: events }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'http://localhost:3456',
      },
    });
  } catch (error) {
    console.error('Error in handlePlanEventsByPlan:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'http://localhost:3456',
      },
    });
  }
}
