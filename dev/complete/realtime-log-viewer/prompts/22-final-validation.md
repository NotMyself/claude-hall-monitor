# Feature: 22-final-validation - End-to-End Validation

## Context
Features 01-21 are complete. All code is written, tested, and dependencies are installed.

## Objective
Perform comprehensive end-to-end validation of the complete system.

**This is a validation feature - no code changes should be made.**

## Constraints
- Reference: See `constraints.md` for global rules
- Only run verification commands
- Document any failures for manual resolution
- Do NOT modify code in this feature

## Validation Checklist

### 1. TypeScript Compilation
```bash
cd .claude/hooks && bun run tsc --noEmit
```
Expected: No errors

### 2. Unit Tests
```bash
cd .claude/hooks && bun test --run
```
Expected: All tests pass

### 3. Server Starts
```bash
cd .claude/hooks && timeout 5 bun run viewer &
sleep 2
curl -s http://localhost:3456/ | head -c 100
kill %1 2>/dev/null || true
```
Expected: HTML content returned

### 4. SSE Endpoint Works
```bash
cd .claude/hooks && bun run viewer &
sleep 2
curl -N -s http://localhost:3456/events &
sleep 2
kill %1 %2 2>/dev/null || true
```
Expected: SSE events received

### 5. API Endpoint Works
```bash
cd .claude/hooks && bun run viewer &
sleep 2
curl -s http://localhost:3456/api/entries
kill %1 2>/dev/null || true
```
Expected: JSON array (possibly empty)

### 6. CSS Serves Correctly
```bash
cd .claude/hooks && bun run viewer &
sleep 2
curl -s http://localhost:3456/styles/theme.css | head -c 100
kill %1 2>/dev/null || true
```
Expected: CSS content

### 7. File Structure Complete
```bash
ls -la .claude/hooks/viewer/
ls -la .claude/hooks/viewer/styles/
ls -la .claude/hooks/viewer/__tests__/
```
Expected: All files present

### 8. Session Start Hook Still Works
```bash
echo '{"hook_event_name":"SessionStart","session_id":"test","cwd":"/tmp","source":"startup","transcript_path":"/tmp/test.json","permission_mode":"default"}' | bun run .claude/hooks/session-start.ts
```
Expected: JSON output with continue:true

## Automated Browser Testing with Playwright MCP

Use Playwright MCP tools to perform automated E2E validation. This replaces manual browser testing.

### Prerequisites
Ensure the viewer server is running before Playwright tests:
```bash
cd .claude/hooks && bun run viewer &
sleep 2
```

### Playwright MCP Test Sequence

**1. Navigate to viewer:**
```
Use: browser_navigate
URL: http://localhost:3456/
```

**2. Take initial screenshot:**
```
Use: browser_take_screenshot
Filename: viewer-initial.png
```

**3. Verify page structure with snapshot:**
```
Use: browser_snapshot
Expected elements:
- heading "Hook Viewer"
- button with theme toggle
- connection status indicator
- filter controls (search input, dropdowns)
- log entry list or empty state
- footer with entry count
```

**4. Test theme toggle:**
```
Use: browser_click
Element: theme toggle button
Then: browser_snapshot to verify theme changed
Repeat 2x to cycle through light → dark → system
```

**5. Test filter bar interaction:**
```
Use: browser_type
Element: search input
Text: "SessionStart"
Then: browser_snapshot to verify filtering works
```

**6. Test log entry expansion (if entries exist):**
```
Use: browser_click
Element: first log entry card
Then: browser_snapshot to verify expanded state with JSON view
```

**7. Take final screenshot:**
```
Use: browser_take_screenshot
Filename: viewer-final.png
FullPage: true
```

**8. Check console for errors:**
```
Use: browser_console_messages
OnlyErrors: true
Expected: No critical errors
```

**9. Close browser:**
```
Use: browser_close
```

### Playwright Validation Checklist

- [ ] Page loads successfully (no Cloudflare challenge since localhost)
- [ ] "Hook Viewer" heading visible in snapshot
- [ ] Theme toggle button present and clickable
- [ ] Theme changes reflect in page snapshot (data-theme attribute)
- [ ] Filter bar contains search input
- [ ] Filter bar contains session dropdown
- [ ] Filter bar contains event type selector
- [ ] Connection status shows "Connected" (or appropriate state)
- [ ] Footer shows entry count
- [ ] No console errors reported
- [ ] Screenshots captured successfully

### Manual Browser Testing (Fallback)

If Playwright MCP is unavailable, open http://localhost:3456/ in a browser and verify:

1. [ ] Page loads with "Hook Viewer" title
2. [ ] Theme toggle cycles light/dark/system
3. [ ] Connection status shows "Connected"
4. [ ] Filter bar has search, session, and event type controls
5. [ ] Existing log entries appear (if any)
6. [ ] New entries appear in real-time when hooks fire
7. [ ] Entry cards expand/collapse on click
8. [ ] Copy button copies JSON to clipboard
9. [ ] Footer shows entry count
10. [ ] Dark mode styling works correctly

## Acceptance Criteria
- [ ] TypeScript compiles without errors
- [ ] All unit tests pass
- [ ] Server starts and serves index.html
- [ ] SSE endpoint streams events
- [ ] API endpoint returns JSON
- [ ] CSS serves correctly
- [ ] All files exist in correct locations
- [ ] Session start hook produces valid output
- [ ] Browser testing confirms UI works

## Verification Summary
```bash
echo "=== Final Validation ==="
echo ""
echo "1. TypeScript Check:"
cd .claude/hooks && bun run tsc --noEmit && echo "✓ TypeScript OK" || echo "✗ TypeScript FAILED"
echo ""
echo "2. Unit Tests:"
cd .claude/hooks && bun test --run && echo "✓ Tests OK" || echo "✗ Tests FAILED"
echo ""
echo "3. File Structure:"
test -f .claude/hooks/viewer/server.ts && echo "✓ server.ts exists" || echo "✗ server.ts missing"
test -f .claude/hooks/viewer/index.html && echo "✓ index.html exists" || echo "✗ index.html missing"
test -f .claude/hooks/viewer/styles/theme.css && echo "✓ theme.css exists" || echo "✗ theme.css missing"
test -f .claude/hooks/viewer/types.ts && echo "✓ types.ts exists" || echo "✗ types.ts missing"
test -f .claude/hooks/viewer/config.ts && echo "✓ config.ts exists" || echo "✗ config.ts missing"
test -f .claude/hooks/viewer/watcher.ts && echo "✓ watcher.ts exists" || echo "✗ watcher.ts missing"
echo ""
echo "=== Validation Complete ==="
```

## Commit
After all validations pass:
```bash
git add -A
git commit -m "feat(viewer): complete real-time log viewer implementation

Real-time log viewer for Claude Code hooks featuring:
- Bun HTTP server with SSE for live updates
- Vue 3 UI with light/dark/system themes
- Filter by search, event type, session
- Expandable log entry cards with JSON view
- Auto-start on Claude Code session startup
- Comprehensive test suite

Closes #<issue-number-if-applicable>"
```

## Project Complete

The realtime-log-viewer is now fully implemented with:

| Component | Description |
|-----------|-------------|
| `viewer/server.ts` | Bun HTTP server with SSE |
| `viewer/index.html` | Vue 3 UI with all components |
| `viewer/styles/theme.css` | Claude Code Docs-inspired theme |
| `viewer/types.ts` | TypeScript type definitions |
| `viewer/config.ts` | Configuration constants |
| `viewer/watcher.ts` | Log file watcher |
| `viewer/vitest.config.ts` | Test configuration |
| `viewer/__tests__/*` | Unit and integration tests |
| `session-start.ts` | Modified to auto-start viewer |

To start the viewer manually:
```bash
cd .claude/hooks && bun run viewer
```

The viewer will also start automatically when Claude Code starts a new session.
