# Feature: F07 - Session Start Env Pass

## Context
Viewer now reads CLAUDE_HOOKS_VIEWER_SESSION env var.

## Objective
Pass session ID as env var when spawning viewer from session-start hook.

## Constraints
- Reference: See constraints.md
- Preserve existing spawn options
- Import CURRENT_SESSION_ENV from config

## Files to Modify
- `.claude/hooks/session-start.ts`

## Implementation Details

Add import:
```typescript
import { CURRENT_SESSION_ENV } from "./viewer/config";
```

Update startViewerServer to accept session_id parameter:
```typescript
function startViewerServer(session_id: string): void {
  const viewerPath = join(import.meta.dir, "viewer", "server.ts");

  try {
    const proc = spawn(["bun", "run", viewerPath], {
      env: {
        ...process.env,
        [CURRENT_SESSION_ENV]: session_id,
      },
      stdout: "ignore",
      stderr: "ignore",
      stdin: "ignore",
    });

    proc.unref();
    console.error(`\nHook Viewer starting at ${VIEWER_URL}\n`);
  } catch (error) {
    console.error("Failed to start viewer:", error);
  }
}
```

Update the call site in main() to pass session_id:
```typescript
if (input.source === "startup") {
  const viewerRunning = await isViewerRunning();

  if (!viewerRunning) {
    startViewerServer(input.session_id);
  } else {
    console.error(`\nHook Viewer: ${VIEWER_URL}\n`);
  }
}
```

## Acceptance Criteria
- [ ] CURRENT_SESSION_ENV imported from viewer/config
- [ ] startViewerServer accepts session_id string parameter
- [ ] spawn() includes env object with CURRENT_SESSION_ENV set to session_id
- [ ] Call site passes input.session_id to startViewerServer

## Verification
Start new Claude session, verify viewer shows current session by default.

## Commit
```bash
git add .claude/hooks/session-start.ts
git commit -m "feat(hooks): pass session ID to viewer on startup"
```

## Next
Proceed to: prompts/08-e2e-validation.md
