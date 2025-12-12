# Feature: api-endpoint - Dashboard API Endpoint

## Context

The `DashboardService` class is complete. The server in `viewer/server.ts` handles HTTP requests with a `handleRequest()` function that routes to different endpoints based on path.

## Objective

Add a `/api/dashboard` GET endpoint to the server that returns dashboard data.

**IMPORTANT**: Only implement this feature. Do not implement any other features.

## Constraints

Reference: See `constraints.md` for global rules.

- Add to existing `viewer/server.ts` file
- Follow existing endpoint patterns
- Handle errors gracefully

## Files to Modify

- `.claude/hooks/viewer/server.ts` - Add dashboard endpoint

## Implementation Details

### Add import at top

```typescript
import { DashboardService } from "./dashboard";
```

### Create service instance

Add near other initialization (after imports, before `handleRequest`):

```typescript
const dashboardService = new DashboardService();
```

### Add route in handleRequest

Add this route handler in the `handleRequest` function, following the pattern of existing routes:

```typescript
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
```

Place this route near the other `/api/*` routes (like `/api/sessions`, `/api/entries`).

## Acceptance Criteria

- [ ] `DashboardService` imported from `./dashboard`
- [ ] `dashboardService` instance created
- [ ] `GET /api/dashboard` route added to `handleRequest`
- [ ] Route returns JSON from `dashboardService.getData()`
- [ ] Errors return 500 status with error message
- [ ] Route follows existing patterns in the file
- [ ] Type check passes with no errors

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit
```

Additional manual verification (start server and test endpoint):

```bash
# Terminal 1: Start server
cd .claude/hooks && bun run viewer/server.ts

# Terminal 2: Test endpoint
curl http://localhost:3456/api/dashboard
```

## Commit

```bash
git add .claude/hooks/viewer/server.ts
git commit -m "feat(dashboard): add /api/dashboard endpoint"
```

## Next

Proceed to: `prompts/07-dashboard-styles.md` (can run in parallel with 08-dashboard-component)
