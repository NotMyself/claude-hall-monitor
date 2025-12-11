# Feature: F05 - Dropdown Checklist for Event Filter

## Context

F01-F04 are complete. The viewer now has theme contrast, reverse order, event summaries, and JSON syntax highlighting.

## Objective

Replace the multi-select dropdown with a custom dropdown checklist component for filtering events.

**IMPORTANT**: It is unacceptable to implement features beyond the scope of this task.

## Constraints

- Reference: See `constraints.md` for global rules
- Only modify the files listed below
- Component must handle all 12 event types
- Use Vue Options API style (matching existing code)

## Files to Modify

- `.claude/hooks/viewer/index.html` (add component, update filter-bar)
- `.claude/hooks/viewer/styles/theme.css` (add dropdown styles)

## Implementation Details

### 1. Create event-filter-dropdown component

Add this new Vue component before the `filter-bar` component:

```javascript
Vue.component('event-filter-dropdown', {
  props: {
    modelValue: {
      type: Array,
      default: () => []
    },
    eventTypes: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      isOpen: false
    };
  },
  computed: {
    buttonLabel() {
      if (this.modelValue.length === 0) {
        return 'No Events';
      }
      if (this.modelValue.length === this.eventTypes.length) {
        return 'All Events';
      }
      if (this.modelValue.length === 1) {
        return this.modelValue[0];
      }
      return `${this.modelValue.length} Events`;
    }
  },
  methods: {
    toggle() {
      this.isOpen = !this.isOpen;
    },
    close() {
      this.isOpen = false;
    },
    isSelected(event) {
      return this.modelValue.includes(event);
    },
    toggleEvent(event) {
      const newValue = this.isSelected(event)
        ? this.modelValue.filter(e => e !== event)
        : [...this.modelValue, event];
      this.$emit('update:modelValue', newValue);
    },
    selectAll() {
      this.$emit('update:modelValue', [...this.eventTypes]);
    },
    clearAll() {
      this.$emit('update:modelValue', []);
    },
    handleClickOutside(event) {
      if (this.$el && !this.$el.contains(event.target)) {
        this.close();
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  template: `
    <div class="event-dropdown">
      <button
        type="button"
        class="event-dropdown-trigger"
        @click.stop="toggle"
      >
        {{ buttonLabel }}
        <span class="dropdown-arrow">{{ isOpen ? '▲' : '▼' }}</span>
      </button>
      <div v-if="isOpen" class="event-dropdown-panel">
        <div class="event-dropdown-header">
          <button type="button" @click="selectAll">Select All</button>
          <button type="button" @click="clearAll">Clear</button>
        </div>
        <div class="event-dropdown-list">
          <label
            v-for="event in eventTypes"
            :key="event"
            class="event-checkbox"
          >
            <input
              type="checkbox"
              :checked="isSelected(event)"
              @change="toggleEvent(event)"
            />
            <span class="event-badge" :class="'badge-' + event.toLowerCase()">
              {{ event }}
            </span>
          </label>
        </div>
      </div>
    </div>
  `
});
```

### 2. Update filter-bar component

Replace the `<select multiple>` element with the new component:

```html
<event-filter-dropdown
  :model-value="selectedEvents"
  :event-types="eventTypes"
  @update:model-value="$emit('update:selectedEvents', $event)"
/>
```

### 3. Add CSS for dropdown

```css
/* Event Filter Dropdown */
.event-dropdown {
  position: relative;
  display: inline-block;
}

.event-dropdown-trigger {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.9em;
  min-width: 120px;
  justify-content: space-between;
}

.event-dropdown-trigger:hover {
  background: var(--bg-primary);
}

.dropdown-arrow {
  font-size: 0.7em;
  color: var(--text-secondary);
}

.event-dropdown-panel {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 100;
  min-width: 200px;
  max-height: 300px;
  overflow-y: auto;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-top: 4px;
}

.event-dropdown-header {
  display: flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs);
  border-bottom: 1px solid var(--border-color);
}

.event-dropdown-header button {
  flex: 1;
  padding: var(--spacing-xs);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.8em;
}

.event-dropdown-header button:hover {
  background: var(--accent-color);
  color: white;
}

.event-dropdown-list {
  padding: var(--spacing-xs);
}

.event-checkbox {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs);
  cursor: pointer;
  border-radius: 4px;
}

.event-checkbox:hover {
  background: var(--bg-primary);
}

.event-checkbox input[type="checkbox"] {
  cursor: pointer;
}
```

## Acceptance Criteria

- [ ] `event-filter-dropdown` Vue component created
- [ ] Button shows "All Events" when all selected
- [ ] Button shows "No Events" when none selected
- [ ] Button shows single event name when one selected
- [ ] Button shows "N Events" when multiple but not all selected
- [ ] Dropdown panel has checkboxes for all 12 event types
- [ ] Select All button selects all events
- [ ] Clear button deselects all events
- [ ] Click-outside closes dropdown
- [ ] Filtering happens immediately on checkbox toggle
- [ ] Component replaces `<select multiple>` in filter-bar
- [ ] All CSS classes added and styled properly
- [ ] All existing tests pass

## Verification

```bash
cd .claude/hooks && bun run test:run
```

Then visually verify using Playwright:
1. Navigate to http://localhost:3456
2. Click the event filter dropdown trigger
3. Verify dropdown opens with all event types
4. Toggle some checkboxes and verify filtering updates
5. Click "Select All" and "Clear" buttons
6. Click outside to close dropdown
7. Verify button label changes appropriately

## Commit

```bash
git add .claude/hooks/viewer/index.html .claude/hooks/viewer/styles/theme.css
git commit -m "$(cat <<'EOF'
feat(viewer): add dropdown checklist for event filtering

- Create event-filter-dropdown Vue component
- Add Select All / Clear buttons
- Implement click-outside to close
- Replace multi-select with new dropdown component
- Add comprehensive dropdown styling

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/06-toolbar-redesign.md`
