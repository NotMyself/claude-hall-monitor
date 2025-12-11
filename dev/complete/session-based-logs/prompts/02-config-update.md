# Feature: F02 - Config Constants

## Context
Logger now writes to per-session files in `.claude/hooks/logs/`.

## Objective
Update viewer config to use LOGS_DIR instead of single LOG_FILE.

## Constraints
- Reference: See constraints.md
- Keep PATHS object structure
- Add method to object for path resolution

## Files to Modify
- `.claude/hooks/viewer/config.ts`

## Implementation Details

Replace LOG_FILE in PATHS:
```typescript
import { resolve, join } from "node:path";

export const PATHS = {
  VIEWER_DIR: import.meta.dir,
  LOGS_DIR: resolve(import.meta.dir, "..", "logs"),
  getSessionLogPath(session_id: string): string {
    return join(this.LOGS_DIR, `${session_id}.txt`);
  },
  INDEX_HTML: join(import.meta.dir, "index.html"),
  STYLES_DIR: join(import.meta.dir, "styles"),
} as const;

export const CURRENT_SESSION_ENV = "CLAUDE_HOOKS_VIEWER_SESSION";
```

## Acceptance Criteria
- [ ] PATHS.LOG_FILE removed
- [ ] PATHS.LOGS_DIR points to ../logs
- [ ] PATHS.getSessionLogPath(id) works correctly
- [ ] CURRENT_SESSION_ENV constant exported

## Verification
```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit
```bash
git add .claude/hooks/viewer/config.ts
git commit -m "feat(hooks): update viewer config for session-based logs"
```

## Next
Proceed to: prompts/03-types-update.md
