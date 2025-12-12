# Feature: F02 - Fix Deprecated beforeDestroy Hook

## Context
F01 completed: Dashboard poll interval is now cleared on unmount.

## Objective
Replace the deprecated Vue 2 `beforeDestroy` lifecycle hook with Vue 3's `beforeUnmount` in the event-filter-dropdown component.

## Constraints
- Reference: See `constraints.md` for global rules
- Only modify the lifecycle hook name in the event-filter-dropdown component
- Do not change the callback logic

## Files to Modify
- `.claude/hooks/viewer/index.html` - Change `beforeDestroy` to `beforeUnmount` (~line 465)

## Implementation Details

Current code (around line 465):
```javascript
beforeDestroy() {
  document.removeEventListener('click', this.handleClickOutside);
},
```

Updated code:
```javascript
beforeUnmount() {
  document.removeEventListener('click', this.handleClickOutside);
},
```

## Acceptance Criteria
- [ ] `beforeDestroy` is replaced with `beforeUnmount`
- [ ] The callback function body remains unchanged
- [ ] Type checking passes: `bun run tsc --noEmit`
- [ ] All tests pass: `bun run test`
- [ ] No Vue deprecation warnings in browser console

## Verification
```bash
cd .claude/hooks && bun run tsc --noEmit && bun run test:run
```

## Commit
```bash
git add .claude/hooks/viewer/index.html
git commit -m "fix(viewer): use Vue 3 beforeUnmount lifecycle hook"
```

## Next
Proceed to: `prompts/03-remove-hardcoded-path.md`
