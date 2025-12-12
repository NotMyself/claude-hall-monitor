# Claude Dashboard Feature Implementation Plan

## Overview

Add a new "Dashboard" tab to the existing viewer that displays:
1. All Claude Code sessions with active/inactive status (heartbeat-based detection)
2. Context window details per session (token usage, message counts, compactions)
3. Available configuration (commands, hooks, skills, MCP servers)

## Files to Modify

| File | Changes |
|------|---------|
| `viewer/types.ts` | Add dashboard type definitions |
| `viewer/config.ts` | Add paths and dashboard config |
| `viewer/dashboard.ts` | **New file** - Dashboard data service |
| `viewer/server.ts` | Add `/api/dashboard` endpoint |
| `viewer/index.html` | Add Dashboard tab and components |
| `viewer/styles/theme.css` | Add dashboard styles |
| `utils/logger.ts` | Add heartbeat function |
| `handlers/pre-tool-use.ts` | Call heartbeat on tool use |
| `handlers/user-prompt-submit.ts` | Call heartbeat on user input |

## Implementation Steps

### Step 1: Add Types (`viewer/types.ts`)

Add new interfaces:
```typescript
export type SessionStatus = "active" | "inactive" | "ended";

export interface DashboardSession extends SessionInfo {
  status: SessionStatus;
  last_heartbeat: string | null;
  tool_call_count: number;
  message_count: number;
  compaction_count: number;
  started_at: string | null;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
}

export interface GlobalStats {
  totalSessions: number;
  totalMessages: number;
  modelUsage: Record<string, TokenUsage>;
}

export interface CommandInfo {
  name: string;
  description: string;
  argumentHint?: string;
  filePath: string;
}

export interface SkillInfo {
  name: string;
  description: string;
  filePath: string;
}

export interface HookConfig {
  eventName: string;
  matcher: string;
  command: string;
}

export interface DashboardData {
  sessions: DashboardSession[];
  currentSession: string | null;
  globalStats: GlobalStats | null;
  commands: CommandInfo[];
  hooks: HookConfig[];
  skills: SkillInfo[];
  mcpServers: string[];
  lastUpdated: string;
}
```

### Step 2: Add Config (`viewer/config.ts`)

Add paths and intervals:
```typescript
export const PATHS = {
  // ... existing ...
  CLAUDE_HOME: process.env.USERPROFILE
    ? join(process.env.USERPROFILE, '.claude')
    : join(process.env.HOME || '', '.claude'),
  get STATS_CACHE() {
    return join(this.CLAUDE_HOME, 'stats-cache.json');
  },
  COMMANDS_DIR: resolve(import.meta.dir, '..', '..', 'commands'),
  SKILLS_DIR: resolve(import.meta.dir, '..', '..', 'skills'),
  SETTINGS_FILE: resolve(import.meta.dir, '..', '..', 'settings.json'),
};

export const DASHBOARD_CONFIG = {
  HEARTBEAT_TIMEOUT_MS: 60_000,  // 60 seconds
  HEARTBEAT_INTERVAL_MS: 30_000, // 30 seconds
  REFRESH_INTERVAL_MS: 5_000,    // 5 seconds
};
```

### Step 3: Create Dashboard Service (`viewer/dashboard.ts`)

New file with `DashboardService` class:
- `getData()` - Returns complete dashboard data
- `getSessions()` - Lists sessions with status computed from heartbeats
- `getGlobalStats()` - Reads `~/.claude/stats-cache.json`
- `getCommands()` - Parses `.claude/commands/*.md` frontmatter
- `getSkills()` - Parses `.claude/skills/*.md` frontmatter
- `getHooks()` - Reads hooks from `settings.json`
- `getMcpServers()` - Reads `enabledMcpjsonServers` from `settings.json`

Status determination logic:
1. If `SessionEnd` event exists without subsequent `SessionStart` -> `ended`
2. If last heartbeat > 60s ago -> `inactive`
3. Otherwise -> `active`

### Step 4: Add Server Endpoint (`viewer/server.ts`)

Add to `handleRequest()`:
```typescript
if (path === "/api/dashboard" && request.method === "GET") {
  const data = await dashboardService.getData();
  return Response.json(data);
}
```

### Step 5: Add Heartbeat to Logger (`utils/logger.ts`)

Add heartbeat function that writes periodic activity markers:
```typescript
let lastHeartbeat = 0;
let sessionToolCount = 0;
let sessionMessageCount = 0;

export async function maybeWriteHeartbeat(
  session_id: string,
  incrementTool = false,
  incrementMessage = false
): Promise<void> {
  if (incrementTool) sessionToolCount++;
  if (incrementMessage) sessionMessageCount++;

  const now = Date.now();
  if (now - lastHeartbeat < 30_000) return;

  lastHeartbeat = now;
  await log("Heartbeat", session_id, {
    tool_count: sessionToolCount,
    message_count: sessionMessageCount,
  });
}
```

### Step 6: Call Heartbeat in Handlers

**`handlers/pre-tool-use.ts`**: After log(), add:
```typescript
await maybeWriteHeartbeat(input.session_id, true, false);
```

**`handlers/user-prompt-submit.ts`**: After log(), add:
```typescript
await maybeWriteHeartbeat(input.session_id, false, true);
```

### Step 7: Add Dashboard Tab (`viewer/index.html`)

Add to tabs array:
```javascript
const tabs = [
  { id: 'logs', label: 'Hook Log' },
  { id: 'dashboard', label: 'Dashboard' },
];
```

Add dashboard state and polling:
```javascript
const dashboardData = ref(null);
const dashboardLoading = ref(false);

async function fetchDashboard() {
  const res = await fetch('/api/dashboard');
  dashboardData.value = await res.json();
}

// Poll every 5s when dashboard tab active
```

Add `dashboard-view` component with sections:
- **Sessions grid**: Cards showing session ID, status badge, message/tool/compaction counts
- **Configuration**: Lists of commands, hooks, skills, MCP servers

### Step 8: Add Dashboard Styles (`viewer/styles/theme.css`)

Add styles for:
- `.dashboard` container
- `.session-grid` and `.session-card` with status colors
- `.status-badge` (active=green, inactive=yellow, ended=gray)
- `.stats-grid` and `.token-stats`
- `.config-group` and `.config-item`

## Data Flow

```
┌─────────────────┐     ┌──────────────────┐
│ Hook Handlers   │────>│ Session Logs     │
│ (heartbeat)     │     │ (.claude/hooks/  │
└─────────────────┘     │  logs/*.txt)     │
                        └────────┬─────────┘
                                 │
┌─────────────────┐     ┌────────v─────────┐
│ stats-cache.json│────>│ Dashboard Service│
│ (~/.claude/)    │     │ (getData())      │
└─────────────────┘     └────────┬─────────┘
                                 │
┌─────────────────┐     ┌────────v─────────┐
│ settings.json   │────>│ /api/dashboard   │
│ commands/*.md   │     │ endpoint         │
│ skills/*.md     │     └────────┬─────────┘
└─────────────────┘              │
                        ┌────────v─────────┐
                        │ Dashboard Tab    │
                        │ (Vue component)  │
                        └──────────────────┘
```

## Session Status Detection

| Condition | Status |
|-----------|--------|
| Has `SessionEnd` event, no restart after | `ended` |
| Last heartbeat/activity > 60s ago | `inactive` |
| Recent heartbeat/activity | `active` |

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ [Hook Log] [Dashboard]                          [Theme] │
├─────────────────────────────────────────────────────────┤
│ Sessions                                                │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│ │ abc123...   │ │ def456...   │ │ ghi789...   │        │
│ │ ● Active    │ │ ○ Inactive  │ │ ○ Ended     │        │
│ │ Msgs: 45    │ │ Msgs: 12    │ │ Msgs: 89    │        │
│ │ Tools: 23   │ │ Tools: 5    │ │ Tools: 34   │        │
│ └─────────────┘ └─────────────┘ └─────────────┘        │
├─────────────────────────────────────────────────────────┤
│ Token Usage                                             │
│ ┌─────────────────────────────────────────────────────┐│
│ │ Opus 4.5                                            ││
│ │ Input: 38.7K  Output: 163.2K  Cache: 57.7M         ││
│ └─────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│ Configuration                                           │
│ Commands (2): /optimize-plan, /orchestrate-plan        │
│ Hooks (12): UserPromptSubmit, PreToolUse, ...          │
│ Skills (1): docker-mcp-cli                             │
│ MCP Servers (1): MCP_DOCKER                            │
└─────────────────────────────────────────────────────────┘
```

## Dependencies

No new npm dependencies required - uses existing Bun/Node APIs.

## Testing Considerations

- Add tests for `DashboardService` methods
- Test session status determination logic
- Test frontmatter parsing for commands/skills
- Test API endpoint response structure
