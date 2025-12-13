# Feature: e2e-validation - E2E Plan Tracker Validation

## Context

All implementation features are complete. Now we need to validate the plan tracker works end-to-end.

## Objective

Manually validate that the plan tracker tab functions correctly with real plan data.

## Constraints

- Reference: See constraints.md for global rules
- Use the Playwright MCP tools if available
- Test with both active and completed plans
- Verify real-time updates work

## Validation Steps

### 1. Start the Viewer

```bash
cd .claude/hooks && bun run viewer
```

### 2. Open in Browser

Navigate to http://localhost:3456

### 3. Verify Plans Tab Exists

- [ ] "Plans" tab is visible in the tab bar
- [ ] Clicking the tab switches to plans view

### 4. Verify Plan List

- [ ] Plans from dev/complete/ are displayed
- [ ] Each plan shows project name and description
- [ ] Progress bars show correct completion percentage
- [ ] Status badges show "active" or "completed"

### 5. Verify Plan Expansion

- [ ] Clicking a plan card expands it
- [ ] Feature list is displayed
- [ ] Each feature shows status dot with correct color:
  - Gray for pending
  - Blue (pulsing) for in_progress
  - Green for completed
  - Red for failed
- [ ] Layer badges are displayed

### 6. Verify Feature Expansion

- [ ] Clicking a feature expands its details
- [ ] Acceptance criteria are listed
- [ ] Files are listed
- [ ] Dependencies are listed

### 7. Verify Controls

- [ ] "Show completed plans" toggle works
- [ ] "Group by layer" toggle organizes features by layer

### 8. Verify Real-time Updates

To test real-time updates:

1. Create a test plan in dev/active/:

```bash
mkdir -p dev/active/test-realtime
cat > dev/active/test-realtime/features.json << 'EOF'
{
  "project": "test-realtime",
  "version": "1.0.0",
  "description": "Testing real-time updates",
  "features": [
    {"id": "f1", "title": "Test Feature", "status": "pending", "layer": 1}
  ],
  "layers": {"1": "Test Layer"}
}
EOF
```

2. Verify the plan appears in the viewer without refresh

3. Update the features.json:

```bash
cat > dev/active/test-realtime/features.json << 'EOF'
{
  "project": "test-realtime",
  "version": "1.0.0",
  "description": "Testing real-time updates",
  "features": [
    {"id": "f1", "title": "Test Feature", "status": "completed", "layer": 1}
  ],
  "layers": {"1": "Test Layer"}
}
EOF
```

4. Verify the status updates in real-time (progress bar, status dot)

5. Clean up:

```bash
rm -rf dev/active/test-realtime
```

### 9. Verify No Console Errors

- [ ] Open browser DevTools
- [ ] Check Console tab for errors
- [ ] No JavaScript errors should appear

### 10. Verify Dark Mode

- [ ] Toggle to dark theme
- [ ] Plan cards render correctly
- [ ] Progress bars are visible
- [ ] Status colors are correct

## Playwright Validation (if available)

If Playwright MCP tools are available:

1. Navigate to http://localhost:3456
2. Take screenshot of initial state
3. Click on "Plans" tab
4. Take screenshot of plans view
5. Click on a plan card to expand
6. Take screenshot of expanded plan
7. Toggle dark mode
8. Take screenshot of dark mode

## Acceptance Criteria

- [ ] Plans tab is clickable and switches view
- [ ] Active plans display with correct feature status
- [ ] Completed plans display when toggle is on
- [ ] Progress bars show accurate completion percentages
- [ ] Real-time updates work when features.json changes
- [ ] Feature expansion shows details correctly
- [ ] Layer grouping works correctly
- [ ] Dark mode renders correctly
- [ ] No console errors

## Verification

Manual validation with viewer running.

## Commit

If any fixes were needed:

```bash
git add -A
git commit -m "fix(plan-tracker): address issues from E2E validation"
```

## Completion

After successful validation:

1. Verify all tests still pass:
   ```bash
   cd .claude/hooks && bun run test:run
   ```

2. The plan tracker feature is complete!
