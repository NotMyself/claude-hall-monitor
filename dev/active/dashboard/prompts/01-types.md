# Feature: types - Dashboard Type Definitions

## Context

Project initialized. No dashboard types exist yet. The viewer already has types in `viewer/types.ts` including `SessionInfo`, `HookEventType`, `LogEntry`, etc.

## Objective

Add TypeScript interfaces for all dashboard data structures to `viewer/types.ts`.

**IMPORTANT**: Only implement this feature. Do not implement any other features.

## Constraints

Reference: See `constraints.md` for global rules.

- Add types to existing `viewer/types.ts` file, do not create new files
- Follow existing naming conventions in the file
- Export all new types

## Files to Modify

- `.claude/hooks/viewer/types.ts` - Add new interfaces

## Implementation Details

Add these types to `viewer/types.ts`:

```typescript
/**
 * Session activity status for dashboard
 */
export type SessionStatus = "active" | "inactive" | "ended";

/**
 * Extended session info with dashboard-specific fields
 */
export interface DashboardSession extends SessionInfo {
  status: SessionStatus;
  last_heartbeat: string | null;
  tool_call_count: number;
  message_count: number;
  compaction_count: number;
  started_at: string | null;
}

/**
 * Token usage statistics per model
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
}

/**
 * Global statistics from stats-cache.json
 */
export interface GlobalStats {
  totalSessions: number;
  totalMessages: number;
  modelUsage: Record<string, TokenUsage>;
}

/**
 * Command definition from .claude/commands/*.md
 */
export interface CommandInfo {
  name: string;
  description: string;
  argumentHint?: string;
  filePath: string;
}

/**
 * Skill definition from .claude/skills/*.md
 */
export interface SkillInfo {
  name: string;
  description: string;
  filePath: string;
}

/**
 * Hook configuration from settings.json
 */
export interface HookConfig {
  eventName: string;
  matcher: string;
  command: string;
}

/**
 * Complete dashboard data returned by API
 */
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

## Acceptance Criteria

- [ ] `SessionStatus` type defined as union of "active" | "inactive" | "ended"
- [ ] `DashboardSession` interface extends `SessionInfo` with status fields
- [ ] `TokenUsage` interface has all four token count fields
- [ ] `GlobalStats` interface has totalSessions, totalMessages, modelUsage
- [ ] `CommandInfo` interface has name, description, optional argumentHint, filePath
- [ ] `SkillInfo` interface has name, description, filePath
- [ ] `HookConfig` interface has eventName, matcher, command
- [ ] `DashboardData` interface aggregates all dashboard data
- [ ] All types are exported
- [ ] Type check passes with no errors

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit
```

## Commit

```bash
git add .claude/hooks/viewer/types.ts
git commit -m "feat(dashboard): add dashboard type definitions"
```

## Next

Proceed to: `prompts/02-config.md` (can run in parallel with this feature)
