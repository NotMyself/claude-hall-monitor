# Feature: F03 - Remove Hardcoded User Path

## Context
F01-F02 completed: Poll interval cleared, Vue 3 lifecycle hooks fixed.

## Objective
Make the `cleanupPaths()` method portable by replacing the hardcoded username with dynamic home directory detection patterns.

## Constraints
- Reference: See `constraints.md` for global rules
- Only modify the `cleanupPaths()` method in the json-viewer component
- Support Windows, Linux, and macOS home directory patterns
- Keep the backslash-to-forward-slash conversion

## Files to Modify
- `.claude/hooks/viewer/index.html` - Update `cleanupPaths()` method (~line 668-677)

## Implementation Details

Current code (around line 668-677):
```javascript
cleanupPaths(json) {
  // Replace Windows home directory with ~
  // JSON.stringify escapes backslashes, so C:\Users becomes C:\\Users in the string
  json = json.replace(/C:\\\\Users\\\\BobbyJohnson/g, '~');

  // Convert remaining escaped backslashes to forward slashes for readability
  json = json.replace(/\\\\/g, '/');

  return json;
}
```

Updated code:
```javascript
cleanupPaths(json) {
  // Replace home directory paths with ~ for readability
  // Supports Windows (C:\Users\<name>), Linux (/home/<name>), macOS (/Users/<name>)
  // JSON.stringify escapes backslashes, so patterns account for \\\\
  json = json.replace(/C:\\\\Users\\\\[^\\\\]+/g, '~');
  json = json.replace(/\/home\/[^/]+/g, '~');
  json = json.replace(/\/Users\/[^/]+/g, '~');

  // Convert remaining escaped backslashes to forward slashes for readability
  json = json.replace(/\\\\/g, '/');

  return json;
}
```

## Acceptance Criteria
- [ ] Hardcoded `BobbyJohnson` username is removed
- [ ] Windows paths like `C:\\Users\\AnyUser` are replaced with `~`
- [ ] Linux paths like `/home/anyuser` are replaced with `~`
- [ ] macOS paths like `/Users/anyuser` are replaced with `~`
- [ ] Backslash conversion to forward slashes still works
- [ ] Type checking passes: `bun run tsc --noEmit`
- [ ] All tests pass: `bun run test`

## Verification
```bash
cd .claude/hooks && bun run tsc --noEmit && bun run test:run
```

## Commit
```bash
git add .claude/hooks/viewer/index.html
git commit -m "fix(viewer): make path cleanup portable across platforms"
```

## Next
Proceed to: `prompts/04-fix-badge-case.md`
