# Feature: F006 - Session ID Validation

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000**: Project initialization verified
- **F001**: Security utilities module created with `validateSessionId()`
- **F002-F005**: Previous security fixes completed

## Objective

Fix the session ID injection vulnerability that allows attackers to access files outside the logs directory via malicious session parameter.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D006**: Session ID format is alphanumeric with hyphens, max 64 chars

## Edge Cases to Handle

From `edge-cases.md`:
- **EC003**: Very long session IDs (>64 chars) - reject
- **EC007**: Empty or whitespace-only inputs - treat as invalid

## Code References

Read these sections before implementing:
- `code/typescript.md#security-utilities` - `validateSessionId()` function

## Constraints

- See `constraints.md` for global rules
- Invalid session IDs should fall back to current session, not error
- Maintain existing behavior for valid session switching

## Files to Modify

| File | Changes |
|------|---------|
| `.claude/hooks/viewer/server.ts` | Add session ID validation to /events and /api/entries routes |

## Implementation Details

Import validateSessionId at the top of server.ts (add to existing import):

```typescript
import {
  sanitizePathComponent,
  validatePathWithinBase,
  validatePlanName,
  validateSessionId,
  getLocalhostOrigin
} from "./security";
```

Update the `/events` route handler (around line 224-229):

```typescript
// Before
if (path === "/events" && request.method === "GET") {
  const session = url.searchParams.get("session") || currentSessionId;
  if (session && session !== watcher.getCurrentSessionId()) {
    watcher.setSession(session);
  }
  return handleSSE(request);
}

// After
if (path === "/events" && request.method === "GET") {
  const rawSession = url.searchParams.get("session");
  const session = validateSessionId(rawSession) || currentSessionId;
  if (session && session !== watcher.getCurrentSessionId()) {
    watcher.setSession(session);
  }
  return handleSSE(request);
}
```

Update the `/api/entries` route handler (around line 238-249):

```typescript
// Before
if (path === "/api/entries" && request.method === "GET") {
  const session = url.searchParams.get("session") || currentSessionId;
  if (session && session !== watcher.getCurrentSessionId()) {
    watcher.setSession(session);
  }
  // ... rest of handler
}

// After
if (path === "/api/entries" && request.method === "GET") {
  const rawSession = url.searchParams.get("session");
  const session = validateSessionId(rawSession) || currentSessionId;
  if (session && session !== watcher.getCurrentSessionId()) {
    watcher.setSession(session);
  }
  // ... rest of handler
}
```

## Acceptance Criteria

- [ ] `/events?session=valid-id-123` works (valid session)
- [ ] `/events?session=../etc/passwd` uses current session (invalid rejected)
- [ ] `/events?session=a`.repeat(100) uses current session (too long)
- [ ] `/api/entries?session=valid-id` works (valid session)
- [ ] `/api/entries?session=<script>` uses current session (special chars rejected)
- [ ] TypeScript compiles without errors

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit

```bash
git add .claude/hooks/viewer/server.ts
git commit -m "$(cat <<'EOF'
fix(viewer): add session ID validation

Validate session IDs to alphanumeric + hyphens, max 64 chars.
Invalid sessions fall back to current session instead of erroring.

Implements: F006
Decisions: D006
Edge cases: EC003, EC007

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/07-shutdown-auth.md` (F007)
