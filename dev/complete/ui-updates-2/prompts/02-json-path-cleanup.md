# Feature: UI-002 - Clean Up JSON Display Paths

## Context
Prior completed: UI-001 (copy button visibility)

The log viewer displays JSON data in expanded log entries. Currently, paths are shown with:
- Full Windows paths like `C:\\Users\\BobbyJohnson\\...`
- Double backslashes for escaping

Users want cleaner, more readable paths.

## Objective
Add a path cleanup function that:
1. Replaces the home directory with `~`
2. Converts backslashes to forward slashes for readability

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- Only modify the `log-entry` component in index.html
- Add a new `cleanupPaths` method
- Update the `highlightedJson` computed property to use it
- Do not modify the `syntaxHighlight` method logic
- Preserve existing JSON formatting and syntax highlighting

## Files to Modify
- `.claude/hooks/viewer/index.html` - Add cleanupPaths method to log-entry component (around lines 605-636)

## Implementation Details

In the `log-entry` component's `methods` section (around line 609), add this new method:

```javascript
cleanupPaths(json) {
  // Replace Windows home directory with ~
  const homeDir = 'C:\\\\Users\\\\BobbyJohnson';
  json = json.replace(new RegExp(homeDir, 'g'), '~');

  // Convert double backslashes to forward slashes
  json = json.replace(/\\\\/g, '/');

  return json;
},
```

Update the `highlightedJson` computed property (around line 605):

```javascript
highlightedJson() {
  let json = JSON.stringify(this.entry.data, null, 2);
  json = this.cleanupPaths(json);
  return this.syntaxHighlight(json);
},
```

## Acceptance Criteria
- [ ] New `cleanupPaths` method exists in log-entry component
- [ ] Home directory `C:\Users\BobbyJohnson` displays as `~`
- [ ] Backslashes display as forward slashes
- [ ] JSON formatting is preserved (indentation, newlines)
- [ ] Syntax highlighting still works correctly
- [ ] `highlightedJson` calls `cleanupPaths` before `syntaxHighlight`

## Verification

Start the viewer and use Playwright to verify:

```bash
cd .claude/hooks && bun run viewer
```

Then use Playwright MCP:
1. `browser_navigate` to `http://host.docker.internal:3456`
2. Click on a log entry to expand it
3. `browser_evaluate` to get the text content of `.json-content`
4. Verify paths show `~/` prefix instead of full home directory
5. Verify backslashes are now forward slashes

## Commit

```bash
git add .claude/hooks/viewer/index.html
git commit -m "feat(viewer): clean up JSON path display

- Add cleanupPaths method to log-entry component
- Replace home directory with ~ prefix
- Convert backslashes to forward slashes for readability

Feature: UI-002"
```

## Next
Proceed to: `03-session-dropdown-position.md`
