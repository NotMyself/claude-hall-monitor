# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Claude Code hooks project using Bun as the JavaScript runtime on Windows. It implements all 12 Claude Code hooks with full functionality, structured JSONL logging, a realtime log viewer web UI, and comprehensive test coverage.

## Commands

```bash
# Install dependencies (run from .claude/hooks directory)
cd .claude/hooks && bun install

# Type check all hooks
cd .claude/hooks && bun run tsc --noEmit

# Run a hook script directly (for testing)
bun run .claude/hooks/handlers/user-prompt-submit.ts

# View structured logs
cat .claude/hooks/hooks-log.txt

# Start the realtime log viewer (auto-starts on any session event, auto-stops on exit)
cd .claude/hooks && bun run viewer

# Start viewer in development mode (with hot reload)
cd .claude/hooks && bun run viewer:dev

# Run tests
cd .claude/hooks && bun run test

# Run tests once (no watch)
cd .claude/hooks && bun run test:run

# Run tests with coverage
cd .claude/hooks && bun run test:coverage
```

## Architecture

The project uses Claude Code's hooks system to execute TypeScript scripts via Bun when specific events occur.

### Configuration

**Hook Configuration**: `.claude/settings.json` defines all 12 hooks and their triggers.

### Hook Handlers

Located in `.claude/hooks/handlers/`. Each handler:
- Receives input via stdin as JSON
- Uses types from `@anthropic-ai/claude-agent-sdk` for type safety
- Logs to unified `hooks-log.txt` in JSONL format
- Outputs JSON to stdout for Claude Code to consume

### Shared Utilities

**Logger** (`utils/logger.ts`): Provides structured logging and I/O helpers:
- `log(event, session_id, data)` - Append JSONL entry to log file
- `readInput<T>()` - Parse typed JSON from stdin
- `writeOutput(output)` - Write JSON response to stdout

### Log Format (JSONL)

All hooks write to `.claude/hooks/hooks-log.txt` with this schema:

```json
{"timestamp":"2024-12-11T14:30:00.000Z","event":"PreToolUse","session_id":"abc123","data":{...}}
```

### Realtime Log Viewer

Located in `.claude/hooks/viewer/`. A web-based dashboard for viewing hook logs in realtime:

- **Auto-start**: Launches automatically on any session event (startup, resume, clear, compact) on port 3456
- **Auto-shutdown**: Gracefully shuts down when Claude Code exits
- **SSE Streaming**: Real-time log updates via Server-Sent Events
- **Filtering**: Filter logs by event type
- **Dark/Light Theme**: Toggle between themes
- **Tab Support**: View different log categories

Key files:
- `viewer/server.ts` - Bun HTTP server with SSE endpoints
- `viewer/watcher.ts` - File watcher for log changes
- `viewer/index.html` - Vue.js single-file application
- `viewer/styles/theme.css` - Theme styling
- `viewer/config.ts` - Configuration constants
- `viewer/types.ts` - TypeScript type definitions

### Testing

Tests are located in `.claude/hooks/viewer/__tests__/`:
- `components.test.ts` - Vue component unit tests
- `server.test.ts` - Server endpoint tests
- `setup.ts` - Test environment setup with happy-dom

Uses Vitest with happy-dom for browser API mocking.

## Implemented Hooks

| Hook | File | Capabilities |
|------|------|--------------|
| UserPromptSubmit | `handlers/user-prompt-submit.ts` | Log prompts, inject `additionalContext` |
| PreToolUse | `handlers/pre-tool-use.ts` | Allow/deny/modify tool inputs |
| PostToolUse | `handlers/post-tool-use.ts` | Log results, inject context, modify MCP output |
| PostToolUseFailure | `handlers/post-tool-use-failure.ts` | Log failures, provide recovery context |
| Notification | `handlers/notification.ts` | Log system notifications |
| SessionStart | `handlers/session-start.ts` | Log session start, inject welcome context, auto-start viewer on all session types |
| SessionEnd | `handlers/session-end.ts` | Log session termination, gracefully shut down viewer |
| Stop | `handlers/stop.ts` | Log user interrupts |
| SubagentStart | `handlers/subagent-start.ts` | Log subagent spawning, inject context |
| SubagentStop | `handlers/subagent-stop.ts` | Log subagent completion |
| PreCompact | `handlers/pre-compact.ts` | Log context compaction events |
| PermissionRequest | `handlers/permission-request.ts` | Auto-approve/deny permissions |

## Hook Output Capabilities

Hooks can return JSON output to modify Claude Code behavior:

- **PreToolUse**: `permissionDecision` (allow/deny/ask), `permissionDecisionReason`, `updatedInput`
- **PostToolUse**: `additionalContext`, `updatedMCPToolOutput`
- **PostToolUseFailure**: `additionalContext`
- **UserPromptSubmit**: `additionalContext`
- **SessionStart**: `additionalContext`
- **SubagentStart**: `additionalContext`
- **PermissionRequest**: `decision` (allow/deny with options)

## Dependencies

- `@anthropic-ai/claude-agent-sdk` - Hook input/output type definitions
- `@types/bun` - Bun runtime types
- `typescript` - Type checking

### Dev Dependencies (Testing)

- `vitest` - Test runner
- `@vitest/coverage-v8` - Code coverage
- `@vue/test-utils` - Vue component testing utilities
- `happy-dom` - Browser API mocking for tests
