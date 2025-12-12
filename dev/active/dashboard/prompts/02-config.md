# Feature: config - Dashboard Configuration

## Context

Project initialized. The viewer has existing configuration in `viewer/config.ts` with `SERVER_CONFIG`, `PATHS`, `SSE_CONFIG`, and `WATCHER_CONFIG`.

## Objective

Add dashboard-specific paths and timing configuration to `viewer/config.ts`.

**IMPORTANT**: Only implement this feature. Do not implement any other features.

## Constraints

Reference: See `constraints.md` for global rules.

- Add to existing `viewer/config.ts` file
- Follow existing `as const` pattern
- Handle Windows paths correctly using USERPROFILE environment variable

## Files to Modify

- `.claude/hooks/viewer/config.ts` - Add PATHS entries and DASHBOARD_CONFIG

## Implementation Details

### Add to PATHS object

Add these properties to the existing `PATHS` object:

```typescript
/** User's Claude home directory (~/.claude) */
CLAUDE_HOME: process.env.USERPROFILE
  ? join(process.env.USERPROFILE, ".claude")
  : join(process.env.HOME || "", ".claude"),

/** Path to global stats cache file */
get STATS_CACHE() {
  return join(this.CLAUDE_HOME, "stats-cache.json");
},

/** Path to commands directory */
COMMANDS_DIR: resolve(import.meta.dir, "..", "..", "commands"),

/** Path to skills directory */
SKILLS_DIR: resolve(import.meta.dir, "..", "..", "skills"),

/** Path to settings.json */
SETTINGS_FILE: resolve(import.meta.dir, "..", "..", "settings.json"),
```

### Add new DASHBOARD_CONFIG export

```typescript
/**
 * Dashboard-specific configuration
 */
export const DASHBOARD_CONFIG = {
  /** Session considered inactive after this many ms without heartbeat */
  HEARTBEAT_TIMEOUT_MS: 60_000, // 60 seconds

  /** Minimum interval between heartbeat writes */
  HEARTBEAT_INTERVAL_MS: 30_000, // 30 seconds

  /** Dashboard data refresh interval for UI polling */
  REFRESH_INTERVAL_MS: 5_000, // 5 seconds
} as const;
```

### Required imports

Ensure these are imported at the top:

```typescript
import { join, resolve } from "path";
```

## Acceptance Criteria

- [ ] `PATHS.CLAUDE_HOME` resolves to user's `.claude` directory
- [ ] `PATHS.STATS_CACHE` returns path to `stats-cache.json`
- [ ] `PATHS.COMMANDS_DIR` resolves to `.claude/commands/`
- [ ] `PATHS.SKILLS_DIR` resolves to `.claude/skills/`
- [ ] `PATHS.SETTINGS_FILE` resolves to `.claude/settings.json`
- [ ] `DASHBOARD_CONFIG.HEARTBEAT_TIMEOUT_MS` is 60000
- [ ] `DASHBOARD_CONFIG.HEARTBEAT_INTERVAL_MS` is 30000
- [ ] `DASHBOARD_CONFIG.REFRESH_INTERVAL_MS` is 5000
- [ ] Paths work on Windows (uses USERPROFILE)
- [ ] Type check passes with no errors

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit

```bash
git add .claude/hooks/viewer/config.ts
git commit -m "feat(dashboard): add dashboard configuration"
```

## Next

Proceed to: `prompts/03-heartbeat.md`
