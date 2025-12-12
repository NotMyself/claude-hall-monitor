# Feature: F06 - Fix ensureLogsDir Race Condition

## Context
F01-F05 completed: UI fixes and config constants done.

## Objective
Replace the check-then-create pattern in `ensureLogsDir()` with an atomic mkdir operation that handles EEXIST gracefully.

## Constraints
- Reference: See `constraints.md` for global rules
- Only modify the `ensureLogsDir()` function
- Keep the function async
- Handle EEXIST error (directory already exists) silently

## Files to Modify
- `.claude/hooks/utils/logger.ts` - Update `ensureLogsDir()` function (~lines 88-92)

## Implementation Details

Current code (around lines 88-92):
```typescript
async function ensureLogsDir(): Promise<void> {
  if (!existsSync(LOGS_DIR)) {
    await mkdir(LOGS_DIR, { recursive: true });
  }
}
```

Updated code:
```typescript
async function ensureLogsDir(): Promise<void> {
  try {
    await mkdir(LOGS_DIR, { recursive: true });
  } catch (err) {
    // Ignore EEXIST - directory already exists (race condition or pre-existing)
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw err;
    }
  }
}
```

Note: You may also need to remove the `existsSync` import if it's no longer used elsewhere in the file.

## Acceptance Criteria
- [ ] `ensureLogsDir()` uses try/catch instead of check-then-create
- [ ] EEXIST errors are handled silently
- [ ] Other errors are re-thrown
- [ ] Unused imports are removed (if `existsSync` is no longer needed)
- [ ] Type checking passes: `bun run tsc --noEmit`

## Verification
```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit
```bash
git add .claude/hooks/utils/logger.ts
git commit -m "fix(logger): eliminate race condition in ensureLogsDir"
```

## Next
Proceed to: `prompts/07-type-settings-parsing.md`
