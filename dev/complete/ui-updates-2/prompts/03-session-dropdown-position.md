# Feature: UI-003 - Move Session Dropdown Below Search

## Context
Prior completed: UI-001 (copy button), UI-002 (JSON paths)

The filter bar currently has the session dropdown on the top row, with search and event filter below it. The user wants the session dropdown moved below the search box.

## Objective
Reorder the filter bar template so the session dropdown appears AFTER the search/filter row.

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- Only modify the `filter-bar` component template
- Swap the order of the two `filter-row` divs
- Do not modify any CSS
- Do not change the component logic or props

## Files to Modify
- `.claude/hooks/viewer/index.html` - Reorder filter-bar template (lines 474-504)

## Implementation Details

Find the `filter-bar` component template (around line 474):

Current order:
```html
<div class="filter-bar">
  <div class="filter-row filter-row-top">
    <session-selector ... />
  </div>

  <div class="filter-row filter-row-main">
    <input ... />
    <event-filter-dropdown ... />
    <button ... />
  </div>
</div>
```

Change to:
```html
<div class="filter-bar">
  <div class="filter-row filter-row-main">
    <input
      type="text"
      class="search-input"
      placeholder="Search logs..."
      :value="modelValue.search"
      @input="onSearchInput"
    />

    <event-filter-dropdown
      :model-value="modelValue.eventTypes"
      :event-types="eventTypes"
      @update:model-value="emit({ eventTypes: $event })"
    />

    <button class="clear-filters-btn" @click="clearFilters" :disabled="!hasFilters">
      Clear Filters
    </button>
  </div>

  <div class="filter-row filter-row-top">
    <session-selector
      :sessions="sessions"
      :current-session="currentSession"
      :model-value="selectedSession"
      @update:model-value="$emit('update:selectedSession', $event)"
    />
  </div>
</div>
```

## Acceptance Criteria
- [ ] Search input appears on the first row
- [ ] Event filter dropdown appears on the first row
- [ ] Clear Filters button appears on the first row
- [ ] Session selector appears on the second row (below search)
- [ ] All filter functionality still works correctly
- [ ] No CSS was modified

## Verification

Start the viewer and use Playwright to verify:

```bash
cd .claude/hooks && bun run viewer
```

Then use Playwright MCP:
1. `browser_navigate` to `http://host.docker.internal:3456`
2. `browser_snapshot` to verify DOM order
3. `browser_take_screenshot` to visually confirm layout
4. Verify search input appears before session dropdown in the accessibility tree

## Commit

```bash
git add .claude/hooks/viewer/index.html
git commit -m "feat(viewer): move session dropdown below search box

- Reorder filter-bar rows: search/filter first, session second
- Improves visual hierarchy of filter controls

Feature: UI-003"
```

## Next
Proceed to: `04-footer-always-visible.md`
