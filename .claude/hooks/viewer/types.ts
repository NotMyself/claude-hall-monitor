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
