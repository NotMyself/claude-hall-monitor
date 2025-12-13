# Feature: F005 - Path Traversal Protection for /api/plans/ Endpoint

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000**: Project initialization verified
- **F001**: Security utilities module created with `validatePlanName()`
- **F002**: Configuration hardened
- **F003**: CORS restricted to localhost
- **F004**: Path traversal fixed for /styles/ endpoint

## Objective

Fix the path traversal vulnerability in the `/api/plans/:name` endpoint that allows attackers to read arbitrary files from the filesystem.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D003**: Use regex-based path validation for predictable, cross-platform behavior
- **D007**: Plan names are ASCII alphanumeric only (with underscores and hyphens)
- **D008**: URL-decode paths before validation to catch encoded traversal attempts

## Edge Cases to Handle

From `edge-cases.md`:
- **EC001**: Encoded path traversal (`%2e%2e`, `%2f`) - URL-decode before validation
- **EC002**: Null bytes in paths - reject any path containing `\x00`
- **EC004**: Unicode in plan names - reject non-ASCII characters
- **EC007**: Empty or whitespace-only inputs - treat as invalid

## Code References

Read these sections before implementing:
- `code/typescript.md#plan-name-validation` - `validatePlanName()` function

## Constraints

- See `constraints.md` for global rules
- Return 400 Bad Request for invalid plan names
- Maintain existing 404 for non-existent plans

## Files to Modify

| File | Changes |
|------|---------|
| `.claude/hooks/viewer/server.ts` | Add plan name validation to /api/plans/:name route handler |

## Implementation Details

Import validatePlanName at the top of server.ts (if not already imported):

```typescript
import {
  sanitizePathComponent,
  validatePathWithinBase,
  validatePlanName,
  getLocalhostOrigin
} from "./security";
```

Replace the existing `/api/plans/:name` route handler (around line 312-318):

```typescript
// Before
if (path.startsWith("/api/plans/") && request.method === "GET") {
  const name = path.replace("/api/plans/", "");
  const plan = planWatcher.getPlan(name);
  if (!plan) {
    return Response.json({ error: "Plan not found" }, { status: 404 });
  }
  return Response.json(plan);
}

// After
if (path.startsWith("/api/plans/") && request.method === "GET") {
  const rawName = path.replace("/api/plans/", "");

  // Validate plan name format
  const name = validatePlanName(rawName);
  if (!name) {
    return Response.json({ error: "Invalid plan name" }, { status: 400 });
  }

  const plan = planWatcher.getPlan(name);
  if (!plan) {
    return Response.json({ error: "Plan not found" }, { status: 404 });
  }
  return Response.json(plan);
}
```

## Acceptance Criteria

- [ ] `/api/plans/my-plan` returns plan data or 404 (valid name)
- [ ] `/api/plans/../config` returns 400 (traversal blocked)
- [ ] `/api/plans/%2e%2e/config` returns 400 (encoded traversal blocked)
- [ ] `/api/plans/plan%00.json` returns 400 (null byte blocked)
- [ ] `/api/plans/` (empty name) returns 400
- [ ] `/api/plans/valid-but-missing` returns 404
- [ ] TypeScript compiles without errors

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit

```bash
git add .claude/hooks/viewer/server.ts
git commit -m "$(cat <<'EOF'
fix(viewer): add path traversal protection to /api/plans/ endpoint

Validate plan names to ASCII alphanumeric characters only.
Blocks traversal attempts, null bytes, and unicode injection.

Implements: F005
Decisions: D003, D007, D008
Edge cases: EC001, EC002, EC004, EC007

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/06-session-validation.md` (F006)
