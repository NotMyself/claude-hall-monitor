# Feature: F005 - Define TypeScript Types

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000-F004**: Project setup, routing, and configuration complete

## Objective

Define all TypeScript interfaces and types for metrics, plans, and sessions.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Code References

Read these sections before implementing:
- `code/typescript.md#types` - Complete type definitions

## Constraints

- See `constraints.md` for global rules
- Match API response shapes exactly
- Export all types for use in other files

## Files to Create

| File | Purpose |
|------|---------|
| `hooks/viewer/src/types/metrics.ts` | Metric, Token, Cost types |
| `hooks/viewer/src/types/plans.ts` | Plan, Feature, PlanEvent types |
| `hooks/viewer/src/types/sessions.ts` | Session, DashboardStats types |

## Implementation Details

See `code/typescript.md#types` for complete definitions of:
- `MetricEntry`, `TokenUsage`, `CostBreakdown`
- `Plan`, `Feature`, `PlanEvent`
- `Session`, `DashboardStats`

## Acceptance Criteria

- [ ] All type files created
- [ ] Types match API response shapes
- [ ] All types exported
- [ ] TypeScript compiles without errors

## Verification

```bash
cd C:/Users/bobby/src/claude/claude-hall-monitor/hooks/viewer
bun run tsc --noEmit
```

## Commit

```bash
git add hooks/viewer/src/types/
git commit -m "$(cat <<'EOF'
feat(viewer): define TypeScript types for metrics, plans, sessions

Create comprehensive type definitions matching API response shapes
for all data models used in the dashboard.

Implements: F005

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/06-api-client.md` (F006)
