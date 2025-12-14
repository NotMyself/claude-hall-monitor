# Feature: F010 - Final Validation and Release

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000-F009**: All plugin features implemented

## Objective

Perform final validation, fix any remaining issues, and prepare for the v1.0.0 release.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D003**: Start at semantic version 1.0.0 — This is the release version

## Edge Cases to Handle

All edge cases should have been addressed in prior features. This step validates handling.

## Code References

Read these sections before implementing:
- `code/bash.md#tag-and-push-release` - Release tagging

## Constraints

- See `constraints.md` for global rules
- Do not skip any validation steps
- Fix issues before tagging release

## Validation Checklist

### 1. File Structure Validation

```bash
# Required directories
test -d .claude-plugin && echo "✓ .claude-plugin/"
test -d hooks && echo "✓ hooks/"
test -d rules && echo "✓ rules/"
test -d commands && echo "✓ commands/"

# Required files
test -f .claude-plugin/plugin.json && echo "✓ plugin.json"
test -f .claude-plugin/hooks.json && echo "✓ hooks.json"
test -f build.ts && echo "✓ build.ts"
test -f CHANGELOG.md && echo "✓ CHANGELOG.md"
test -f README.md && echo "✓ README.md"
```

### 2. Build Validation

```bash
# Clean build
rm -rf dist
bun run build.ts

# Verify all handlers built
ls dist/handlers/*.js | wc -l  # Should be 12

# Verify viewer built
test -f dist/viewer/server.js && echo "✓ viewer built"
```

### 3. Test Validation

```bash
# Type checking
cd hooks && bun run tsc --noEmit

# Unit tests
cd hooks && bun run test:run

# E2E tests
bun run test-e2e.ts
```

### 4. Version Validation

```bash
# Run version check
./scripts/version-check.sh

# Or manually:
PLUGIN_VERSION=$(jq -r '.version' .claude-plugin/plugin.json)
PACKAGE_VERSION=$(jq -r '.version' hooks/package.json)
echo "plugin.json: $PLUGIN_VERSION"
echo "package.json: $PACKAGE_VERSION"
```

### 5. Documentation Validation

```bash
# No old paths remain
grep -r "\.claude/hooks" README.md CLAUDE.md rules/ && echo "❌ Old paths found" || echo "✓ No old paths"

# Installation instructions present
grep -q "Installation" README.md && echo "✓ Installation section"
```

### 6. CI/CD Validation

```bash
# Workflow files exist
test -f .github/workflows/ci.yml && echo "✓ CI workflow"
test -f .github/workflows/release.yml && echo "✓ Release workflow"
```

### 7. Handler Execution Test

Test each handler manually with sample input:

```bash
echo '{"session_id":"final-test"}' | bun run dist/handlers/session-start.js
echo '{"session_id":"final-test","tool_name":"Read","tool_input":{"file_path":"/tmp"}}' | bun run dist/handlers/pre-tool-use.js
```

## Release Steps

After all validations pass:

### 1. Final Commit

```bash
git add -A
git status  # Review all changes
git commit -m "chore: prepare v1.0.0 release

Final validation complete:
- All 12 handlers build and execute correctly
- Unit and E2E tests pass
- Documentation updated
- CI/CD workflows ready

Implements: F010"
```

### 2. Create Tag

```bash
git tag -a v1.0.0 -m "Release v1.0.0

Initial plugin release with:
- 12 hook handlers
- Realtime log viewer
- Rules and slash commands
- Cross-platform support"
```

### 3. Push

```bash
git push origin main
git push origin v1.0.0
```

### 4. Monitor Release

1. Watch GitHub Actions release workflow
2. Verify release artifact (zip file) is attached
3. Download and test the release zip

## Post-Release

- [ ] Verify GitHub release page has correct notes
- [ ] Download and extract zip to verify contents
- [ ] Submit PR to claude-dotnet-marketplace
- [ ] Announce release (if applicable)

## Acceptance Criteria

- [ ] All validation checks pass
- [ ] No test failures
- [ ] Version 1.0.0 in all files
- [ ] v1.0.0 tag created and pushed
- [ ] GitHub release workflow completes
- [ ] Release zip available for download

## Verification

```bash
# Final comprehensive check
echo "=== Final Validation ==="

# Structure
echo -n "Structure: "
test -d .claude-plugin && test -d dist && test -d hooks && echo "✓" || echo "✗"

# Build
echo -n "Build: "
ls dist/handlers/*.js 2>/dev/null | wc -l | grep -q "12" && echo "✓" || echo "✗"

# Tests
echo -n "Tests: "
cd hooks && bun run test:run > /dev/null 2>&1 && echo "✓" || echo "✗"
cd ..

# Version
echo -n "Version sync: "
./scripts/version-check.sh > /dev/null 2>&1 && echo "✓" || echo "✗"

echo "=== Done ==="
```

## Commit

This feature's commit is the final release preparation commit shown in Release Steps above.

## Next

Plugin is complete! Submit marketplace entry from `marketplace-entry.json` to claude-dotnet-marketplace.
