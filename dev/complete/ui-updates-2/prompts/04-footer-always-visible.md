# Feature: UI-004 - Fix Footer Always Visible

## Context
Prior completed: UI-001 (copy button), UI-002 (JSON paths), UI-003 (session dropdown)

The footer gets pushed off screen when there are many log entries. It should always be visible at the bottom of the viewport.

## Objective
Update the CSS layout to use flexbox so the footer stays at the bottom and the log list scrolls within the available space.

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- Only modify CSS in theme.css
- Update: `body`, `.app-container`, `main` (new), `.footer`, `.log-list`
- Remove `max-height` from `.log-list` (flex will handle sizing)
- Do not modify any HTML structure

## Files to Modify
- `.claude/hooks/viewer/styles/theme.css` - Update layout CSS rules

## Implementation Details

### 1. Update `body` (around line 67):

```css
body {
  font-family: var(--font-family);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
```

### 2. Update `.app-container` (around line 76):

```css
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}
```

### 3. Add new `main` rule (after .app-container):

```css
main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
```

### 4. Update `.footer` (around line 333):

```css
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
```

### 5. Update `.log-list` (around line 454):

Remove `max-height: calc(100vh - 350px);` and update to:

```css
.log-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}
```

## Acceptance Criteria
- [ ] Footer is always visible at bottom of viewport
- [ ] Footer doesn't get pushed off screen with many entries
- [ ] Log list scrolls within available space
- [ ] Header remains at top
- [ ] Filter bar remains visible
- [ ] Layout works with various viewport sizes

## Verification

Start the viewer and use Playwright to verify:

```bash
cd .claude/hooks && bun run viewer
```

Then use Playwright MCP:
1. `browser_navigate` to `http://host.docker.internal:3456`
2. `browser_take_screenshot` with `fullPage: false` to capture viewport
3. Verify footer is visible in the screenshot
4. `browser_evaluate` to check footer position:
   ```javascript
   () => {
     const footer = document.querySelector('.footer');
     const rect = footer.getBoundingClientRect();
     return {
       bottom: rect.bottom,
       windowHeight: window.innerHeight,
       isVisible: rect.bottom <= window.innerHeight
     };
   }
   ```

## Commit

```bash
git add .claude/hooks/viewer/styles/theme.css
git commit -m "feat(viewer): fix footer always visible with flexbox layout

- Update body, app-container, main, footer for flex layout
- Remove fixed max-height from log-list
- Footer now stays at bottom of viewport
- Log list scrolls within available space

Feature: UI-004"
```

## Next
Proceed to: `05-e2e-validation.md`
