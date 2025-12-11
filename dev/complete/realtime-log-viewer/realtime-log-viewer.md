# Real-Time Log Viewer for Claude Code Hooks

## Overview

Create a real-time log viewer for Claude Code hooks using Vue.js, styled after the Claude Code Docs page. The viewer will update in real-time via Server-Sent Events (SSE) as log entries are added to `hooks-log.txt`.

## Requirements Summary

- **Location**: `.claude/hooks/viewer/`
- **Update Method**: Bun HTTP server with SSE
- **Testing**: Vitest + Vue Test Utils
- **Theme**: Light and dark mode with system preference detection
- **UI**: Multi-tabbed (extensible for future viewers)

## File Structure

```
.claude/hooks/viewer/
├── server.ts                 # Bun HTTP server (SSE, file watching, static serving)
├── index.html                # Main HTML page with embedded Vue app
├── config.ts                 # Server configuration (port, paths)
├── types.ts                  # Shared TypeScript interfaces
├── watcher.ts                # File watcher utility for hooks-log.txt
├── styles/
│   └── theme.css             # Claude Code Docs-inspired styling
├── components/               # Vue SFCs for testing
│   ├── EventBadge.vue
│   ├── ThemeToggle.vue
│   ├── FilterBar.vue
│   ├── LogEntry.vue
│   ├── LogViewer.vue
│   └── TabContainer.vue
├── vitest.config.ts
└── __tests__/
    ├── setup.ts
    ├── EventBadge.test.ts
    ├── ThemeToggle.test.ts
    ├── FilterBar.test.ts
    ├── LogEntry.test.ts
    └── server.test.ts
```

## Implementation Steps

### Phase 1: Server Infrastructure

1. **Create `viewer/config.ts`**
   - Port: 3456
   - Log file path reference
   - SSE heartbeat interval (30s)

2. **Create `viewer/types.ts`**
   - `LogEntry` interface (timestamp, event, session_id, data)
   - `HookEventType` union (12 event types)
   - `SSEMessage` interface
   - `FilterState` interface

3. **Create `viewer/watcher.ts`**
   - `LogFileWatcher` class
   - Watch `hooks-log.txt` for changes
   - Track file size to detect new content
   - Parse JSONL and emit new entries to subscribers
   - `getAllEntries()` method for initial load

4. **Create `viewer/server.ts`**
   - Bun HTTP server on port 3456
   - Routes:
     - `GET /` → serve index.html
     - `GET /events` → SSE endpoint
     - `GET /api/entries` → JSON array of all entries
     - `GET /styles/*` → static CSS files
   - SSE broadcasts new entries to all connected clients
   - Heartbeat every 30s to keep connections alive

### Phase 2: UI (HTML + Vue + CSS)

5. **Create `viewer/styles/theme.css`**
   - CSS variables for theming (light/dark)
   - Colors: Primary terracotta `#D4A27F`, dark `#0E0E0E`, off-white `#FDFDF7`
   - Dark mode: `#09090B` background, `#F3F3F3` text
   - Poppins font family
   - Event-specific badge colors (12 colors for 12 event types)
   - Card styling with 12px border-radius
   - Responsive layout

6. **Create `viewer/index.html`**
   - Load Poppins font from Google Fonts
   - Load Vue 3 from CDN
   - Embedded Vue components:
     - `EventBadge` - colored badge by event type
     - `ThemeToggle` - cycles light/dark/system
     - `FilterBar` - search, event filter dropdown, session select, clear button
     - `LogEntry` - expandable card with JSON data view, copy button
     - `LogViewer` - filtered list with auto-scroll
     - `TabContainer` - tab navigation (extensible)
   - SSE connection with auto-reconnect
   - Theme persistence in localStorage
   - Connection status indicator in footer

### Phase 3: Testing

7. **Create `viewer/vitest.config.ts`**
   - Configure happy-dom environment
   - Setup file for mocks

8. **Create `viewer/__tests__/setup.ts`**
   - Mock localStorage
   - Mock matchMedia
   - Mock navigator.clipboard

9. **Extract Vue components to `.vue` files** (for testability)
   - `components/EventBadge.vue`
   - `components/ThemeToggle.vue`
   - `components/FilterBar.vue`
   - `components/LogEntry.vue`
   - `components/LogViewer.vue`
   - `components/TabContainer.vue`

10. **Write component tests**
    - `EventBadge.test.ts` - renders event name, applies correct color class
    - `ThemeToggle.test.ts` - cycles through themes on click
    - `FilterBar.test.ts` - search input, session dropdown, clear filters
    - `LogEntry.test.ts` - expand/collapse, copy to clipboard
    - `server.test.ts` - serves HTML, SSE endpoint, API endpoint

### Phase 4: Integration

11. **Modify `.claude/hooks/session-start.ts`**
    - Add `isViewerRunning()` function (fetch with timeout)
    - Add `startViewerServer()` function (spawn detached process)
    - On `source === "startup"`, check and start viewer if not running
    - Print clickable link: `console.error('\n🔗 Hook Viewer: http://localhost:3456/\n')`
    - Include viewer URL in `additionalContext`

12. **Update `.claude/hooks/package.json`**
    - Add scripts: `viewer`, `viewer:dev`, `test`, `test:run`, `test:coverage`
    - Add devDependencies:
      - `@vitejs/plugin-vue`
      - `@vue/test-utils`
      - `happy-dom`
      - `vitest`

## Critical Files to Modify

| File | Action |
|------|--------|
| `.claude/hooks/session-start.ts` | Modify to start server and print link |
| `.claude/hooks/package.json` | Add test dependencies and scripts |

## Critical Files to Create

| File | Purpose |
|------|---------|
| `viewer/server.ts` | Bun HTTP server with SSE |
| `viewer/index.html` | Vue app with all components |
| `viewer/styles/theme.css` | Complete styling |
| `viewer/watcher.ts` | File watcher for log updates |
| `viewer/config.ts` | Configuration constants |
| `viewer/types.ts` | TypeScript interfaces |

## Design Details

### Color Scheme
- **Primary (terracotta)**: `#D4A27F`
- **Light mode**: Background `#FDFDF7`, text `#0E0E0E`
- **Dark mode**: Background `#09090B`, text `#F3F3F3`
- **Event badges**: 12 distinct colors for each hook type

### Component Hierarchy
```
App
├── ThemeToggle
├── TabContainer
│   └── LogViewer (tab: "Event Log")
│       ├── FilterBar
│       └── LogEntry[]
│           └── EventBadge
└── Footer (connection status, entry count)
```

### SSE Message Types
- `entries` - Initial load (array of all entries)
- `entry` - New single entry
- `heartbeat` - Keep-alive ping
- `error` - Error message

## Extensibility

The tab-based UI is designed for future viewers:
```javascript
const tabs = [
  { id: 'logs', label: 'Event Log' },
  // Future: { id: 'analytics', label: 'Analytics' }
  // Future: { id: 'sessions', label: 'Sessions' }
];
```
