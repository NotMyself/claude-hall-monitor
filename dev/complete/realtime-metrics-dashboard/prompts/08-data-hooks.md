# Feature: F008 - Create Data Fetching Hooks

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F006**: API client implemented
- **F007**: SSE hook created

## Objective

Create custom hooks for fetching plans, metrics, and sessions data.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Code References

Read these sections before implementing:
- `code/typescript.md#hooks` - usePlans, useMetrics, useSessions implementations

## Constraints

- See `constraints.md` for global rules
- Integrate SSE for realtime plan updates
- Handle loading and error states
- Use API client from F006

## Files to Create

| File | Purpose |
|------|---------|
| `hooks/viewer/src/hooks/use-plans.ts` | Plans data + SSE updates |
| `hooks/viewer/src/hooks/use-metrics.ts` | Metrics data fetching |
| `hooks/viewer/src/hooks/use-sessions.ts` | Sessions data fetching |

## Implementation Details

Each hook should:
- Fetch data using API client
- Track loading/error states
- usePlans: Integrate SSE for realtime updates
- Return typed data

See `code/typescript.md#hooks` for complete implementations.

## Acceptance Criteria

- [ ] use-plans.ts created with SSE integration
- [ ] use-metrics.ts created
- [ ] use-sessions.ts created
- [ ] All hooks handle loading/error states
- [ ] TypeScript compiles without errors

## Verification

```bash
cd C:/Users/bobby/src/claude/claude-hall-monitor/hooks/viewer
bun run tsc --noEmit
```

## Commit

```bash
git add hooks/viewer/src/hooks/
git commit -m "$(cat <<'EOF'
feat(viewer): create data fetching hooks

Implement custom hooks for plans, metrics, and sessions data
with loading/error states and SSE integration for realtime updates.

Implements: F008

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/09-shadcn-layout.md` (F009)
