# Feature: F08 - E2E Validation with Playwright

## Context

F01-F07 are complete. All features implemented and unit tested. This is the final validation step.

## Objective

Perform end-to-end validation of all UI changes using Playwright browser automation via MCP tools.

**IMPORTANT**: This is a validation task, not implementation. Do not make code changes.

## Constraints

- Reference: See `constraints.md` for global rules
- Use Playwright MCP tools for browser automation
- Take screenshots to document each verification
- Report any issues found

## Files to Modify

None - this is validation only.

## Validation Steps

### 1. Start the Viewer

Ensure the viewer is running:
```bash
cd .claude/hooks && bun run viewer &
```

### 2. Navigate to Viewer

```
browser_navigate: http://localhost:3456
browser_snapshot
```

### 3. Verify Theme Toggle (F01)

```
browser_take_screenshot: filename="01-light-mode.png"
```

Click the theme toggle:
```
browser_click: [theme toggle element]
browser_take_screenshot: filename="02-dark-mode.png"
```

**Check**: Text is visible in both screenshots.

### 4. Verify Log Order (F02)

```
browser_snapshot
```

**Check**: If logs exist, verify newest timestamps appear first (at top).

### 5. Verify Event Summaries (F03)

Look at collapsed log entries:
```
browser_snapshot
```

**Check**: Each entry shows a contextual summary between badge and expand icon.

### 6. Verify JSON Syntax Highlighting (F04)

Click to expand a log entry:
```
browser_click: [log entry to expand]
browser_take_screenshot: filename="03-json-expanded.png"
```

**Check**: JSON has colored syntax (keys, strings, numbers in different colors).

Toggle theme and verify colors change:
```
browser_click: [theme toggle]
browser_take_screenshot: filename="04-json-dark-mode.png"
```

### 7. Verify Event Filter Dropdown (F05)

Click the event filter dropdown:
```
browser_click: [event dropdown trigger]
browser_snapshot
browser_take_screenshot: filename="05-dropdown-open.png"
```

**Check**:
- Dropdown opens
- Shows all 12 event types with checkboxes
- Has Select All / Clear buttons

Test filtering:
```
browser_click: [Clear button]
browser_snapshot
```

**Check**: Button label shows "No Events" and log list is empty/filtered.

```
browser_click: [Select All button]
browser_snapshot
```

**Check**: Button label shows "All Events".

Click outside to close:
```
browser_click: [area outside dropdown]
browser_snapshot
```

**Check**: Dropdown is closed.

### 8. Verify Toolbar Layout (F06)

```
browser_take_screenshot: filename="06-toolbar-layout.png"
```

**Check**:
- Session selector is on top row
- Search, event filter, clear button on second row

Test responsive:
```
browser_resize: width=400, height=800
browser_take_screenshot: filename="07-toolbar-narrow.png"
```

**Check**: Layout adjusts for narrow screen.

```
browser_resize: width=1200, height=800
```

### 9. Check Console for Errors

```
browser_console_messages: onlyErrors=true
```

**Check**: No JavaScript errors.

## Acceptance Criteria

- [ ] Theme toggle text visible in light mode (screenshot 01)
- [ ] Theme toggle text visible in dark mode (screenshot 02)
- [ ] Logs display newest first
- [ ] Event summaries visible in collapsed entries
- [ ] JSON syntax highlighted in expanded entries (screenshot 03)
- [ ] JSON colors change with theme (screenshot 04)
- [ ] Event dropdown opens and shows all events (screenshot 05)
- [ ] Select All / Clear buttons work
- [ ] Click-outside closes dropdown
- [ ] Toolbar has two-row layout (screenshot 06)
- [ ] Responsive layout works (screenshot 07)
- [ ] No JavaScript console errors

## Commit

No commit - this is validation only.

## Completion

If all checks pass, the UI improvements are complete!

If issues are found:
1. Document the specific issue
2. Return to the relevant feature prompt
3. Fix the issue
4. Re-run validation

## Final Summary

After successful validation, summarize:
- Features implemented: 6 (F01-F06)
- Tests added: F07
- Validation: F08

Update `features.json` to mark all features as `completed`.
