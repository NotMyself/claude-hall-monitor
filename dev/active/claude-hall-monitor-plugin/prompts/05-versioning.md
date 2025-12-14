# Feature: F005 - Add Versioning and Changelog

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000-F004**: Project restructured, manifest created, build system ready, docs updated

## Objective

Establish semantic versioning with synchronized version across all files and create the initial CHANGELOG.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D003**: Start at semantic version 1.0.0 — Initial production-ready release
- **D004**: Use Keep a Changelog format — Standard format for version history

## Edge Cases to Handle

From `edge-cases.md`:
- **EC005**: Version mismatch between files → Create sync validation script

## Code References

Read these sections before implementing:
- `code/json.md#changelog-format` - CHANGELOG structure
- `code/typescript.md#version-sync-utility` - Version sync validation
- `code/bash.md#version-management` - Shell scripts for version operations

## Constraints

- See `constraints.md` for global rules
- Version must match in: `.claude-plugin/plugin.json`, `hooks/package.json`, `CHANGELOG.md`
- Use ISO 8601 date format in CHANGELOG (YYYY-MM-DD)

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `CHANGELOG.md` | Version history (create new) |
| `.claude-plugin/plugin.json` | Verify version is 1.0.0 |
| `hooks/package.json` | Update version to 1.0.0 |
| `scripts/version-check.sh` | Version sync validation script |

## Implementation Details

### CHANGELOG.md

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - YYYY-MM-DD

### Added
- Initial plugin release as `claude-hall-monitor`
- All 12 hook handlers with JSONL logging:
  - SessionStart, SessionEnd
  - UserPromptSubmit
  - PreToolUse, PostToolUse, PostToolUseFailure
  - Notification, Stop
  - SubagentStart, SubagentStop
  - PreCompact, PermissionRequest
- Realtime log viewer UI (Vue.js single-file application)
- 6 rules files for Claude Code guidance
- 3 slash commands
- Build system for bundling TypeScript to JavaScript
- Plugin manifest for marketplace distribution
- Cross-platform support (Windows, macOS, Linux)

### Changed
- Project structure reorganized for plugin distribution:
  - `.claude/hooks/` → `hooks/`
  - `.claude/rules/` → `rules/`
  - `.claude/commands/` → `commands/`

[Unreleased]: https://github.com/NotMyself/claude-hall-monitor/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/NotMyself/claude-hall-monitor/releases/tag/v1.0.0
```

Replace `YYYY-MM-DD` with today's date.

### hooks/package.json Version

Ensure version field is set:

```json
{
  "name": "claude-hall-monitor",
  "version": "1.0.0",
  ...
}
```

### scripts/version-check.sh

```bash
#!/bin/bash
# Validate version consistency across all files

set -e

PLUGIN_VERSION=$(jq -r '.version' .claude-plugin/plugin.json)
PACKAGE_VERSION=$(jq -r '.version' hooks/package.json)
CHANGELOG_VERSION=$(grep -m1 '## \[' CHANGELOG.md | sed 's/.*\[\([^]]*\)\].*/\1/')

echo "Version check:"
echo "  plugin.json:  $PLUGIN_VERSION"
echo "  package.json: $PACKAGE_VERSION"
echo "  CHANGELOG.md: $CHANGELOG_VERSION"

if [ "$PLUGIN_VERSION" != "$PACKAGE_VERSION" ]; then
  echo "❌ Mismatch: plugin.json vs package.json"
  exit 1
fi

if [ "$PLUGIN_VERSION" != "$CHANGELOG_VERSION" ]; then
  echo "❌ Mismatch: plugin.json vs CHANGELOG.md"
  exit 1
fi

echo "✓ All versions match: $PLUGIN_VERSION"
```

Make executable:
```bash
chmod +x scripts/version-check.sh
```

## Acceptance Criteria

- [ ] CHANGELOG.md exists with 1.0.0 entry
- [ ] `.claude-plugin/plugin.json` has version "1.0.0"
- [ ] `hooks/package.json` has version "1.0.0"
- [ ] `scripts/version-check.sh` validates all versions match
- [ ] Version check script passes

## Verification

```bash
# Create scripts directory if needed
mkdir -p scripts

# Run version check
./scripts/version-check.sh

# Or manually verify
jq '.version' .claude-plugin/plugin.json
jq '.version' hooks/package.json
grep -m1 '## \[' CHANGELOG.md
```

## Commit

```bash
git add CHANGELOG.md scripts/version-check.sh
git add .claude-plugin/plugin.json hooks/package.json
git commit -m "chore(version): establish v1.0.0 with changelog

Add CHANGELOG.md following Keep a Changelog format
Add version sync validation script
Ensure version 1.0.0 across all files

Implements: F005
Decisions: D003, D004"
```

## Next

Proceed to: `prompts/06-ci-workflow.md` (F006)
