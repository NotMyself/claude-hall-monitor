# Feature: 02-config - Configuration Module

## Context
Feature 01-types is complete. Type definitions exist in `.claude/hooks/viewer/types.ts`.

## Objective
Create a configuration module with constants for server settings, file paths, and timing intervals.

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- Use `import.meta.dir` for Bun-compatible path resolution
- Export typed constants
- No environment variables for now - hardcoded values

## Files to Create/Modify
- `.claude/hooks/viewer/config.ts` - Replace placeholder with configuration

## Implementation Details

```typescript
import { join, resolve } from "path";

/**
 * Server configuration
 */
export const SERVER_CONFIG = {
  /** HTTP server port */
  PORT: 3456,

  /** Hostname to bind to */
  HOST: "localhost",

  /** Full server URL */
  get URL() {
    return `http://${this.HOST}:${this.PORT}`;
  }
} as const;

/**
 * File paths configuration
 */
export const PATHS = {
  /** Directory containing viewer files */
  VIEWER_DIR: import.meta.dir,

  /** Path to hooks-log.txt (one level up from viewer/) */
  LOG_FILE: resolve(import.meta.dir, "..", "hooks-log.txt"),

  /** Path to index.html */
  INDEX_HTML: join(import.meta.dir, "index.html"),

  /** Path to styles directory */
  STYLES_DIR: join(import.meta.dir, "styles"),
} as const;

/**
 * SSE (Server-Sent Events) configuration
 */
export const SSE_CONFIG = {
  /** Heartbeat interval in milliseconds */
  HEARTBEAT_INTERVAL: 30_000, // 30 seconds

  /** Reconnect delay for clients (sent in retry field) */
  RECONNECT_DELAY: 3_000, // 3 seconds
} as const;

/**
 * File watcher configuration
 */
export const WATCHER_CONFIG = {
  /** Poll interval for file changes in milliseconds */
  POLL_INTERVAL: 500, // 500ms
} as const;
```

## Acceptance Criteria
- [ ] PORT constant set to 3456
- [ ] LOG_FILE path points to ../hooks-log.txt relative to viewer/
- [ ] SSE_HEARTBEAT_INTERVAL set to 30000ms
- [ ] PATHS.INDEX_HTML points to index.html
- [ ] PATHS.STYLES_DIR points to styles/
- [ ] All config exports are typed with `as const`
- [ ] File compiles without TypeScript errors

## Verification
```bash
cd .claude/hooks && bun run tsc --noEmit viewer/config.ts
```

## Commit
After verification passes:
```bash
git add .claude/hooks/viewer/config.ts
git commit -m "feat(viewer): add configuration module

- Server config: port 3456, localhost binding
- File paths: log file, index.html, styles directory
- SSE config: 30s heartbeat, 3s reconnect delay
- Watcher config: 500ms poll interval"
```

## Next
Proceed to: `prompts/03-watcher.md`
