# Feature: api-endpoints - Plan Tracker API Endpoints

## Context

The server in `.claude/hooks/viewer/server.ts` has endpoints for sessions, logs, and dashboard. We need to add plan-related endpoints.

## Objective

Add `/api/plans` endpoints and SSE support for plan updates to the server.

## Constraints

- Reference: See constraints.md for global rules
- Follow existing endpoint patterns
- Use existing SSE pattern from `/events`
- Handle errors gracefully

## Files to Create/Modify

- `.claude/hooks/viewer/server.ts` - Add plan endpoints

## Implementation Details

1. Import the PlanWatcher:

```typescript
import { PlanWatcher } from "./plan-watcher";
```

2. Create watcher instance near the top:

```typescript
const planWatcher = new PlanWatcher();
planWatcher.start();
```

3. Add helper for SSE formatting (reuse existing formatSSE function).

4. Add these route handlers in `handleRequest`:

```typescript
// Route: GET /api/plans -> List all plans
if (path === "/api/plans" && request.method === "GET") {
  const includeCompleted = url.searchParams.get("completed") !== "false";
  const plans = planWatcher.getAllPlans(includeCompleted);
  const response: PlanListResponse = {
    plans,
    activePlans: plans.filter(p => p.status === "active").length,
    completedPlans: plans.filter(p => p.status === "completed").length,
  };
  return Response.json(response);
}

// Route: GET /api/plans/:name -> Get specific plan
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
  return handlePlanSSE(request);
}
```

5. Add SSE handler function:

```typescript
function handlePlanSSE(request: Request): Response {
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
```

6. Update shutdown handler to stop plan watcher:

```typescript
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  watcher.stop();
  planWatcher.stop();  // Add this
  server.stop();
  process.exit(0);
});
```

## Acceptance Criteria

- [ ] GET /api/plans returns list of all plans
- [ ] GET /api/plans?completed=false filters to active only
- [ ] GET /api/plans/:name returns full plan data
- [ ] GET /api/plans/:name returns 404 for missing plan
- [ ] GET /events/plans provides SSE stream
- [ ] SSE emits plan_update events on changes
- [ ] planWatcher stopped on shutdown
- [ ] Type check passes

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit

```bash
git add .claude/hooks/viewer/server.ts
git commit -m "feat(plan-tracker): add API endpoints for plans"
```

## Next

Proceed to: `05-plan-styles.md`
