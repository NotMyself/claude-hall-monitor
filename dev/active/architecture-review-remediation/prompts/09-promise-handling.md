# Feature: F009 - Fix Unhandled Promise in Watcher

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000-F008**: All critical and high-priority security fixes completed

## Objective

Fix the unhandled promise rejection in the file watcher that could cause silent failures when reading log file updates.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D005**: Use console.error for catch blocks - matches existing logging pattern

## Edge Cases to Handle

From `edge-cases.md`:
- **EC006**: Existing log files with old format - no schema changes needed
- **EC011**: SSE client disconnection during write - catch errors in controller.enqueue()

## Code References

Read these sections before implementing:
- `code/typescript.md#promise-error-handling` - Promise error handling pattern

## Constraints

- See `constraints.md` for global rules
- Don't change any business logic
- Only add error handling

## Files to Modify

| File | Changes |
|------|---------|
| `.claude/hooks/viewer/watcher.ts` | Add .catch() to unhandled promise |

## Implementation Details

Locate the `checkForChanges()` method in watcher.ts (around line 139-165).

Find the unhandled promise:

```typescript
// Before (around line 149-155)
slice.text().then((content) => {
  const entries = this.parseLines(content);
  for (const entry of entries) {
    this.emit(entry);
  }
});

// After
slice.text()
  .then((content) => {
    const entries = this.parseLines(content);
    for (const entry of entries) {
      this.emit(entry);
    }
  })
  .catch((error) => {
    console.error("Error reading log file slice:", error);
  });
```

## Acceptance Criteria

- [ ] No unhandled promise rejections when log file read fails
- [ ] Error is logged to console with descriptive message
- [ ] Watcher continues operating after error
- [ ] Existing functionality unchanged
- [ ] TypeScript compiles without errors

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit

```bash
git add .claude/hooks/viewer/watcher.ts
git commit -m "$(cat <<'EOF'
fix(viewer): add error handling to file watcher promise

Add .catch() handler to log file slice read operation.
Prevents unhandled promise rejections.

Implements: F009
Decisions: D005
Edge cases: EC006

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/10-catch-logging.md` (F010)
