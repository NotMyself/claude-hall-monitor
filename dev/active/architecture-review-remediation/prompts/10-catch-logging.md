# Feature: F010 - Add Logging to Silent Catch Blocks

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000-F009**: All critical and high-priority security fixes completed

## Objective

Replace all silent/empty catch blocks with console.error logging to aid debugging and prevent hidden failures.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D005**: Use console.error for catch blocks - matches existing logging pattern, low overhead

## Edge Cases to Handle

From `edge-cases.md`:
- **EC006**: Existing log files with old format - just log the parse error, don't crash
- **EC011**: SSE client disconnection - already logged as "Client disconnected" in comments

## Code References

Read these sections before implementing:
- `code/typescript.md#catch-block-logging` - Catch block pattern

## Constraints

- See `constraints.md` for global rules
- Don't change business logic, only add logging
- Some catch blocks intentionally skip errors (e.g., "Client disconnected") - add comment if already there

## Files to Modify

| File | Locations |
|------|-----------|
| `.claude/hooks/viewer/watcher.ts` | parseLines(), getAllEntries(), listSessions() |
| `.claude/hooks/viewer/plan-watcher.ts` | loadPlans(), parseFeaturesFile() |
| `.claude/hooks/viewer/server.ts` | SSE handlers (client disconnect cases) |
| `.claude/hooks/viewer/dashboard.ts` | Error handling in stats loading |
| `.claude/hooks/viewer/session-summary.ts` | JSON parsing errors |

## Implementation Details

### Pattern for silent catch blocks

```typescript
// Before
} catch {
  // Skip invalid JSON
}

// After
} catch (error) {
  console.error("Failed to parse JSON:", error);
}
```

### Pattern for expected errors (client disconnect)

```typescript
// Before
} catch {
  // Client disconnected
}

// After
} catch {
  // Expected: client disconnected during write
}
```

### Specific locations to update

**watcher.ts:**
- `parseLines()` - JSON parse errors
- `getAllEntries()` - file read errors
- `listSessions()` - file read/parse errors

**plan-watcher.ts:**
- `loadPlans()` - directory read errors
- `parseFeaturesFile()` - JSON parse errors
- Any other empty catch blocks

**server.ts:**
- SSE stream write errors (mark as expected, client disconnect)

**dashboard.ts:**
- Stats loading errors

**session-summary.ts:**
- JSON parsing errors

Search for empty catch blocks with regex: `catch\s*\{?\s*\}` or `catch\s*\([^)]*\)\s*\{\s*\}`

## Acceptance Criteria

- [ ] No empty catch blocks remain (except documented client disconnect cases)
- [ ] All error catch blocks log to console.error
- [ ] Expected errors (client disconnect) have clear comments
- [ ] Existing functionality unchanged
- [ ] TypeScript compiles without errors

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit
```

To find remaining empty catch blocks:
```bash
cd .claude/hooks && grep -rn "catch.*{" --include="*.ts" | grep -v node_modules | grep -v "console\|error\|//"
```

## Commit

```bash
git add .claude/hooks/viewer/watcher.ts .claude/hooks/viewer/plan-watcher.ts .claude/hooks/viewer/server.ts .claude/hooks/viewer/dashboard.ts .claude/hooks/viewer/session-summary.ts
git commit -m "$(cat <<'EOF'
fix(viewer): add logging to silent catch blocks

Replace empty catch blocks with console.error logging.
Document expected errors (client disconnect) with comments.

Implements: F010
Decisions: D005
Edge cases: EC006, EC011

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/11-handler-errors.md` (F011)
