import { SERVER_CONFIG, PATHS, SSE_CONFIG, CURRENT_SESSION_ENV, TIMING } from "./config";
import { LogFileWatcher } from "./watcher";
import { PlanWatcher } from "./plan-watcher";
import type { LogEntry, SSEMessage, SessionListResponse, PlanListResponse, PlanUpdateMessage } from "./types";
import { DashboardService } from "./dashboard";
import { SessionSummaryService } from "./session-summary";

/**
 * MIME types for static files
 */
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};

/**
 * File watcher instance
 */
const watcher = new LogFileWatcher();
watcher.start();

/**
 * Dashboard service instance
 */
const dashboardService = new DashboardService();

/**
 * Plan watcher instance
 */
const planWatcher = new PlanWatcher();
planWatcher.start();

/**
 * Session summary service instance
 */
const sessionSummaryService = new SessionSummaryService();

const currentSessionId = process.env[CURRENT_SESSION_ENV] || null;

// Initialize watcher with current session if available
if (currentSessionId) {
  watcher.setSession(currentSessionId);
}

/**
 * Get MIME type from file extension
 */
function getMimeType(path: string): string {
  const ext = path.substring(path.lastIndexOf("."));
  return MIME_TYPES[ext] || "application/octet-stream";
}

/**
 * Serve a static file
 */
async function serveFile(path: string): Promise<Response> {
  const file = Bun.file(path);

  if (!(await file.exists())) {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(file, {
    headers: { "Content-Type": getMimeType(path) },
  });
}

/**
 * Format data as SSE message
 */
function formatSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Handle sessions list request
 */
async function handleSessionsList(): Promise<Response> {
  const sessions = await LogFileWatcher.listSessions();
  const response: SessionListResponse = {
    sessions,
    current_session: currentSessionId,
  };
  return Response.json(response);
}

/**
 * Handle SSE connection
 */
function handleSSE(request: Request): Response {
  const encoder = new TextEncoder();
  let heartbeatInterval: Timer | null = null;
  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial entries
      const entries = watcher.getAllEntries();
      controller.enqueue(encoder.encode(formatSSE("entries", entries)));

      // Subscribe to new entries
      unsubscribe = watcher.subscribe((entry: LogEntry) => {
        try {
          controller.enqueue(encoder.encode(formatSSE("entry", entry)));
        } catch {
          // Client disconnected
        }
      });

      // Start heartbeat
      heartbeatInterval = setInterval(() => {
        try {
          const heartbeat: SSEMessage = {
            type: "heartbeat",
            timestamp: new Date().toISOString(),
          };
          controller.enqueue(encoder.encode(formatSSE("heartbeat", heartbeat)));
        } catch {
          // Client disconnected
        }
      }, SSE_CONFIG.HEARTBEAT_INTERVAL);
    },

    cancel() {
      // Cleanup on disconnect
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (unsubscribe) unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/**
 * Handle SSE connection for plan updates
 */
function handlePlanSSE(): Response {
  const encoder = new TextEncoder();
  let heartbeatInterval: Timer | null = null;
  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial plans
      const plans = planWatcher.getAllPlans();
      controller.enqueue(encoder.encode(formatSSE("plans", plans)));

      // Subscribe to updates
      unsubscribe = planWatcher.subscribe((plan) => {
        try {
          const message: PlanUpdateMessage = {
            type: "plan_updated",
            plan,
            timestamp: new Date().toISOString(),
          };
          controller.enqueue(encoder.encode(formatSSE("plan_update", message)));
        } catch {
          // Client disconnected
        }
      });

      // Start heartbeat
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(formatSSE("heartbeat", { timestamp: new Date().toISOString() }))
          );
        } catch {
          // Client disconnected
        }
      }, SSE_CONFIG.HEARTBEAT_INTERVAL);
    },

    cancel() {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (unsubscribe) unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/**
 * Main request handler
 */
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Route: GET / -> index.html
  if (path === "/" && request.method === "GET") {
    return serveFile(PATHS.INDEX_HTML);
  }

  // Route: GET /styles/* -> static CSS files
  if (path.startsWith("/styles/") && request.method === "GET") {
    const filePath = `${PATHS.STYLES_DIR}${path.replace("/styles", "")}`;
    return serveFile(filePath);
  }

  // Route: GET /logo.svg -> logo image
  if (path === "/logo.svg" && request.method === "GET") {
    return serveFile(PATHS.LOGO_SVG);
  }

  // Route: GET /events -> SSE stream
  if (path === "/events" && request.method === "GET") {
    const session = url.searchParams.get("session") || currentSessionId;
    if (session && session !== watcher.getCurrentSessionId()) {
      watcher.setSession(session);
    }
    return handleSSE(request);
  }

  // Route: GET /api/sessions -> JSON list of sessions
  if (path === "/api/sessions" && request.method === "GET") {
    return await handleSessionsList();
  }

  // Route: GET /api/entries -> JSON array of all entries
  if (path === "/api/entries" && request.method === "GET") {
    const session = url.searchParams.get("session") || currentSessionId;
    if (session && session !== watcher.getCurrentSessionId()) {
      watcher.setSession(session);
    }
    const entries = watcher.getAllEntries();
    return new Response(JSON.stringify(entries), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Route: GET /api/dashboard -> Dashboard data
  if (path === "/api/dashboard" && request.method === "GET") {
    try {
      const data = await dashboardService.getData();
      return Response.json(data);
    } catch (error) {
      console.error("Dashboard error:", error);
      return Response.json(
        { error: "Failed to load dashboard data" },
        { status: 500 }
      );
    }
  }

  // Route: GET /api/summaries -> Claude Code session summaries
  if (path === "/api/summaries" && request.method === "GET") {
    try {
      const project = url.searchParams.get("project") || undefined;
      const data = await sessionSummaryService.getSummaries(project);
      return Response.json(data);
    } catch (error) {
      console.error("Session summaries error:", error);
      return Response.json(
        { error: "Failed to load session summaries" },
        { status: 500 }
      );
    }
  }

  // Route: POST /shutdown -> Gracefully shut down the server
  if (path === "/shutdown" && request.method === "POST") {
    console.log("\n🛑 Shutdown requested via API");
    // Respond before shutting down
    setTimeout(() => {
      watcher.stop();
      planWatcher.stop();
      server.stop();
      process.exit(0);
    }, TIMING.SHUTDOWN_DELAY_MS);
    return new Response(JSON.stringify({ status: "shutting_down" }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Route: GET /api/plans -> List all plans
  if (path === "/api/plans" && request.method === "GET") {
    const includeCompleted = url.searchParams.get("completed") !== "false";
    const plans = planWatcher.getAllPlans(includeCompleted);
    const response: PlanListResponse = {
      plans,
      activePlans: plans.filter((p) => p.status === "active").length,
      completedPlans: plans.filter((p) => p.status === "completed").length,
    };
    return Response.json(response);
  }

  // Route: GET /api/plans/:name -> Get specific plan data
  if (path.startsWith("/api/plans/") && request.method === "GET") {
    const name = path.replace("/api/plans/", "");
    const plan = planWatcher.getPlan(name);
    if (!plan) {
      return Response.json({ error: "Plan not found" }, { status: 404 });
    }
    return Response.json(plan);
  }

  // Route: GET /events/plans -> SSE stream for plan updates
  if (path === "/events/plans" && request.method === "GET") {
    return handlePlanSSE();
  }

  // 404 for unknown routes
  return new Response("Not Found", { status: 404 });
}

/**
 * Start the HTTP server
 */
const server = Bun.serve({
  port: SERVER_CONFIG.PORT,
  hostname: SERVER_CONFIG.HOST,
  fetch: handleRequest,
  idleTimeout: 0, // Disable timeout for SSE connections
});

console.log(`🔍 Hook Viewer running at ${SERVER_CONFIG.URL}`);

/**
 * Graceful shutdown
 */
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  watcher.stop();
  planWatcher.stop();
  server.stop();
  process.exit(0);
});
