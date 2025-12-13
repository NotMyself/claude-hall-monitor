# Feature: F011 - Handler Top-Level Error Handling

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000-F010**: All critical, high-priority, and error handling fixes completed

## Objective

Add top-level error handling to all 12 hook handlers to ensure they always output valid JSON, even when encountering errors.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D009**: Top-level try/catch with safe default output. Handlers must always produce valid JSON. If handler crashes, output `{ continue: true }` as safe default.

## Edge Cases to Handle

From `edge-cases.md`:
- **EC010**: Concurrent handler errors - each handler process is independent, so this doesn't cause issues

## Code References

Read these sections before implementing:
- `code/typescript.md#handler-error-wrapper` - Handler error wrapper pattern

## Constraints

- See `constraints.md` for global rules
- Don't modify handler logic, only wrap main() call
- All 12 handlers must be updated
- Consistent pattern across all handlers

## Files to Modify

| File | Handler |
|------|---------|
| `.claude/hooks/handlers/notification.ts` | Notification |
| `.claude/hooks/handlers/permission-request.ts` | PermissionRequest |
| `.claude/hooks/handlers/post-tool-use-failure.ts` | PostToolUseFailure |
| `.claude/hooks/handlers/post-tool-use.ts` | PostToolUse |
| `.claude/hooks/handlers/pre-compact.ts` | PreCompact |
| `.claude/hooks/handlers/pre-tool-use.ts` | PreToolUse |
| `.claude/hooks/handlers/session-end.ts` | SessionEnd |
| `.claude/hooks/handlers/session-start.ts` | SessionStart |
| `.claude/hooks/handlers/stop.ts` | Stop |
| `.claude/hooks/handlers/subagent-start.ts` | SubagentStart |
| `.claude/hooks/handlers/subagent-stop.ts` | SubagentStop |
| `.claude/hooks/handlers/user-prompt-submit.ts` | UserPromptSubmit |

## Implementation Details

For each handler file, wrap the final `await main();` call:

```typescript
// Before (at end of file)
await main();

// After
try {
  await main();
} catch (error) {
  console.error("Handler error:", error);
  writeOutput({ continue: true });
  process.exit(1);
}
```

Note: The `writeOutput` function is already imported in each handler.

### Example complete transformation for pre-tool-use.ts:

```typescript
// At end of file, replace:
await main();

// With:
try {
  await main();
} catch (error) {
  console.error("Handler error:", error);
  writeOutput({ continue: true });
  process.exit(1);
}
```

## Acceptance Criteria

- [ ] All 12 handler files have try/catch around main()
- [ ] Error message logged with console.error
- [ ] Safe default `{ continue: true }` output on error
- [ ] Process exits with code 1 on error
- [ ] TypeScript compiles without errors
- [ ] Existing tests still pass

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit && bun run test:run
```

## Commit

```bash
git add .claude/hooks/handlers/*.ts
git commit -m "$(cat <<'EOF'
fix(handlers): add top-level error handling to all handlers

Wrap main() in try/catch to ensure valid JSON output even on errors.
Output safe default { continue: true } on crash.

Implements: F011
Decisions: D009
Edge cases: EC010

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/12-rate-limiting.md` (F012)
