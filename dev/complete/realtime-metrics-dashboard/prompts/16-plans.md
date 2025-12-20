# Feature: F016 - Build Active Orchestrations Component

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F015, F008**: Completed

## Objective

Create active-orchestrations with SSE integration.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Code References

Read these sections before implementing:
- `code/typescript.md` - Implementation patterns
- `code/css.md` - Styling patterns (if applicable)

## Constraints

- See `constraints.md` for global rules

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `hooks/viewer/src/**/*` | See objective |

## Implementation Details


See code references for implementation patterns.

## Acceptance Criteria

- [ ] All files created/modified
- [ ] TypeScript compiles without errors
- [ ] Functionality verified

## Verification

```bash
cd C:/Users/bobby/src/claude/claude-hall-monitor/hooks/viewer
bun run tsc --noEmit
```

## Commit

```bash
git add hooks/viewer/
git commit -m "$(cat <<'EOF'
feat(plans): build active orchestrations component

Create active-orchestrations with SSE integration.

Implements: F016

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/17-*.md` (F017)
