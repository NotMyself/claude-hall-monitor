# Feature: config - Plan Tracker Configuration

## Context

The viewer has configuration in `.claude/hooks/viewer/config.ts` for paths, timing, and other settings. We need to add plan-specific configuration.

## Objective

Add paths and configuration for plan directories to `config.ts`.

## Constraints

- Reference: See constraints.md for global rules
- Add to existing PATHS object
- Create new PLAN_CONFIG constant
- Paths should resolve relative to project root

## Files to Create/Modify

- `.claude/hooks/viewer/config.ts` - Add plan configuration

## Implementation Details

Add to the `PATHS` object:

```typescript
/** Project root directory (parent of .claude) */
PROJECT_ROOT: resolve(import.meta.dir, "..", "..", ".."),

/** Directory containing active plans */
get DEV_ACTIVE_DIR() {
  return join(this.PROJECT_ROOT, "dev", "active");
},

/** Directory containing completed plans */
get DEV_COMPLETE_DIR() {
  return join(this.PROJECT_ROOT, "dev", "complete");
},

/** Get path to a plan's features.json */
getPlanFeaturesPath(planDir: string): string {
  return join(planDir, "features.json");
},
```

Add new config constant:

```typescript
/**
 * Plan tracker configuration
 */
export const PLAN_CONFIG = {
  /** Poll interval for plan file changes in milliseconds */
  POLL_INTERVAL_MS: 1_000, // 1 second for responsive updates during orchestration

  /** Maximum number of completed plans to show */
  MAX_COMPLETED_PLANS: 10,
} as const;
```

## Acceptance Criteria

- [ ] PATHS.PROJECT_ROOT resolves to project root
- [ ] PATHS.DEV_ACTIVE_DIR points to dev/active
- [ ] PATHS.DEV_COMPLETE_DIR points to dev/complete
- [ ] PATHS.getPlanFeaturesPath() helper works
- [ ] PLAN_CONFIG with poll interval defined
- [ ] Type check passes

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit

```bash
git add .claude/hooks/viewer/config.ts
git commit -m "feat(plan-tracker): add configuration for plan directories"
```

## Next

Proceed to: `03-plan-watcher.md`
