# Feature: F007 - Create SSE Connection Hook

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F005**: Types defined
- **F006**: API client implemented

## Objective

Create custom hook for SSE connections with auto-reconnect logic.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D007**: SSE for realtime updates — More efficient than polling

## Edge Cases to Handle

From `edge-cases.md`:
- **EC001**: SSE disconnection → Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)

## Code References

Read these sections before implementing:
- `code/typescript.md#hooks` - useSSE implementation with reconnect logic

## Constraints

- See `constraints.md` for global rules
- Exponential backoff: 1s → 2s → 4s → 8s → 30s max
- Track connection status
- Clean up on unmount

## Files to Create

| File | Purpose |
|------|---------|
| `hooks/viewer/src/hooks/use-sse.ts` | SSE hook with auto-reconnect |

## Implementation Details

Hook should:
- Accept URL and callback
- Auto-connect on mount
- Auto-reconnect with exponential backoff on disconnect
- Return connection status
- Clean up on unmount

See `code/typescript.md#hooks` for complete implementation.

## Acceptance Criteria

- [ ] use-sse.ts hook created
- [ ] Auto-reconnect with exponential backoff
- [ ] Connection status tracking
- [ ] Cleanup on unmount
- [ ] TypeScript compiles without errors

## Verification

```bash
cd C:/Users/bobby/src/claude/claude-hall-monitor/hooks/viewer
bun run tsc --noEmit
```

## Commit

```bash
git add hooks/viewer/src/hooks/use-sse.ts
git commit -m "$(cat <<'EOF'
feat(viewer): create SSE hook with auto-reconnect

Implement custom React hook for SSE connections with exponential
backoff reconnection logic and connection status tracking.

Implements: F007
Decisions: D007
Edge Cases: EC001

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/08-data-hooks.md` (F008)
