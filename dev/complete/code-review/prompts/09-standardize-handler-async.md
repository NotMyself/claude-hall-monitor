# Feature: F09 - Standardize Handler Async Pattern

## Context
F01-F08 completed: All quick wins and code quality fixes done.

## Objective
Wrap all hook handlers in a consistent `async main()` function pattern for code consistency and better error handling.

## Constraints
- Reference: See `constraints.md` for global rules
- Only modify the execution structure, not the handler logic
- Use the same pattern as `session-start.ts` (which already uses `main()`)
- Do not modify `session-start.ts` (it's already correct)

## Files to Modify
Check and update these handlers if they use top-level await instead of `main()`:
- `.claude/hooks/handlers/session-end.ts`
- `.claude/hooks/handlers/pre-tool-use.ts`
- `.claude/hooks/handlers/post-tool-use.ts`
- `.claude/hooks/handlers/post-tool-use-failure.ts`
- `.claude/hooks/handlers/notification.ts`
- `.claude/hooks/handlers/stop.ts`
- `.claude/hooks/handlers/subagent-start.ts`
- `.claude/hooks/handlers/subagent-stop.ts`
- `.claude/hooks/handlers/pre-compact.ts`
- `.claude/hooks/handlers/permission-request.ts`
- `.claude/hooks/handlers/user-prompt-submit.ts`

## Implementation Details

### Reference Pattern (from session-start.ts):
```typescript
async function main() {
  const input = await readInput<SessionStartHookInput>();

  // ... handler logic ...

  writeOutput(output);
}

main();
```

### Transformation for handlers using top-level await:

**Before:**
```typescript
// Read input
const input = await readInput<SomeHookInput>();

// Process
await log("Event", input.session_id, { ... });

// Output
writeOutput(output);
```

**After:**
```typescript
async function main() {
  // Read input
  const input = await readInput<SomeHookInput>();

  // Process
  await log("Event", input.session_id, { ... });

  // Output
  writeOutput(output);
}

main();
```

## Acceptance Criteria
- [ ] All handlers use `async function main()` pattern
- [ ] All handlers call `main()` at the end
- [ ] Handler logic remains unchanged
- [ ] All handlers still work correctly
- [ ] Type checking passes: `bun run tsc --noEmit`

## Verification
```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit
```bash
git add .claude/hooks/handlers/
git commit -m "refactor(handlers): standardize async main() pattern"
```

## Next
Proceed to: `prompts/10-convert-sync-to-async.md`
