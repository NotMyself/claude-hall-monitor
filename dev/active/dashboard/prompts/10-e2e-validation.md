# Feature: e2e-validation - E2E Dashboard Validation

## Context

All dashboard implementation and unit tests are complete. The viewer is fully functional with the new Dashboard tab.

## Objective

Perform end-to-end validation of the dashboard using Playwright MCP tools to verify the UI works correctly.

**IMPORTANT**: This is a validation step, not implementation. Only verify existing functionality.

## Constraints

Reference: See `constraints.md` for global rules.

- Use Playwright MCP tools for browser automation
- Do not modify any code
- Document any issues found

## Prerequisites

1. Viewer server must be running
2. At least one session log should exist for testing

## Validation Steps

### 1. Start the Viewer Server

```bash
cd .claude/hooks && bun run viewer
```

Verify server starts on http://localhost:3456

### 2. Navigate to Viewer

Use Playwright MCP:
```
browser_navigate url="http://localhost:3456"
```

### 3. Capture Initial Snapshot

```
browser_snapshot
```

Verify:
- [ ] Page loads successfully
- [ ] Tab bar is visible with "Hook Log" and "Dashboard" tabs
- [ ] "Hook Log" tab is active by default

### 4. Click Dashboard Tab

```
browser_click element="Dashboard tab" ref="[ref from snapshot]"
```

### 5. Capture Dashboard Snapshot

```
browser_snapshot
```

Verify:
- [ ] Dashboard view is displayed
- [ ] Sessions section is visible
- [ ] Configuration section is visible

### 6. Verify Sessions Section

From snapshot, verify:
- [ ] Session cards are displayed (if sessions exist)
- [ ] Each card shows session ID (truncated)
- [ ] Each card shows status badge (active/inactive/ended)
- [ ] Each card shows message, tool, and compact counts
- [ ] Status badges have correct colors:
  - Active: green
  - Inactive: yellow
  - Ended: gray

### 7. Verify Token Usage Section (if stats exist)

From snapshot, verify:
- [ ] Token usage section is visible
- [ ] Model name is formatted correctly (e.g., "Opus 4.5")
- [ ] Token counts are displayed with K/M suffixes

### 8. Verify Configuration Section

From snapshot, verify:
- [ ] Commands subsection shows available commands
- [ ] Hooks subsection shows configured hooks
- [ ] Skills subsection shows available skills
- [ ] MCP Servers subsection shows enabled servers
- [ ] Empty states show appropriate messages

### 9. Check Console for Errors

```
browser_console_messages onlyErrors=true
```

Verify:
- [ ] No JavaScript errors
- [ ] No failed network requests

### 10. Take Screenshot

```
browser_take_screenshot filename="dashboard-validation.png"
```

### 11. Switch Back to Logs Tab

```
browser_click element="Hook Log tab" ref="[ref from snapshot]"
browser_snapshot
```

Verify:
- [ ] Log viewer is displayed
- [ ] Dashboard polling has stopped (check network requests)

### 12. Return to Dashboard

```
browser_click element="Dashboard tab" ref="[ref from snapshot]"
```

Verify:
- [ ] Dashboard reloads data
- [ ] Data refreshes every 5 seconds (can verify with multiple snapshots)

## Expected Results

All checkboxes above should be verified. The dashboard should:

1. Display session information correctly
2. Show accurate status badges
3. Display token usage statistics (if available)
4. List all configuration items
5. Have no console errors
6. Poll for updates when active
7. Stop polling when inactive

## Issues Log

Document any issues found during validation:

| Issue | Severity | Description |
|-------|----------|-------------|
| (none expected) | | |

## Sign-off

- [ ] All validation steps completed
- [ ] No blocking issues found
- [ ] Dashboard feature ready for use

## Commit

After successful validation, create a final commit:

```bash
git add -A
git commit -m "feat(dashboard): complete dashboard feature implementation

- Add dashboard type definitions
- Add configuration paths and constants
- Implement heartbeat mechanism for activity detection
- Create DashboardService for data aggregation
- Add /api/dashboard endpoint
- Create Dashboard Vue component with session grid
- Display token usage and configuration
- Add comprehensive unit tests
- E2E validation passed"
```
