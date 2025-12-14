# JSON Configuration Patterns

## Plugin Manifest

### plugin.json

```json
{
  "name": "claude-hall-monitor",
  "version": "1.0.0",
  "description": "All 12 hook handlers, realtime log viewer, rules, and slash commands for Claude Code",
  "author": "NotMyself",
  "repository": "https://github.com/NotMyself/claude-hall-monitor",
  "runtime": "bun",
  "keywords": ["hooks", "logging", "viewer", "monitoring"]
}
```

## Hook Configurations

### hooks.json - Complete Configuration

```json
{
  "hooks": [
    {
      "matcher": { "type": "always" },
      "hooks": [
        {
          "type": "SessionStart",
          "command": "bun run ${CLAUDE_PLUGIN_ROOT}/dist/handlers/session-start.js"
        },
        {
          "type": "SessionEnd",
          "command": "bun run ${CLAUDE_PLUGIN_ROOT}/dist/handlers/session-end.js"
        },
        {
          "type": "UserPromptSubmit",
          "command": "bun run ${CLAUDE_PLUGIN_ROOT}/dist/handlers/user-prompt-submit.js"
        },
        {
          "type": "PreToolUse",
          "command": "bun run ${CLAUDE_PLUGIN_ROOT}/dist/handlers/pre-tool-use.js"
        },
        {
          "type": "PostToolUse",
          "command": "bun run ${CLAUDE_PLUGIN_ROOT}/dist/handlers/post-tool-use.js"
        },
        {
          "type": "PostToolUseFailure",
          "command": "bun run ${CLAUDE_PLUGIN_ROOT}/dist/handlers/post-tool-use-failure.js"
        },
        {
          "type": "Notification",
          "command": "bun run ${CLAUDE_PLUGIN_ROOT}/dist/handlers/notification.js"
        },
        {
          "type": "Stop",
          "command": "bun run ${CLAUDE_PLUGIN_ROOT}/dist/handlers/stop.js"
        },
        {
          "type": "SubagentStart",
          "command": "bun run ${CLAUDE_PLUGIN_ROOT}/dist/handlers/subagent-start.js"
        },
        {
          "type": "SubagentStop",
          "command": "bun run ${CLAUDE_PLUGIN_ROOT}/dist/handlers/subagent-stop.js"
        },
        {
          "type": "PreCompact",
          "command": "bun run ${CLAUDE_PLUGIN_ROOT}/dist/handlers/pre-compact.js"
        },
        {
          "type": "PermissionRequest",
          "command": "bun run ${CLAUDE_PLUGIN_ROOT}/dist/handlers/permission-request.js"
        }
      ]
    }
  ]
}
```

### hooks.json - Development Version (Source Files)

For local development before building:

```json
{
  "hooks": [
    {
      "matcher": { "type": "always" },
      "hooks": [
        {
          "type": "SessionStart",
          "command": "bun run ${CLAUDE_PLUGIN_ROOT}/hooks/handlers/session-start.ts"
        }
      ]
    }
  ]
}
```

## Package Configuration

### package.json Updates

```json
{
  "name": "claude-hall-monitor",
  "version": "1.0.0",
  "description": "Claude Code hooks plugin with realtime log viewer",
  "scripts": {
    "build": "bun run build.ts",
    "build:handlers": "bun build hooks/handlers/*.ts --outdir dist/handlers --target bun --minify",
    "build:viewer": "bun build hooks/viewer/server.ts --outdir dist/viewer --target bun --minify",
    "test": "cd hooks && bun run test",
    "test:run": "cd hooks && bun run test:run",
    "test:e2e": "bun run test-e2e.ts",
    "viewer": "bun run hooks/viewer/server.ts",
    "typecheck": "cd hooks && bun run tsc --noEmit"
  },
  "devDependencies": {
    "@anthropic-ai/claude-agent-sdk": "^0.1.0",
    "@types/bun": "latest",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

## Changelog Format

### CHANGELOG.md Structure

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2024-12-14

### Added
- Initial plugin release
- All 12 hook handlers with JSONL logging
- Realtime log viewer UI (Vue.js)
- 6 rules files for Claude Code guidance
- 3 slash commands
- Build system for bundling TypeScript to JavaScript
- GitHub Actions CI/CD workflows
- Cross-platform support (Windows, macOS, Linux)

### Changed
- Project structure from .claude/ to root level for plugin distribution

[Unreleased]: https://github.com/NotMyself/claude-hall-monitor/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/NotMyself/claude-hall-monitor/releases/tag/v1.0.0
```

## Marketplace Entry

### marketplace.json Addition

```json
{
  "name": "claude-hall-monitor",
  "description": "All 12 hook handlers, realtime log viewer, rules, and slash commands",
  "repository": "https://github.com/NotMyself/claude-hall-monitor",
  "version": "1.0.0",
  "author": "NotMyself",
  "tags": ["hooks", "logging", "viewer", "monitoring", "bun"],
  "runtime": "bun"
}
```

## Test Fixtures

### session-start-input.json

```json
{
  "session_id": "test-session-abc123",
  "cwd": "/Users/test/project",
  "env": {
    "HOME": "/Users/test"
  }
}
```

### pre-tool-use-input.json

```json
{
  "session_id": "test-session-abc123",
  "tool_name": "Bash",
  "tool_input": {
    "command": "ls -la",
    "description": "List files in current directory"
  }
}
```

### Expected Output Format

```json
{
  "additionalContext": "Session initialized at 2024-12-14T10:30:00.000Z"
}
```

```json
{
  "permissionDecision": "allow",
  "permissionDecisionReason": "Safe read-only command"
}
```
