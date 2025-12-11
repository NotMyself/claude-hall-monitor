# Hook Viewer UI Improvements Plan

## Summary
Improve the Claude Code hooks viewer with 6 fixes: theme toggle visibility, toolbar redesign, dropdown checklist for event filters, reverse chronological order, event-specific collapsed displays, and formatted JSON with syntax highlighting.

## Critical Files
- `.claude/hooks/viewer/index.html` - Vue components (theme-toggle, filter-bar, log-entry, log-viewer)
- `.claude/hooks/viewer/styles/theme.css` - All styling
- `.claude/hooks/viewer/__tests__/components.test.ts` - Unit tests

---

## Changes

### 1. Fix Theme Toggle Text Contrast
**File:** `theme.css` (lines ~179-193)

Add `color: var(--text-primary)` to `.theme-toggle` and `.theme-label` classes so text is visible in dark mode.

---

### 2. Reverse Log Entry Order (Newest First)
**File:** `index.html` (line ~621 in LogViewer)

Change `filteredEntries` computed property:
```javascript
// Add .slice().reverse() to show newest first
return this.entries.filter(entry => { ... }).slice().reverse();
```

Update `scrollToBottom` → `scrollToTop` method to scroll to top for new entries.

---

### 3. Event-Specific Collapsed Display
**File:** `index.html` (log-entry component ~463-541)

Add `getSummary(entry)` method with event-type-specific logic:
- UserPromptSubmit → truncated prompt text
- PreToolUse → tool name
- PostToolUse → tool name + ✓/✗
- PostToolUseFailure → tool name + error snippet
- SessionStart/End → session ID
- SubagentStart/Stop → subagent type
- Notification → message
- PermissionRequest → permission type
- PreCompact → compaction reason
- Stop → stop reason

Update card-header template to show summary between badge and expand icon.

**File:** `theme.css`
Add `.entry-summary` style (flex: 1, monospace, ellipsis overflow).

---

### 4. JSON Syntax Highlighting
**File:** `index.html` (log-entry component)

Add `syntaxHighlight(json)` method that wraps JSON tokens in spans:
- Keys → `.json-key`
- Strings → `.json-string`
- Numbers → `.json-number`
- Booleans/null → `.json-boolean` / `.json-null`

Change template from `{{ formattedJson }}` to `v-html="highlightedJson"`.

**File:** `theme.css`
Add syntax highlighting colors for both light and dark modes (VS Code style colors).

---

### 5. Dropdown Checklist for Event Filter
**File:** `index.html`

Create new `event-filter-dropdown` component:
- Button showing "All Events" / single event / "N Events"
- Dropdown panel with checkboxes for all 12 event types
- Select All / Clear buttons in header
- Immediate filtering on toggle (no apply button)
- Click-outside directive to close

Replace `<select multiple>` in filter-bar with `<event-filter-dropdown>`.

**File:** `theme.css`
Add styles:
- `.event-dropdown` (relative positioning)
- `.event-dropdown-trigger` (button styling)
- `.event-dropdown-panel` (absolute positioned, shadows, scrollable)
- `.event-dropdown-header` (Select All/Clear buttons)
- `.event-checkbox` (checkbox + mini badge)

---

### 6. Toolbar Redesign
**File:** `index.html` (filter-bar component ~349-460)

Restructure to two-row layout:
```html
<div class="filter-bar">
  <div class="filter-row filter-row-top">
    <session-selector ... />
  </div>
  <div class="filter-row filter-row-main">
    <input type="text" placeholder="Search logs..." ... />
    <event-filter-dropdown ... />
    <button>Clear Filters</button>
  </div>
</div>
```

**File:** `theme.css`
Update `.filter-bar` to `flex-direction: column` with `.filter-row` children.

---

## Implementation Order

1. Theme toggle fix (CSS only)
2. Reverse log order (one-line change)
3. Event-specific summaries (method + template + CSS)
4. JSON syntax highlighting (method + template + CSS)
5. Dropdown checklist component (new component + directive + CSS)
6. Toolbar redesign (template restructure + CSS)

---

## Testing
Run `cd .claude/hooks && bun run test` after implementation to verify existing tests pass, then add new tests for:
- Event filter dropdown label logic
- Log entry summary generation per event type
- JSON syntax highlighting regex
- Reverse ordering behavior
