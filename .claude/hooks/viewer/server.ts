import { SERVER_CONFIG, PATHS, SSE_CONFIG, CURRENT_SESSION_ENV } from "./config";
import { LogFileWatcher } from "./watcher";
import type { LogEntry, SSEMessage, SessionListResponse } from "./types";

/**
 * MIME types for static files
 */
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
};

/**
 * File watcher instance
 */
const watcher = new LogFileWatcher();
watcher.start();

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
function handleSessionsList(): Response {
  const sessions = LogFileWatcher.listSessions();
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
    return handleSessionsList();
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
});

console.log(`🔍 Hook Viewer running at ${SERVER_CONFIG.URL}`);

/**
 * Graceful shutdown
 */
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  watcher.stop();
  server.stop();
  process.exit(0);
});
