import { existsSync, readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PATHS, WATCHER_CONFIG } from "./config";
import type { LogEntry, SessionInfo } from "./types";

type EntryCallback = (entry: LogEntry) => void;

export class LogFileWatcher {
  private lastSize = 0;
  private interval: Timer | null = null;
  private subscribers: Set<EntryCallback> = new Set();
  private currentSessionId: string | null = null;

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
   * Set the current session to watch
   */
  setSession(session_id: string): void {
    this.currentSessionId = session_id;
    this.lastSize = this.getFileSize();
  }

  /**
   * Get the current session ID being watched
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Get all existing entries from the log file
   */
  getAllEntries(): LogEntry[] {
    const logPath = this.getLogFilePath();
    if (!logPath) return [];
    try {
      const file = Bun.file(logPath);
      if (!file.size) return [];

      const content = readFileSync(logPath, "utf-8");
      return this.parseLines(content);
    } catch (error) {
      console.error("Failed to read log file:", error);
      return [];
    }
  }

  /**
   * List all available session log files
   */
  static async listSessions(): Promise<SessionInfo[]> {
    const dir = PATHS.LOGS_DIR;
    if (!existsSync(dir)) return [];

    const files = readdirSync(dir).filter(f => f.endsWith('.txt') && f !== '.gitkeep');
    const sessions = await Promise.all(files.map(async filename => {
      const session_id = filename.replace('.txt', '');
      const file_path = join(dir, filename);
      const stats = statSync(file_path);
      const content = await Bun.file(file_path).text();
      const lines = content.trim().split('\n').filter(Boolean);

      let first_entry = '', last_entry = '';
      if (lines.length > 0) {
        try {
          const firstLine = lines[0];
          const lastLine = lines[lines.length - 1];
          if (firstLine && lastLine) {
            const firstParsed = JSON.parse(firstLine) as LogEntry;
            const lastParsed = JSON.parse(lastLine) as LogEntry;
            first_entry = firstParsed.timestamp ?? '';
            last_entry = lastParsed.timestamp ?? '';
          }
        } catch (error) {
          console.error("Failed to parse session timestamps:", error);
        }
      }

      return {
        session_id,
        file_path,
        first_entry,
        last_entry,
        entry_count: lines.length,
        size_bytes: stats.size,
      };
    }));
    return sessions.sort((a, b) => b.last_entry.localeCompare(a.last_entry));
  }

  /**
   * Get the current log file path based on session
   */
  private getLogFilePath(): string | null {
    if (!this.currentSessionId) return null;
    return PATHS.getSessionLogPath(this.currentSessionId);
  }

  private getFileSize(): number {
    const logPath = this.getLogFilePath();
    if (!logPath) return 0;
    try {
      const file = Bun.file(logPath);
      return file.size;
    } catch (error) {
      console.error("Failed to get file size:", error);
      return 0;
    }
  }

  private checkForChanges(): void {
    const currentSize = this.getFileSize();

    if (currentSize > this.lastSize) {
      // Read only the new content
      const logPath = this.getLogFilePath();
      if (!logPath) return;

      try {
        const file = Bun.file(logPath);
        const slice = file.slice(this.lastSize, currentSize);
        slice.text()
          .then((content) => {
            const entries = this.parseLines(content);
            for (const entry of entries) {
              this.emit(entry);
            }
          })
          .catch((error) => {
            console.error("Error reading log file slice:", error);
          });
      } catch (error) {
        console.error("Error reading log file:", error);
      }

      this.lastSize = currentSize;
    } else if (currentSize < this.lastSize) {
      // File was truncated/reset, start from beginning
      this.lastSize = currentSize;
    }
  }

  private parseLines(content: string): LogEntry[] {
    const entries: LogEntry[] = [];
    const lines = content.split("\n").filter((line) => line.trim());

    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as LogEntry;
        entries.push(entry);
      } catch (error) {
        console.error("Failed to parse JSON line:", error);
      }
    }

    return entries;
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
