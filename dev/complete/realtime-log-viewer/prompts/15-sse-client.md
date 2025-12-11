# Feature: 15-sse-client - SSE Client Connection

## Context
Features 09-14 are complete. All UI components exist. The main app has placeholder connection state.

## Objective
Implement the client-side SSE connection with auto-reconnect and exponential backoff.

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- Connect to /events endpoint
- Handle all SSE message types (entries, entry, heartbeat, error)
- Auto-reconnect on disconnect with exponential backoff
- Update connection status state

## Files to Create/Modify
- `.claude/hooks/viewer/index.html` - Add SSE connection logic to main app

## Implementation Details

Update the main app's setup() function to include SSE connection logic:

```javascript
const app = createApp({
  setup() {
    // === State ===
    const entries = ref([]);
    const isConnected = ref(false);
    const lastHeartbeat = ref(null);
    const reconnectAttempts = ref(0);
    const currentTab = ref('logs');

    // === SSE Connection ===
    let eventSource = null;
    let reconnectTimeout = null;

    const connectionText = computed(() => {
      if (isConnected.value) {
        return 'Connected';
      }
      if (reconnectAttempts.value > 0) {
        return `Reconnecting (${reconnectAttempts.value})...`;
      }
      return 'Disconnected';
    });

    function connect() {
      // Clean up existing connection
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource('/events');

      eventSource.onopen = () => {
        console.log('SSE connected');
        isConnected.value = true;
        reconnectAttempts.value = 0;
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        isConnected.value = false;
        eventSource.close();
        scheduleReconnect();
      };

      // Handle 'entries' event (initial load)
      eventSource.addEventListener('entries', (event) => {
        try {
          const data = JSON.parse(event.data);
          entries.value = Array.isArray(data) ? data : [];
          console.log(`Loaded ${entries.value.length} entries`);
        } catch (err) {
          console.error('Failed to parse entries:', err);
        }
      });

      // Handle 'entry' event (new entry)
      eventSource.addEventListener('entry', (event) => {
        try {
          const entry = JSON.parse(event.data);
          entries.value.push(entry);
        } catch (err) {
          console.error('Failed to parse entry:', err);
        }
      });

      // Handle 'heartbeat' event
      eventSource.addEventListener('heartbeat', (event) => {
        try {
          const data = JSON.parse(event.data);
          lastHeartbeat.value = data.timestamp;
        } catch (err) {
          // Ignore heartbeat parse errors
        }
      });

      // Handle 'error' event from server
      eventSource.addEventListener('error', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.error('Server error:', data);
        } catch {
          // Ignore
        }
      });
    }

    function scheduleReconnect() {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }

      // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
      const delay = Math.min(
        1000 * Math.pow(2, reconnectAttempts.value),
        30000
      );

      reconnectAttempts.value++;
      console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.value})`);

      reconnectTimeout = setTimeout(() => {
        connect();
      }, delay);
    }

    function disconnect() {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      isConnected.value = false;
    }

    // === Lifecycle ===
    onMounted(() => {
      connect();
    });

    onUnmounted(() => {
      disconnect();
    });

    // === Return ===
    return {
      entries,
      isConnected,
      connectionText,
      lastHeartbeat,
      currentTab,
    };
  },
});
```

## Acceptance Criteria
- [ ] EventSource connects to /events on mount
- [ ] Handles 'entries' event (initial load as array)
- [ ] Handles 'entry' event (pushes to entries array)
- [ ] Handles 'heartbeat' event (updates lastHeartbeat)
- [ ] isConnected updates on open/error
- [ ] Auto-reconnects on disconnect
- [ ] Exponential backoff (1s, 2s, 4s, 8s... max 30s)
- [ ] reconnectAttempts counter increments
- [ ] connectionText shows status (Connected/Reconnecting/Disconnected)
- [ ] Cleans up EventSource on unmount
- [ ] Console logs for debugging

## Verification
```bash
grep -q "new EventSource" .claude/hooks/viewer/index.html && echo "EventSource created"
grep -q "addEventListener.*entries" .claude/hooks/viewer/index.html && echo "entries handler found"
grep -q "addEventListener.*entry" .claude/hooks/viewer/index.html && echo "entry handler found"
grep -q "scheduleReconnect" .claude/hooks/viewer/index.html && echo "Reconnect logic found"
grep -q "Math.pow.*2" .claude/hooks/viewer/index.html && echo "Exponential backoff found"
```

## Commit
After verification passes:
```bash
git add .claude/hooks/viewer/index.html
git commit -m "feat(viewer): add SSE client connection

- Connect to /events endpoint on mount
- Handle entries, entry, heartbeat, error events
- Auto-reconnect with exponential backoff
- Connection status tracking
- Clean disconnect on unmount"
```

## Next
Proceed to: `prompts/16-app-integration.md`
