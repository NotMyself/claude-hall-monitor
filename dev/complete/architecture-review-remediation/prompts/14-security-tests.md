# Feature: F014 - Security Tests

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000-F013**: All security fixes and utilities completed

## Objective

Add comprehensive security tests to verify vulnerability fixes and prevent regression.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- All security decisions (D001-D008) should be tested

## Edge Cases to Handle

From `edge-cases.md`:
- All edge cases (EC001-EC012) should have test coverage

## Code References

Read these sections before implementing:
- `testing-strategy.md` - Test patterns and approach

## Constraints

- See `constraints.md` for global rules
- Use existing test infrastructure (Vitest)
- Tests should be fast and deterministic
- No external dependencies (mock where needed)

## Files to Create

| File | Purpose |
|------|---------|
| `.claude/hooks/viewer/__tests__/security.test.ts` | Security utility and endpoint tests |

## Implementation Details

### security.test.ts

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  validateSessionId,
  sanitizePathComponent,
  validatePathWithinBase,
  validatePlanName,
  getLocalhostOrigin,
  generateAuthToken,
  verifyAuthToken,
} from "../security";

describe("Security Utilities", () => {
  describe("validateSessionId", () => {
    it("accepts valid session IDs", () => {
      expect(validateSessionId("abc123")).toBe("abc123");
      expect(validateSessionId("session-with-hyphens")).toBe("session-with-hyphens");
      expect(validateSessionId("ABC123")).toBe("ABC123");
    });

    it("rejects null and undefined", () => {
      expect(validateSessionId(null)).toBeNull();
      expect(validateSessionId(undefined as any)).toBeNull();
    });

    it("rejects IDs over 64 characters", () => {
      const longId = "a".repeat(65);
      expect(validateSessionId(longId)).toBeNull();
    });

    it("rejects IDs with special characters", () => {
      expect(validateSessionId("session/../etc")).toBeNull();
      expect(validateSessionId("session<script>")).toBeNull();
      expect(validateSessionId("session\x00null")).toBeNull();
    });
  });

  describe("sanitizePathComponent", () => {
    it("accepts valid filenames", () => {
      expect(sanitizePathComponent("main.css")).toBe("main.css");
      expect(sanitizePathComponent("file-name.js")).toBe("file-name.js");
    });

    it("rejects path traversal attempts", () => {
      expect(sanitizePathComponent("..")).toBeNull();
      expect(sanitizePathComponent("../config")).toBeNull();
      expect(sanitizePathComponent("foo/bar")).toBeNull();
    });

    it("rejects encoded path traversal", () => {
      expect(sanitizePathComponent("%2e%2e")).toBeNull();
      expect(sanitizePathComponent("%2e%2e%2fconfig")).toBeNull();
    });

    it("rejects null bytes", () => {
      expect(sanitizePathComponent("file%00.txt")).toBeNull();
      expect(sanitizePathComponent("file\x00.txt")).toBeNull();
    });

    it("rejects empty and whitespace-only", () => {
      expect(sanitizePathComponent("")).toBeNull();
      expect(sanitizePathComponent("   ")).toBeNull();
    });
  });

  describe("validatePathWithinBase", () => {
    const baseDir = "/app/styles";

    it("accepts paths within base", () => {
      const result = validatePathWithinBase("main.css", baseDir);
      expect(result).toContain("main.css");
    });

    it("rejects paths outside base", () => {
      expect(validatePathWithinBase("../config.ts", baseDir)).toBeNull();
    });
  });

  describe("validatePlanName", () => {
    it("accepts valid plan names", () => {
      expect(validatePlanName("my-plan")).toBe("my-plan");
      expect(validatePlanName("plan_v2")).toBe("plan_v2");
      expect(validatePlanName("Plan123")).toBe("Plan123");
    });

    it("rejects path traversal", () => {
      expect(validatePlanName("../etc/passwd")).toBeNull();
      expect(validatePlanName("%2e%2e%2f")).toBeNull();
    });

    it("rejects unicode characters", () => {
      expect(validatePlanName("plan\u0000null")).toBeNull();
      expect(validatePlanName("plan\u202E")).toBeNull();
    });
  });

  describe("getLocalhostOrigin", () => {
    it("returns correct format", () => {
      expect(getLocalhostOrigin(3456)).toBe("http://localhost:3456");
      expect(getLocalhostOrigin(8080)).toBe("http://localhost:8080");
    });
  });

  describe("Authentication", () => {
    it("generates unique tokens", () => {
      const token1 = generateAuthToken();
      const token2 = generateAuthToken();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it("verifies valid tokens", () => {
      const token = generateAuthToken();
      expect(verifyAuthToken(`Bearer ${token}`, token)).toBe(true);
    });

    it("rejects invalid tokens", () => {
      const token = generateAuthToken();
      expect(verifyAuthToken("Bearer wrong", token)).toBe(false);
      expect(verifyAuthToken(null, token)).toBe(false);
      expect(verifyAuthToken("", token)).toBe(false);
    });
  });
});

describe("Rate Limiter", () => {
  // Import here to avoid circular deps
  const { RateLimiter } = await import("../rate-limiter");

  it("allows connections under limit", () => {
    const limiter = new RateLimiter({ maxConnections: 5, windowMs: 60000 });
    expect(limiter.isAllowed("127.0.0.1")).toBe(true);
    expect(limiter.isAllowed("127.0.0.1")).toBe(true);
    limiter.stop();
  });

  it("blocks connections over limit", () => {
    const limiter = new RateLimiter({ maxConnections: 2, windowMs: 60000 });
    expect(limiter.isAllowed("127.0.0.1")).toBe(true);
    expect(limiter.isAllowed("127.0.0.1")).toBe(true);
    expect(limiter.isAllowed("127.0.0.1")).toBe(false);
    limiter.stop();
  });

  it("tracks different IPs separately", () => {
    const limiter = new RateLimiter({ maxConnections: 1, windowMs: 60000 });
    expect(limiter.isAllowed("127.0.0.1")).toBe(true);
    expect(limiter.isAllowed("127.0.0.1")).toBe(false);
    expect(limiter.isAllowed("192.168.1.1")).toBe(true);
    limiter.stop();
  });
});
```

## Acceptance Criteria

- [ ] Security test file created
- [ ] Tests cover all security utility functions
- [ ] Tests cover all edge cases (EC001-EC012)
- [ ] Tests cover rate limiter
- [ ] All tests pass: `bun run test:run --grep "Security"`
- [ ] TypeScript compiles without errors

## Verification

```bash
cd .claude/hooks && bun run test:run
```

## Commit

```bash
git add .claude/hooks/viewer/__tests__/security.test.ts
git commit -m "$(cat <<'EOF'
test(viewer): add comprehensive security tests

Test security utilities, path validation, session validation,
authentication, and rate limiting.

Implements: F014
Edge cases: EC001-EC012

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/15-handler-tests.md` (F015)
