# Feature: heartbeat-handlers - Integrate Heartbeat in Handlers

## Context

The heartbeat function is implemented in `utils/logger.ts`. Now we need to call it from the high-frequency hook handlers to generate heartbeat events during active sessions.

## Objective

Integrate `maybeWriteHeartbeat()` calls into `pre-tool-use.ts` and `user-prompt-submit.ts` handlers.

**IMPORTANT**: Only implement this feature. Do not implement any other features.

## Constraints

Reference: See `constraints.md` for global rules.

- Minimal changes to existing handlers
- Call heartbeat after the main log() call
- Do not modify handler output behavior

## Files to Modify

- `.claude/hooks/handlers/pre-tool-use.ts` - Add heartbeat call
- `.claude/hooks/handlers/user-prompt-submit.ts` - Add heartbeat call

## Implementation Details

### pre-tool-use.ts

Add import at top:

```typescript
import { log, readInput, writeOutput, maybeWriteHeartbeat } from "../utils/logger.ts";
```

Add heartbeat call after the existing `log()` call, before `writeOutput()`:

```typescript
// After: await log("PreToolUse", input.session_id, { ... });
// Add:
await maybeWriteHeartbeat(input.session_id, true, false);

// Before: writeOutput({ ... });
```

### user-prompt-submit.ts

Add import at top:

```typescript
import { log, readInput, writeOutput, maybeWriteHeartbeat } from "../utils/logger.ts";
```

Add heartbeat call after the existing `log()` call, before `writeOutput()`:

```typescript
// After: await log("UserPromptSubmit", input.session_id, { ... });
// Add:
await maybeWriteHeartbeat(input.session_id, false, true);

// Before: writeOutput({ ... });
```

## Acceptance Criteria

- [ ] `pre-tool-use.ts` imports `maybeWriteHeartbeat`
- [ ] `pre-tool-use.ts` calls `maybeWriteHeartbeat(session_id, true, false)`
- [ ] `user-prompt-submit.ts` imports `maybeWriteHeartbeat`
- [ ] `user-prompt-submit.ts` calls `maybeWriteHeartbeat(session_id, false, true)`
- [ ] Heartbeat calls are placed after log() and before writeOutput()
- [ ] Handler output behavior is unchanged
- [ ] Type check passes with no errors

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit

```bash
git add .claude/hooks/handlers/pre-tool-use.ts .claude/hooks/handlers/user-prompt-submit.ts
git commit -m "feat(dashboard): integrate heartbeat in handlers"
```

## Next

Proceed to: `prompts/05-dashboard-service.md`
