# Architecture Review Remediation

## Summary

Address all 18 security and quality issues identified in `docs/architecture/review.md`. The review found 6 critical security vulnerabilities (P0), 4 high-priority issues (P1), 3 medium-priority gaps (P2), and 2 low-priority improvements (P3) in the Claude Code hooks viewer implementation.

## Requirements

- Fix all path traversal vulnerabilities in `/styles/` and `/api/plans/` endpoints
- Validate session IDs to prevent injection attacks
- Bind server to localhost only (not 0.0.0.0)
- Restrict CORS to localhost origin
- Add authentication to destructive endpoints
- Fix XSS risk via v-html
- Add error handling to unhandled promises and handlers
- Implement rate limiting for SSE connections
- Add input validation for hook inputs
- Improve test coverage with security and execution tests
- Pin @types/bun to specific version

## Implementation Approach

Four sequential phases, each building on the previous. Security utilities created first to support all subsequent fixes.

---

## Phase 1: Critical Security (P0)

### 1.1 Create security utility module

**New file:** `.claude/hooks/viewer/security.ts`

```typescript
export function validateSessionId(id: string | null): string | null
export function sanitizePathComponent(component: string): string | null
export function validatePathWithinBase(path: string, base: string): string | null
export function getLocalhostOrigin(port: number): string
```

### 1.2 Fix path traversal in /styles/ endpoint

**File:** `.claude/hooks/viewer/server.ts:213-216`

```typescript
// Before
const filePath = `${PATHS.STYLES_DIR}${path.replace("/styles", "")}`;

// After
const requestedFile = path.replace("/styles/", "");
const sanitizedFile = sanitizePathComponent(requestedFile);
if (!sanitizedFile) return new Response("Bad Request", { status: 400 });
const filePath = validatePathWithinBase(sanitizedFile, PATHS.STYLES_DIR);
if (!filePath) return new Response("Forbidden", { status: 403 });
```

### 1.3 Fix path traversal in /api/plans/:name

**File:** `.claude/hooks/viewer/server.ts:312-314`

```typescript
// Before
const name = path.replace("/api/plans/", "");

// After
const name = path.replace("/api/plans/", "");
const sanitizedName = sanitizePathComponent(name);
if (!sanitizedName) return Response.json({ error: "Invalid plan name" }, { status: 400 });
```

### 1.4 Fix session ID injection

**File:** `.claude/hooks/viewer/server.ts:225, 239`

```typescript
// Before
const session = url.searchParams.get("session") || currentSessionId;

// After
const rawSession = url.searchParams.get("session");
const session = validateSessionId(rawSession) || currentSessionId;
```

### 1.5 Bind to localhost only

**File:** `.claude/hooks/viewer/config.ts:11`

```typescript
// Before
HOST: "0.0.0.0",

// After
HOST: process.env.HOOK_VIEWER_HOST || "127.0.0.1",
```

### 1.6 Restrict CORS to localhost

**File:** `.claude/hooks/viewer/server.ts` (lines 139, 195, 247, 294)

```typescript
// Before
"Access-Control-Allow-Origin": "*",

// After
"Access-Control-Allow-Origin": `http://localhost:${SERVER_CONFIG.PORT}`,
```

### 1.7 Add authentication to /shutdown

**File:** `.claude/hooks/viewer/server.ts:282`

Add token validation before processing shutdown request. Token generated on startup and printed to console.

---

## Phase 2: High Priority (P1)

### 2.1 Add CSP header for XSS protection

**File:** `.claude/hooks/viewer/server.ts` - `serveFile()` function

Add Content-Security-Policy header for HTML files to restrict script sources.

### 2.2 Fix unhandled promise in watcher

**File:** `.claude/hooks/viewer/watcher.ts:150`

```typescript
// Before
slice.text().then((content) => { ... });

// After
slice.text().then((content) => { ... }).catch((error) => {
  console.error("Error reading log file slice:", error);
});
```

### 2.3 Add logging to silent catch blocks

**Files:** Multiple (14+ locations)
- `viewer/watcher.ts`
- `viewer/plan-watcher.ts`
- `viewer/server.ts`
- `viewer/dashboard.ts`
- `viewer/session-summary.ts`

Replace empty catch blocks with `console.error()` logging.

### 2.4 Add top-level error handling to handlers

**Files:** All 12 handlers in `.claude/hooks/handlers/`

```typescript
// Wrap main() call in each handler
try {
  await main();
} catch (error) {
  console.error("Handler error:", error);
  writeOutput({ continue: true });
  process.exit(1);
}
```

---

## Phase 3: Medium Priority (P2)

### 3.1 Add rate limiting for SSE

**New file:** `.claude/hooks/viewer/rate-limiter.ts`

Limit to 5 SSE connections per IP within 60-second window.

### 3.2 Add input validation

**New file:** `.claude/hooks/utils/validation.ts`

Validate hook inputs have required fields (session_id, hook_event_name).

### 3.3 Add security tests

**New file:** `.claude/hooks/viewer/__tests__/security.test.ts`

Test path traversal blocking, session ID validation, rate limiting.

### 3.4 Add handler execution tests

**New file:** `.claude/hooks/handlers/__tests__/execution.test.ts`

Test handlers output valid JSON on errors.

---

## Phase 4: Low Priority (P3)

### 4.1 Pin @types/bun version

**File:** `.claude/hooks/package.json`

```json
"@types/bun": "^1.1.14"
```

### 4.2 Make port configurable

**File:** `.claude/hooks/viewer/config.ts`

```typescript
PORT: parseInt(process.env.HOOK_VIEWER_PORT || "3456", 10),
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `.claude/hooks/viewer/server.ts` | Path validation, session validation, CORS, auth, CSP |
| `.claude/hooks/viewer/config.ts` | HOST binding, PORT from env |
| `.claude/hooks/viewer/watcher.ts` | Promise error handling |
| `.claude/hooks/viewer/plan-watcher.ts` | Error logging in catch blocks |
| `.claude/hooks/viewer/dashboard.ts` | Error logging in catch blocks |
| `.claude/hooks/viewer/session-summary.ts` | Error logging in catch blocks |
| `.claude/hooks/handlers/*.ts` (12 files) | Top-level error handling |
| `.claude/hooks/package.json` | Pin @types/bun |

## Files to Create

| File | Purpose |
|------|---------|
| `.claude/hooks/viewer/security.ts` | Path/session validation utilities |
| `.claude/hooks/viewer/rate-limiter.ts` | SSE connection rate limiting |
| `.claude/hooks/utils/validation.ts` | Hook input validation |
| `.claude/hooks/viewer/__tests__/security.test.ts` | Security tests |
| `.claude/hooks/handlers/__tests__/execution.test.ts` | Handler execution tests |

---

## Edge Cases

| Case | Handling |
|------|----------|
| Encoded path traversal (`%2e%2e`) | Decode before validation |
| Null bytes in paths | Reject as invalid |
| Very long session IDs | Limit to 64 chars max |
| Unicode in plan names | Restrict to ASCII alphanumeric |
| Rate limit bypass via headers | Use connection IP, not X-Forwarded-For |
| Existing log files with old format | Backward compatible - no schema changes |

## Testing Strategy

1. **Unit tests** for security utilities (sanitizePathComponent, validateSessionId)
2. **Integration tests** for path traversal attempts against endpoints
3. **Handler tests** to verify valid JSON output on errors
4. **Manual testing** to ensure viewer still functions after changes

Run tests with: `cd .claude/hooks && bun run test:run`

## Decisions

| Decision | Rationale |
|----------|-----------|
| Localhost binding by default | Primary use is local development; can override via env var |
| Simple token auth (not OAuth) | Matches project scope; single-user development tool |
| Regex validation over path.resolve | More predictable; cross-platform consistent |
| Rate limit of 5 connections | Reasonable for single-user; prevents runaway reconnects |
| Console.error for catch blocks | Matches existing logging pattern; low overhead |
