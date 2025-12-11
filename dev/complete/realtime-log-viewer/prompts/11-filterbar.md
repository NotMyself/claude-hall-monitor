# Feature: 11-filterbar - FilterBar Component

## Context
Features 09-10 are complete. EventBadge and ThemeToggle components exist.

## Objective
Create the FilterBar Vue component with search input, event type filter, session select, and clear button.

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- Emit filter change events to parent
- Receive available sessions as prop
- Debounce search input (300ms)
- Multi-select for event types

## Files to Create/Modify
- `.claude/hooks/viewer/index.html` - Add FilterBar component registration

## Implementation Details

```javascript
// ===== FilterBar Component =====
app.component('filter-bar', {
  props: {
    sessions: {
      type: Array,
      default: () => [],
    },
    modelValue: {
      type: Object,
      default: () => ({
        search: '',
        eventTypes: [],
        sessionId: null,
      }),
    },
  },
  emits: ['update:modelValue'],
  template: `
    <div class="filter-bar">
      <input
        type="text"
        placeholder="Search logs..."
        :value="modelValue.search"
        @input="onSearchInput"
      />

      <select
        :value="modelValue.sessionId || ''"
        @change="onSessionChange"
      >
        <option value="">All Sessions</option>
        <option
          v-for="session in sessions"
          :key="session"
          :value="session"
        >
          {{ truncateSession(session) }}
        </option>
      </select>

      <select
        multiple
        :value="modelValue.eventTypes"
        @change="onEventTypesChange"
        class="event-select"
      >
        <option v-for="type in eventTypes" :key="type" :value="type">
          {{ type }}
        </option>
      </select>

      <button @click="clearFilters" :disabled="!hasFilters">
        Clear Filters
      </button>
    </div>
  `,
  data() {
    return {
      searchTimeout: null,
      eventTypes: [
        'UserPromptSubmit',
        'PreToolUse',
        'PostToolUse',
        'PostToolUseFailure',
        'Notification',
        'SessionStart',
        'SessionEnd',
        'Stop',
        'SubagentStart',
        'SubagentStop',
        'PreCompact',
        'PermissionRequest',
      ],
    };
  },
  computed: {
    hasFilters() {
      return (
        this.modelValue.search ||
        this.modelValue.eventTypes.length > 0 ||
        this.modelValue.sessionId
      );
    },
  },
  methods: {
    emit(updates) {
      this.$emit('update:modelValue', {
        ...this.modelValue,
        ...updates,
      });
    },
    onSearchInput(e) {
      // Debounce search
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.emit({ search: e.target.value });
      }, 300);
    },
    onSessionChange(e) {
      this.emit({ sessionId: e.target.value || null });
    },
    onEventTypesChange(e) {
      const selected = Array.from(e.target.selectedOptions).map(o => o.value);
      this.emit({ eventTypes: selected });
    },
    clearFilters() {
      this.emit({
        search: '',
        eventTypes: [],
        sessionId: null,
      });
    },
    truncateSession(id) {
      if (id.length <= 16) return id;
      return id.substring(0, 8) + '...' + id.substring(id.length - 4);
    },
  },
  beforeUnmount() {
    clearTimeout(this.searchTimeout);
  },
});
```

### Add CSS for Multi-Select (append to theme.css section or inline)

```css
.event-select {
  min-width: 150px;
  max-height: 120px;
}
```

## Acceptance Criteria
- [ ] Component registered as 'filter-bar'
- [ ] Search input with 300ms debounce
- [ ] Session dropdown populated from `sessions` prop
- [ ] Event type multi-select with all 12 types
- [ ] Clear filters button (disabled when no filters active)
- [ ] Emits update:modelValue with filter object
- [ ] v-model compatible (modelValue prop + update:modelValue emit)
- [ ] Session IDs truncated for display

## Verification
```bash
grep -q "app.component('filter-bar'" .claude/hooks/viewer/index.html && echo "FilterBar registered"
grep -q "update:modelValue" .claude/hooks/viewer/index.html && echo "v-model emit found"
grep -q "setTimeout" .claude/hooks/viewer/index.html && echo "Debounce found"
```

## Commit
After verification passes:
```bash
git add .claude/hooks/viewer/index.html
git commit -m "feat(viewer): add FilterBar component

- Search input with 300ms debounce
- Session ID dropdown filter
- Event type multi-select
- Clear filters button
- v-model compatible for two-way binding"
```

## Next
Proceed to: `prompts/12-logentry.md`
