# Feature: 05-server-sse - SSE Endpoint

## Context
Feature 04-server-basic is complete. The server handles static file serving.
- `.claude/hooks/viewer/server.ts` - Basic HTTP server with static serving
- `.claude/hooks/viewer/watcher.ts` - File watcher utility

## Objective
Add a Server-Sent Events (SSE) endpoint at `/events` that streams log entries to connected clients in real-time.

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- Use standard SSE format with `data:` and `event:` fields
- Send initial entries on connection
- Stream new entries as they arrive
- Send heartbeat every 30 seconds
- Clean up on client disconnect

## Files to Create/Modify
- `.claude/hooks/viewer/server.ts` - Add SSE endpoint to existing server

## Implementation Details

### SSE Response Format
```
event: entries
data: [{"timestamp":"...","event":"SessionStart",...},...]

event: entry
data: {"timestamp":"...","event":"PreToolUse",...}

event: heartbeat
data: {"timestamp":"2024-12-11T12:00:00.000Z"}
```

### Code Changes

Add imports at top of server.ts:
```typescript
import { LogFileWatcher } from "./watcher";
import { SSE_CONFIG } from "./config";
import type { LogEntry, SSEMessage } from "./types";
```

Add watcher instance (module-level):
```typescript
const watcher = new LogFileWatcher();
watcher.start();
```

Add SSE helper functions:
```typescript
/**
 * Format data as SSE message
 */
function formatSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
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
```

Add route in handleRequest():
```typescript
// Route: GET /events -> SSE stream
if (path === "/events" && request.method === "GET") {
  return handleSSE(request);
}
```

Update shutdown to stop watcher:
```typescript
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  watcher.stop();
  server.stop();
  process.exit(0);
});
```

## Acceptance Criteria
- [ ] GET /events returns SSE stream
- [ ] Content-Type is text/event-stream
- [ ] Initial "entries" event sent on connect with all existing entries
- [ ] New entries streamed as "entry" events
- [ ] Heartbeat sent every 30 seconds as "heartbeat" event
- [ ] Client disconnect triggers cleanup (interval cleared, unsubscribed)
- [ ] Watcher started on server start
- [ ] Watcher stopped on server shutdown

## Verification
```bash
# Start server and test SSE endpoint
cd .claude/hooks/viewer && timeout 5 bun run server.ts &
sleep 2
curl -N http://localhost:3456/events &
sleep 3
kill %1 %2 2>/dev/null || true
```

## Commit
After verification passes:
```bash
git add .claude/hooks/viewer/server.ts
git commit -m "feat(viewer): add SSE endpoint for real-time updates

- GET /events returns Server-Sent Events stream
- Sends initial entries on connection
- Streams new log entries as they arrive
- Heartbeat every 30 seconds to keep connection alive
- Proper cleanup on client disconnect"
```

## Next
Proceed to: `prompts/06-server-api.md`
