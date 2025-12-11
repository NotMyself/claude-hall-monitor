# Feature: 13-logviewer - LogViewer Component

## Context
Features 09-12 are complete. EventBadge, ThemeToggle, FilterBar, and LogEntry components exist.

## Objective
Create the LogViewer Vue component that displays a filtered, scrollable list of log entries.

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- Use LogEntry component for each entry
- Use FilterBar component for filtering
- Apply filters to entries
- Auto-scroll to new entries (optional toggle)
- Show empty state when no entries

## Files to Create/Modify
- `.claude/hooks/viewer/index.html` - Add LogViewer component registration

## Implementation Details

```javascript
// ===== LogViewer Component =====
app.component('log-viewer', {
  props: {
    entries: {
      type: Array,
      default: () => [],
    },
  },
  template: `
    <div class="log-viewer">
      <filter-bar
        v-model="filters"
        :sessions="uniqueSessions"
      ></filter-bar>

      <div class="log-viewer-controls">
        <label class="auto-scroll-toggle">
          <input type="checkbox" v-model="autoScroll" />
          Auto-scroll to new entries
        </label>
        <span class="entry-count">
          Showing {{ filteredEntries.length }} of {{ entries.length }} entries
        </span>
      </div>

      <div
        v-if="filteredEntries.length === 0"
        class="empty-state"
      >
        <h3>No entries found</h3>
        <p v-if="hasFilters">Try adjusting your filters</p>
        <p v-else>Waiting for log entries...</p>
      </div>

      <div
        v-else
        ref="logList"
        class="log-list"
      >
        <log-entry
          v-for="entry in filteredEntries"
          :key="entryKey(entry)"
          :entry="entry"
        ></log-entry>
      </div>
    </div>
  `,
  data() {
    return {
      filters: {
        search: '',
        eventTypes: [],
        sessionId: null,
      },
      autoScroll: true,
    };
  },
  computed: {
    uniqueSessions() {
      const sessions = new Set(this.entries.map(e => e.session_id));
      return Array.from(sessions).sort();
    },
    filteredEntries() {
      return this.entries.filter(entry => {
        // Search filter
        if (this.filters.search) {
          const searchLower = this.filters.search.toLowerCase();
          const matchesSearch =
            entry.event.toLowerCase().includes(searchLower) ||
            entry.session_id.toLowerCase().includes(searchLower) ||
            JSON.stringify(entry.data).toLowerCase().includes(searchLower);
          if (!matchesSearch) return false;
        }

        // Event type filter
        if (this.filters.eventTypes.length > 0) {
          if (!this.filters.eventTypes.includes(entry.event)) {
            return false;
          }
        }

        // Session filter
        if (this.filters.sessionId) {
          if (entry.session_id !== this.filters.sessionId) {
            return false;
          }
        }

        return true;
      });
    },
    hasFilters() {
      return (
        this.filters.search ||
        this.filters.eventTypes.length > 0 ||
        this.filters.sessionId
      );
    },
  },
  methods: {
    entryKey(entry) {
      return `${entry.timestamp}-${entry.event}-${entry.session_id}`;
    },
    scrollToBottom() {
      if (!this.autoScroll || !this.$refs.logList) return;
      this.$nextTick(() => {
        const list = this.$refs.logList;
        list.scrollTop = list.scrollHeight;
      });
    },
  },
  watch: {
    entries: {
      handler() {
        this.scrollToBottom();
      },
      deep: false,
    },
  },
});
```

### Additional CSS

```css
.log-viewer-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 8px 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.auto-scroll-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.log-list {
  max-height: calc(100vh - 350px);
  overflow-y: auto;
  padding-right: 8px;
}

.log-list::-webkit-scrollbar {
  width: 8px;
}

.log-list::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}
```

## Acceptance Criteria
- [ ] Component registered as 'log-viewer'
- [ ] Accepts `entries` prop (array of LogEntry)
- [ ] Uses FilterBar with v-model for filter state
- [ ] Passes unique session IDs to FilterBar
- [ ] Renders LogEntry for each filtered entry
- [ ] Search filter matches event, session_id, and data content
- [ ] Event type filter excludes non-matching events
- [ ] Session filter shows only selected session
- [ ] Auto-scroll checkbox (default: checked)
- [ ] Shows "X of Y entries" count
- [ ] Empty state when no entries match filters
- [ ] Unique key for each entry (timestamp + event + session_id)

## Verification
```bash
grep -q "app.component('log-viewer'" .claude/hooks/viewer/index.html && echo "LogViewer registered"
grep -q "<filter-bar" .claude/hooks/viewer/index.html && echo "FilterBar used"
grep -q "<log-entry" .claude/hooks/viewer/index.html && echo "LogEntry used"
grep -q "filteredEntries" .claude/hooks/viewer/index.html && echo "Filtering logic found"
```

## Commit
After verification passes:
```bash
git add .claude/hooks/viewer/index.html
git commit -m "feat(viewer): add LogViewer component

- Displays filtered list of log entries
- FilterBar integration with v-model
- Search, event type, and session filters
- Auto-scroll to new entries toggle
- Entry count display
- Empty state handling"
```

## Next
Proceed to: `prompts/14-tabcontainer.md`
