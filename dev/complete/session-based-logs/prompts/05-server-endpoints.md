# Feature: F05 - Server API Endpoints

## Context
Watcher now supports session switching and listing.

## Objective
Add /api/sessions endpoint and session filtering to existing endpoints.

## Constraints
- Reference: See constraints.md
- Read current session from CURRENT_SESSION_ENV on startup
- Default to current session when no filter provided

## Files to Modify
- `.claude/hooks/viewer/server.ts`

## Implementation Details

Add imports:
```typescript
import { CURRENT_SESSION_ENV } from "./config";
import type { SessionListResponse } from "./types";
```

Add at module scope:
```typescript
const currentSessionId = process.env[CURRENT_SESSION_ENV] || null;

// Initialize watcher with current session if available
if (currentSessionId) {
  watcher.setSession(currentSessionId);
}
```

Add new route handler:
```typescript
function handleSessionsList(): Response {
  const sessions = LogFileWatcher.listSessions();
  const response: SessionListResponse = {
    sessions,
    current_session: currentSessionId,
  };
  return Response.json(response);
}
```

Update router to handle /api/sessions:
```typescript
if (path === "/api/sessions") {
  return handleSessionsList();
}
```

Update /api/entries handler:
```typescript
if (path === "/api/entries") {
  const session = url.searchParams.get("session") || currentSessionId;
  if (session && session !== watcher.getCurrentSessionId()) {
    watcher.setSession(session);
  }
  const entries = await watcher.getAllEntries();
  return Response.json(entries);
}
```

Update /events SSE handler:
```typescript
if (path === "/events") {
  const session = url.searchParams.get("session") || currentSessionId;
  if (session && session !== watcher.getCurrentSessionId()) {
    watcher.setSession(session);
  }
  return handleSSE();
}
```

## Acceptance Criteria
- [ ] GET /api/sessions returns {sessions, current_session}
- [ ] GET /api/entries?session=id filters correctly
- [ ] GET /events?session=id streams correct session
- [ ] Defaults to env-specified current session
- [ ] CURRENT_SESSION_ENV imported from config

## Verification
```bash
curl http://localhost:3456/api/sessions
```

## Commit
```bash
git add .claude/hooks/viewer/server.ts
git commit -m "feat(hooks): add session API endpoints and filtering"
```

## Next
Proceed to: prompts/06-frontend-selector.md
