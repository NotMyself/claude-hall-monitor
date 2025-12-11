# Feature: 14-tabcontainer - TabContainer Component

## Context
Features 09-13 are complete. EventBadge, ThemeToggle, FilterBar, LogEntry, and LogViewer components exist.

## Objective
Create the TabContainer Vue component for tab-based navigation, designed to be extensible for future viewers.

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- Currently only "Event Log" tab, but designed for extension
- Use slot for tab content
- Active tab styling from theme.css

## Files to Create/Modify
- `.claude/hooks/viewer/index.html` - Add TabContainer component registration

## Implementation Details

```javascript
// ===== TabContainer Component =====
app.component('tab-container', {
  props: {
    tabs: {
      type: Array,
      default: () => [
        { id: 'logs', label: 'Event Log' },
        // Future tabs:
        // { id: 'analytics', label: 'Analytics' },
        // { id: 'sessions', label: 'Sessions' },
      ],
    },
    activeTab: {
      type: String,
      default: 'logs',
    },
  },
  emits: ['update:activeTab'],
  template: `
    <div class="tab-container">
      <nav class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab"
          :class="{ active: activeTab === tab.id }"
          @click="selectTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </nav>

      <div class="tab-content">
        <slot :name="activeTab">
          <slot></slot>
        </slot>
      </div>
    </div>
  `,
  methods: {
    selectTab(id) {
      this.$emit('update:activeTab', id);
    },
  },
});
```

### Usage Pattern (for integration in feature 16)

```html
<tab-container v-model:active-tab="currentTab" :tabs="tabs">
  <template #logs>
    <log-viewer :entries="entries"></log-viewer>
  </template>

  <!-- Future: -->
  <!-- <template #analytics>
    <analytics-viewer :entries="entries"></analytics-viewer>
  </template> -->
</tab-container>
```

### Additional CSS (if not in theme.css)

```css
.tab-container {
  display: flex;
  flex-direction: column;
}

.tab-content {
  flex: 1;
  min-height: 0;
}
```

## Acceptance Criteria
- [ ] Component registered as 'tab-container'
- [ ] Accepts `tabs` prop (array of {id, label} objects)
- [ ] Accepts `activeTab` prop with v-model support
- [ ] Renders tab buttons from tabs array
- [ ] Emits update:activeTab on tab click
- [ ] Active tab has .active class
- [ ] Uses named slots for tab content
- [ ] Default slot fallback for simple cases
- [ ] Default tabs array includes "Event Log"
- [ ] Extensible design with comments for future tabs

## Verification
```bash
grep -q "app.component('tab-container'" .claude/hooks/viewer/index.html && echo "TabContainer registered"
grep -q "update:activeTab" .claude/hooks/viewer/index.html && echo "v-model emit found"
grep -q "Event Log" .claude/hooks/viewer/index.html && echo "Default tab found"
```

## Commit
After verification passes:
```bash
git add .claude/hooks/viewer/index.html
git commit -m "feat(viewer): add TabContainer component

- Tab-based navigation with active state
- v-model support for active tab
- Named slots for tab content
- Extensible design for future viewers
- Default 'Event Log' tab"
```

## Next
Proceed to: `prompts/15-sse-client.md`
