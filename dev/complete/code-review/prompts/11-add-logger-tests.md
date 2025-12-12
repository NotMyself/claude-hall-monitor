# Feature: F11 - Add Logger Utility Tests

## Context
F01-F10 completed: All code fixes done. Now adding test coverage.

## Objective
Create comprehensive unit tests for the logger utility functions to ensure core logging functionality is verified.

## Constraints
- Reference: See `constraints.md` for global rules
- Use Vitest as the test framework (matches existing tests)
- Mock file system operations to avoid side effects
- Test all exported functions from `logger.ts`

## Files to Create
- `.claude/hooks/utils/__tests__/logger.test.ts` (new file)

## Implementation Details

### Test Structure:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { log, readInput, writeOutput, getLogPath } from '../logger';

describe('logger', () => {
  describe('getLogPath', () => {
    it('returns correct path for session id', () => {
      const path = getLogPath('test-session-123');
      expect(path).toContain('logs');
      expect(path).toContain('test-session-123.txt');
    });
  });

  describe('log', () => {
    // Mock file system
    beforeEach(() => {
      vi.mock('fs/promises', () => ({
        appendFile: vi.fn(),
        mkdir: vi.fn(),
      }));
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('writes JSONL formatted entry', async () => {
      // Test implementation
    });

    it('includes timestamp, event, session_id, and data', async () => {
      // Test implementation
    });

    it('throttles heartbeat events', async () => {
      // Test that rapid heartbeats are deduplicated
    });
  });

  describe('readInput', () => {
    it('parses JSON from stdin', async () => {
      // Mock stdin with JSON data
    });

    it('returns typed result', async () => {
      // Verify generic type is respected
    });
  });

  describe('writeOutput', () => {
    it('writes JSON to stdout', () => {
      // Mock console.log or process.stdout
    });
  });
});
```

### Functions to Test:
1. **`getLogPath(session_id)`** - Verify path construction
2. **`log(event, session_id, data)`** - Verify JSONL format, file writing
3. **`readInput<T>()`** - Verify JSON parsing from stdin
4. **`writeOutput(output)`** - Verify JSON output to stdout
5. **Heartbeat throttling** - Verify rapid heartbeats are deduplicated

## Acceptance Criteria
- [ ] Test file created at `.claude/hooks/utils/__tests__/logger.test.ts`
- [ ] Tests cover `getLogPath()` function
- [ ] Tests cover `log()` function with mocked file system
- [ ] Tests cover `readInput()` function with mocked stdin
- [ ] Tests cover `writeOutput()` function
- [ ] Tests verify heartbeat throttling behavior
- [ ] All new tests pass: `bun run test`
- [ ] Type checking passes: `bun run tsc --noEmit`

## Verification
```bash
cd .claude/hooks && bun run tsc --noEmit && bun run test:run
```

## Commit
```bash
git add .claude/hooks/utils/__tests__/
git commit -m "test(logger): add unit tests for logger utility"
```

## Next
Proceed to: `prompts/12-add-handler-tests.md`
