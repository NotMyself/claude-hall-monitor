# Feature: F015 - Handler Execution Tests

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000-F014**: All fixes completed including handler error handling (F011)

## Objective

Add handler execution tests that verify handlers produce valid JSON output, including on error conditions.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D009**: Handlers must always produce valid JSON. Tests should verify this.

## Edge Cases to Handle

From `edge-cases.md`:
- **EC010**: Concurrent handler errors - verify each handler outputs valid JSON independently

## Code References

Read these sections before implementing:
- `testing-strategy.md#handler-test-pattern` - Handler test pattern

## Constraints

- See `constraints.md` for global rules
- Use subprocess to run handlers (match real execution)
- Mock stdin with test input
- Capture and validate stdout

## Files to Create

| File | Purpose |
|------|---------|
| `.claude/hooks/handlers/__tests__/execution.test.ts` | Handler execution tests |

## Implementation Details

### execution.test.ts

```typescript
import { describe, it, expect } from "vitest";
import { spawn } from "bun";
import { join } from "node:path";

const HANDLERS_DIR = join(import.meta.dir, "..");

/**
 * Run a handler with given input and return stdout.
 */
async function runHandler(
  handlerFile: string,
  input: unknown
): Promise<string> {
  const handlerPath = join(HANDLERS_DIR, handlerFile);
  const inputJson = JSON.stringify(input);

  const proc = spawn(["bun", "run", handlerPath], {
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });

  // Write input to stdin
  const writer = proc.stdin.getWriter();
  await writer.write(new TextEncoder().encode(inputJson));
  await writer.close();

  // Read stdout
  const stdout = await new Response(proc.stdout).text();
  await proc.exited;

  return stdout.trim();
}

/**
 * Create mock input for a hook type.
 */
function createMockInput(hookEventName: string): Record<string, unknown> {
  return {
    hook_event_name: hookEventName,
    session_id: "test-session-123",
    transcript_path: "/mock/path/transcript.json",
    cwd: "/mock/project",
  };
}

describe("Handler Execution", () => {
  const handlers = [
    { file: "notification.ts", event: "Notification" },
    { file: "permission-request.ts", event: "PermissionRequest" },
    { file: "post-tool-use-failure.ts", event: "PostToolUseFailure" },
    { file: "post-tool-use.ts", event: "PostToolUse" },
    { file: "pre-compact.ts", event: "PreCompact" },
    { file: "pre-tool-use.ts", event: "PreToolUse" },
    { file: "session-end.ts", event: "SessionEnd" },
    { file: "session-start.ts", event: "SessionStart" },
    { file: "stop.ts", event: "Stop" },
    { file: "subagent-start.ts", event: "SubagentStart" },
    { file: "subagent-stop.ts", event: "SubagentStop" },
    { file: "user-prompt-submit.ts", event: "UserPromptSubmit" },
  ];

  describe("Valid Input", () => {
    for (const { file, event } of handlers) {
      it(`${event} outputs valid JSON`, async () => {
        const input = {
          ...createMockInput(event),
          // Add event-specific fields
          ...(event === "PreToolUse" && {
            tool_name: "Bash",
            tool_input: { command: "echo test" },
            tool_use_id: "tool-123",
            permission_mode: "default",
          }),
          ...(event === "PostToolUse" && {
            tool_name: "Bash",
            tool_result: "test output",
            tool_use_id: "tool-123",
          }),
          ...(event === "SessionStart" && {
            source: "startup",
            permission_mode: "default",
          }),
          ...(event === "SessionEnd" && {
            reason: "user_exit",
          }),
          ...(event === "UserPromptSubmit" && {
            prompt: "test prompt",
          }),
          ...(event === "Notification" && {
            message: "test notification",
            level: "info",
          }),
          ...(event === "PermissionRequest" && {
            tool_name: "Bash",
            tool_input: { command: "echo" },
          }),
        };

        const output = await runHandler(file, input);

        // Must be valid JSON
        let parsed: unknown;
        expect(() => {
          parsed = JSON.parse(output);
        }).not.toThrow();

        // Must have continue property
        expect(parsed).toHaveProperty("continue");
      }, 10000); // 10s timeout for subprocess
    }
  });

  describe("Invalid Input", () => {
    it("pre-tool-use handles malformed JSON gracefully", async () => {
      // Run with invalid input
      const handlerPath = join(HANDLERS_DIR, "pre-tool-use.ts");

      const proc = spawn(["bun", "run", handlerPath], {
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe",
      });

      const writer = proc.stdin.getWriter();
      await writer.write(new TextEncoder().encode("not valid json"));
      await writer.close();

      const stdout = await new Response(proc.stdout).text();
      await proc.exited;

      // Should still output valid JSON with continue: true
      const output = stdout.trim();
      expect(() => JSON.parse(output)).not.toThrow();

      const parsed = JSON.parse(output);
      expect(parsed.continue).toBe(true);
    }, 10000);

    it("pre-tool-use handles missing fields gracefully", async () => {
      const output = await runHandler("pre-tool-use.ts", {
        // Missing required fields
      });

      // Should still output valid JSON with continue: true
      expect(() => JSON.parse(output)).not.toThrow();
      const parsed = JSON.parse(output);
      expect(parsed.continue).toBe(true);
    }, 10000);
  });
});
```

## Acceptance Criteria

- [ ] Execution test file created
- [ ] Tests cover all 12 handlers
- [ ] Each handler tested with valid input produces valid JSON
- [ ] Tests verify `continue` property in output
- [ ] Tests verify error handling produces valid JSON
- [ ] All tests pass: `bun run test:run --grep "Handler Execution"`
- [ ] TypeScript compiles without errors

## Verification

```bash
cd .claude/hooks && bun run test:run
```

## Commit

```bash
git add .claude/hooks/handlers/__tests__/execution.test.ts
git commit -m "$(cat <<'EOF'
test(handlers): add execution tests for all handlers

Verify each handler produces valid JSON output.
Test error handling with malformed and missing input.

Implements: F015
Decisions: D009
Edge cases: EC010

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Next

All features complete. Run final verification:
```bash
cd .claude/hooks && bun run tsc --noEmit && bun run test:run
```
