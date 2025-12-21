# Hook Handler Conventions

When creating or modifying hook handlers in `hooks/handlers/`:

## Structure

- Receive input via stdin as JSON
- Use types from `@anthropic-ai/claude-agent-sdk` for type safety
- Log to unified `hooks-log.txt` using the shared logger
- Output JSON to stdout for Claude Code to consume
- Build script bundles TypeScript to standalone JavaScript in `dist/handlers/`

## Required Imports

```typescript
import { log, readInput, writeOutput } from '../utils/logger';
import type { HookInputType } from '@anthropic-ai/claude-agent-sdk';
```

## Pattern

```typescript
const input = await readInput<HookInputType>();
await log('EventName', input.session_id, { /* relevant data */ });
writeOutput({ /* response */ });
```

## Output Types

Different hooks support different outputs:

- **PreToolUse**: `permissionDecision`, `permissionDecisionReason`, `updatedInput`
- **PostToolUse**: `additionalContext`, `updatedMCPToolOutput`
- **PostToolUseFailure**: `additionalContext`
- **UserPromptSubmit**: `additionalContext`
- **SessionStart**: `additionalContext`
- **SubagentStart**: `additionalContext`
- **PermissionRequest**: `decision` (allow/deny with options)
