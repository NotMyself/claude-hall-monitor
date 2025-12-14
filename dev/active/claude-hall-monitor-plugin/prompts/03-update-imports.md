# Feature: F003 - Update Import Paths

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000**: Project restructured - files at `hooks/`, `rules/`, `commands/`
- **F001**: Plugin manifest created
- **F002**: Build system created

## Objective

Update all relative import paths in handler files to reflect the new directory structure (from `.claude/hooks/` to `hooks/`).

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

None specific to this feature.

## Edge Cases to Handle

From `edge-cases.md`:
- **EC001**: Cross-platform paths → Imports should use forward slashes

## Code References

Read these sections before implementing:
- `code/typescript.md#types` - Import patterns

## Constraints

- See `constraints.md` for global rules
- Only update import paths, do not modify logic
- Verify TypeScript compiles after changes

## Files to Modify

All files in `hooks/handlers/` that import from `../utils/`:

| File | Import to Update |
|------|------------------|
| `hooks/handlers/session-start.ts` | `../utils/logger` |
| `hooks/handlers/session-end.ts` | `../utils/logger` |
| `hooks/handlers/user-prompt-submit.ts` | `../utils/logger` |
| `hooks/handlers/pre-tool-use.ts` | `../utils/logger` |
| `hooks/handlers/post-tool-use.ts` | `../utils/logger` |
| `hooks/handlers/post-tool-use-failure.ts` | `../utils/logger` |
| `hooks/handlers/notification.ts` | `../utils/logger` |
| `hooks/handlers/stop.ts` | `../utils/logger` |
| `hooks/handlers/subagent-start.ts` | `../utils/logger` |
| `hooks/handlers/subagent-stop.ts` | `../utils/logger` |
| `hooks/handlers/pre-compact.ts` | `../utils/logger` |
| `hooks/handlers/permission-request.ts` | `../utils/logger` |

## Implementation Details

The imports should remain relative within the `hooks/` directory:

```typescript
// Current (should still work after move):
import { log, readInput, writeOutput } from '../utils/logger';
```

Since we moved the entire `hooks/` directory structure intact, internal relative imports should still work. However, verify:

1. **Logger path**: `hooks/utils/logger.ts` must exist
2. **Viewer imports**: Check `hooks/viewer/` files for any path issues
3. **Test imports**: Check `hooks/viewer/__tests__/` imports

### Potential Issues

If any files reference absolute paths or paths relative to `.claude/`, they need updating:

```typescript
// BAD - absolute path to old location
import { log } from '/path/to/.claude/hooks/utils/logger';

// GOOD - relative path
import { log } from '../utils/logger';
```

### tsconfig.json Paths

Check `hooks/tsconfig.json` for any path mappings that need updating:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## Acceptance Criteria

- [ ] All handler files compile without import errors
- [ ] `hooks/utils/logger.ts` is correctly referenced
- [ ] Viewer files compile without import errors
- [ ] Test files compile without import errors
- [ ] Type checking passes: `cd hooks && bun run tsc --noEmit`

## Verification

```bash
# Type check all files
cd hooks && bun run tsc --noEmit

# If tsc is not in package.json scripts, run directly:
cd hooks && npx tsc --noEmit

# Verify imports resolve
bun run hooks/handlers/session-start.ts --help 2>&1 || echo "Handler loaded"

# Run tests to verify imports work
cd hooks && bun run test:run
```

## Commit

```bash
git add hooks/
git commit -m "fix(imports): update paths for new directory structure

Verify and fix import paths after moving from .claude/hooks/ to hooks/

Implements: F003"
```

## Next

Proceed to: `prompts/04-update-docs.md` (F004)
