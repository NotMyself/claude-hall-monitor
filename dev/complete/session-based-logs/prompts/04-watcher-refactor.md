# Feature: F04 - Watcher Session Support

## Context
Types and config ready. Logger writes per-session files.

## Objective
Refactor LogFileWatcher to watch session-specific files with ability to switch sessions.

## Constraints
- Reference: See constraints.md
- Major refactor - maintain polling architecture
- Handle missing session gracefully

## Files to Modify
- `.claude/hooks/viewer/watcher.ts`

## Implementation Details

Add imports:
```typescript
import { existsSync, readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { SessionInfo } from "./types";
```

Add to LogFileWatcher class:
```typescript
private currentSessionId: string | null = null;

setSession(session_id: string): void {
  this.currentSessionId = session_id;
  this.lastSize = this.getFileSize();
}

getCurrentSessionId(): string | null {
  return this.currentSessionId;
}

private getLogFilePath(): string | null {
  if (!this.currentSessionId) return null;
  return PATHS.getSessionLogPath(this.currentSessionId);
}

static listSessions(): SessionInfo[] {
  const dir = PATHS.LOGS_DIR;
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir).filter(f => f.endsWith('.txt') && f !== '.gitkeep');
  return files.map(filename => {
    const session_id = filename.replace('.txt', '');
    const file_path = join(dir, filename);
    const stats = statSync(file_path);
    const content = readFileSync(file_path, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    let first_entry = '', last_entry = '';
    if (lines.length > 0) {
      try {
        first_entry = JSON.parse(lines[0]).timestamp;
        last_entry = JSON.parse(lines[lines.length - 1]).timestamp;
      } catch {}
    }

    return {
      session_id,
      file_path,
      first_entry,
      last_entry,
      entry_count: lines.length,
      size_bytes: stats.size,
    };
  }).sort((a, b) => b.last_entry.localeCompare(a.last_entry));
}
```

Update getFileSize():
```typescript
private getFileSize(): number {
  const logPath = this.getLogFilePath();
  if (!logPath) return 0;
  try {
    const file = Bun.file(logPath);
    return file.size;
  } catch {
    return 0;
  }
}
```

Update getAllEntries():
```typescript
async getAllEntries(): Promise<LogEntry[]> {
  const logPath = this.getLogFilePath();
  if (!logPath) return [];
  try {
    const file = Bun.file(logPath);
    if (!await file.exists()) return [];
    const content = await file.text();
    return this.parseLines(content);
  } catch {
    return [];
  }
}
```

Update checkForChanges():
```typescript
private async checkForChanges(): Promise<void> {
  const logPath = this.getLogFilePath();
  if (!logPath) return;

  const currentSize = this.getFileSize();
  // ... rest of existing logic using logPath instead of hardcoded path
}
```

## Acceptance Criteria
- [ ] currentSessionId property tracks active session
- [ ] setSession(id) updates watched file and resets size
- [ ] getCurrentSessionId() returns current session
- [ ] listSessions() returns metadata for all session files
- [ ] Existing methods use dynamic path via getLogFilePath()

## Verification
```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit
```bash
git add .claude/hooks/viewer/watcher.ts
git commit -m "feat(hooks): refactor watcher for session-aware file watching"
```

## Next
Proceed to: prompts/05-server-endpoints.md
