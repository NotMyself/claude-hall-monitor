# Feature: F008 - E2E Test Script

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000-F007**: Plugin fully structured with CI/CD

## Objective

Create an end-to-end test script that verifies all 12 bundled handlers execute correctly and produce valid output.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

None specific to this feature.

## Edge Cases to Handle

From `edge-cases.md`:
- **EC001**: Cross-platform paths → Use node:path for all paths in test script
- **EC006**: Viewer port conflict → Test viewer startup/shutdown

## Code References

Read these sections before implementing:
- `code/typescript.md#e2e-test-structure` - Test patterns
- `code/json.md#test-fixtures` - Input fixtures

## Constraints

- See `constraints.md` for global rules
- Test bundled JS files (dist/), not TypeScript source
- Each handler must produce valid JSON output
- Tests should run quickly (< 30 seconds total)

## Files to Create

| File | Purpose |
|------|---------|
| `test-e2e.ts` | E2E test script |
| `test-fixtures/` | Test input JSON files |

## Implementation Details

### test-e2e.ts

```typescript
import { spawn } from "bun";
import { join } from "node:path";

const DIST_DIR = join(import.meta.dir, "dist", "handlers");

interface TestCase {
  handler: string;
  input: object;
  validate: (output: object) => boolean;
}

const TEST_CASES: TestCase[] = [
  {
    handler: "session-start",
    input: { session_id: "e2e-test-123", cwd: "/tmp/test" },
    validate: (out) => "additionalContext" in out || Object.keys(out).length >= 0,
  },
  {
    handler: "session-end",
    input: { session_id: "e2e-test-123" },
    validate: () => true, // May have empty output
  },
  {
    handler: "user-prompt-submit",
    input: { session_id: "e2e-test-123", prompt: "test prompt" },
    validate: (out) => "additionalContext" in out || Object.keys(out).length >= 0,
  },
  {
    handler: "pre-tool-use",
    input: {
      session_id: "e2e-test-123",
      tool_name: "Bash",
      tool_input: { command: "ls" },
    },
    validate: (out) => !("permissionDecision" in out) || ["allow", "deny", "ask"].includes((out as any).permissionDecision),
  },
  {
    handler: "post-tool-use",
    input: {
      session_id: "e2e-test-123",
      tool_name: "Bash",
      tool_result: { stdout: "file.txt" },
    },
    validate: () => true,
  },
  {
    handler: "post-tool-use-failure",
    input: {
      session_id: "e2e-test-123",
      tool_name: "Bash",
      error: "Command not found",
    },
    validate: () => true,
  },
  {
    handler: "notification",
    input: { session_id: "e2e-test-123", message: "Test notification" },
    validate: () => true,
  },
  {
    handler: "stop",
    input: { session_id: "e2e-test-123", reason: "user_interrupt" },
    validate: () => true,
  },
  {
    handler: "subagent-start",
    input: { session_id: "e2e-test-123", subagent_id: "sub-1" },
    validate: () => true,
  },
  {
    handler: "subagent-stop",
    input: { session_id: "e2e-test-123", subagent_id: "sub-1" },
    validate: () => true,
  },
  {
    handler: "pre-compact",
    input: { session_id: "e2e-test-123" },
    validate: () => true,
  },
  {
    handler: "permission-request",
    input: {
      session_id: "e2e-test-123",
      tool_name: "Write",
      tool_input: { file_path: "/tmp/test.txt" },
    },
    validate: () => true,
  },
];

async function runTest(test: TestCase): Promise<{ success: boolean; error?: string }> {
  const handlerPath = join(DIST_DIR, `${test.handler}.js`);

  try {
    const proc = spawn({
      cmd: ["bun", "run", handlerPath],
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
    });

    proc.stdin.write(JSON.stringify(test.input));
    proc.stdin.end();

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();

    await proc.exited;

    // Handler may output empty or valid JSON
    if (stdout.trim() === "") {
      return { success: true };
    }

    try {
      const output = JSON.parse(stdout);
      if (test.validate(output)) {
        return { success: true };
      }
      return { success: false, error: `Validation failed: ${JSON.stringify(output)}` };
    } catch {
      return { success: false, error: `Invalid JSON output: ${stdout}\nStderr: ${stderr}` };
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

async function main() {
  console.log("Running E2E tests for bundled handlers...\n");

  let passed = 0;
  let failed = 0;

  for (const test of TEST_CASES) {
    process.stdout.write(`  ${test.handler}... `);
    const result = await runTest(test);

    if (result.success) {
      console.log("✓");
      passed++;
    } else {
      console.log("✗");
      console.log(`    Error: ${result.error}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
```

### package.json script

Add to root or hooks package.json:

```json
{
  "scripts": {
    "test:e2e": "bun run test-e2e.ts"
  }
}
```

## Acceptance Criteria

- [ ] `test-e2e.ts` exists at project root
- [ ] All 12 handlers are tested
- [ ] Tests verify JSON output is valid
- [ ] Tests run against dist/ bundles (not TypeScript)
- [ ] Script exits with code 1 on any failure
- [ ] Script completes in under 30 seconds

## Verification

```bash
# Build first (if not already built)
bun run build.ts

# Run E2E tests
bun run test-e2e.ts

# Expected output:
# Running E2E tests for bundled handlers...
#
#   session-start... ✓
#   session-end... ✓
#   user-prompt-submit... ✓
#   pre-tool-use... ✓
#   post-tool-use... ✓
#   post-tool-use-failure... ✓
#   notification... ✓
#   stop... ✓
#   subagent-start... ✓
#   subagent-stop... ✓
#   pre-compact... ✓
#   permission-request... ✓
#
# Results: 12 passed, 0 failed
```

## Commit

```bash
git add test-e2e.ts
git commit -m "test: add E2E test script for bundled handlers

Create test-e2e.ts that:
- Tests all 12 handlers against dist/ bundles
- Verifies valid JSON output
- Reports pass/fail for each handler

Implements: F008"
```

## Next

Proceed to: `prompts/09-marketplace-prep.md` (F009)
