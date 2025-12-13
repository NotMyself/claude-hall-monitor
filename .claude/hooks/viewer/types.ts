/**
 * TypeScript type definitions for the realtime log viewer
 */

/**
 * All 12 Claude Code hook event types
 */
export type HookEventType =
  | "UserPromptSubmit"
  | "PreToolUse"
  | "PostToolUse"
  | "PostToolUseFailure"
  | "Notification"
  | "SessionStart"
  | "SessionEnd"
  | "Stop"
  | "SubagentStart"
  | "SubagentStop"
  | "PreCompact"
  | "PermissionRequest";

/**
 * Represents a single log entry from hooks-log.txt
 */
export interface LogEntry {
  timestamp: string; // ISO 8601 format
  event: HookEventType; // One of 12 event types
  session_id: string; // Session identifier
  data: Record<string, unknown>; // Event-specific payload
}

/**
 * SSE message types
 */
export type SSEMessageType = "entries" | "entry" | "heartbeat" | "error";

/**
 * Messages sent over Server-Sent Events
 */
export interface SSEMessage {
  type: SSEMessageType;
  data?: LogEntry | LogEntry[] | string;
  timestamp: string;
}

/**
 * UI filter state
 */
export interface FilterState {
  search: string; // Text search query
  eventTypes: HookEventType[]; // Selected event types (empty = all)
  sessionId: string | null; // Selected session (null = all)
}

/**
 * Theme mode options
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * SSE connection status
 */
export interface ConnectionStatus {
  connected: boolean;
  lastHeartbeat: string | null;
  reconnectAttempts: number;
}

/**
 * Session metadata information
 */
export interface SessionInfo {
  session_id: string;
  file_path: string;
  first_entry: string;   // ISO timestamp
  last_entry: string;    // ISO timestamp
  entry_count: number;
  size_bytes: number;
}

/**
 * Response containing list of sessions
 */
export interface SessionListResponse {
  sessions: SessionInfo[];
  current_session: string | null;
}

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

// ===== Plan Tracker Types =====

/**
 * Feature status in a plan
 */
export type FeatureStatus = "pending" | "in_progress" | "completed" | "failed";

/**
 * A single feature in a plan
 */
export interface PlanFeature {
  id: string;
  title: string;
  layer: number;
  status: FeatureStatus;
  description: string;
  acceptanceCriteria: string[];
  verification: string;
  dependencies: string[];
  files: string[];
}

/**
 * Complete plan data from features.json
 */
export interface PlanData {
  project: string;
  version: string;
  description: string;
  features: PlanFeature[];
  layers: Record<string, string>;
}

/**
 * Summary info for plan list
 */
export interface PlanInfo {
  name: string;
  path: string;
  project: string;
  description: string;
  featureCount: number;
  completedCount: number;
  inProgressCount: number;
  failedCount: number;
  status: "active" | "completed";
  lastModified: string;
}

/**
 * Response from /api/plans endpoint
 */
export interface PlanListResponse {
  plans: PlanInfo[];
  activePlans: number;
  completedPlans: number;
}

/**
 * SSE message for plan updates
 */
export interface PlanUpdateMessage {
  type: "plan_updated" | "plan_added" | "plan_removed";
  plan: PlanInfo;
  timestamp: string;
}
