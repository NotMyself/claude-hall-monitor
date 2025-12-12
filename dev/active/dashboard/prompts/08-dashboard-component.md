# Feature: dashboard-component - Dashboard Vue Component

## Context

The API endpoint and styles are complete. The viewer uses Vue 3 in `viewer/index.html` with components defined inline. The existing `TabContainer` component manages tab switching between views.

## Objective

Add a Dashboard tab and `dashboard-view` Vue component to the viewer.

**IMPORTANT**: Only implement this feature. Do not implement any other features.

## Constraints

Reference: See `constraints.md` for global rules.

- Modify existing `viewer/index.html`
- Follow existing Vue 3 patterns in the file
- Use Composition API with `ref()` and `watch()`
- Clean up polling interval on tab switch

## Files to Modify

- `.claude/hooks/viewer/index.html` - Add dashboard tab and component

## Implementation Details

### 1. Add Dashboard tab to tabs array

Find the `tabs` array in the `setup()` function and add the dashboard tab:

```javascript
const tabs = [
  { id: 'logs', label: 'Hook Log' },
  { id: 'dashboard', label: 'Dashboard' },
];
```

### 2. Add dashboard state variables

Add these in the `setup()` function:

```javascript
// Dashboard state
const dashboardData = ref(null);
const dashboardLoading = ref(false);
let dashboardPollInterval = null;

// Fetch dashboard data
async function fetchDashboard() {
  try {
    dashboardLoading.value = dashboardData.value === null;
    const res = await fetch('/api/dashboard');
    if (res.ok) {
      dashboardData.value = await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch dashboard:', err);
  } finally {
    dashboardLoading.value = false;
  }
}

// Start/stop dashboard polling based on active tab
watch(currentTab, (newTab, oldTab) => {
  if (newTab === 'dashboard') {
    fetchDashboard();
    dashboardPollInterval = setInterval(fetchDashboard, 5000);
  } else if (oldTab === 'dashboard' && dashboardPollInterval) {
    clearInterval(dashboardPollInterval);
    dashboardPollInterval = null;
  }
});
```

### 3. Include in returned object

Add to the `return` statement in `setup()`:

```javascript
return {
  // ... existing ...
  dashboardData,
  dashboardLoading,
};
```

### 4. Add dashboard-view component

Add this component definition after the existing components:

```javascript
app.component('dashboard-view', {
  props: {
    data: { type: Object, default: null },
    loading: { type: Boolean, default: false },
  },
  template: `
    <div class="dashboard">
      <div v-if="loading && !data" class="dashboard-loading">
        Loading dashboard...
      </div>

      <div v-else-if="data" class="dashboard-content">
        <!-- Sessions Section -->
        <section class="dashboard-section">
          <h2>Sessions</h2>
          <div v-if="data.sessions.length > 0" class="session-grid">
            <div
              v-for="session in data.sessions"
              :key="session.session_id"
              class="session-card"
              :class="'status-' + session.status"
            >
              <div class="session-header">
                <span class="session-id">{{ session.session_id.slice(0, 8) }}...</span>
                <span class="status-badge" :class="session.status">
                  {{ session.status }}
                </span>
              </div>
              <div class="session-stats">
                <div class="stat">
                  <span class="stat-label">Messages</span>
                  <span class="stat-value">{{ session.message_count }}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Tools</span>
                  <span class="stat-value">{{ session.tool_call_count }}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Compacts</span>
                  <span class="stat-value">{{ session.compaction_count }}</span>
                </div>
              </div>
              <div v-if="session.last_heartbeat" class="session-time">
                Last: {{ formatTime(session.last_heartbeat) }}
              </div>
            </div>
          </div>
          <div v-else class="config-list">
            <div class="empty">No sessions found</div>
          </div>
        </section>

        <!-- Token Usage Section -->
        <section v-if="data.globalStats" class="dashboard-section">
          <h2>Token Usage</h2>
          <div class="stats-grid">
            <div
              v-for="(usage, model) in data.globalStats.modelUsage"
              :key="model"
              class="model-stats"
            >
              <h3>{{ formatModelName(model) }}</h3>
              <div class="token-stats">
                <div class="token-stat">
                  <span class="label">Input</span>
                  <span class="value">{{ formatNumber(usage.inputTokens) }}</span>
                </div>
                <div class="token-stat">
                  <span class="label">Output</span>
                  <span class="value">{{ formatNumber(usage.outputTokens) }}</span>
                </div>
                <div class="token-stat">
                  <span class="label">Cache Read</span>
                  <span class="value">{{ formatNumber(usage.cacheReadInputTokens) }}</span>
                </div>
                <div class="token-stat">
                  <span class="label">Cache Write</span>
                  <span class="value">{{ formatNumber(usage.cacheCreationInputTokens) }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Configuration Section -->
        <section class="dashboard-section">
          <h2>Configuration</h2>

          <!-- Commands -->
          <div class="config-group">
            <h3>Commands ({{ data.commands.length }})</h3>
            <div class="config-list">
              <div v-for="cmd in data.commands" :key="cmd.name" class="config-item">
                <span class="config-name">/{{ cmd.name }}</span>
                <span class="config-desc">{{ cmd.description || 'No description' }}</span>
              </div>
              <div v-if="data.commands.length === 0" class="empty">No commands configured</div>
            </div>
          </div>

          <!-- Hooks -->
          <div class="config-group">
            <h3>Hooks ({{ data.hooks.length }})</h3>
            <div class="config-list">
              <div
                v-for="(hook, index) in data.hooks"
                :key="hook.eventName + index"
                class="config-item"
              >
                <span class="config-name">{{ hook.eventName }}</span>
                <span class="config-desc">{{ truncateCommand(hook.command) }}</span>
              </div>
              <div v-if="data.hooks.length === 0" class="empty">No hooks configured</div>
            </div>
          </div>

          <!-- Skills -->
          <div class="config-group">
            <h3>Skills ({{ data.skills.length }})</h3>
            <div class="config-list">
              <div v-for="skill in data.skills" :key="skill.name" class="config-item">
                <span class="config-name">{{ skill.name }}</span>
                <span class="config-desc">{{ skill.description || 'No description' }}</span>
              </div>
              <div v-if="data.skills.length === 0" class="empty">No skills configured</div>
            </div>
          </div>

          <!-- MCP Servers -->
          <div class="config-group">
            <h3>MCP Servers ({{ data.mcpServers.length }})</h3>
            <div class="config-list">
              <div v-for="server in data.mcpServers" :key="server" class="config-item">
                <span class="config-name">{{ server }}</span>
              </div>
              <div v-if="data.mcpServers.length === 0" class="empty">No MCP servers enabled</div>
            </div>
          </div>
        </section>
      </div>

      <div v-else class="dashboard-empty">
        <h3>Dashboard unavailable</h3>
        <p>Unable to load dashboard data</p>
      </div>
    </div>
  `,
  methods: {
    formatTime(iso) {
      try {
        const date = new Date(iso);
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
      } catch {
        return iso;
      }
    },
    formatNumber(num) {
      if (num == null) return '0';
      if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(1) + 'M';
      }
      if (num >= 1_000) {
        return (num / 1_000).toFixed(1) + 'K';
      }
      return String(num);
    },
    formatModelName(model) {
      // claude-opus-4-5-20251101 -> Opus 4.5
      const match = model.match(/claude-(\w+)-(\d+)-(\d+)/);
      if (match) {
        const name = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        return name + ' ' + match[2] + '.' + match[3];
      }
      return model;
    },
    truncateCommand(cmd) {
      if (!cmd) return '';
      // Show last part of command path
      const parts = cmd.split(/[/\\]/);
      return parts[parts.length - 1] || cmd;
    },
  },
});
```

### 5. Add template slot for dashboard

Find the `tab-container` usage in the template and add the dashboard slot:

```html
<template #dashboard>
  <dashboard-view
    :data="dashboardData"
    :loading="dashboardLoading"
  ></dashboard-view>
</template>
```

## Acceptance Criteria

- [ ] Dashboard tab added to tabs array
- [ ] `dashboardData` and `dashboardLoading` refs created
- [ ] `fetchDashboard()` function fetches from `/api/dashboard`
- [ ] `watch()` starts polling when dashboard tab is active
- [ ] Polling stops when switching away from dashboard tab
- [ ] `dashboard-view` component registered
- [ ] Sessions section displays cards with status badges
- [ ] Token usage section shows model stats
- [ ] Configuration section shows commands, hooks, skills, MCP servers
- [ ] Empty states handled for all sections
- [ ] Helper methods format time, numbers, and model names correctly
- [ ] Template slot connects component to tab container

## Verification

```bash
cd .claude/hooks && bun run tsc --noEmit
```

Manual verification:
1. Start viewer: `cd .claude/hooks && bun run viewer`
2. Open http://localhost:3456
3. Click "Dashboard" tab
4. Verify sections render correctly

## Commit

```bash
git add .claude/hooks/viewer/index.html
git commit -m "feat(dashboard): add dashboard Vue component"
```

## Next

Proceed to: `prompts/09-unit-tests.md`
