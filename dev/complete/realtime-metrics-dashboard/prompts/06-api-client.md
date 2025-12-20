# Feature: F006 - Implement API Client

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F005**: TypeScript types defined

## Objective

Create API client with fetch wrapper and functions for all endpoints.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Edge Cases to Handle

From `edge-cases.md`:
- **EC004**: API request fails → Display toast, retry max 3 attempts
- **EC010**: API returns incomplete data → Validate response shapes, display partial data

## Code References

Read these sections before implementing:
- `code/typescript.md#api-functions` - Complete API client implementation

## Constraints

- See `constraints.md` for global rules
- API base URL: `http://localhost:3456`
- Handle errors with APIError class
- Implement automatic retry logic

## Files to Create

| File | Purpose |
|------|---------|
| `hooks/viewer/src/lib/api.ts` | API client with all endpoint functions |

## Implementation Details

Implement functions for:
- `/api/metrics`, `/api/metrics/aggregations`, `/api/metrics/costs`
- `/api/dashboard/stats`
- `/api/plans`, `/api/plans/:name`, `/api/plans/events`
- `/api/sessions`, `/api/sessions/:id`

Include error handling, retry logic, and TypeScript types.

## Acceptance Criteria

- [ ] API client created with all endpoint functions
- [ ] Error handling with APIError class
- [ ] Automatic retry (max 3 attempts)
- [ ] TypeScript compiles without errors
- [ ] All functions typed with request/response types

## Verification

```bash
cd C:/Users/bobby/src/claude/claude-hall-monitor/hooks/viewer
bun run tsc --noEmit
```

## Commit

```bash
git add hooks/viewer/src/lib/api.ts
git commit -m "$(cat <<'EOF'
feat(viewer): implement API client with error handling

Create comprehensive API client with fetch wrapper, error handling,
and automatic retry logic for all dashboard endpoints.

Implements: F006
Edge Cases: EC004, EC010

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/07-sse-hook.md` (F007)
