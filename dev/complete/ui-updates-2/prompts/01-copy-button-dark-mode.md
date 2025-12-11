# Feature: UI-001 - Fix Copy Button Dark Mode Visibility

## Context
The log viewer has a copy button in expanded log entries that allows users to copy JSON data. In dark mode, the button text is invisible because it uses black text on a dark background.

## Objective
Add a text color to the `.copy-btn` CSS rule so the button is visible in both light and dark modes.

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- Only modify the `.log-entry .copy-btn` CSS rule
- Use `var(--text-primary)` for the text color (works in both themes)
- Do not modify any other CSS rules

## Files to Modify
- `.claude/hooks/viewer/styles/theme.css` - Add color property to copy button rule (lines 323-330)

## Implementation Details

Find this CSS rule (around line 323):

```css
.log-entry .copy-btn {
  padding: 4px 8px;
  font-size: 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  cursor: pointer;
}
```

Add the `color` property:

```css
.log-entry .copy-btn {
  padding: 4px 8px;
  font-size: 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
}
```

## Acceptance Criteria
- [ ] `.log-entry .copy-btn` has `color: var(--text-primary)` property
- [ ] Copy button text is visible in dark mode
- [ ] Copy button text is visible in light mode
- [ ] No other CSS rules were modified

## Verification

Start the viewer and use Playwright to verify:

```bash
cd .claude/hooks && bun run viewer
```

Then use Playwright MCP:
1. `browser_navigate` to `http://host.docker.internal:3456`
2. Click on a log entry to expand it
3. `browser_take_screenshot` to verify copy button is visible
4. `browser_evaluate` to check computed color of `.copy-btn`

## Commit

```bash
git add .claude/hooks/viewer/styles/theme.css
git commit -m "feat(viewer): fix copy button visibility in dark mode

- Add color: var(--text-primary) to .copy-btn
- Button text now visible in both light and dark themes

Feature: UI-001"
```

## Next
Proceed to: `02-json-path-cleanup.md`
