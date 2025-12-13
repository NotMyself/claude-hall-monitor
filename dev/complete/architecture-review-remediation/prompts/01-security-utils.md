# Feature: F001 - Security Utilities Module

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000**: Project initialization verified dependencies and tests pass.

## Objective

Create a centralized security utilities module that provides path sanitization, session ID validation, and other security functions used by all subsequent security fixes.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D003**: Use regex-based path validation over path.resolve() for predictable, cross-platform behavior
- **D006**: Session ID format is alphanumeric with hyphens, max 64 chars
- **D007**: Plan names are ASCII alphanumeric only (with underscores and hyphens)
- **D008**: URL-decode paths before validation to catch encoded traversal attempts

## Edge Cases to Handle

From `edge-cases.md`:
- **EC001**: Encoded path traversal (`%2e%2e`) - decode first, then validate
- **EC002**: Null bytes in paths - reject any path containing `\x00`
- **EC003**: Very long session IDs - reject if >64 chars
- **EC004**: Unicode in plan names - reject non-ASCII
- **EC007**: Empty or whitespace-only inputs - treat as invalid

## Code References

Read these sections before implementing:
- `code/typescript.md#security-types` - Type definitions
- `code/typescript.md#security-utilities` - Core validation functions
- `code/typescript.md#plan-name-validation` - Plan name validation

## Constraints

- See `constraints.md` for global rules
- Create new file, do not modify existing files yet
- Export all functions for use by other modules
- Include JSDoc comments for all exports

## Files to Create

| File | Purpose |
|------|---------|
| `.claude/hooks/viewer/security.ts` | Security utilities module |

## Implementation Details

Create `.claude/hooks/viewer/security.ts` with the following exports:

```typescript
// Type exports
export type SessionIdResult = string | null;
export type SanitizedPath = string | null;

// Function exports
export function validateSessionId(id: string | null): SessionIdResult;
export function sanitizePathComponent(component: string): SanitizedPath;
export function validatePathWithinBase(relativePath: string, baseDir: string): SanitizedPath;
export function validatePlanName(name: string): string | null;
export function getLocalhostOrigin(port: number): string;
```

Follow the implementation patterns in `code/typescript.md#security-utilities`.

## Acceptance Criteria

- [ ] `security.ts` file created in `.claude/hooks/viewer/`
- [ ] All 5 functions exported with correct signatures
- [ ] `validateSessionId()` rejects: null, >64 chars, special chars
- [ ] `sanitizePathComponent()` rejects: `..`, null bytes, encoded traversal
- [ ] `validatePathWithinBase()` rejects paths outside base directory
- [ ] `validatePlanName()` rejects non-ASCII, special chars
- [ ] `getLocalhostOrigin()` returns correct format
- [ ] TypeScript compiles without errors

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit

```bash
git add .claude/hooks/viewer/security.ts
git commit -m "$(cat <<'EOF'
feat(viewer): add security utilities module

Creates centralized security functions for path sanitization,
session ID validation, and plan name validation.

Implements: F001
Decisions: D003, D006, D007, D008

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/02-config-security.md` (F002)
