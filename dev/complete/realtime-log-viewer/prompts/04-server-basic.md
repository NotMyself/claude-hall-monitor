# Feature: 04-server-basic - Basic HTTP Server

## Context
Features 01-03 are complete:
- `.claude/hooks/viewer/types.ts` - Type definitions
- `.claude/hooks/viewer/config.ts` - Configuration constants
- `.claude/hooks/viewer/watcher.ts` - File watcher utility

## Objective
Create a basic Bun HTTP server that serves static files (index.html and CSS).

**It is unacceptable to implement features beyond the scope of this task.**
**It is unacceptable to implement SSE or API endpoints** - those are separate features.

## Constraints
- Reference: See `constraints.md` for global rules
- Use Bun.serve() API
- Serve only static files in this feature
- Handle 404 for unknown routes
- Add graceful shutdown on SIGINT

## Files to Create/Modify
- `.claude/hooks/viewer/server.ts` - Replace placeholder with basic server

## Implementation Details

```typescript
import { SERVER_CONFIG, PATHS } from "./config";

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

  // TODO: SSE endpoint will be added in feature 05-server-sse
  // TODO: API endpoint will be added in feature 06-server-api

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
  server.stop();
  process.exit(0);
});
```

## Acceptance Criteria
- [ ] Server starts on port 3456
- [ ] GET / returns index.html with Content-Type: text/html
- [ ] GET /styles/theme.css serves CSS file
- [ ] Unknown routes return 404
- [ ] Missing files return 404
- [ ] SIGINT triggers graceful shutdown
- [ ] Console shows startup message with URL

## Verification
```bash
# Start server (will timeout after 3 seconds)
cd .claude/hooks/viewer && timeout 3 bun run server.ts || true

# Or manually test:
# Terminal 1: cd .claude/hooks/viewer && bun run server.ts
# Terminal 2: curl http://localhost:3456/
# Terminal 2: curl http://localhost:3456/styles/theme.css
# Terminal 2: curl http://localhost:3456/unknown -> 404
```

## Commit
After verification passes:
```bash
git add .claude/hooks/viewer/server.ts
git commit -m "feat(viewer): add basic HTTP server

- Bun.serve() on port 3456
- Serve index.html at root path
- Serve CSS from /styles/*
- 404 handling for unknown routes
- Graceful shutdown on SIGINT"
```

## Next
Proceed to: `prompts/05-server-sse.md`
