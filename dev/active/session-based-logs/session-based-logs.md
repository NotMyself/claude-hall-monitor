# Plan: Per-Session Log Files for Claude Code Hooks

## Summary

Convert from single shared `hooks-log.txt` to per-session log files at `.claude/hooks/logs/{session_id}.txt`. The viewer will default to the current session with ability to browse previous sessions.

## Requirements (from user)

- **Clean break**: No backward compatibility with existing `hooks-log.txt`
- **Keep logs indefinitely**: No auto-cleanup
- **Default view**: Current session only, with ability to view previous sessions

## New File Structure

```
.claude/hooks/
  logs/                    # NEW: Per-session log directory
    {session_id}.txt       # One JSONL file per session
  utils/logger.ts          # Modified
  viewer/
    config.ts              # Modified
    watcher.ts             # Modified (major refactor)
    server.ts              # Modified (new API endpoints)
    types.ts               # Modified (new types)
    index.html             # Modified (session selector UI)
  session-start.ts         # Modified (pass session ID to viewer)
```

## Implementation Steps

### Step 1: Update Logger (`utils/logger.ts`)

**Changes:**
- Add `LOGS_DIR` constant pointing to `.claude/hooks/logs/`
- Add `getLogFilePath(session_id)` function
- Add `ensureLogsDir()` to create directory if missing
- Modify `log()` to write to per-session file

```typescript
export const LOGS_DIR = join(__dirname, "..", "logs");

export function getLogFilePath(session_id: string): string {
  return join(LOGS_DIR, `${session_id}.txt`);
}

async function ensureLogsDir(): Promise<void> {
  if (!existsSync(LOGS_DIR)) {
    await mkdir(LOGS_DIR, { recursive: true });
  }
}

export async function log(...): Promise<void> {
  await ensureLogsDir();
  const filePath = getLogFilePath(session_id);
  await appendFile(filePath, line, "utf-8");
}
```

### Step 2: Update Config (`viewer/config.ts`)

**Changes:**
- Replace `LOG_FILE` with `LOGS_DIR` path
- Add `getSessionLogPath(session_id)` helper
- Add `CURRENT_SESSION_ENV` constant for env variable name

```typescript
export const PATHS = {
  VIEWER_DIR: import.meta.dir,
  LOGS_DIR: resolve(import.meta.dir, "..", "logs"),
  getSessionLogPath(session_id: string): string {
    return join(this.LOGS_DIR, `${session_id}.txt`);
  },
  // ... existing paths
} as const;

export const CURRENT_SESSION_ENV = "CLAUDE_HOOKS_VIEWER_SESSION";
```

### Step 3: Update Types (`viewer/types.ts`)

**Add new types:**

```typescript
export interface SessionInfo {
  session_id: string;
  file_path: string;
  first_entry: string;
  last_entry: string;
  entry_count: number;
  size_bytes: number;
}

export interface SessionListResponse {
  sessions: SessionInfo[];
  current_session: string | null;
}
```

### Step 4: Refactor Watcher (`viewer/watcher.ts`)

**Major changes:**
- Add `currentSessionId` property
- Add `setSession(session_id)` method to switch watched file
- Add static `listSessions()` method to enumerate all session files
- Update `getFileSize()`, `getAllEntries()`, `checkForChanges()` to use current session path

**Key methods:**

```typescript
setSession(session_id: string): void {
  this.currentSessionId = session_id;
  this.lastSize = this.getFileSize();
}

private getLogFilePath(): string | null {
  if (!this.currentSessionId) return null;
  return PATHS.getSessionLogPath(this.currentSessionId);
}

static listSessions(): SessionInfo[] {
  // Read LOGS_DIR, parse each file for metadata
  // Sort by last_entry descending (most recent first)
}
```

### Step 5: Update Server (`viewer/server.ts`)

**Changes:**
- Read current session from `CURRENT_SESSION_ENV` environment variable
- Initialize watcher with current session
- Add `GET /api/sessions` endpoint
- Update `GET /api/entries` to support `?session=<id>` filter
- Update `GET /events` to support `?session=<id>` filter

**New endpoint:**

```typescript
// GET /api/sessions
function handleSessionsList(): Response {
  const sessions = LogFileWatcher.listSessions();
  return Response.json({
    sessions,
    current_session: currentSessionId,
  });
}
```

**Modified SSE handler:**
- Accept `?session=<id>` query parameter
- Default to current session if no parameter
- Create session-specific watcher for the stream

### Step 6: Update Frontend (`viewer/index.html`)

**Changes:**
- Add `sessions`, `currentSession`, `selectedSession` refs
- Add `fetchSessions()` to load available sessions on mount
- Add session selector component in filter bar
- Modify `connect()` to pass `?session=<id>` to SSE endpoint
- Watch `selectedSession` to reconnect SSE when changed

**New component:**

```javascript
app.component('session-selector', {
  props: ['sessions', 'currentSession', 'modelValue'],
  emits: ['update:modelValue'],
  // Dropdown showing sessions with (current) marker
  // Displays: short ID + start time + entry count
});
```

### Step 7: Update Session Start Hook (`session-start.ts`)

**Change:**
- Pass `CLAUDE_HOOKS_VIEWER_SESSION` env var when spawning viewer

```typescript
const proc = spawn(["bun", "run", viewerPath], {
  env: {
    ...process.env,
    CLAUDE_HOOKS_VIEWER_SESSION: input.session_id,
  },
  // ... other options
});
```

## Files to Modify

| File | Change Scope |
|------|--------------|
| `.claude/hooks/utils/logger.ts` | Moderate - new path logic |
| `.claude/hooks/viewer/config.ts` | Small - add constants |
| `.claude/hooks/viewer/types.ts` | Small - add 2 interfaces |
| `.claude/hooks/viewer/watcher.ts` | Major - session-aware watching |
| `.claude/hooks/viewer/server.ts` | Moderate - new endpoint + filters |
| `.claude/hooks/viewer/index.html` | Moderate - session selector UI |
| `.claude/hooks/session-start.ts` | Small - pass env var |

## Edge Cases Handled

1. **Empty logs directory**: `ensureLogsDir()` creates with `recursive: true`
2. **No sessions yet**: `/api/sessions` returns empty array, UI shows message
3. **Concurrent writes**: `appendFile` is atomic for small writes
4. **Session switch mid-stream**: Disconnect old SSE, reconnect with new session
5. **File deleted while watching**: Gracefully handle missing file
6. **Large session count**: `/api/sessions` sorts by recency, could add pagination later

## Testing Notes

After implementation, verify:
1. New sessions create files in `logs/` directory
2. Viewer defaults to current session
3. Session selector shows all sessions with (current) marker
4. Switching sessions updates the log view
5. SSE streaming works for selected session
6. Old `hooks-log.txt` is ignored (can be deleted manually)
