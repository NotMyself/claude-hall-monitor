# Feature: 03-watcher - File Watcher Utility

## Context
Features 01-types and 02-config are complete:
- `.claude/hooks/viewer/types.ts` - Type definitions
- `.claude/hooks/viewer/config.ts` - Configuration constants

## Objective
Create a LogFileWatcher class that monitors `hooks-log.txt` for new entries and emits them to subscribers.

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- Use Bun's file APIs, not Node.js fs
- Handle missing log file gracefully (don't crash)
- Parse JSONL format (one JSON object per line)
- Track file position to only read new content

## Files to Create/Modify
- `.claude/hooks/viewer/watcher.ts` - Replace placeholder with implementation

## Implementation Details

```typescript
import { PATHS, WATCHER_CONFIG } from "./config";
import type { LogEntry } from "./types";

type EntryCallback = (entry: LogEntry) => void;

export class LogFileWatcher {
  private lastSize = 0;
  private interval: Timer | null = null;
  private subscribers: Set<EntryCallback> = new Set();

  /**
   * Start watching the log file for changes
   */
  start(): void {
    if (this.interval) return;

    // Initialize with current file size
    this.lastSize = this.getFileSize();

    this.interval = setInterval(() => {
      this.checkForChanges();
    }, WATCHER_CONFIG.POLL_INTERVAL);
  }

  /**
   * Stop watching the log file
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Subscribe to new log entries
   */
  subscribe(callback: EntryCallback): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Get all existing entries from the log file
   */
  getAllEntries(): LogEntry[] {
    // Read entire file and parse each line as JSON
    // Return empty array if file doesn't exist
  }

  private getFileSize(): number {
    // Use Bun.file to check file size
    // Return 0 if file doesn't exist
  }

  private checkForChanges(): void {
    // Compare current size to lastSize
    // If larger, read only new content
    // Parse new lines and emit to subscribers
  }

  private parseLines(content: string): LogEntry[] {
    // Split by newline, filter empty, parse JSON
    // Handle invalid JSON gracefully (skip bad lines)
  }

  private emit(entry: LogEntry): void {
    for (const callback of this.subscribers) {
      try {
        callback(entry);
      } catch (error) {
        console.error("Subscriber error:", error);
      }
    }
  }
}
```

### Key Implementation Notes

1. **File Size Tracking**: Use `Bun.file(path).size` to get file size without reading
2. **Partial Reads**: Use `Bun.file(path).slice(start, end)` to read only new content
3. **JSONL Parsing**: Each line is a complete JSON object
4. **Error Handling**: Invalid JSON lines should be skipped, not crash

## Acceptance Criteria
- [ ] LogFileWatcher class implements file watching
- [ ] Tracks file size to detect new content
- [ ] Parses JSONL format correctly
- [ ] Emits new entries via callback to subscribers
- [ ] getAllEntries() returns all existing entries as LogEntry[]
- [ ] Handles missing log file gracefully (returns empty array)
- [ ] Handles invalid JSON lines gracefully (skips them)
- [ ] start() and stop() methods work correctly
- [ ] subscribe() returns unsubscribe function

## Verification
```bash
cd .claude/hooks && bun run tsc --noEmit viewer/watcher.ts
```

## Commit
After verification passes:
```bash
git add .claude/hooks/viewer/watcher.ts
git commit -m "feat(viewer): add log file watcher

- LogFileWatcher class monitors hooks-log.txt
- Polls for changes at 500ms intervals
- Tracks file size for incremental reads
- Parses JSONL format with error handling
- Subscriber pattern for new entry notifications"
```

## Next
Proceed to: `prompts/04-server-basic.md`
