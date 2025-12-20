# Feature: F009 - Install shadcn/ui Layout Components

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F003**: shadcn/ui configured
- **F008**: Data hooks created

## Objective

Install shadcn/ui components needed for layout: sidebar, sheet, separator, scroll-area.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D010**: shadcn/ui component library — Use CLI to install components

## Code References

Read these sections before implementing:
- `code/bash.md#shadcn-install` - Component installation commands

## Constraints

- See `constraints.md` for global rules
- Use shadcn/ui CLI: `bun x shadcn@latest add <component>`
- Do not manually create components

## Implementation Details

Install these components:
```bash
bun x shadcn@latest add sidebar
bun x shadcn@latest add sheet
bun x shadcn@latest add separator
bun x shadcn@latest add scroll-area
```

## Acceptance Criteria

- [ ] sidebar component installed
- [ ] sheet component installed
- [ ] separator component installed
- [ ] scroll-area component installed
- [ ] All components in src/components/ui/
- [ ] TypeScript compiles without errors

## Verification

```bash
cd C:/Users/bobby/src/claude/claude-hall-monitor/hooks/viewer
bun run tsc --noEmit
ls src/components/ui/ | grep -E "(sidebar|sheet|separator|scroll-area)"
```

## Commit

```bash
git add hooks/viewer/src/components/ui/
git commit -m "$(cat <<'COMMITEOF'
feat(viewer): install shadcn/ui layout components

Add sidebar, sheet, separator, and scroll-area components for
dashboard layout structure.

Implements: F009
Decisions: D010

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
COMMITEOF
)"
```

## Next

Proceed to: `prompts/10-shadcn-data.md` (F010)
