# Feature: F000 - Project Initialization

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

None - this is the initialization step.

## Objective

Verify prerequisites and prepare the project for plugin conversion by restructuring files from `.claude/` to root level.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D001**: Rename repo to `claude-hall-monitor` — Establishes the plugin identity

## Edge Cases to Handle

From `edge-cases.md`:
- **EC002**: Bun runtime not installed → Verify Bun is available before proceeding

## Code References

Read these sections before implementing:
- `code/bash.md#project-structure-commands` - File move commands

## Constraints

- See `constraints.md` for global rules
- Do NOT modify any source code yet - only move files
- Preserve git history where possible

## Prerequisites Check

Before proceeding, verify:

```bash
# Check Bun is installed
bun --version

# Expected: 1.x.x or higher
```

## Files to Move

| Source | Destination |
|--------|-------------|
| `.claude/hooks/handlers/` | `hooks/handlers/` |
| `.claude/hooks/utils/` | `hooks/utils/` |
| `.claude/hooks/viewer/` | `hooks/viewer/` |
| `.claude/hooks/package.json` | `hooks/package.json` |
| `.claude/hooks/tsconfig.json` | `hooks/tsconfig.json` |
| `.claude/hooks/hooks-log.txt` | `hooks/hooks-log.txt` |
| `.claude/rules/` | `rules/` |
| `.claude/commands/` | `commands/` |

## Directories to Create

| Directory | Purpose |
|-----------|---------|
| `.claude-plugin/` | Plugin manifest files (created in F002) |
| `dist/` | Build output (created in F003) |

## Implementation Steps

1. **Verify Bun installation**
   ```bash
   bun --version
   ```

2. **Create new directory structure**
   ```bash
   mkdir -p hooks/handlers hooks/utils hooks/viewer
   mkdir -p rules
   mkdir -p commands
   ```

3. **Move hook files**
   ```bash
   # Use git mv to preserve history
   git mv .claude/hooks/handlers/* hooks/handlers/
   git mv .claude/hooks/utils/* hooks/utils/
   git mv .claude/hooks/viewer/* hooks/viewer/
   git mv .claude/hooks/package.json hooks/
   git mv .claude/hooks/tsconfig.json hooks/
   git mv .claude/hooks/hooks-log.txt hooks/
   ```

4. **Move rules**
   ```bash
   git mv .claude/rules/* rules/
   ```

5. **Move commands**
   ```bash
   git mv .claude/commands/* commands/
   ```

6. **Clean up empty directories**
   ```bash
   rm -rf .claude/hooks .claude/rules .claude/commands
   ```

7. **Update .claude/settings.json** to point to new locations (temporary, will be replaced by hooks.json)

## Acceptance Criteria

- [ ] Bun version 1.x or higher is installed
- [ ] All files moved from `.claude/hooks/` to `hooks/`
- [ ] All files moved from `.claude/rules/` to `rules/`
- [ ] All files moved from `.claude/commands/` to `commands/`
- [ ] No source code modifications made
- [ ] Project structure matches target layout

## Verification

```bash
# Verify directory structure
ls -la hooks/handlers/
ls -la hooks/utils/
ls -la hooks/viewer/
ls -la rules/
ls -la commands/

# Verify key files exist
test -f hooks/package.json && echo "✓ package.json"
test -f hooks/tsconfig.json && echo "✓ tsconfig.json"
test -d hooks/handlers && echo "✓ handlers directory"

# Count handlers (should be 12)
ls hooks/handlers/*.ts | wc -l
```

## Commit

```bash
git add -A
git commit -m "chore: restructure project for plugin distribution

Move files from .claude/ to root level:
- .claude/hooks/ → hooks/
- .claude/rules/ → rules/
- .claude/commands/ → commands/

Implements: F000
Decisions: D001"
```

## Next

Proceed to: `prompts/01-plugin-manifest.md` (F001)
