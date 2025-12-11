# Feature: 06-server-api - REST API Endpoint

## Context
Feature 05-server-sse is complete. The server has static serving and SSE streaming.
- `.claude/hooks/viewer/server.ts` - HTTP server with static files and SSE

## Objective
Add a REST API endpoint at `/api/entries` that returns all log entries as JSON.

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- Return JSON array of all entries
- Handle empty log file (return empty array)
- Set proper Content-Type header

## Files to Create/Modify
- `.claude/hooks/viewer/server.ts` - Add API endpoint to existing server

## Implementation Details

Add route in handleRequest() function, before the 404 fallback:

```typescript
// Route: GET /api/entries -> JSON array of all entries
if (path === "/api/entries" && request.method === "GET") {
  const entries = watcher.getAllEntries();
  return new Response(JSON.stringify(entries), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
```

### Full Route Order
The handleRequest function should now have routes in this order:
1. `GET /` -> index.html
2. `GET /styles/*` -> static CSS
3. `GET /events` -> SSE stream
4. `GET /api/entries` -> JSON API
5. Default -> 404

## Acceptance Criteria
- [ ] GET /api/entries returns JSON array
- [ ] Content-Type is application/json
- [ ] Returns all log entries from watcher.getAllEntries()
- [ ] Empty log file returns `[]` (empty array)
- [ ] CORS header allows any origin

## Verification
```bash
# Start server and test API endpoint
cd .claude/hooks/viewer && timeout 3 bun run server.ts &
sleep 1
curl -s http://localhost:3456/api/entries | head -c 200
kill %1 2>/dev/null || true
```

## Commit
After verification passes:
```bash
git add .claude/hooks/viewer/server.ts
git commit -m "feat(viewer): add REST API endpoint

- GET /api/entries returns all log entries as JSON
- CORS enabled for cross-origin requests
- Returns empty array if no entries exist"
```

## Next
Proceed to: `prompts/07-theme-css.md`
