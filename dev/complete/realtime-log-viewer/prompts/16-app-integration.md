# Feature: 16-app-integration - App Integration

## Context
Features 09-15 are complete. All components exist and SSE connection is implemented.

## Objective
Wire all components together in the main Vue app template to create the complete UI.

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- Connect all components with proper props and events
- Ensure data flows correctly through component hierarchy
- Footer shows connection status and entry count

## Files to Create/Modify
- `.claude/hooks/viewer/index.html` - Update main template to use all components

## Implementation Details

Update the #app template to use all components:

```html
<div id="app">
  <div class="app-container">
    <!-- Header -->
    <header class="header">
      <h1>Hook Viewer</h1>
      <theme-toggle></theme-toggle>
    </header>

    <!-- Main Content -->
    <main>
      <tab-container
        v-model:active-tab="currentTab"
        :tabs="tabs"
      >
        <template #logs>
          <log-viewer :entries="entries"></log-viewer>
        </template>

        <!-- Future tabs would go here -->
      </tab-container>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="connection-status">
        <span
          class="status-dot"
          :class="{ connected: isConnected }"
        ></span>
        <span>{{ connectionText }}</span>
        <span v-if="lastHeartbeat" class="heartbeat">
          ({{ formatHeartbeat }})
        </span>
      </div>
      <div class="entry-count">
        {{ entries.length }} total entries
      </div>
    </footer>
  </div>
</div>
```

Add tabs data and formatHeartbeat to setup():

```javascript
// Add to setup() return:
const tabs = [
  { id: 'logs', label: 'Event Log' },
  // Future: { id: 'analytics', label: 'Analytics' },
];

const formatHeartbeat = computed(() => {
  if (!lastHeartbeat.value) return '';
  try {
    const date = new Date(lastHeartbeat.value);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
});

return {
  // ... existing returns ...
  tabs,
  formatHeartbeat,
};
```

### Complete Template Structure

```
App
├── Header
│   ├── h1 "Hook Viewer"
│   └── ThemeToggle
├── Main
│   └── TabContainer
│       └── LogViewer (in #logs slot)
│           ├── FilterBar
│           └── LogEntry[] (for each filtered entry)
│               └── EventBadge
└── Footer
    ├── Connection Status (dot + text + heartbeat time)
    └── Entry Count
```

### Additional CSS for Heartbeat

```css
.heartbeat {
  font-size: 0.75rem;
  opacity: 0.7;
}
```

## Acceptance Criteria
- [ ] Header contains h1 and ThemeToggle
- [ ] TabContainer renders with tabs array
- [ ] LogViewer receives entries from app state
- [ ] #logs slot contains LogViewer
- [ ] Footer shows connection status dot
- [ ] Footer shows connection text
- [ ] Footer shows last heartbeat time (if available)
- [ ] Footer shows total entry count
- [ ] All components properly connected
- [ ] Data flows from SSE → entries → LogViewer → LogEntry

## Verification
```bash
# Start the server and verify the page loads
cd .claude/hooks/viewer && bun run server.ts &
SERVER_PID=$!
sleep 2

# Check if page loads and contains expected elements
curl -s http://localhost:3456/ | grep -q "Hook Viewer" && echo "Title found"
curl -s http://localhost:3456/ | grep -q "tab-container" && echo "TabContainer found"
curl -s http://localhost:3456/ | grep -q "log-viewer" && echo "LogViewer found"
curl -s http://localhost:3456/ | grep -q "theme-toggle" && echo "ThemeToggle found"

kill $SERVER_PID 2>/dev/null || true
```

## Commit
After verification passes:
```bash
git add .claude/hooks/viewer/index.html
git commit -m "feat(viewer): integrate all components

- Wire Header with ThemeToggle
- TabContainer with LogViewer in logs slot
- Footer with connection status and entry count
- Complete component hierarchy connected
- Data flows from SSE through all components"
```

## Next
Proceed to: `prompts/17-test-setup.md`
