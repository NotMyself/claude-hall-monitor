# Feature: F12 - Add Handler Tests

## Context
F01-F11 completed: All fixes done, logger tests added. Final feature.

## Objective
Create a test suite for hook handlers to ensure critical code paths are verified.

## Constraints
- Reference: See `constraints.md` for global rules
- Use Vitest as the test framework
- Mock stdin/stdout and logger functions
- Focus on testing input parsing, output format, and key logic
- Don't need 100% coverage - focus on critical paths

## Files to Create
- `.claude/hooks/handlers/__tests__/setup.ts` - Shared test utilities
- `.claude/hooks/handlers/__tests__/handlers.test.ts` - Handler tests

## Implementation Details

### 1. Create test setup (`setup.ts`):
```typescript
import { vi } from 'vitest';

/**
 * Mock stdin with JSON input
 */
export function mockStdin(data: object): void {
  // Implementation to mock Bun.stdin or process.stdin
}

/**
 * Capture stdout output
 */
export function captureStdout(): { getOutput: () => string } {
  // Implementation to capture console output
}

/**
 * Mock the logger module
 */
export function mockLogger() {
  return {
    log: vi.fn(),
    readInput: vi.fn(),
    writeOutput: vi.fn(),
  };
}
```

### 2. Create handler tests (`handlers.test.ts`):
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Hook Handlers', () => {
  describe('session-start', () => {
    it('logs SessionStart event', async () => {
      // Test implementation
    });

    it('returns continue: true', async () => {
      // Test implementation
    });

    it('includes additionalContext', async () => {
      // Test implementation
    });
  });

  describe('session-end', () => {
    it('logs SessionEnd event', async () => {
      // Test implementation
    });

    it('shuts down viewer on exit', async () => {
      // Test implementation
    });

    it('skips shutdown on clear/compact', async () => {
      // Test implementation
    });
  });

  describe('pre-tool-use', () => {
    it('allows all tools by default', async () => {
      // Test implementation
    });

    it('logs tool usage', async () => {
      // Test implementation
    });
  });

  describe('post-tool-use', () => {
    it('logs tool results', async () => {
      // Test implementation
    });

    it('truncates large responses', async () => {
      // Test implementation
    });
  });

  // Add tests for other handlers...
});
```

### Priority Handlers to Test:
1. **session-start.ts** - Critical for viewer lifecycle
2. **session-end.ts** - Critical for cleanup
3. **pre-tool-use.ts** - Security-relevant
4. **post-tool-use.ts** - Data processing
5. **permission-request.ts** - Security-relevant

### Lower Priority (can be brief):
- notification.ts
- stop.ts
- subagent-start.ts
- subagent-stop.ts
- pre-compact.ts
- user-prompt-submit.ts
- post-tool-use-failure.ts

## Acceptance Criteria
- [ ] Test setup file created with mock utilities
- [ ] Tests for session-start handler
- [ ] Tests for session-end handler
- [ ] Tests for pre-tool-use handler
- [ ] Tests for post-tool-use handler
- [ ] Tests for permission-request handler
- [ ] All new tests pass: `bun run test`
- [ ] Type checking passes: `bun run tsc --noEmit`

## Verification
```bash
cd .claude/hooks && bun run tsc --noEmit && bun run test:run
```

## Commit
```bash
git add .claude/hooks/handlers/__tests__/
git commit -m "test(handlers): add unit tests for hook handlers"
```

## Completion
All features implemented! Run final verification:
```bash
cd .claude/hooks && bun run test:coverage
```
