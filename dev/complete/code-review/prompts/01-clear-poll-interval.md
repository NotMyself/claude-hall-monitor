# Feature: F01 - Clear Dashboard Poll Interval

## Context
Starting fresh from initialized project. No prior fixes applied.

## Objective
Fix memory leak by clearing `dashboardPollInterval` when the main Vue app component unmounts.

## Constraints
- Reference: See `constraints.md` for global rules
- Only modify the `onUnmounted()` callback in the main app component
- Do not change any other lifecycle hooks or intervals

## Files to Modify
- `.claude/hooks/viewer/index.html` - Add clearInterval to onUnmounted callback (~line 291-293)

## Implementation Details

Current code (around line 288-293):
```javascript
dashboardPollInterval = setInterval(fetchDashboard, 5000);

onUnmounted(() => {
  disconnect();
});
```

Updated code:
```javascript
dashboardPollInterval = setInterval(fetchDashboard, 5000);

onUnmounted(() => {
  disconnect();
  if (dashboardPollInterval) {
    clearInterval(dashboardPollInterval);
    dashboardPollInterval = null;
  }
});
```

## Acceptance Criteria
- [ ] `onUnmounted()` clears `dashboardPollInterval` if it exists
- [ ] `dashboardPollInterval` is set to `null` after clearing
- [ ] Type checking passes: `bun run tsc --noEmit`
- [ ] All tests pass: `bun run test`

## Verification
```bash
cd .claude/hooks && bun run tsc --noEmit && bun run test:run
```

## Commit
```bash
git add .claude/hooks/viewer/index.html
git commit -m "fix(viewer): clear dashboard poll interval on unmount"
```

## Next
Proceed to: `prompts/02-fix-before-destroy.md`
