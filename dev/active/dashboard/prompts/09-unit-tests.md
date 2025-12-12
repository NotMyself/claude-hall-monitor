# Feature: unit-tests - Dashboard Unit Tests

## Context

All dashboard implementation is complete. The project uses Vitest for testing with happy-dom for browser API mocking. Existing tests are in `viewer/__tests__/`.

## Objective

Add unit tests for the dashboard service and related functionality.

**IMPORTANT**: Only implement this feature. Do not implement any other features.

## Constraints

Reference: See `constraints.md` for global rules.

- Create new test file `viewer/__tests__/dashboard.test.ts`
- Use Vitest patterns from existing tests
- Mock file system operations
- Test status determination logic thoroughly

## Files to Create

- `.claude/hooks/viewer/__tests__/dashboard.test.ts` - Dashboard tests

## Implementation Details

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DashboardService } from "../dashboard";
import type { LogEntry, SessionStatus } from "../types";

// Mock node:fs
vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
}));

// Mock watcher
vi.mock("../watcher", () => ({
  LogFileWatcher: {
    listSessions: vi.fn(),
  },
}));

// Import mocked modules
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { LogFileWatcher } from "../watcher";

describe("DashboardService", () => {
  let service: DashboardService;

  beforeEach(() => {
    service = new DashboardService();
    vi.clearAllMocks();
  });

  describe("getData", () => {
    it("returns complete dashboard data structure", async () => {
      // Setup mocks
      vi.mocked(LogFileWatcher.listSessions).mockReturnValue([]);
      vi.mocked(existsSync).mockReturnValue(false);

      const data = await service.getData();

      expect(data).toHaveProperty("sessions");
      expect(data).toHaveProperty("currentSession");
      expect(data).toHaveProperty("globalStats");
      expect(data).toHaveProperty("commands");
      expect(data).toHaveProperty("hooks");
      expect(data).toHaveProperty("skills");
      expect(data).toHaveProperty("mcpServers");
      expect(data).toHaveProperty("lastUpdated");
    });
  });

  describe("session status determination", () => {
    const mockSessionInfo = {
      session_id: "test-session",
      file_path: "/path/to/test-session.txt",
      first_entry: "2024-01-01T00:00:00Z",
      last_entry: "2024-01-01T01:00:00Z",
      entry_count: 10,
      size_bytes: 1000,
    };

    it("returns 'ended' when SessionEnd exists without restart", async () => {
      const entries: LogEntry[] = [
        { timestamp: "2024-01-01T00:00:00Z", event: "SessionStart", session_id: "test", data: {} },
        { timestamp: "2024-01-01T01:00:00Z", event: "SessionEnd", session_id: "test", data: {} },
      ];

      vi.mocked(LogFileWatcher.listSessions).mockReturnValue([mockSessionInfo]);
      vi.mocked(existsSync).mockImplementation((path) => {
        if (String(path).includes("test-session.txt")) return true;
        return false;
      });
      vi.mocked(readFileSync).mockImplementation((path) => {
        if (String(path).includes("test-session.txt")) {
          return entries.map((e) => JSON.stringify(e)).join("\n");
        }
        return "";
      });

      const data = await service.getData();

      expect(data.sessions[0].status).toBe("ended");
    });

    it("returns 'active' when SessionEnd followed by SessionStart", async () => {
      const now = new Date();
      const entries: LogEntry[] = [
        { timestamp: "2024-01-01T00:00:00Z", event: "SessionStart", session_id: "test", data: {} },
        { timestamp: "2024-01-01T00:30:00Z", event: "SessionEnd", session_id: "test", data: {} },
        { timestamp: now.toISOString(), event: "SessionStart", session_id: "test", data: {} },
      ];

      vi.mocked(LogFileWatcher.listSessions).mockReturnValue([mockSessionInfo]);
      vi.mocked(existsSync).mockImplementation((path) => {
        if (String(path).includes("test-session.txt")) return true;
        return false;
      });
      vi.mocked(readFileSync).mockImplementation((path) => {
        if (String(path).includes("test-session.txt")) {
          return entries.map((e) => JSON.stringify(e)).join("\n");
        }
        return "";
      });

      const data = await service.getData();

      expect(data.sessions[0].status).toBe("active");
    });

    it("returns 'inactive' when last activity exceeds timeout", async () => {
      const oldTime = new Date(Date.now() - 120_000).toISOString(); // 2 minutes ago
      const entries: LogEntry[] = [
        { timestamp: oldTime, event: "SessionStart", session_id: "test", data: {} },
        { timestamp: oldTime, event: "UserPromptSubmit", session_id: "test", data: {} },
      ];

      vi.mocked(LogFileWatcher.listSessions).mockReturnValue([mockSessionInfo]);
      vi.mocked(existsSync).mockImplementation((path) => {
        if (String(path).includes("test-session.txt")) return true;
        return false;
      });
      vi.mocked(readFileSync).mockImplementation((path) => {
        if (String(path).includes("test-session.txt")) {
          return entries.map((e) => JSON.stringify(e)).join("\n");
        }
        return "";
      });

      const data = await service.getData();

      expect(data.sessions[0].status).toBe("inactive");
    });

    it("returns 'active' when recent activity within timeout", async () => {
      const recentTime = new Date().toISOString();
      const entries: LogEntry[] = [
        { timestamp: recentTime, event: "SessionStart", session_id: "test", data: {} },
        { timestamp: recentTime, event: "UserPromptSubmit", session_id: "test", data: {} },
      ];

      vi.mocked(LogFileWatcher.listSessions).mockReturnValue([mockSessionInfo]);
      vi.mocked(existsSync).mockImplementation((path) => {
        if (String(path).includes("test-session.txt")) return true;
        return false;
      });
      vi.mocked(readFileSync).mockImplementation((path) => {
        if (String(path).includes("test-session.txt")) {
          return entries.map((e) => JSON.stringify(e)).join("\n");
        }
        return "";
      });

      const data = await service.getData();

      expect(data.sessions[0].status).toBe("active");
    });
  });

  describe("session statistics", () => {
    const mockSessionInfo = {
      session_id: "stats-test",
      file_path: "/path/to/stats-test.txt",
      first_entry: "2024-01-01T00:00:00Z",
      last_entry: "2024-01-01T01:00:00Z",
      entry_count: 10,
      size_bytes: 1000,
    };

    it("counts tool calls correctly", async () => {
      const now = new Date().toISOString();
      const entries: LogEntry[] = [
        { timestamp: now, event: "SessionStart", session_id: "test", data: {} },
        { timestamp: now, event: "PostToolUse", session_id: "test", data: {} },
        { timestamp: now, event: "PostToolUse", session_id: "test", data: {} },
        { timestamp: now, event: "PostToolUseFailure", session_id: "test", data: {} },
      ];

      vi.mocked(LogFileWatcher.listSessions).mockReturnValue([mockSessionInfo]);
      vi.mocked(existsSync).mockImplementation((path) => {
        if (String(path).includes("stats-test.txt")) return true;
        return false;
      });
      vi.mocked(readFileSync).mockImplementation((path) => {
        if (String(path).includes("stats-test.txt")) {
          return entries.map((e) => JSON.stringify(e)).join("\n");
        }
        return "";
      });

      const data = await service.getData();

      expect(data.sessions[0].tool_call_count).toBe(3);
    });

    it("counts messages correctly", async () => {
      const now = new Date().toISOString();
      const entries: LogEntry[] = [
        { timestamp: now, event: "SessionStart", session_id: "test", data: {} },
        { timestamp: now, event: "UserPromptSubmit", session_id: "test", data: {} },
        { timestamp: now, event: "UserPromptSubmit", session_id: "test", data: {} },
      ];

      vi.mocked(LogFileWatcher.listSessions).mockReturnValue([mockSessionInfo]);
      vi.mocked(existsSync).mockImplementation((path) => {
        if (String(path).includes("stats-test.txt")) return true;
        return false;
      });
      vi.mocked(readFileSync).mockImplementation((path) => {
        if (String(path).includes("stats-test.txt")) {
          return entries.map((e) => JSON.stringify(e)).join("\n");
        }
        return "";
      });

      const data = await service.getData();

      expect(data.sessions[0].message_count).toBe(2);
    });

    it("counts compactions correctly", async () => {
      const now = new Date().toISOString();
      const entries: LogEntry[] = [
        { timestamp: now, event: "SessionStart", session_id: "test", data: {} },
        { timestamp: now, event: "PreCompact", session_id: "test", data: {} },
      ];

      vi.mocked(LogFileWatcher.listSessions).mockReturnValue([mockSessionInfo]);
      vi.mocked(existsSync).mockImplementation((path) => {
        if (String(path).includes("stats-test.txt")) return true;
        return false;
      });
      vi.mocked(readFileSync).mockImplementation((path) => {
        if (String(path).includes("stats-test.txt")) {
          return entries.map((e) => JSON.stringify(e)).join("\n");
        }
        return "";
      });

      const data = await service.getData();

      expect(data.sessions[0].compaction_count).toBe(1);
    });
  });

  describe("configuration parsing", () => {
    it("parses commands from markdown frontmatter", async () => {
      vi.mocked(LogFileWatcher.listSessions).mockReturnValue([]);
      vi.mocked(existsSync).mockImplementation((path) => {
        if (String(path).includes("commands")) return true;
        return false;
      });
      vi.mocked(readdirSync).mockImplementation((path) => {
        if (String(path).includes("commands")) return ["test-cmd.md"] as any;
        return [] as any;
      });
      vi.mocked(readFileSync).mockImplementation((path) => {
        if (String(path).includes("test-cmd.md")) {
          return `---
description: Test command description
argument-hint: <arg>
---
# Test Command`;
        }
        return "";
      });

      const data = await service.getData();

      expect(data.commands).toHaveLength(1);
      expect(data.commands[0].name).toBe("test-cmd");
      expect(data.commands[0].description).toBe("Test command description");
      expect(data.commands[0].argumentHint).toBe("<arg>");
    });

    it("parses skills from markdown frontmatter", async () => {
      vi.mocked(LogFileWatcher.listSessions).mockReturnValue([]);
      vi.mocked(existsSync).mockImplementation((path) => {
        if (String(path).includes("skills")) return true;
        return false;
      });
      vi.mocked(readdirSync).mockImplementation((path) => {
        if (String(path).includes("skills")) return ["test-skill.md"] as any;
        return [] as any;
      });
      vi.mocked(readFileSync).mockImplementation((path) => {
        if (String(path).includes("test-skill.md")) {
          return `---
name: Test Skill
description: A test skill
---
# Test Skill`;
        }
        return "";
      });

      const data = await service.getData();

      expect(data.skills).toHaveLength(1);
      expect(data.skills[0].name).toBe("Test Skill");
      expect(data.skills[0].description).toBe("A test skill");
    });
  });

  describe("error handling", () => {
    it("handles missing files gracefully", async () => {
      vi.mocked(LogFileWatcher.listSessions).mockReturnValue([]);
      vi.mocked(existsSync).mockReturnValue(false);

      const data = await service.getData();

      expect(data.sessions).toEqual([]);
      expect(data.globalStats).toBeNull();
      expect(data.commands).toEqual([]);
      expect(data.skills).toEqual([]);
      expect(data.hooks).toEqual([]);
      expect(data.mcpServers).toEqual([]);
    });

    it("handles malformed JSON in log files", async () => {
      const mockSessionInfo = {
        session_id: "bad-json",
        file_path: "/path/to/bad-json.txt",
        first_entry: "2024-01-01T00:00:00Z",
        last_entry: "2024-01-01T01:00:00Z",
        entry_count: 1,
        size_bytes: 100,
      };

      vi.mocked(LogFileWatcher.listSessions).mockReturnValue([mockSessionInfo]);
      vi.mocked(existsSync).mockImplementation((path) => {
        if (String(path).includes("bad-json.txt")) return true;
        return false;
      });
      vi.mocked(readFileSync).mockImplementation((path) => {
        if (String(path).includes("bad-json.txt")) {
          return "not valid json\n";
        }
        return "";
      });

      const data = await service.getData();

      // Should not throw, should return session with defaults
      expect(data.sessions).toHaveLength(1);
    });
  });
});
```

## Acceptance Criteria

- [ ] Test file created at `viewer/__tests__/dashboard.test.ts`
- [ ] Tests for `getData()` structure validation
- [ ] Tests for status determination: ended, inactive, active
- [ ] Tests for session restart detection
- [ ] Tests for session statistics counting
- [ ] Tests for command frontmatter parsing
- [ ] Tests for skill frontmatter parsing
- [ ] Tests for error handling with missing files
- [ ] Tests for malformed JSON handling
- [ ] All tests pass

## Verification

```bash
cd .claude/hooks && bun run test:run
```

## Commit

```bash
git add .claude/hooks/viewer/__tests__/dashboard.test.ts
git commit -m "test(dashboard): add dashboard service unit tests"
```

## Next

Proceed to: `prompts/10-e2e-validation.md`
