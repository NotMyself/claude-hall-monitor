# Feature: F013 - Hook Input Validation

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000-F012**: All security fixes and rate limiting completed

## Objective

Add input validation for hook inputs to ensure required fields are present before processing.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D009**: Handlers must always produce valid JSON. Validation failures should output safe default.

## Edge Cases to Handle

From `edge-cases.md`:
- **EC007**: Empty or whitespace-only inputs - treat as invalid

## Code References

Read these sections before implementing:
- `code/typescript.md#input-validation-hook` - Input validation pattern

## Constraints

- See `constraints.md` for global rules
- Don't break existing handler functionality
- Validation should be minimal - check required fields only

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `.claude/hooks/utils/validation.ts` | New validation utilities |
| `.claude/hooks/utils/logger.ts` | Add validated readInput variant |

## Implementation Details

### 1. Create validation.ts

```typescript
/**
 * @fileoverview Input validation utilities for Claude Code hooks.
 *
 * Provides runtime validation of hook inputs to ensure required
 * fields are present before processing.
 */

/**
 * Base hook input fields that all hooks must have.
 */
export interface BaseHookInput {
  session_id: string;
  hook_event_name: string;
}

/**
 * Validate that an input object has required hook fields.
 *
 * @param input - Raw input from stdin
 * @returns true if input has required fields, false otherwise
 */
export function validateHookInput(input: unknown): input is BaseHookInput {
  if (!input || typeof input !== "object") {
    return false;
  }

  const obj = input as Record<string, unknown>;

  // Required: session_id must be a non-empty string
  if (typeof obj.session_id !== "string" || !obj.session_id.trim()) {
    return false;
  }

  // Required: hook_event_name must be a non-empty string
  if (typeof obj.hook_event_name !== "string" || !obj.hook_event_name.trim()) {
    return false;
  }

  return true;
}

/**
 * Get a safe session ID from input or return a default.
 *
 * @param input - Raw input object
 * @param defaultId - Default session ID if invalid
 * @returns Valid session ID or default
 */
export function getSafeSessionId(
  input: unknown,
  defaultId: string = "unknown"
): string {
  if (!input || typeof input !== "object") {
    return defaultId;
  }

  const obj = input as Record<string, unknown>;
  if (typeof obj.session_id === "string" && obj.session_id.trim()) {
    return obj.session_id;
  }

  return defaultId;
}
```

### 2. Update logger.ts (optional enhancement)

Add a validated read function variant:

```typescript
import { validateHookInput, getSafeSessionId } from "./validation";

/**
 * Reads input from stdin with basic validation.
 * Throws if input is missing required fields.
 *
 * @typeParam T - The expected input type
 * @returns Promise resolving to validated input
 * @throws Error if input is invalid
 */
export async function readValidatedInput<T>(): Promise<T> {
  const text = await Bun.stdin.text();
  const input = JSON.parse(text);

  if (!validateHookInput(input)) {
    throw new Error("Invalid hook input: missing required fields");
  }

  return input as T;
}
```

This is optional - handlers can continue using `readInput()` with try/catch from F011.

## Acceptance Criteria

- [ ] validation.ts created with validateHookInput()
- [ ] validateHookInput checks for session_id and hook_event_name
- [ ] getSafeSessionId provides fallback for invalid inputs
- [ ] TypeScript compiles without errors
- [ ] Existing handlers still work (no breaking changes)

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit

```bash
git add .claude/hooks/utils/validation.ts
git commit -m "$(cat <<'EOF'
feat(utils): add hook input validation utilities

Add validateHookInput() to check required fields.
Add getSafeSessionId() for safe fallback.

Implements: F013
Decisions: D009
Edge cases: EC007

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/14-security-tests.md` (F014)
