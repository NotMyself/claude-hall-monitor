# Feature: F06 - Frontend Session Selector

## Context
Server now provides /api/sessions and supports session filtering.

## Objective
Add session selector UI component and wire up session switching.

## Constraints
- Reference: See constraints.md
- Keep Vue 3 CDN approach
- Maintain existing filter bar structure

## Files to Modify
- `.claude/hooks/viewer/index.html`

## Implementation Details

Add refs in setup():
```javascript
const sessions = ref([]);
const currentSession = ref(null);
const selectedSession = ref(null);
```

Add fetchSessions() function:
```javascript
async function fetchSessions() {
  try {
    const res = await fetch('/api/sessions');
    const data = await res.json();
    sessions.value = data.sessions;
    currentSession.value = data.current_session;
    if (!selectedSession.value && data.current_session) {
      selectedSession.value = data.current_session;
    } else if (!selectedSession.value && data.sessions.length > 0) {
      selectedSession.value = data.sessions[0].session_id;
    }
  } catch (err) {
    console.error('Failed to fetch sessions:', err);
  }
}
```

Call fetchSessions() in onMounted:
```javascript
onMounted(() => {
  fetchSessions();
  connect();
});
```

Add session-selector component:
```javascript
app.component('session-selector', {
  props: ['sessions', 'currentSession', 'modelValue'],
  emits: ['update:modelValue'],
  template: `
    <div class="session-selector">
      <label>Session:</label>
      <select
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
        class="session-select"
      >
        <option v-for="s in sessions" :key="s.session_id" :value="s.session_id">
          {{ s.session_id.slice(0, 8) }}{{ s.session_id === currentSession ? ' (current)' : '' }}
          - {{ s.entry_count }} entries
        </option>
      </select>
    </div>
  `
});
```

Watch selectedSession for changes:
```javascript
watch(selectedSession, (newSession, oldSession) => {
  if (newSession && newSession !== oldSession) {
    // Close existing connection
    if (eventSource.value) {
      eventSource.value.close();
      eventSource.value = null;
    }
    // Clear entries and reconnect
    entries.value = [];
    connect();
  }
});
```

Update connect() to use selectedSession:
```javascript
function connect() {
  const sessionParam = selectedSession.value ? `?session=${selectedSession.value}` : '';
  const url = `/events${sessionParam}`;
  eventSource.value = new EventSource(url);
  // ... rest of existing logic
}
```

Add session-selector to filter-bar template:
```html
<session-selector
  :sessions="sessions"
  :current-session="currentSession"
  v-model="selectedSession"
/>
```

Add CSS for session selector:
```css
.session-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.session-select {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
}
```

## Acceptance Criteria
- [ ] sessions ref populated on mount via fetchSessions()
- [ ] Session selector component shows all sessions
- [ ] Current session marked with (current) indicator
- [ ] Changing session closes old SSE and reconnects
- [ ] Session selector integrated into filter bar

## Verification
Manual browser testing at http://localhost:3456

## Commit
```bash
git add .claude/hooks/viewer/index.html
git commit -m "feat(hooks): add session selector to viewer UI"
```

## Next
Proceed to: prompts/07-session-start-env.md
