# Plan: Fix Log Viewer UI Issues

## Issues Identified

1. **Copy button not visible in dark mode** - The `.copy-btn` has black text (`color: rgb(0, 0, 0)`) on a dark background, making it nearly invisible
2. **JSON data display** - Remove escape characters and use relative paths with `~` for home directory
3. **Session dropdown position** - Currently in a separate row above the search box; user wants it below
4. **Footer being pushed off screen** - Footer should always be visible

## Files to Modify

- `.claude/hooks/viewer/styles/theme.css` - Fix copy button styling and footer positioning
- `.claude/hooks/viewer/index.html` - Reorder filter bar layout (session dropdown below search)

## Implementation Steps

### 1. Fix Copy Button Visibility in Dark Mode

**File:** `.claude/hooks/viewer/styles/theme.css` (lines 323-330)

Add `color: var(--text-primary)` to the `.log-entry .copy-btn` rule:

```css
.log-entry .copy-btn {
  padding: 4px 8px;
  font-size: 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-primary);  /* ADD THIS LINE */
  cursor: pointer;
}
```

### 2. Clean Up JSON Display (Remove Escaping, Use Relative Paths)

**File:** `.claude/hooks/viewer/index.html` (lines 610-636 in `syntaxHighlight` method)

Add a preprocessing step to:
1. Unescape double backslashes to single backslashes (Windows paths)
2. Replace the user's home directory with `~`

Add a new method `cleanupJson` and call it before `syntaxHighlight`:

```javascript
cleanupPaths(json) {
  // Get Windows home directory pattern
  const homeDir = 'C:\\\\Users\\\\BobbyJohnson';
  const homeDirRegex = new RegExp(homeDir.replace(/\\/g, '\\\\'), 'g');

  // Replace home directory with ~
  json = json.replace(homeDirRegex, '~');

  // Convert double backslashes to forward slashes for readability
  json = json.replace(/\\\\/g, '/');

  return json;
},
```

Update the `highlightedJson` computed property:

```javascript
highlightedJson() {
  let json = JSON.stringify(this.entry.data, null, 2);
  json = this.cleanupPaths(json);
  return this.syntaxHighlight(json);
},
```

And update `syntaxHighlight` to accept a string directly (it already does).

### 3. Move Session Dropdown Below Search Box

**File:** `.claude/hooks/viewer/index.html` (lines 474-504)

Reorder the filter-bar template in the `filter-bar` component to put the session selector row AFTER the main filter row:

```html
<div class="filter-bar">
  <!-- Main filters first -->
  <div class="filter-row filter-row-main">
    <input ... />
    <event-filter-dropdown ... />
    <button ... />
  </div>

  <!-- Session selector below -->
  <div class="filter-row filter-row-top">
    <session-selector ... />
  </div>
</div>
```

### 4. Fix Footer Always Visible

**File:** `.claude/hooks/viewer/styles/theme.css`

Update the layout to use flexbox with sticky footer:

```css
/* Update body to use flex layout */
body {
  font-family: var(--font-family);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Update app-container */
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Update main to take available space */
main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* Update footer to stay at bottom */
.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  margin-top: auto;
  border-top: 1px solid var(--border);
  font-size: 0.875rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

/* Update log-list to scroll within available space */
.log-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}
```

Remove the `max-height: calc(100vh - 350px)` from `.log-list` as the flex layout will handle sizing.

## Summary of Changes

| Issue | Fix Location | Change |
|-------|--------------|--------|
| Copy button invisible | theme.css:323-330 | Add `color: var(--text-primary)` |
| JSON escaping/paths | index.html:605-636 | Add `cleanupPaths()` method, update `highlightedJson` |
| Session dropdown position | index.html:474-504 | Swap order of filter rows |
| Footer off screen | theme.css:67-73, 76-80, 332-342, 454-458 | Flex layout with sticky footer |
