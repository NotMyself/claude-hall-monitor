# Logging Conventions

All hooks use structured JSONL logging via the shared logger utility.

## Log File

All logs append to `hooks/hooks-log.txt`

## JSONL Schema

```json
{"timestamp":"2024-12-11T14:30:00.000Z","event":"PreToolUse","session_id":"abc123","data":{...}}
```

## Logger Utility

Located in `hooks/utils/logger.ts`:

```typescript
import { log, readInput, writeOutput } from '../utils/logger';

// Append structured log entry
await log('EventName', session_id, { key: 'value' });

// Parse typed JSON from stdin
const input = await readInput<T>();

// Write JSON response to stdout
writeOutput({ result: 'data' });
```

## Guidelines

- Always include `session_id` for log correlation
- Keep `data` objects focused on relevant event information
- Use event names matching the hook type (e.g., `PreToolUse`, `SessionStart`)
