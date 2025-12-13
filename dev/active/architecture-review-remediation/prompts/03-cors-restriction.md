# Feature: F003 - CORS Restriction

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000**: Project initialization verified
- **F001**: Security utilities module created with `getLocalhostOrigin()`
- **F002**: Configuration hardened (localhost binding, port config)

## Objective

Restrict CORS to localhost origin only, preventing cross-origin data theft from malicious websites.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D001**: Localhost binding means we can restrict CORS to localhost origin

## Edge Cases to Handle

From `edge-cases.md`:
- No specific edge cases for CORS.

## Code References

Read these sections before implementing:
- `code/typescript.md#cors-headers` - CORS header pattern

## Constraints

- See `constraints.md` for global rules
- Use the security utility function for origin
- Update all locations with CORS headers

## Files to Modify

| File | Changes |
|------|---------|
| `.claude/hooks/viewer/server.ts` | Replace all `"Access-Control-Allow-Origin": "*"` with localhost origin |

## Implementation Details

Import the security utility at the top of server.ts:

```typescript
import { getLocalhostOrigin } from "./security";
```

Find all occurrences of `"Access-Control-Allow-Origin": "*"` and replace with:

```typescript
"Access-Control-Allow-Origin": getLocalhostOrigin(SERVER_CONFIG.PORT),
```

There are 4 locations in server.ts that need updating:
1. Line ~139: `handleSSE()` response headers
2. Line ~195: `handlePlanSSE()` response headers
3. Line ~247: `/api/entries` response headers
4. Line ~294: `/shutdown` response headers

## Acceptance Criteria

- [ ] No occurrences of `"Access-Control-Allow-Origin": "*"` remain
- [ ] All CORS headers use `getLocalhostOrigin(SERVER_CONFIG.PORT)`
- [ ] Security utility is imported at top of server.ts
- [ ] TypeScript compiles without errors

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit

```bash
git add .claude/hooks/viewer/server.ts
git commit -m "$(cat <<'EOF'
feat(viewer): restrict CORS to localhost origin

Replace wildcard CORS with localhost-only origin to prevent
cross-origin data theft from malicious websites.

Implements: F003
Decisions: D001

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/04-path-traversal-styles.md` (F004)
