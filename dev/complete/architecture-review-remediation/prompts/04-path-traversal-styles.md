# Feature: F004 - Path Traversal Protection for /styles/ Endpoint

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000**: Project initialization verified
- **F001**: Security utilities module created with `sanitizePathComponent()` and `validatePathWithinBase()`
- **F002**: Configuration hardened
- **F003**: CORS restricted to localhost

## Objective

Fix the path traversal vulnerability in the `/styles/` endpoint that allows attackers to read arbitrary files from the filesystem.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D003**: Use regex-based path validation for predictable, cross-platform behavior
- **D008**: URL-decode paths before validation to catch encoded traversal attempts

## Edge Cases to Handle

From `edge-cases.md`:
- **EC001**: Encoded path traversal (`%2e%2e`, `%2f`) - URL-decode before validation
- **EC002**: Null bytes in paths - reject any path containing `\x00`
- **EC007**: Empty or whitespace-only inputs - treat as invalid
- **EC008**: Case sensitivity on Windows - handled by validatePathWithinBase

## Code References

Read these sections before implementing:
- `code/typescript.md#security-utilities` - `sanitizePathComponent()` and `validatePathWithinBase()`

## Constraints

- See `constraints.md` for global rules
- Return 400 Bad Request for invalid input
- Return 403 Forbidden for traversal attempts
- Maintain existing 404 for non-existent files

## Files to Modify

| File | Changes |
|------|---------|
| `.claude/hooks/viewer/server.ts` | Add path validation to /styles/ route handler |

## Implementation Details

Import security utilities at the top of server.ts (if not already imported):

```typescript
import { sanitizePathComponent, validatePathWithinBase, getLocalhostOrigin } from "./security";
```

Replace the existing `/styles/` route handler (around line 213-216):

```typescript
// Before
if (path.startsWith("/styles/") && request.method === "GET") {
  const filePath = `${PATHS.STYLES_DIR}${path.replace("/styles", "")}`;
  return serveFile(filePath);
}

// After
if (path.startsWith("/styles/") && request.method === "GET") {
  const requestedFile = path.replace("/styles/", "");

  // Sanitize the path component
  const sanitizedFile = sanitizePathComponent(requestedFile);
  if (!sanitizedFile) {
    return new Response("Bad Request", { status: 400 });
  }

  // Validate path is within styles directory
  const filePath = validatePathWithinBase(sanitizedFile, PATHS.STYLES_DIR);
  if (!filePath) {
    return new Response("Forbidden", { status: 403 });
  }

  return serveFile(filePath);
}
```

## Acceptance Criteria

- [ ] `/styles/main.css` returns 200 (valid file)
- [ ] `/styles/../config.ts` returns 400 or 403 (traversal blocked)
- [ ] `/styles/%2e%2e/config.ts` returns 400 or 403 (encoded traversal blocked)
- [ ] `/styles/` (empty filename) returns 400
- [ ] `/styles/nonexistent.css` returns 404
- [ ] TypeScript compiles without errors

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit

```bash
git add .claude/hooks/viewer/server.ts
git commit -m "$(cat <<'EOF'
fix(viewer): add path traversal protection to /styles/ endpoint

Validate and sanitize path components before serving static files.
Blocks encoded traversal attempts and null byte injection.

Implements: F004
Decisions: D003, D008
Edge cases: EC001, EC002, EC007

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/05-path-traversal-plans.md` (F005)
