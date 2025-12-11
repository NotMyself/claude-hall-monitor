# Feature: F08 - E2E Validation

## Context
All features implemented. Ready for integration testing.

## Objective
Validate complete flow works end-to-end.

## Test Plan

### 1. Type Check
```bash
cd .claude/hooks && bun run tsc --noEmit
```

### 2. Unit Tests
```bash
cd .claude/hooks && bun run test:run
```

### 3. Manual E2E Test

#### Step 1: Cleanup
```bash
# Remove old shared log file if present
rm -f .claude/hooks/hooks-log.txt

# Verify logs directory exists
ls -la .claude/hooks/logs/
```

#### Step 2: Start First Session
1. Open a new terminal
2. Start Claude Code
3. Verify a log file was created:
```bash
ls .claude/hooks/logs/
# Should show a .txt file named with session ID
```

#### Step 3: Test Viewer
1. Open http://localhost:3456 in browser
2. Verify:
   - Session selector is visible
   - Current session is selected and marked "(current)"
   - Log entries are displayed for the current session

#### Step 4: Create Second Session
1. Open another terminal
2. Start another Claude Code session
3. Go back to viewer and refresh
4. Verify:
   - Session selector now shows 2 sessions
   - New session is marked "(current)"
   - Old session is still available

#### Step 5: Test Session Switching
1. Select the older session from dropdown
2. Verify:
   - Entries update to show old session's logs
   - SSE reconnects (check network tab)
3. Select current session again
4. Verify entries switch back

### 4. Playwright Validation (Optional)
```javascript
// If using Playwright MCP for automated E2E
await page.goto('http://localhost:3456');
await page.waitForSelector('.session-select');

// Check session selector has options
const options = await page.locator('.session-select option').count();
expect(options).toBeGreaterThan(0);

// Check current session indicator
const currentOption = await page.locator('.session-select option:has-text("(current)")');
expect(await currentOption.count()).toBe(1);
```

## Acceptance Criteria
- [ ] Type check passes with no errors
- [ ] Unit tests pass
- [ ] New sessions create files in .claude/hooks/logs/
- [ ] Viewer defaults to current session
- [ ] Session selector lists all sessions sorted by recency
- [ ] Session switching updates displayed entries
- [ ] SSE reconnects on session change

## Cleanup Tasks
- [ ] Delete old `hooks-log.txt` if still present
- [ ] Update CLAUDE.md documentation if needed
- [ ] Update any tests that reference old log file path

## Final Commit
```bash
git add -A
git commit -m "feat(hooks): complete per-session logging implementation

- Logger writes to per-session files in logs/ directory
- Viewer supports session switching via dropdown
- Session ID passed to viewer on startup
- API endpoints support session filtering"
```

## Post-Implementation Notes

### Known Limitations
- Session list is not auto-refreshed (requires page reload to see new sessions)
- No pagination for large numbers of sessions
- Old sessions kept indefinitely (per requirements)

### Future Enhancements (Not in Scope)
- Auto-refresh session list periodically
- Session search/filter
- Session deletion UI
- Session statistics/analytics
