# Per-Session Logs - Implementation Orchestration

## Overview
This plan implements per-session log files for Claude Code hooks viewer, converting from a single shared `hooks-log.txt` to per-session files at `.claude/hooks/logs/{session_id}.txt`.

## Quick Start
1. Run `init.md` to create directory structure
2. Execute prompts in layer order (see below)
3. Run `08-e2e-validation.md` to verify

## Execution Order

### Layer 1: Foundation (No Dependencies)
These can run in parallel:
- `prompts/01-logger-paths.md` - Logger updates (F01)
- `prompts/02-config-update.md` - Config constants (F02)
- `prompts/03-types-update.md` - Type definitions (F03)

### Layer 2: Infrastructure (Depends on Layer 1)
These can run in parallel:
- `prompts/04-watcher-refactor.md` - Watcher session support (F04)
- `prompts/07-session-start-env.md` - Env var passing (F07)

### Layer 3: Features (Depends on Layer 2)
Run sequentially:
- `prompts/05-server-endpoints.md` - API endpoints (F05)
- `prompts/06-frontend-selector.md` - UI selector (F06)

### Layer 4: Validation (Depends on all)
- `prompts/08-e2e-validation.md` - Integration testing (F08)

## Feature Reference

| ID | Title | File | Scope |
|----|-------|------|-------|
| F01 | Logger Path Updates | utils/logger.ts | Moderate |
| F02 | Config Constants | viewer/config.ts | Small |
| F03 | Session Types | viewer/types.ts | Small |
| F04 | Watcher Session Support | viewer/watcher.ts | Major |
| F05 | Server API Endpoints | viewer/server.ts | Moderate |
| F06 | Frontend Session Selector | viewer/index.html | Moderate |
| F07 | Session Start Env Pass | session-start.ts | Small |
| F08 | E2E Validation | - | Testing |

## Commands

```bash
# Type check all code
cd .claude/hooks && bun run tsc --noEmit

# Run unit tests
cd .claude/hooks && bun run test:run

# Run tests with coverage
cd .claude/hooks && bun run test:coverage

# Start viewer manually
cd .claude/hooks && bun run viewer
```

## File Structure After Implementation

```
.claude/hooks/
  logs/                    # NEW: Per-session log directory
    {session_id}.txt       # One JSONL file per session
    .gitkeep               # Preserve directory in git
  utils/logger.ts          # Modified: per-session paths
  viewer/
    config.ts              # Modified: LOGS_DIR, CURRENT_SESSION_ENV
    watcher.ts             # Modified: session-aware watching
    server.ts              # Modified: new API endpoints
    types.ts               # Modified: SessionInfo types
    index.html             # Modified: session selector UI
  session-start.ts         # Modified: pass session ID env
```

## Tracking Progress

Update `features.json` status as you complete each feature:
- `pending` - Not started
- `in_progress` - Currently working on
- `completed` - Done and verified
- `failed` - Blocked or failed

## Constraints Reference

See `constraints.md` for:
- Code style rules
- Implementation guidelines
- Error handling patterns
- Git commit format
- Available MCP tools
