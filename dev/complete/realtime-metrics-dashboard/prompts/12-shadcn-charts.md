# Feature: F012 - Install shadcn/ui Chart Components

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F003**: Completed

## Objective

Install shadcn/ui chart components.

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

Run: `bun x shadcn@latest add chart`
bun x shadcn@latest add chart

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
feat(shadcn-charts): install shadcn/ui chart components

Install shadcn/ui chart components.

Implements: F012

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/13-*.md` (F013)
