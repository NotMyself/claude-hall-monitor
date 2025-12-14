# Claude Hall Monitor Plugin

## Summary

Transform the claude-bun-win11-hooks project into an installable Claude Code plugin named "claude-hall-monitor". The plugin provides all 12 hook handlers, the Hall Monitor realtime viewer UI, 6 rules files, and 3 slash commands as a distributable package that can be installed via the claude-dotnet-marketplace.

## Requirements

- Plugin name: `claude-hall-monitor`
- Add to existing marketplace: NotMyself/claude-dotnet-marketplace
- Include full package: hooks + viewer + rules + commands
- Cross-platform support (Windows, macOS, Linux)
- Bun runtime prerequisite

## Implementation Approach

### Phase 1: Create Plugin Manifest

Create `.claude-plugin/` directory with:

1. **`.claude-plugin/plugin.json`** - Plugin metadata
2. **`.claude-plugin/hooks.json`** - Hook configurations using `${CLAUDE_PLUGIN_ROOT}` paths

### Phase 2: Add Build System

Create a build script to bundle TypeScript to JavaScript:

1. **`build.ts`** - Bun build script that:
   - Bundles each of the 12 handlers to standalone JS files
   - Bundles the viewer server
   - Outputs to `dist/` directory
   - Inlines all dependencies (no `bun install` needed by users)

2. **`package.json`** - Add build scripts:
   ```json
   {
     "scripts": {
       "build": "bun run build.ts",
       "build:handlers": "bun build handlers/*.ts --outdir dist/handlers",
       "build:viewer": "bun build viewer/server.ts --outdir dist/viewer"
     }
   }
   ```

3. **`.claude-plugin/hooks.json`** - Reference bundled JS files:
   ```json
   {
     "command": "bun run ${CLAUDE_PLUGIN_ROOT}/dist/handlers/session-start.js"
   }
   ```

### Phase 3: Restructure Project

Move files from `.claude/` to root level for plugin distribution:

| From | To |
|------|-----|
| `.claude/hooks/` | `hooks/` |
| `.claude/rules/` | `rules/` |
| `.claude/commands/` | `commands/` |

The `.claude/settings.json` becomes obsolete (replaced by hooks.json).

### Phase 4: Update Documentation

- Update README.md with plugin installation instructions
- Update CLAUDE.md with new directory structure
- Update rules/commands.md with corrected paths

### Phase 5: Add Versioning & Changelog

1. **Semantic Versioning** - Start at `1.0.0`:
   - MAJOR: Breaking changes to hook behavior or configuration
   - MINOR: New hooks, features, or non-breaking enhancements
   - PATCH: Bug fixes, documentation updates

2. **`CHANGELOG.md`** - Follow [Keep a Changelog](https://keepachangelog.com/) format

3. **Version sync** - Keep version in sync across:
   - `.claude-plugin/plugin.json`
   - `hooks/package.json`
   - `CHANGELOG.md`

### Phase 6: CI/CD with GitHub Actions

Create `.github/workflows/` with:

1. **`ci.yml`** - Pull Request workflow: build, unit tests, e2e tests
2. **`release.yml`** - Release workflow: build, test, zip, create release

### Phase 7: Marketplace Registration

Add entry to NotMyself/claude-dotnet-marketplace/`.claude-plugin/marketplace.json`.

## Files to Create

| File | Description |
|------|-------------|
| `.claude-plugin/plugin.json` | Plugin manifest |
| `.claude-plugin/hooks.json` | Hook configurations referencing dist/*.js |
| `build.ts` | Bun build script for bundling handlers and viewer |
| `dist/handlers/*.js` | Bundled handler scripts (12 files, generated) |
| `dist/viewer/server.js` | Bundled viewer server (generated) |
| `CHANGELOG.md` | Version history following Keep a Changelog format |
| `.github/workflows/ci.yml` | PR workflow: build, unit tests, e2e tests |
| `.github/workflows/release.yml` | Release workflow: build, test, zip, create release |
| `test:e2e.ts` | E2E test script for hook execution verification |

## Files to Move

| Source | Destination |
|--------|-------------|
| `.claude/hooks/handlers/` | `hooks/handlers/` |
| `.claude/hooks/utils/` | `hooks/utils/` |
| `.claude/hooks/viewer/` | `hooks/viewer/` |
| `.claude/hooks/package.json` | `hooks/package.json` |
| `.claude/hooks/tsconfig.json` | `hooks/tsconfig.json` |
| `.claude/rules/` | `rules/` |
| `.claude/commands/` | `commands/` |

## Files to Update

| File | Changes |
|------|---------|
| `README.md` | Add plugin installation section |
| `CLAUDE.md` | Update paths from `.claude/hooks/` to `hooks/` |
| `rules/commands.md` | Update path references |
| `rules/hook-handlers.md` | Update path references |
| `rules/testing.md` | Update path references |

## Repository Strategy

Rename the current repository from `claude-bun-win11-hooks` to `claude-hall-monitor`. This repository serves as both the development and distribution repo.

## Decisions

| Decision | Rationale |
|----------|-----------|
| Rename existing repo | Single repo for development and distribution; simpler maintenance |
| Bundle to JavaScript | Eliminates `bun install` step; faster startup; still requires Bun runtime |
| Semantic versioning | Industry standard; start at 1.0.0 for initial release |
| Keep a Changelog format | Standard format for documenting version history |
| GitHub Actions CI/CD | Automated build, test, and release on PR/tag |
| Zip archive for releases | Easy distribution; contains all plugin files |
| Use `${CLAUDE_PLUGIN_ROOT}` in hook commands | Standard pattern from dot-hooks; expanded at runtime to plugin install location |
