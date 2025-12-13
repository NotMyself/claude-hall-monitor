# Feature: F007 - Shutdown Endpoint Authentication

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000-F006**: Previous security fixes completed including security utilities

## Objective

Add authentication to the `/shutdown` endpoint to prevent unauthorized remote shutdown of the viewer server.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D002**: Simple token authentication (not OAuth). Token generated on startup and printed to console.

## Edge Cases to Handle

From `edge-cases.md`:
- **EC012**: Auth token in browser URL - use Authorization header, not URL parameter

## Code References

Read these sections before implementing:
- `code/typescript.md#authentication` - Token generation and verification

## Constraints

- See `constraints.md` for global rules
- Generate token at startup using crypto.randomBytes
- Print token to console for hook handlers to use
- Accept token via Authorization: Bearer header

## Files to Modify

| File | Changes |
|------|---------|
| `.claude/hooks/viewer/security.ts` | Add generateAuthToken() and verifyAuthToken() functions |
| `.claude/hooks/viewer/server.ts` | Generate token on startup, require auth for /shutdown |

## Implementation Details

### 1. Add auth functions to security.ts

```typescript
import { randomBytes } from "node:crypto";

/**
 * Generate a secure random token for authentication.
 */
export function generateAuthToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Verify an authorization header matches the expected token.
 */
export function verifyAuthToken(
  header: string | null,
  expectedToken: string
): boolean {
  if (!header) return false;
  const token = header.replace(/^Bearer\s+/i, "");
  return token === expectedToken;
}
```

### 2. Update server.ts

At the top of the file, after imports:

```typescript
import { generateAuthToken, verifyAuthToken, /* ... other imports */ } from "./security";

// Generate auth token on startup
const AUTH_TOKEN = generateAuthToken();
```

Near the server startup message, print the token:

```typescript
console.log(`🔍 Hook Viewer running at ${SERVER_CONFIG.URL}`);
console.log(`🔑 Shutdown token: ${AUTH_TOKEN}`);
```

Update the `/shutdown` route handler:

```typescript
// Before
if (path === "/shutdown" && request.method === "POST") {
  console.log("\n🛑 Shutdown requested via API");
  // ... shutdown logic
}

// After
if (path === "/shutdown" && request.method === "POST") {
  // Verify authentication
  const authHeader = request.headers.get("Authorization");
  if (!verifyAuthToken(authHeader, AUTH_TOKEN)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": "Bearer",
      },
    });
  }

  console.log("\n🛑 Shutdown requested via API");
  // ... rest of shutdown logic unchanged
}
```

### 3. Update session-end.ts handler

The session-end handler calls /shutdown. Update it to use the token from environment:

```typescript
// In .claude/hooks/handlers/session-end.ts
// Add token to shutdown request:

const token = process.env.CLAUDE_HOOKS_VIEWER_TOKEN;
await fetch(`${VIEWER_URL}/shutdown`, {
  method: "POST",
  headers: token ? { "Authorization": `Bearer ${token}` } : {},
});
```

Also update server.ts to set the environment variable when starting:

```typescript
// In session-start.ts, add to spawn env:
env: {
  ...process.env,
  [CURRENT_SESSION_ENV]: session_id,
  CLAUDE_HOOKS_VIEWER_TOKEN: AUTH_TOKEN,  // Add this
},
```

Wait - the session-start handler doesn't have access to AUTH_TOKEN.

Alternative approach: Have the server export the token to a file that handlers can read, or use a predictable token from environment.

Simpler approach for this single-user dev tool: Check for an environment variable first, and if not set, generate one.

```typescript
// In server.ts
const AUTH_TOKEN = process.env.CLAUDE_HOOKS_VIEWER_TOKEN || generateAuthToken();
```

## Acceptance Criteria

- [ ] `/shutdown` without auth returns 401 Unauthorized
- [ ] `/shutdown` with wrong token returns 401
- [ ] `/shutdown` with correct token works
- [ ] Token is printed to console on startup
- [ ] WWW-Authenticate header is set on 401 response
- [ ] TypeScript compiles without errors

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit

```bash
git add .claude/hooks/viewer/security.ts .claude/hooks/viewer/server.ts
git commit -m "$(cat <<'EOF'
feat(viewer): add authentication to /shutdown endpoint

Generate random token on startup and require it for shutdown.
Token is printed to console and can be set via env var.

Implements: F007
Decisions: D002
Edge cases: EC012

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/08-csp-headers.md` (F008)
