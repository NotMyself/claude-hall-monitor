# Feature: F10 - Convert Sync File Read to Async

## Context
F01-F09 completed: All UI, code quality, and handler consistency fixes done.

## Objective
Replace synchronous `readFileSync` with async `Bun.file().text()` in the watcher's `listSessions()` method to prevent event loop blocking.

## Constraints
- Reference: See `constraints.md` for global rules
- Convert `listSessions()` to async
- Update all callers to await the result
- Use Bun's native file API for consistency with the rest of the codebase

## Files to Modify
- `.claude/hooks/viewer/watcher.ts` - Convert `listSessions()` to async (~line 91)
- `.claude/hooks/viewer/server.ts` - Update callers to await `listSessions()`

## Implementation Details

### 1. Update watcher.ts `listSessions()`:

**Before (~line 91):**
```typescript
static listSessions(): SessionInfo[] {
  // ...
  const content = readFileSync(file_path, 'utf-8');
  // ...
}
```

**After:**
```typescript
static async listSessions(): Promise<SessionInfo[]> {
  // ...
  const content = await Bun.file(file_path).text();
  // ...
}
```

### 2. Update server.ts callers:

Find all calls to `LogFileWatcher.listSessions()` and add `await`:

**Before:**
```typescript
const sessions = LogFileWatcher.listSessions();
```

**After:**
```typescript
const sessions = await LogFileWatcher.listSessions();
```

Also ensure the containing function is async if it isn't already.

### 3. Remove unused imports:
If `readFileSync` is no longer used in `watcher.ts`, remove the import.

## Acceptance Criteria
- [ ] `listSessions()` is now async and returns `Promise<SessionInfo[]>`
- [ ] Uses `Bun.file().text()` instead of `readFileSync`
- [ ] All callers in `server.ts` properly await the result
- [ ] Unused sync imports are removed
- [ ] Type checking passes: `bun run tsc --noEmit`
- [ ] All tests pass: `bun run test`

## Verification
```bash
cd .claude/hooks && bun run tsc --noEmit && bun run test:run
```

## Commit
```bash
git add .claude/hooks/viewer/watcher.ts .claude/hooks/viewer/server.ts
git commit -m "refactor(watcher): convert listSessions to async"
```

## Next
Proceed to: `prompts/11-add-logger-tests.md`
