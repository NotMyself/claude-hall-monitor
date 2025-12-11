# Feature: F06 - Toolbar Redesign

## Context

F01-F05 are complete. The viewer now has all core features including the new event filter dropdown.

## Objective

Restructure the filter-bar component to a two-row layout with session selector on the top row.

**IMPORTANT**: It is unacceptable to implement features beyond the scope of this task.

## Constraints

- Reference: See `constraints.md` for global rules
- Only modify the files listed below
- Maintain all existing functionality
- Layout should be responsive

## Files to Modify

- `.claude/hooks/viewer/index.html` (filter-bar template)
- `.claude/hooks/viewer/styles/theme.css` (filter-bar layout styles)

## Implementation Details

### 1. Update filter-bar template

Restructure the template to use a two-row layout:

```html
<template id="filter-bar-template">
  <div class="filter-bar">
    <div class="filter-row filter-row-top">
      <session-selector
        :sessions="sessions"
        :selected-session="selectedSession"
        @update:selectedSession="$emit('update:selectedSession', $event)"
      />
    </div>
    <div class="filter-row filter-row-main">
      <input
        type="text"
        class="search-input"
        placeholder="Search logs..."
        :value="searchQuery"
        @input="$emit('update:searchQuery', $event.target.value)"
      />
      <event-filter-dropdown
        :model-value="selectedEvents"
        :event-types="eventTypes"
        @update:model-value="$emit('update:selectedEvents', $event)"
      />
      <button
        type="button"
        class="clear-filters-btn"
        @click="clearFilters"
      >
        Clear Filters
      </button>
    </div>
  </div>
</template>
```

### 2. Add clearFilters method if not present

```javascript
methods: {
  clearFilters() {
    this.$emit('update:searchQuery', '');
    this.$emit('update:selectedEvents', [...this.eventTypes]);
    this.$emit('update:selectedSession', 'all');
  }
}
```

### 3. Update CSS for two-row layout

```css
/* Filter Bar - Two Row Layout */
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.filter-row-top {
  /* Session selector takes full width on its own row */
}

.filter-row-main {
  /* Search, event filter, clear button */
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 0.9em;
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color);
}

.clear-filters-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.9em;
  white-space: nowrap;
}

.clear-filters-btn:hover {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .filter-row-main {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    min-width: 100%;
  }
}
```

## Acceptance Criteria

- [ ] filter-bar uses `flex-direction: column`
- [ ] `filter-row-top` contains session-selector only
- [ ] `filter-row-main` contains search input, event-filter-dropdown, and clear filters button
- [ ] CSS classes `.filter-row`, `.filter-row-top`, `.filter-row-main` added
- [ ] Clear Filters button resets search, events, and session
- [ ] Layout looks good at various widths
- [ ] Responsive adjustments work on narrow screens
- [ ] All existing tests pass

## Verification

```bash
cd .claude/hooks && bun run test:run
```

Then visually verify using Playwright:
1. Navigate to http://localhost:3456
2. Verify toolbar has two rows
3. Verify session selector is on top row
4. Verify search, event filter, and clear button are on second row
5. Resize browser window to test responsive behavior
6. Click Clear Filters and verify all filters reset
7. Take screenshots at different widths

## Commit

```bash
git add .claude/hooks/viewer/index.html .claude/hooks/viewer/styles/theme.css
git commit -m "$(cat <<'EOF'
feat(viewer): redesign toolbar to two-row layout

- Move session selector to dedicated top row
- Place search, event filter, and clear button on main row
- Add responsive CSS for narrow screens
- Add Clear Filters button functionality

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/07-unit-tests.md`
