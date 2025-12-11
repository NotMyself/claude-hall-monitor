# Feature: 20-session-start - Session Start Integration

## Context
Features 01-19 are complete. The viewer is fully functional and tested.

## Objective
Modify session-start.ts to auto-start the viewer server on Claude Code startup and print a clickable link.

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- Do NOT break existing functionality
- Only start viewer on `source === "startup"`
- Use detached process so viewer survives hook completion
- Handle case where viewer is already running

## Files to Create/Modify
- `.claude/hooks/session-start.ts` - Add viewer auto-start logic

## Implementation Details

Add these functions and modify main():

```typescript
import { spawn } from "bun";
import { join } from "path";

/**
 * Viewer server configuration
 */
const VIEWER_PORT = 3456;
const VIEWER_URL = `http://localhost:${VIEWER_PORT}`;

/**
 * Check if the viewer server is already running
 */
async function isViewerRunning(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    const response = await fetch(VIEWER_URL, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Start the viewer server as a detached background process
 */
function startViewerServer(): void {
  const viewerPath = join(import.meta.dir, "viewer", "server.ts");

  try {
    // Spawn detached process that survives parent exit
    const proc = spawn(["bun", "run", viewerPath], {
      stdout: "ignore",
      stderr: "ignore",
      stdin: "ignore",
    });

    // Unref to allow parent to exit
    proc.unref();

    console.error(`\n🔍 Hook Viewer starting at ${VIEWER_URL}\n`);
  } catch (error) {
    console.error("Failed to start viewer:", error);
  }
}
```

Modify the main() function to add viewer logic:

```typescript
async function main(): Promise<void> {
  // Read and parse the hook input from stdin
  const input = await readInput<SessionStartHookInput>();

  // Log the session start with structured data
  await log("SessionStart", input.session_id, {
    cwd: input.cwd,
    source: input.source,
    transcript_path: input.transcript_path,
    permission_mode: input.permission_mode,
    started_at: new Date().toISOString(),
  });

  // === Start viewer on fresh startup ===
  if (input.source === "startup") {
    const viewerRunning = await isViewerRunning();

    if (!viewerRunning) {
      startViewerServer();
    } else {
      console.error(`\n🔍 Hook Viewer: ${VIEWER_URL}\n`);
    }
  }

  // Build the output response
  const additionalContext = input.source === "startup"
    ? `Session started. Hook Viewer available at ${VIEWER_URL}`
    : `Session ${input.source} at ${new Date().toISOString()}`;

  const output: SyncHookJSONOutput = {
    continue: true,
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext,
    },
  };

  // Write JSON response to stdout
  writeOutput(output);
}
```

### Key Behaviors

1. **On startup**: Check if viewer is running → start if not → print link
2. **On resume/clear/compact**: Don't start viewer, just log
3. **Viewer URL in context**: Only on startup, include viewer URL in additionalContext
4. **Detached process**: Viewer keeps running after hook exits
5. **Error handling**: Gracefully handle start failures

## Acceptance Criteria
- [ ] isViewerRunning() function checks if server responds
- [ ] startViewerServer() spawns detached bun process
- [ ] On source="startup", checks and starts viewer if needed
- [ ] Prints clickable link to stderr (visible in terminal)
- [ ] Does NOT start viewer on resume/clear/compact
- [ ] Includes viewer URL in additionalContext on startup
- [ ] Existing logging functionality preserved
- [ ] Process is detached (survives hook exit)
- [ ] TypeScript compiles without errors

## Verification
```bash
cd .claude/hooks && bun run tsc --noEmit session-start.ts
```

## Commit
After verification passes:
```bash
git add .claude/hooks/session-start.ts
git commit -m "feat(hooks): auto-start viewer on session startup

- Add isViewerRunning() to check if server is up
- Add startViewerServer() to spawn detached process
- Start viewer automatically on fresh startup
- Print clickable link to stderr
- Include viewer URL in session context"
```

## Next
Proceed to: `prompts/21-package-json.md`
