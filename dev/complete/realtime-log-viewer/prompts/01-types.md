# Feature: 01-types - TypeScript Interfaces

## Context
The initializer agent has created the project structure. The file `.claude/hooks/viewer/types.ts` exists as a placeholder.

## Objective
Create TypeScript type definitions that will be used throughout the viewer application. This is a foundational feature with no dependencies.

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- Export all types for use in other modules
- Use TypeScript strict mode compatible types
- No runtime code - types only

## Files to Create/Modify
- `.claude/hooks/viewer/types.ts` - Replace placeholder with full type definitions

## Implementation Details

### LogEntry Interface
Represents a single log entry from hooks-log.txt:
```typescript
export interface LogEntry {
  timestamp: string;      // ISO 8601 format
  event: HookEventType;   // One of 12 event types
  session_id: string;     // Session identifier
  data: Record<string, unknown>; // Event-specific payload
}
```

### HookEventType Union
All 12 Claude Code hook event types:
```typescript
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
```

### SSEMessage Interface
Messages sent over Server-Sent Events:
```typescript
export type SSEMessageType = "entries" | "entry" | "heartbeat" | "error";

export interface SSEMessage {
  type: SSEMessageType;
  data?: LogEntry | LogEntry[] | string;
  timestamp: string;
}
```

### FilterState Interface
UI filter state:
```typescript
export interface FilterState {
  search: string;              // Text search query
  eventTypes: HookEventType[]; // Selected event types (empty = all)
  sessionId: string | null;    // Selected session (null = all)
}
```

### Additional Types
```typescript
export type ThemeMode = "light" | "dark" | "system";

export interface ConnectionStatus {
  connected: boolean;
  lastHeartbeat: string | null;
  reconnectAttempts: number;
}
```

## Acceptance Criteria
- [ ] LogEntry interface has timestamp, event, session_id, data fields
- [ ] HookEventType union includes all 12 event types
- [ ] SSEMessage interface supports entries, entry, heartbeat, error types
- [ ] FilterState interface has search, eventTypes, sessionId fields
- [ ] ThemeMode and ConnectionStatus types defined
- [ ] File compiles without TypeScript errors
- [ ] All types are exported

## Verification
```bash
cd .claude/hooks && bun run tsc --noEmit viewer/types.ts
```

## Commit
After verification passes:
```bash
git add .claude/hooks/viewer/types.ts
git commit -m "feat(viewer): add TypeScript type definitions

- LogEntry interface for parsed log entries
- HookEventType union for all 12 hook events
- SSEMessage for server-sent event payloads
- FilterState for UI filter state
- ThemeMode and ConnectionStatus utilities"
```

## Next
Proceed to: `prompts/02-config.md`
