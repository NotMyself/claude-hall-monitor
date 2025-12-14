# Claude Hall Monitor Plugin - Implementation Plan

Transform `claude-bun-win11-hooks` into an installable Claude Code plugin.

## Overview

This optimized plan converts the existing hooks implementation into a distributable plugin package for the claude-dotnet-marketplace. The plan is structured for sub-agent execution with one feature per session.

## Quick Start

1. Execute features in order using `manifest.jsonl`
2. Each prompt is self-contained with full context
3. Verify after each feature before proceeding

## Files

| File | Purpose |
|------|---------|
| `manifest.jsonl` | Feature metadata for orchestration (11 features) |
| `context.md` | Project rationale and architecture vision |
| `decisions.md` | 7 architectural decisions with rationale |
| `edge-cases.md` | 10 edge cases mapped to features |
| `testing-strategy.md` | Testing philosophy and patterns |
| `constraints.md` | Global rules for all prompts |
| `init.md` | Project initialization (F000) |
| `prompts/*.md` | Individual feature prompts (F001-F010) |

## Code Samples

The `code/` directory contains reusable code patterns organized by language:

| File | Content |
|------|---------|
| `code/typescript.md` | Types, build scripts, testing patterns |
| `code/json.md` | Plugin manifest, hooks config, package.json |
| `code/yaml.md` | GitHub Actions CI/CD workflows |
| `code/bash.md` | Shell commands for build/test/release |

Reference specific sections via anchors: `code/typescript.md#build-script-core`

## Feature Dependency Graph

```
F000 (Init)
  ├── F001 (Plugin Manifest)
  │     └── F005 (Versioning)
  │           └── F006 (CI Workflow)
  │                 └── F007 (Release Workflow)
  │                       └── F009 (Marketplace)
  │                             └── F010 (Final)
  ├── F002 (Build System)
  │     └── F008 (E2E Tests)
  ├── F003 (Update Imports)
  └── F004 (Update Docs)
```

**Parallel execution possible**:
- F001, F002, F003 can run after F000
- F004 waits for F000 and F001
- F006 waits for F002 and F005

## Orchestration

### Manual Execution

Process prompts in order:

```bash
# Read each prompt and execute with Claude Code
cat init.md
cat prompts/01-plugin-manifest.md
cat prompts/02-build-system.md
# ... continue through 10-final-validation.md
```

### Scripted Execution

Process manifest.jsonl line by line:

```bash
#!/bin/bash
while IFS= read -r line; do
  file=$(echo "$line" | jq -r '.file')
  id=$(echo "$line" | jq -r '.id')
  desc=$(echo "$line" | jq -r '.description')

  echo "=== $id: $desc ==="
  # Execute prompt with sub-agent
  # Update status to in_progress, then completed
done < manifest.jsonl
```

### Using /plan-orchestrate

```bash
/plan-orchestrate dev/active/claude-hall-monitor-plugin
```

## Feature Status Tracking

Update status in manifest.jsonl as you progress:

| Status | Meaning |
|--------|---------|
| `pending` | Not started |
| `in_progress` | Currently being implemented |
| `completed` | Done and verified |
| `failed` | Needs attention |

## Verification Commands

Each feature includes a verification command. Run before marking complete:

| Feature | Verification |
|---------|-------------|
| F000 | `ls hooks/handlers && ls rules` |
| F001 | `jq '.' .claude-plugin/plugin.json` |
| F002 | `bun run build.ts && ls dist/handlers` |
| F003 | `cd hooks && bun run tsc --noEmit` |
| F004 | `grep -q 'Installation' README.md` |
| F005 | `./scripts/version-check.sh` |
| F006 | `test -f .github/workflows/ci.yml` |
| F007 | `test -f .github/workflows/release.yml` |
| F008 | `bun run test-e2e.ts` |
| F009 | `jq '.' marketplace-entry.json` |
| F010 | `git tag | grep -q 'v1.0.0'` |

## Decision Log

See `decisions.md` for architectural choices:

| ID | Decision |
|----|----------|
| D001 | Rename repo to `claude-hall-monitor` |
| D002 | Bundle TypeScript to JavaScript |
| D003 | Semantic versioning starting at 1.0.0 |
| D004 | Keep a Changelog format |
| D005 | GitHub Actions for CI/CD |
| D006 | Zip archive for releases |
| D007 | Use `${CLAUDE_PLUGIN_ROOT}` in hook commands |

## Edge Cases

See `edge-cases.md` for cases spanning multiple features:

| ID | Case |
|----|------|
| EC001 | Cross-platform path handling |
| EC002 | Bun runtime prerequisite |
| EC003 | Build failure handling |
| EC004 | Plugin variable expansion |
| EC005 | Version sync validation |

## Completion Checklist

- [ ] F000: Project restructured
- [ ] F001: Plugin manifest created
- [ ] F002: Build system working
- [ ] F003: Imports verified
- [ ] F004: Documentation updated
- [ ] F005: Versioning established
- [ ] F006: CI workflow active
- [ ] F007: Release workflow active
- [ ] F008: E2E tests passing
- [ ] F009: Marketplace entry prepared
- [ ] F010: v1.0.0 released
