# Feature: F05 - Extract Magic Numbers to Constants

## Context
F01-F04 completed: All high priority and badge fixes done.

## Objective
Move hardcoded numeric values to named constants in `config.ts` for maintainability and clarity.

## Constraints
- Reference: See `constraints.md` for global rules
- Add new constants to existing `config.ts` file
- Update `server.ts` to use the new constant
- Do not change the actual timing values, just name them

## Files to Modify
- `.claude/hooks/viewer/config.ts` - Add new constants
- `.claude/hooks/viewer/server.ts` - Import and use `SHUTDOWN_DELAY_MS` (~line 201)

## Implementation Details

### 1. Add constants to `config.ts`:
```typescript
// Timing constants
export const SHUTDOWN_DELAY_MS = 100;
export const DASHBOARD_POLL_INTERVAL_MS = 5000;
export const FILE_WATCH_INTERVAL_MS = 500;
export const SSE_HEARTBEAT_INTERVAL_MS = 30000;
```

### 2. Update `server.ts` (~line 201):

Current code:
```typescript
setTimeout(() => {
  process.exit(0);
}, 100);
```

Updated code:
```typescript
import { SHUTDOWN_DELAY_MS } from './config';

// ... later in the file ...

setTimeout(() => {
  process.exit(0);
}, SHUTDOWN_DELAY_MS);
```

## Acceptance Criteria
- [ ] `SHUTDOWN_DELAY_MS` constant added to `config.ts`
- [ ] `DASHBOARD_POLL_INTERVAL_MS` constant added to `config.ts`
- [ ] `FILE_WATCH_INTERVAL_MS` constant added to `config.ts`
- [ ] `SSE_HEARTBEAT_INTERVAL_MS` constant added to `config.ts`
- [ ] `server.ts` imports and uses `SHUTDOWN_DELAY_MS`
- [ ] Type checking passes: `bun run tsc --noEmit`
- [ ] All tests pass: `bun run test`

## Verification
```bash
cd .claude/hooks && bun run tsc --noEmit && bun run test:run
```

## Commit
```bash
git add .claude/hooks/viewer/config.ts .claude/hooks/viewer/server.ts
git commit -m "refactor(viewer): extract magic numbers to named constants"
```

## Next
Proceed to: `prompts/06-fix-ensure-logs-dir.md`
