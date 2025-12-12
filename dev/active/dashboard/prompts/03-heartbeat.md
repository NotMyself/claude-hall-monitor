# Feature: heartbeat - Heartbeat Logging Function

## Context

Types and config are complete. The logger utility in `utils/logger.ts` provides:
- `log(event, session_id, data)` - Writes JSONL to session log
- `readInput<T>()` - Reads JSON from stdin
- `writeOutput(output)` - Writes JSON to stdout

## Objective

Add a `maybeWriteHeartbeat()` function to the logger that periodically writes heartbeat events to track session activity.

**IMPORTANT**: Only implement this feature. Do not implement any other features.

## Constraints

Reference: See `constraints.md` for global rules.

- Add to existing `utils/logger.ts` file
- Use the existing `log()` function internally
- Throttle heartbeats to avoid excessive writes
- Track cumulative tool and message counts

## Files to Modify

- `.claude/hooks/utils/logger.ts` - Add heartbeat function and state

## Implementation Details

Add module-level state variables and the heartbeat function:

```typescript
/**
 * Heartbeat state tracking
 */
let lastHeartbeatTime = 0;
let sessionToolCount = 0;
let sessionMessageCount = 0;

/** Minimum interval between heartbeats in milliseconds */
const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds

/**
 * Conditionally writes a heartbeat entry if enough time has passed.
 *
 * Heartbeats are used by the dashboard to detect active sessions.
 * They are throttled to avoid excessive log writes.
 *
 * @param session_id - Session identifier
 * @param incrementTool - Whether to increment the tool counter
 * @param incrementMessage - Whether to increment the message counter
 *
 * @example Called from pre-tool-use handler
 * ```typescript
 * await maybeWriteHeartbeat(input.session_id, true, false);
 * ```
 *
 * @example Called from user-prompt-submit handler
 * ```typescript
 * await maybeWriteHeartbeat(input.session_id, false, true);
 * ```
 */
export async function maybeWriteHeartbeat(
  session_id: string,
  incrementTool: boolean = false,
  incrementMessage: boolean = false
): Promise<void> {
  // Update counters
  if (incrementTool) sessionToolCount++;
  if (incrementMessage) sessionMessageCount++;

  // Check if enough time has passed
  const now = Date.now();
  if (now - lastHeartbeatTime < HEARTBEAT_INTERVAL_MS) {
    return; // Too soon for another heartbeat
  }

  // Update timestamp and write heartbeat
  lastHeartbeatTime = now;

  await log("Heartbeat", session_id, {
    tool_count: sessionToolCount,
    message_count: sessionMessageCount,
  });
}

/**
 * Resets heartbeat state. Useful for testing.
 */
export function resetHeartbeatState(): void {
  lastHeartbeatTime = 0;
  sessionToolCount = 0;
  sessionMessageCount = 0;
}
```

## Acceptance Criteria

- [ ] `maybeWriteHeartbeat` function is exported
- [ ] Function increments tool_count when incrementTool is true
- [ ] Function increments message_count when incrementMessage is true
- [ ] Function throttles writes to 30 second minimum intervals
- [ ] Function writes "Heartbeat" event via existing log() function
- [ ] Heartbeat data includes tool_count and message_count
- [ ] `resetHeartbeatState` function exported for testing
- [ ] Type check passes with no errors

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit

```bash
git add .claude/hooks/utils/logger.ts
git commit -m "feat(dashboard): add heartbeat logging function"
```

## Next

Proceed to: `prompts/04-heartbeat-handlers.md`
