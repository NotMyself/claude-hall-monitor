# Feature: UI-005 - E2E Validation with Playwright

## Context
Prior completed: UI-001 (copy button), UI-002 (JSON paths), UI-003 (session dropdown), UI-004 (footer)

All UI fixes have been implemented. This task validates all changes work correctly using Playwright browser automation.

## Objective
Verify all UI changes are working correctly by running a series of Playwright tests.

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- This is a READ-ONLY validation task
- Do NOT modify any code
- Only use Playwright MCP tools to verify
- Document any failures found

## Validation Steps

### Setup
1. Ensure the viewer is running:
   ```bash
   cd .claude/hooks && bun run viewer
   ```

### Test 1: Copy Button Visibility (UI-001)

Use Playwright MCP:

```
1. browser_navigate to http://host.docker.internal:3456
2. browser_snapshot to see the page structure
3. browser_click on a log entry to expand it
4. browser_take_screenshot to capture the expanded entry
5. browser_evaluate:
   () => {
     const btn = document.querySelector('.copy-btn');
     if (!btn) return { error: 'Button not found' };
     const style = getComputedStyle(btn);
     return {
       color: style.color,
       isVisible: style.color !== 'rgb(0, 0, 0)'
     };
   }
```

**Expected**: Button color is NOT black (rgb(0, 0, 0))

### Test 2: JSON Path Cleanup (UI-002)

```
1. With an entry expanded from Test 1
2. browser_evaluate:
   () => {
     const json = document.querySelector('.json-content');
     if (!json) return { error: 'JSON content not found' };
     const text = json.textContent;
     return {
       hasHomeDir: text.includes('C:\\Users\\BobbyJohnson') || text.includes('C:/Users/BobbyJohnson'),
       hasTilde: text.includes('~'),
       hasDoubleBackslash: text.includes('\\\\'),
       sample: text.substring(0, 200)
     };
   }
```

**Expected**:
- `hasHomeDir` is false (no full home directory path)
- `hasTilde` is true (uses ~ prefix)
- `hasDoubleBackslash` is false (no escaped backslashes)

### Test 3: Session Dropdown Position (UI-003)

```
1. browser_snapshot to get accessibility tree
2. Verify in the snapshot that:
   - Search input appears BEFORE session selector
   - The order is: Search -> Event Filter -> Clear -> Session
```

**Expected**: Search input ref appears before session selector ref in the tree

### Test 4: Footer Visibility (UI-004)

```
1. browser_take_screenshot with fullPage: false (viewport only)
2. browser_evaluate:
   () => {
     const footer = document.querySelector('.footer');
     if (!footer) return { error: 'Footer not found' };
     const rect = footer.getBoundingClientRect();
     return {
       footerBottom: rect.bottom,
       viewportHeight: window.innerHeight,
       isInViewport: rect.bottom <= window.innerHeight && rect.top >= 0
     };
   }
```

**Expected**: `isInViewport` is true

### Test 5: Dark Mode Toggle (Bonus)

```
1. browser_click on the theme toggle button (shows "dark")
2. browser_take_screenshot to capture dark mode
3. Verify copy button is still visible in screenshot
```

## Acceptance Criteria
- [ ] Test 1: Copy button has visible text color in dark mode
- [ ] Test 2: JSON paths show ~ instead of home directory
- [ ] Test 3: Session dropdown appears after search box
- [ ] Test 4: Footer is visible within viewport
- [ ] All tests pass without code modifications

## Verification Report

Document results for each test:

| Test | Feature | Status | Notes |
|------|---------|--------|-------|
| 1 | Copy Button | | |
| 2 | JSON Paths | | |
| 3 | Session Dropdown | | |
| 4 | Footer Visibility | | |

## Commit

If all tests pass:

```bash
git add .
git commit -m "chore(viewer): complete UI updates validation

All UI fixes verified:
- UI-001: Copy button visible in dark mode
- UI-002: JSON paths cleaned up with ~ prefix
- UI-003: Session dropdown below search
- UI-004: Footer always visible

Feature: UI-005"
```

## Completion

If all tests pass, update `features.json`:
- Set all feature statuses to "completed"
- Document any issues found

The UI updates are complete!
