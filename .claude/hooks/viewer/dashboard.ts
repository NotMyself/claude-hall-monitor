/**
 * Dashboard data service for gathering session, stats, and config information.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, basename } from "node:path";
import { PATHS, DASHBOARD_CONFIG, CURRENT_SESSION_ENV } from "./config";
import type {
  DashboardData,
  DashboardSession,
  GlobalStats,
  CommandInfo,
  SkillInfo,
  HookConfig,
  SessionStatus,
  LogEntry,
  SessionInfo,
} from "./types";
import { LogFileWatcher } from "./watcher";

export class DashboardService {
  /**
   * Get complete dashboard data from all sources.
   */
  async getData(): Promise<DashboardData> {
    const [sessions, globalStats, commands, skills, hooks, mcpServers] =
      await Promise.all([
        this.getSessions(),
        this.getGlobalStats(),
        this.getCommands(),
        this.getSkills(),
        this.getHooks(),
        this.getMcpServers(),
      ]);

    return {
      sessions,
      currentSession: process.env[CURRENT_SESSION_ENV] || null,
      globalStats,
      commands,
      hooks,
      skills,
      mcpServers,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get sessions with computed activity status.
   */
  private getSessions(): DashboardSession[] {
    const sessionInfos = LogFileWatcher.listSessions();
    const now = Date.now();

    return sessionInfos.map((info) => {
      const entries = this.readSessionEntries(info.session_id);
      const lastHeartbeat = this.findLastActivity(entries);
      const status = this.determineStatus(entries, lastHeartbeat, now);
      const stats = this.computeSessionStats(entries);

      return {
        ...info,
        status,
        last_heartbeat: lastHeartbeat,
        tool_call_count: stats.toolCalls,
        message_count: stats.messages,
        compaction_count: stats.compactions,
        started_at: this.findStartTime(entries),
      };
    });
  }

  /**
   * Read all log entries for a session.
   */
  private readSessionEntries(sessionId: string): LogEntry[] {
    const logPath = PATHS.getSessionLogPath(sessionId);
    if (!existsSync(logPath)) return [];

    try {
      const content = readFileSync(logPath, "utf-8");
      return content
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as LogEntry);
    } catch {
      return [];
    }
  }

  /**
   * Find the most recent activity timestamp.
   */
  private findLastActivity(entries: LogEntry[]): string | null {
    if (entries.length === 0) return null;
    // Return the timestamp of the last entry
    const lastEntry = entries[entries.length - 1];
    return lastEntry?.timestamp ?? null;
  }

  /**
   * Determine session status from entries and heartbeat timing.
   */
  private determineStatus(
    entries: LogEntry[],
    lastActivity: string | null,
    now: number
  ): SessionStatus {
    // Check for SessionEnd without subsequent SessionStart
    const lastEndIndex = entries.findLastIndex((e) => e.event === "SessionEnd");
    if (lastEndIndex !== -1) {
      const hasRestartAfter = entries
        .slice(lastEndIndex + 1)
        .some((e) => e.event === "SessionStart");
      if (!hasRestartAfter) {
        return "ended";
      }
    }

    // Check activity timeout
    if (lastActivity) {
      const activityTime = new Date(lastActivity).getTime();
      if (now - activityTime > DASHBOARD_CONFIG.HEARTBEAT_TIMEOUT_MS) {
        return "inactive";
      }
      return "active";
    }

    return "inactive";
  }

  /**
   * Compute session statistics from log entries.
   */
  private computeSessionStats(entries: LogEntry[]) {
    let toolCalls = 0;
    let messages = 0;
    let compactions = 0;

    for (const entry of entries) {
      switch (entry.event) {
        case "PostToolUse":
        case "PostToolUseFailure":
          toolCalls++;
          break;
        case "UserPromptSubmit":
          messages++;
          break;
        case "PreCompact":
          compactions++;
          break;
      }
    }

    return { toolCalls, messages, compactions };
  }

  /**
   * Find session start time from SessionStart event.
   */
  private findStartTime(entries: LogEntry[]): string | null {
    const start = entries.find((e) => e.event === "SessionStart");
    return start?.timestamp ?? null;
  }

  /**
   * Read global stats from stats-cache.json.
   */
  private getGlobalStats(): GlobalStats | null {
    const statsPath = PATHS.STATS_CACHE;
    if (!existsSync(statsPath)) return null;

    try {
      const content = readFileSync(statsPath, "utf-8");
      const data = JSON.parse(content);
      return {
        totalSessions: data.totalSessions || 0,
        totalMessages: data.totalMessages || 0,
        modelUsage: data.modelUsage || {},
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse commands from .claude/commands/*.md files.
   */
  private getCommands(): CommandInfo[] {
    const dir = PATHS.COMMANDS_DIR;
    if (!existsSync(dir)) return [];

    try {
      const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
      return files.map((file) => {
        const filePath = join(dir, file);
        const content = readFileSync(filePath, "utf-8");
        const frontmatter = this.parseFrontmatter(content);

        return {
          name: basename(file, ".md"),
          description: frontmatter.description || "",
          argumentHint: frontmatter["argument-hint"],
          filePath,
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Parse skills from .claude/skills/*.md files.
   */
  private getSkills(): SkillInfo[] {
    const dir = PATHS.SKILLS_DIR;
    if (!existsSync(dir)) return [];

    try {
      const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
      return files.map((file) => {
        const filePath = join(dir, file);
        const content = readFileSync(filePath, "utf-8");
        const frontmatter = this.parseFrontmatter(content);

        return {
          name: frontmatter.name || basename(file, ".md"),
          description: frontmatter.description || "",
          filePath,
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Parse hooks from settings.json.
   */
  private getHooks(): HookConfig[] {
    const settingsPath = PATHS.SETTINGS_FILE;
    if (!existsSync(settingsPath)) return [];

    try {
      const content = readFileSync(settingsPath, "utf-8");
      const settings = JSON.parse(content);
      const hooks: HookConfig[] = [];

      if (settings.hooks) {
        for (const [eventName, configs] of Object.entries(settings.hooks)) {
          for (const config of configs as any[]) {
            for (const hook of config.hooks || []) {
              hooks.push({
                eventName,
                matcher: config.matcher || "",
                command: hook.command || "",
              });
            }
          }
        }
      }

      return hooks;
    } catch {
      return [];
    }
  }

  /**
   * Get enabled MCP servers from settings.json.
   */
  private getMcpServers(): string[] {
    const settingsPath = PATHS.SETTINGS_FILE;
    if (!existsSync(settingsPath)) return [];

    try {
      const content = readFileSync(settingsPath, "utf-8");
      const settings = JSON.parse(content);
      return settings.enabledMcpjsonServers || [];
    } catch {
      return [];
    }
  }

  /**
   * Parse YAML frontmatter from markdown content.
   */
  private parseFrontmatter(content: string): Record<string, string> {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match || !match[1]) return {};

    const frontmatter: Record<string, string> = {};
    const lines = match[1].split("\n");

    for (const line of lines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        let value = line.slice(colonIndex + 1).trim();
        // Remove surrounding quotes
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        frontmatter[key] = value;
      }
    }

    return frontmatter;
  }
}
