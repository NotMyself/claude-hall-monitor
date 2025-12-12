# Global Constraints

These rules apply to ALL feature implementations in this plan.

## Scope Rules

1. **One Feature Per Session**: Each prompt implements exactly ONE feature. It is unacceptable to implement features beyond the scope of the current task.

2. **No Over-Engineering**: Make only the changes specified. Do not add extra features, refactor unrelated code, or make "improvements" beyond what is explicitly requested.

3. **Preserve Existing Behavior**: All changes must maintain backward compatibility with existing functionality unless explicitly changing behavior.

## Code Standards

1. **TypeScript Strict Mode**: All code must pass `bun run tsc --noEmit` with no errors.

2. **Existing Patterns**: Follow established patterns in the codebase:
   - Handlers use `readInput<T>()`, `log()`, `writeOutput()` from `utils/logger.ts`
   - Vue components use Composition API with `<script setup>` or Options API consistently
   - Tests use Vitest with happy-dom for browser mocking

3. **No New Dependencies**: Do not add new npm packages without explicit approval.

4. **Comments**: Only add comments where logic isn't self-evident. Don't add docstrings to unchanged code.

## File Locations

- **Handlers**: `.claude/hooks/handlers/`
- **Utilities**: `.claude/hooks/utils/`
- **Viewer**: `.claude/hooks/viewer/`
- **Tests**: `__tests__/` subdirectories relative to source
- **Config**: `.claude/hooks/viewer/config.ts`

## Testing Requirements

1. **Run Tests After Changes**: Execute `bun run test` after each modification.
2. **Type Check**: Execute `bun run tsc --noEmit` after each modification.
3. **No Breaking Tests**: All existing tests must continue to pass.

## Git Workflow

1. **Commit After Each Feature**: Create a focused commit after completing each feature.
2. **Commit Message Format**: `fix(<scope>): <description>` for bug fixes, `refactor(<scope>): <description>` for code quality improvements.
3. **No Force Push**: Never use `--force` or `--amend` on shared branches.

## MCP Tools Available

The following MCP tools can be used for verification:

- **Playwright MCP**: For E2E testing if needed
  - `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`
  - `browser_take_screenshot`, `browser_console_messages`

- **Context7 MCP**: For documentation lookup
  - `resolve-library-id`, `get-library-docs`

## Verification Checklist

After each feature implementation:
- [ ] Code compiles: `bun run tsc --noEmit`
- [ ] Tests pass: `bun run test`
- [ ] Feature works manually (if applicable)
- [ ] Commit created with appropriate message
