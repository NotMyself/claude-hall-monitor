# Feature: F000 - Project Initialization

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

None - this is the first feature in the implementation sequence.

## Objective

Verify the project environment is ready for security remediation work. Ensure dependencies are installed, types compile, and existing tests pass.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- No decisions apply to initialization.

## Edge Cases to Handle

From `edge-cases.md`:
- No edge cases apply to initialization.

## Code References

No code samples needed for this initialization task.

## Constraints

- See `constraints.md` for global rules
- Do not modify any source files
- Only verify existing setup works

## Tasks

1. **Verify dependencies are installed**
   ```bash
   cd .claude/hooks
   bun install
   ```

2. **Verify TypeScript compiles without errors**
   ```bash
   bun run tsc --noEmit
   ```

3. **Verify existing tests pass**
   ```bash
   bun run test:run
   ```

4. **Verify directory structure exists**
   - `.claude/hooks/viewer/` - Server files
   - `.claude/hooks/handlers/` - Hook handlers
   - `.claude/hooks/utils/` - Utilities
   - `.claude/hooks/viewer/__tests__/` - Test files

## Acceptance Criteria

- [ ] `bun install` completes without errors
- [ ] `bun run tsc --noEmit` reports no type errors
- [ ] `bun run test:run` passes all existing tests
- [ ] All expected directories exist

## Verification

```bash
cd .claude/hooks && bun install && bun run tsc --noEmit && bun run test:run
```

## Commit

No commit needed for initialization - this verifies the existing state.

## Next

Proceed to: `prompts/01-security-utils.md` (F001)
