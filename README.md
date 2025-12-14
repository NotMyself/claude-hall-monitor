# Claude Hall Monitor

A Claude Code plugin featuring all 12 hooks with structured JSONL logging and a realtime web-based log viewer.

## Features

- All 12 Claude Code hooks implemented with full TypeScript type safety
- Structured JSONL logging for all hook events
- Realtime web UI with SSE streaming for live log viewing
- Dark/light theme support
- Event filtering and categorization
- Comprehensive test coverage
- Auto-start/shutdown lifecycle management

## Prerequisites

- [Bun](https://bun.sh/) v1.0 or later - Required runtime for the plugin
- [Claude Code CLI](https://claude.ai/code)

## Installation

### Via Claude Marketplace (Recommended)

```bash
claude plugin install claude-hall-monitor
```

### Manual Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/claude-hall-monitor.git
cd claude-hall-monitor
```

2. Build the plugin:
```bash
cd hooks && bun install && bun run build
```

3. Install locally:
```bash
claude plugin install /path/to/claude-hall-monitor
```

The plugin is distributed as bundled JavaScript with all dependencies inlined - users don't need to run `bun install` after installation.

## Usage

Once installed, the plugin is automatically active in all Claude Code sessions. Claude Hall Monitor will automatically launch at http://localhost:3456 when you start a session and gracefully shut down when you exit.

## Claude Hall Monitor (Log Viewer)

Claude Hall Monitor provides a web-based interface to monitor hook activity in realtime:

- **Auto-start**: Launches automatically on any session event (startup, resume, clear, compact)
- **Auto-shutdown**: Gracefully shuts down when Claude Code exits
- **Live Updates**: Uses Server-Sent Events (SSE) for instant log streaming
- **Filtering**: Filter logs by event type (PreToolUse, PostToolUse, etc.)
- **Themes**: Toggle between dark and light themes
- **URL**: http://localhost:3456

### Manual Start (Development)

For development purposes, you can manually start the viewer:

```bash
cd hooks

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
| **SessionStart** | Runs on session start/resume/clear/compact. Auto-starts Claude Hall Monitor. |
| **SessionEnd** | Triggered when a session ends. Gracefully shuts down Claude Hall Monitor. |
| **Stop** | Handles user interrupts (Ctrl+C, Escape). |
| **SubagentStart** | Runs when a subagent is spawned. |
| **SubagentStop** | Triggered when a subagent completes. |
| **PreCompact** | Runs before context compaction. |
| **PermissionRequest** | Handles permission requests. Can auto-approve or deny. |

## Log Format

All hooks write to `hooks-log.txt` in JSONL format:

```json
{"timestamp":"2024-12-11T14:30:00.000Z","event":"PreToolUse","session_id":"abc123","data":{"tool_name":"Read","tool_input":{...}}}
```

## Project Structure

```
claude-hall-monitor/
├── .claude-plugin/
│   ├── plugin.json            # Plugin manifest
│   └── hooks.json             # Hook mappings
├── dist/                      # Bundled JavaScript (auto-generated)
│   ├── handlers/              # Bundled hook handlers
│   └── viewer/                # Bundled viewer components
├── hooks/
│   ├── handlers/              # Hook handler TypeScript sources
│   │   ├── user-prompt-submit.ts
│   │   ├── pre-tool-use.ts
│   │   ├── post-tool-use.ts
│   │   ├── post-tool-use-failure.ts
│   │   ├── notification.ts
│   │   ├── session-start.ts
│   │   ├── session-end.ts
│   │   ├── stop.ts
│   │   ├── subagent-start.ts
│   │   ├── subagent-stop.ts
│   │   ├── pre-compact.ts
│   │   └── permission-request.ts
│   ├── utils/
│   │   └── logger.ts          # Shared logging utilities
│   ├── viewer/
│   │   ├── server.ts          # Bun HTTP server
│   │   ├── watcher.ts         # File watcher for logs
│   │   ├── index.html         # Vue.js web UI
│   │   ├── logo.svg           # Hall Monitor logo
│   │   ├── config.ts          # Configuration
│   │   ├── types.ts           # TypeScript types
│   │   ├── vitest.config.ts   # Test configuration
│   │   ├── styles/
│   │   │   └── theme.css      # Theme styles
│   │   └── __tests__/         # Test files
│   ├── build.ts               # Build script
│   └── package.json           # Dependencies
├── rules/                     # Coding conventions (auto-loaded)
│   ├── commands.md
│   ├── cross-platform.md
│   ├── hook-handlers.md
│   ├── logging.md
│   ├── mcp-docker-networking.md
│   └── testing.md
└── commands/                  # Custom slash commands
    ├── plan-new.md
    ├── plan-optimize.md
    └── plan-orchestrate.md
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
cd hooks && bun run tsc --noEmit
```

### Running Tests

```bash
cd hooks

# Watch mode
bun run test

# Single run
bun run test:run

# With coverage
bun run test:coverage
```

### Build Plugin

```bash
cd hooks && bun run build
```

This bundles all TypeScript sources into standalone JavaScript files in the `dist/` directory with all dependencies inlined.

### View Raw Logs

```bash
cat hooks-log.txt
```

## Configuration

When installed as a plugin, hooks are automatically configured via `.claude-plugin/hooks.json`. The plugin's bundled handlers execute automatically without additional setup.

### Local Development

For local development (not using the plugin), hook configuration is in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bun run hooks/handlers/pre-tool-use.ts"
          }
        ]
      }
    ]
  }
}
```

The `matcher` field can filter which tools trigger the hook (empty string matches all).

## Dependencies

### Runtime
- `@anthropic-ai/claude-agent-sdk` - Type definitions for hook inputs/outputs

### Development
- `@types/bun` - Bun runtime types
- `typescript` - Type checking (peer dependency)

### Testing
- `vitest` - Test runner
- `@vitest/coverage-v8` - Code coverage
- `happy-dom` - Browser API mocking for tests
- `@vue/test-utils` - Vue component testing

## License

MIT
