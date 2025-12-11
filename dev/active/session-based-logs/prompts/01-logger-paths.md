# Feature: F01 - Logger Path Updates

## Context
Initializer created `.claude/hooks/logs/` directory.

## Objective
Update logger.ts to write per-session log files instead of single shared file.

## Constraints
- Reference: See constraints.md
- Must maintain backward-compatible function signature for log()
- Use Bun's file APIs

## Files to Modify
- `.claude/hooks/utils/logger.ts`

## Implementation Details

Add these exports:
```typescript
import { existsSync } from "node:fs";
import { mkdir, appendFile } from "node:fs/promises";
import { join } from "node:path";

export const LOGS_DIR = join(__dirname, "..", "logs");

export function getLogFilePath(session_id: string): string {
  return join(LOGS_DIR, `${session_id}.txt`);
}

async function ensureLogsDir(): Promise<void> {
  if (!existsSync(LOGS_DIR)) {
    await mkdir(LOGS_DIR, { recursive: true });
  }
}
```

Modify log() function:
```typescript
export async function log(
  event: string,
  session_id: string,
  data: Record<string, unknown>
): Promise<void> {
  await ensureLogsDir();
  const filePath = getLogFilePath(session_id);
  const entry = { timestamp: new Date().toISOString(), event, session_id, data };
  await appendFile(filePath, JSON.stringify(entry) + "\n", "utf-8");
}
```

## Acceptance Criteria
- [ ] LOGS_DIR exported and points to .claude/hooks/logs/
- [ ] getLogFilePath(session_id) exported and returns correct path
- [ ] ensureLogsDir() creates directory if missing
- [ ] log() writes to session-specific file

## Verification
```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit
```bash
git add .claude/hooks/utils/logger.ts
git commit -m "feat(hooks): update logger to write per-session files"
```

## Next
Proceed to: prompts/02-config-update.md
