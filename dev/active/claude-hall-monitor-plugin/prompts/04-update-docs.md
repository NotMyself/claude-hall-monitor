# Feature: F004 - Update Documentation

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000**: Project restructured
- **F001**: Plugin manifest created
- **F002**: Build system created
- **F003**: Import paths verified

## Objective

Update all documentation files to reflect the new directory structure and add plugin installation instructions.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D001**: Rename repo to `claude-hall-monitor` — Update all repository references
- **D002**: Bundle to JavaScript — Document that users don't need `bun install`

## Edge Cases to Handle

From `edge-cases.md`:
- **EC002**: Bun runtime not installed → Document as prerequisite
- **EC008**: Existing hooks conflict → Document hook precedence

## Code References

Read these sections before implementing:
- `code/json.md#changelog-format` - CHANGELOG structure (for F006, reference only)

## Constraints

- See `constraints.md` for global rules
- Keep installation instructions simple
- Maintain existing useful content, only update paths

## Files to Modify

| File | Changes |
|------|---------|
| `README.md` | Add plugin installation section, update architecture diagram |
| `CLAUDE.md` | Update all `.claude/hooks/` references to `hooks/` |
| `rules/commands.md` | Update path references |
| `rules/hook-handlers.md` | Update path references |
| `rules/testing.md` | Update path references |
| `rules/logging.md` | Update log file path |

## Implementation Details

### README.md Updates

Add installation section at the top:

```markdown
# Claude Hall Monitor

A Claude Code plugin providing all 12 hook handlers, realtime log viewer, rules, and slash commands.

## Installation

### Prerequisites

- [Bun](https://bun.sh) runtime installed

### Via Marketplace (Recommended)

```bash
# Install from claude-dotnet-marketplace
claude plugin install claude-hall-monitor
```

### Manual Installation

1. Download the latest release
2. Extract to your plugins directory
3. The hooks will be automatically registered

## Features

- All 12 Claude Code hooks with JSONL logging
- Realtime log viewer UI (auto-starts on session)
- 6 rules files for Claude Code guidance
- 3 slash commands
```

### CLAUDE.md Path Updates

Replace all occurrences of:
- `.claude/hooks/` → `hooks/`
- `.claude/rules/` → `rules/`
- `.claude/commands/` → `commands/`

Update architecture diagram:

```markdown
## Architecture

```
claude-hall-monitor/
├── .claude-plugin/
│   ├── plugin.json       # Plugin metadata
│   └── hooks.json        # Hook configurations
├── dist/                 # Built JavaScript bundles
│   ├── handlers/         # 12 handler bundles
│   └── viewer/           # Viewer server bundle
├── hooks/                # TypeScript source
│   ├── handlers/         # Hook handler scripts
│   ├── utils/            # Shared utilities
│   ├── viewer/           # Realtime log viewer
│   └── hooks-log.txt     # JSONL log file
├── rules/                # Claude Code rules
└── commands/             # Slash commands
```
```

### rules/commands.md Updates

```markdown
# Project Commands

All commands run from `hooks/` directory unless otherwise specified.

## Development

```bash
cd hooks
bun install
bun run tsc --noEmit
```

## Building

```bash
# From project root
bun run build.ts
```
```

### rules/hook-handlers.md Updates

Update example paths:

```markdown
When creating or modifying hook handlers in `hooks/handlers/`:
```

### rules/testing.md Updates

```markdown
Tests live in `hooks/viewer/__tests__/`

```bash
cd hooks
bun run test
```
```

### rules/logging.md Updates

```markdown
All logs append to `hooks/hooks-log.txt`
```

## Acceptance Criteria

- [ ] README.md has installation instructions
- [ ] CLAUDE.md paths updated from `.claude/` to root level
- [ ] All rules files reference correct paths
- [ ] No references to `.claude/hooks/` remain in docs
- [ ] Documentation is accurate for new structure

## Verification

```bash
# Search for old paths (should return nothing)
grep -r "\.claude/hooks" README.md CLAUDE.md rules/
grep -r "\.claude/rules" README.md CLAUDE.md rules/

# Verify new paths mentioned
grep -q "hooks/handlers" CLAUDE.md && echo "✓ CLAUDE.md updated"
grep -q "plugin install" README.md && echo "✓ README.md has install section"
```

## Commit

```bash
git add README.md CLAUDE.md rules/
git commit -m "docs: update paths for plugin structure

Update documentation to reflect new directory layout:
- .claude/hooks/ → hooks/
- .claude/rules/ → rules/
- .claude/commands/ → commands/

Add plugin installation instructions to README

Implements: F004
Decisions: D001"
```

## Next

Proceed to: `prompts/05-versioning.md` (F005)
