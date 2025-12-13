# Feature: F012 - SSE Connection Rate Limiting

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000-F011**: All security and error handling fixes completed

## Objective

Add rate limiting to SSE connections to prevent resource exhaustion from excessive connection attempts.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D004**: Rate limit of 5 SSE connections per IP in 60-second window. Reasonable for single-user; prevents runaway reconnects.

## Edge Cases to Handle

From `edge-cases.md`:
- **EC005**: Rate limit bypass via X-Forwarded-For - use connection IP directly, not headers

## Code References

Read these sections before implementing:
- `code/typescript.md#rate-limiting` - RateLimiter class implementation

## Constraints

- See `constraints.md` for global rules
- Only rate limit SSE endpoints (/events, /events/plans)
- Return 429 Too Many Requests when limit exceeded
- Clean up expired entries periodically

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `.claude/hooks/viewer/rate-limiter.ts` | New rate limiter module |
| `.claude/hooks/viewer/server.ts` | Apply rate limiting to SSE endpoints |

## Implementation Details

### 1. Create rate-limiter.ts

```typescript
/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  maxConnections: number;
  windowMs: number;
}

/**
 * Rate limit entry for tracking connections
 */
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/**
 * Simple in-memory rate limiter for SSE connections.
 */
export class RateLimiter {
  private connections: Map<string, RateLimitEntry> = new Map();
  private maxConnections: number;
  private windowMs: number;
  private cleanupInterval: Timer | null = null;

  constructor(config: RateLimitConfig) {
    this.maxConnections = config.maxConnections;
    this.windowMs = config.windowMs;

    // Cleanup every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  /**
   * Check if a connection should be allowed.
   *
   * @param ip - Client IP address
   * @returns true if allowed, false if rate limited
   */
  isAllowed(ip: string): boolean {
    const now = Date.now();
    const entry = this.connections.get(ip);

    if (!entry || now - entry.windowStart > this.windowMs) {
      // New window
      this.connections.set(ip, { count: 1, windowStart: now });
      return true;
    }

    if (entry.count >= this.maxConnections) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Clean up expired entries to prevent memory leaks.
   */
  cleanup(): void {
    const now = Date.now();
    for (const [ip, entry] of this.connections) {
      if (now - entry.windowStart > this.windowMs) {
        this.connections.delete(ip);
      }
    }
  }

  /**
   * Stop the cleanup interval.
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Default configuration: 5 connections per 60 seconds
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxConnections: 5,
  windowMs: 60_000,
};
```

### 2. Update server.ts

Import and create rate limiter:

```typescript
import { RateLimiter, DEFAULT_RATE_LIMIT } from "./rate-limiter";

// Create rate limiter instance
const sseRateLimiter = new RateLimiter(DEFAULT_RATE_LIMIT);
```

Add helper to get client IP:

```typescript
/**
 * Get client IP from request.
 * Uses direct connection IP, not X-Forwarded-For (EC005).
 */
function getClientIP(request: Request): string {
  // Bun provides the IP via server.requestIP() in the fetch handler
  // For now, use a placeholder - this needs Bun-specific handling
  return "127.0.0.1"; // All connections are localhost after F002
}
```

Add rate limiting to SSE endpoints:

```typescript
// Before /events handler
if (path === "/events" && request.method === "GET") {
  // ... existing code
}

// After (add rate limit check at start)
if (path === "/events" && request.method === "GET") {
  const clientIP = getClientIP(request);
  if (!sseRateLimiter.isAllowed(clientIP)) {
    return new Response("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": "60",
        "Content-Type": "text/plain",
      },
    });
  }
  // ... rest of existing code
}
```

Apply same pattern to `/events/plans` endpoint.

Stop rate limiter on shutdown:

```typescript
// In shutdown handler and SIGINT handler
sseRateLimiter.stop();
```

## Acceptance Criteria

- [ ] rate-limiter.ts created with RateLimiter class
- [ ] SSE endpoints return 429 when limit exceeded
- [ ] 429 response includes Retry-After header
- [ ] Rate limiter cleans up expired entries
- [ ] Rate limiter stopped on server shutdown
- [ ] TypeScript compiles without errors

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit

```bash
git add .claude/hooks/viewer/rate-limiter.ts .claude/hooks/viewer/server.ts
git commit -m "$(cat <<'EOF'
feat(viewer): add rate limiting to SSE connections

Limit to 5 connections per IP per 60-second window.
Return 429 Too Many Requests when limit exceeded.

Implements: F012
Decisions: D004
Edge cases: EC005

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/13-input-validation.md` (F013)
