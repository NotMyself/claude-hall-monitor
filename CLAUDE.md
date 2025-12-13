# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

A Claude Code hooks implementation using Bun on Windows. Features all 12 hooks with JSONL logging, realtime log viewer UI, and comprehensive tests.

## Architecture

```
.claude/
├── hooks/
│   ├── handlers/       # Hook handler scripts
│   ├── utils/          # Shared utilities (logger.ts)
│   ├── viewer/         # Realtime log viewer web UI
│   └── hooks-log.txt   # Unified JSONL log file
├── settings.json       # Hook configuration
└── rules/              # Actionable conventions (auto-loaded)
```

### Log Viewer

- Auto-starts on session events (port 3456)
- Auto-shuts down on session end
- SSE streaming for realtime updates
- Vue.js single-file application

## Implemented Hooks

| Hook | File | Purpose |
|------|------|---------|
| UserPromptSubmit | `user-prompt-submit.ts` | Log prompts, inject context |
| PreToolUse | `pre-tool-use.ts` | Allow/deny/modify tool inputs |
| PostToolUse | `post-tool-use.ts` | Log results, modify MCP output |
| PostToolUseFailure | `post-tool-use-failure.ts` | Log failures, recovery context |
| Notification | `notification.ts` | Log system notifications |
| SessionStart | `session-start.ts` | Log start, auto-start viewer |
| SessionEnd | `session-end.ts` | Log end, shutdown viewer |
| Stop | `stop.ts` | Log user interrupts |
| SubagentStart | `subagent-start.ts` | Log subagent spawn |
| SubagentStop | `subagent-stop.ts` | Log subagent completion |
| PreCompact | `pre-compact.ts` | Log context compaction |
| PermissionRequest | `permission-request.ts` | Auto-approve/deny permissions |

## Dependencies

| Package | Purpose |
|---------|---------|
| `@anthropic-ai/claude-agent-sdk` | Hook type definitions |
| `@types/bun` | Bun runtime types |
| `typescript` | Type checking |
| `vitest` | Test runner |
| `@vue/test-utils` | Vue component testing |
| `happy-dom` | Browser API mocking |
