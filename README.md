# Claude Code Hooks with Bun

A complete implementation of all 12 Claude Code hooks using [Bun](https://bun.sh/) as the JavaScript runtime, featuring structured JSONL logging and a realtime web-based log viewer.

## Features

- All 12 Claude Code hooks implemented with full TypeScript type safety
- Structured JSONL logging for all hook events
- Realtime log viewer web UI with SSE streaming
- Dark/light theme support
- Event filtering and categorization
- Comprehensive test coverage

## Prerequisites

- [Bun](https://bun.sh/) v1.0 or later
- [Claude Code CLI](https://claude.ai/code)
- Windows 11 (tested), should work on macOS/Linux

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd claude-bun-win11-hooks

# Install dependencies
cd .claude/hooks && bun install
```

### 2. Start Using

The hooks are automatically active when you run Claude Code in this directory. On session startup, the realtime log viewer will automatically launch at http://localhost:3456.

## Realtime Log Viewer

The log viewer provides a web-based dashboard to monitor hook activity in realtime:

- **Auto-start**: Launches automatically when Claude Code starts a new session
- **Live Updates**: Uses Server-Sent Events (SSE) for instant log streaming
- **Filtering**: Filter logs by event type (PreToolUse, PostToolUse, etc.)
- **Themes**: Toggle between dark and light themes
- **URL**: http://localhost:3456

### Manual Start

```bash
cd .claude/hooks

# Start the viewer
bun run viewer

# Or with hot reload for development
bun run viewer:dev
```

## Implemented Hooks

| Hook | Description |
|------|-------------|
| **UserPromptSubmit** | Triggered when user submits a prompt. Can inject additional context. |
| **PreToolUse** | Runs before a tool executes. Can allow, deny, or modify tool inputs. |
| **PostToolUse** | Runs after a tool completes. Can inject context or modify MCP output. |
| **PostToolUseFailure** | Triggered when a tool fails. Can provide recovery context. |
| **Notification** | Handles system notifications from Claude Code. |
| **SessionStart** | Runs when a session starts. Auto-starts the log viewer. |
| **SessionEnd** | Triggered when a session ends. |
| **Stop** | Handles user interrupts (Ctrl+C, Escape). |
| **SubagentStart** | Runs when a subagent is spawned. |
| **SubagentStop** | Triggered when a subagent completes. |
| **PreCompact** | Runs before context compaction. |
| **PermissionRequest** | Handles permission requests. Can auto-approve or deny. |

## Log Format

All hooks write to `.claude/hooks/hooks-log.txt` in JSONL format:

```json
{"timestamp":"2024-12-11T14:30:00.000Z","event":"PreToolUse","session_id":"abc123","data":{"tool_name":"Read","tool_input":{...}}}
```

## Project Structure

```
.claude/
├── settings.local.json    # Hook configuration
└── hooks/
    ├── user-prompt-submit.ts
    ├── pre-tool-use.ts
    ├── post-tool-use.ts
    ├── post-tool-use-failure.ts
    ├── notification.ts
    ├── session-start.ts
    ├── session-end.ts
    ├── stop.ts
    ├── subagent-start.ts
    ├── subagent-stop.ts
    ├── pre-compact.ts
    ├── permission-request.ts
    ├── hooks-log.txt          # Structured log output
    ├── utils/
    │   └── logger.ts          # Shared logging utilities
    └── viewer/
        ├── server.ts          # Bun HTTP server
        ├── watcher.ts         # File watcher for logs
        ├── index.html         # Vue.js web UI
        ├── config.ts          # Configuration
        ├── types.ts           # TypeScript types
        ├── styles/
        │   └── theme.css      # Theme styles
        └── __tests__/         # Test files
```

## Hook Output Capabilities

Hooks can return JSON to modify Claude Code behavior:

| Hook | Output Options |
|------|----------------|
| **PreToolUse** | `permissionDecision` (allow/deny/ask), `permissionDecisionReason`, `updatedInput` |
| **PostToolUse** | `additionalContext`, `updatedMCPToolOutput` |
| **PostToolUseFailure** | `additionalContext` |
| **UserPromptSubmit** | `additionalContext` |
| **SessionStart** | `additionalContext` |
| **SubagentStart** | `additionalContext` |
| **PermissionRequest** | `decision` (allow/deny with options) |

## Development

### Type Checking

```bash
cd .claude/hooks && bun run tsc --noEmit
```

### Running Tests

```bash
cd .claude/hooks

# Watch mode
bun run test

# Single run
bun run test:run

# With coverage
bun run test:coverage
```

### View Raw Logs

```bash
cat .claude/hooks/hooks-log.txt
```

## Configuration

Hook configuration is in `.claude/settings.local.json`. Each hook is configured with:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bun run .claude/hooks/pre-tool-use.ts"
          }
        ]
      }
    ]
  }
}
```

The `matcher` field can filter which tools trigger the hook (empty string matches all).

## Dependencies

- `@anthropic-ai/claude-agent-sdk` - Type definitions for hook inputs/outputs
- `@types/bun` - Bun runtime types
- `typescript` - Type checking
- `vitest` - Test runner
- `happy-dom` - Browser API mocking for tests
- `@vue/test-utils` - Vue component testing

## License

MIT
