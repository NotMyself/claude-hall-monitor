# Code Review Resolution Plan

**Created**: 2025-12-12
**Source**: `dev/active/code-review/review.md`

---

## Priority 1: High (Bug Fixes / Breaking Issues)

### 1.1 Clear dashboard poll interval on unmount
**File**: `.claude/hooks/viewer/index.html:288-293`
**Issue**: `dashboardPollInterval` is set in `onMounted()` but never cleared in `onUnmounted()`, causing a memory leak and continued polling after component destruction.

**Fix**:
```javascript
onUnmounted(() => {
  disconnect();
  if (dashboardPollInterval) {
    clearInterval(dashboardPollInterval);
  }
});
```

**Effort**: Small
**Risk**: Low

---

### 1.2 Fix deprecated `beforeDestroy` lifecycle hook
**File**: `.claude/hooks/viewer/index.html:465`
**Issue**: Vue 3 deprecated `beforeDestroy` in favor of `beforeUnmount`. This will cause warnings and eventually break in future Vue versions.

**Fix**: Change `beforeDestroy()` to `beforeUnmount()` in the event-filter-dropdown component.

**Effort**: Trivial
**Risk**: Low

---

### 1.3 Remove hardcoded user path
**File**: `.claude/hooks/viewer/index.html:671`
**Issue**: Hardcoded `C:\\\\Users\\\\BobbyJohnson` breaks portability for other users.

**Fix**: Replace with dynamic home directory detection or remove entirely:
```javascript
cleanupPaths(json) {
  // Detect home directory pattern dynamically
  // Match C:\Users\<username> or /home/<username> or /Users/<username>
  json = json.replace(/C:\\\\Users\\\\[^\\\\]+/g, '~');
  json = json.replace(/\/home\/[^/]+/g, '~');
  json = json.replace(/\/Users\/[^/]+/g, '~');

  // Convert remaining escaped backslashes to forward slashes
  json = json.replace(/\\\\/g, '/');
  return json;
}
```

**Effort**: Small
**Risk**: Low

---

## Priority 2: Medium (Code Quality / Consistency)

### 2.1 Fix badge class case mismatch
**File**: `.claude/hooks/viewer/index.html:494`
**Issue**: CSS uses PascalCase (`.badge-SessionStart`) but code uses `.toLowerCase()` producing `.badge-sessionstart`.

**Fix**: Remove the `.toLowerCase()` call:
```html
<span class="event-badge" :class="'badge-' + event">
```

**Effort**: Trivial
**Risk**: Low

---

### 2.2 Convert sync file read to async in watcher
**File**: `.claude/hooks/viewer/watcher.ts:91`
**Issue**: `readFileSync` blocks the event loop in `listSessions()`.

**Fix**: Convert to async and update callers:
```typescript
static async listSessions(): Promise<SessionInfo[]> {
  // Use await Bun.file().text() or fs.promises.readFile
}
```

**Effort**: Medium (requires updating callers)
**Risk**: Medium

---

### 2.3 Add handler tests
**Directory**: `.claude/hooks/handlers/`
**Issue**: All 12 handler scripts lack test coverage.

**Fix**: Create `.claude/hooks/handlers/__tests__/` with tests for each handler:
- Test input parsing
- Test output format
- Test logging behavior
- Mock stdin/stdout for isolation

**Effort**: Large
**Risk**: Low

---

### 2.4 Wrap handlers in consistent async main()
**Files**: All handlers, specifically `session-end.ts:83`
**Issue**: Some handlers use top-level await while others wrap in `async main()`.

**Fix**: Standardize all handlers to use:
```typescript
async function main() {
  const input = await readInput<HookInput>();
  // ... handler logic
}

main();
```

**Effort**: Medium
**Risk**: Low

---

### 2.5 Extract magic numbers to constants
**Files**:
- `.claude/hooks/viewer/server.ts:201` (shutdown delay: 100ms)
- `.claude/hooks/viewer/config.ts` (add constants)

**Fix**: Add to `config.ts`:
```typescript
export const SHUTDOWN_DELAY_MS = 100;
export const DASHBOARD_POLL_INTERVAL_MS = 5000;
export const FILE_WATCH_INTERVAL_MS = 500;
```

**Effort**: Small
**Risk**: Low

---

## Priority 3: Low (Polish / Best Practices)

### 3.1 Fix race condition in ensureLogsDir
**File**: `.claude/hooks/utils/logger.ts:88-92`
**Issue**: Check-then-create pattern could race in concurrent scenarios.

**Fix**:
```typescript
async function ensureLogsDir(): Promise<void> {
  try {
    await mkdir(LOGS_DIR, { recursive: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw err;
    }
  }
}
```

**Effort**: Small
**Risk**: Low

---

### 3.2 Type the settings hooks parsing
**File**: `.claude/hooks/viewer/dashboard.ts:252`
**Issue**: `as any[]` loses type safety.

**Fix**: Define proper type:
```typescript
interface HookConfig {
  hooks: Record<string, Array<{
    command: string;
    timeout?: number;
    matcher?: object;
  }>>;
}
```

**Effort**: Small
**Risk**: Low

---

### 3.3 Add debug-level logging for caught errors
**Files**: `.claude/hooks/viewer/dashboard.ts` (multiple catch blocks)
**Issue**: Empty catch blocks silently swallow errors.

**Fix**: Add console.debug or structured logging:
```typescript
} catch (err) {
  console.debug('Failed to parse hooks config:', err);
  return [];
}
```

**Effort**: Small
**Risk**: Low

---

### 3.4 Add logger utility tests
**File**: `.claude/hooks/utils/__tests__/logger.test.ts` (new)
**Issue**: Core logging functionality is untested.

**Fix**: Create test file covering:
- `log()` writes correct JSONL format
- `readInput()` parses JSON correctly
- `writeOutput()` outputs correct format
- `getLogPath()` returns correct paths
- Heartbeat throttling works

**Effort**: Medium
**Risk**: Low

---

## Implementation Order

Execute in this order for optimal flow:

```
Phase 1: Quick Wins (1-2 hours)
├── 1.1 Clear dashboard poll interval
├── 1.2 Fix beforeDestroy → beforeUnmount
├── 1.3 Remove hardcoded user path
├── 2.1 Fix badge class case
└── 2.5 Extract magic numbers

Phase 2: Consistency (2-3 hours)
├── 2.4 Wrap handlers in async main()
├── 3.1 Fix ensureLogsDir race condition
├── 3.2 Type settings hooks parsing
└── 3.3 Add debug logging

Phase 3: Async Improvements (1-2 hours)
└── 2.2 Convert sync file reads to async

Phase 4: Test Coverage (4-6 hours)
├── 2.3 Add handler tests
└── 3.4 Add logger utility tests
```

---

## Verification Checklist

After each fix:
- [ ] Run `bun run tsc --noEmit` for type checking
- [ ] Run `bun run test` for existing tests
- [ ] Start viewer and verify functionality
- [ ] Check browser console for errors

After all fixes:
- [ ] Run full test suite with coverage
- [ ] Manual E2E test of all hooks
- [ ] Update CLAUDE.md if needed

---

## Summary

| Priority | Count | Est. Effort |
|----------|-------|-------------|
| High     | 3     | ~1 hour     |
| Medium   | 5     | ~4 hours    |
| Low      | 4     | ~3 hours    |
| **Total**| **12**| ~8 hours    |
