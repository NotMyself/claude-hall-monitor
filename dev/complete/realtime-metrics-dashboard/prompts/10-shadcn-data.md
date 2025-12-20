# Feature: F010 - Install shadcn/ui Data Display Components

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F003**: shadcn/ui configured

## Objective

Install shadcn/ui components for data display: card, badge, progress, table, tabs.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D010**: shadcn/ui component library

## Constraints

- See `constraints.md` for global rules
- Use shadcn/ui CLI

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `hooks/viewer/src/components/ui/*` | shadcn/ui components |

## Implementation Details

```bash
cd C:/Users/bobby/src/claude/claude-hall-monitor/hooks/viewer
bun x shadcn@latest add card badge progress table tabs
```

## Acceptance Criteria

- [ ] All components installed
- [ ] TypeScript compiles without errors

## Verification

```bash
cd C:/Users/bobby/src/claude/claude-hall-monitor/hooks/viewer
bun run tsc --noEmit
```

## Commit

```bash
git add hooks/viewer/src/components/ui/
git commit -m "$(cat <<'COMMITEOF'
feat(shadcn-data): install shadcn/ui data display components

Install card, badge, progress, table, and tabs components.

Implements: F010
Decisions: D010

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
COMMITEOF
)"
```

## Next

Proceed to: `prompts/11-shadcn-forms.md` (F011)
