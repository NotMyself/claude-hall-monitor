# Feature: F02 - Reverse Log Entry Order

## Context

F01 (Theme Toggle Fix) has been completed. The theme toggle now has proper text contrast.

## Objective

Display log entries in reverse chronological order so newest entries appear first at the top of the list.

**IMPORTANT**: It is unacceptable to implement features beyond the scope of this task.

## Constraints

- Reference: See `constraints.md` for global rules
- Only modify `.claude/hooks/viewer/index.html`
- Only change the `filteredEntries` computed property and scroll behavior

## Files to Modify

- `.claude/hooks/viewer/index.html` (LogViewer component, ~line 621)

## Implementation Details

### 1. Update filteredEntries computed property

In the `log-viewer` component, find the `filteredEntries` computed property and add `.slice().reverse()` at the end of the filter chain:

```javascript
filteredEntries() {
  return this.entries.filter(entry => {
    // existing filter logic
  }).slice().reverse();
}
```

The `.slice()` creates a copy so we don't mutate the original array.

### 2. Update scroll behavior

Find the `scrollToBottom` method and rename it to `scrollToTop`. Update the implementation:

```javascript
scrollToTop() {
  this.$nextTick(() => {
    const container = this.$refs.logContainer;
    if (container) {
      container.scrollTop = 0;
    }
  });
}
```

Update any calls to `scrollToBottom` to use `scrollToTop` instead.

## Acceptance Criteria

- [ ] `filteredEntries` returns entries in reverse chronological order
- [ ] Newest entries appear at the top of the list
- [ ] `scrollToBottom` renamed to `scrollToTop`
- [ ] New entries trigger scroll to top (not bottom)
- [ ] All existing tests pass

## Verification

```bash
cd .claude/hooks && bun run test:run
```

Then visually verify using Playwright:
1. Navigate to http://localhost:3456
2. Observe the log order - newest should be at top
3. If entries exist, verify timestamps decrease going down the list

## Commit

```bash
git add .claude/hooks/viewer/index.html
git commit -m "$(cat <<'EOF'
feat(viewer): reverse log entry order to show newest first

- Add .slice().reverse() to filteredEntries computed property
- Rename scrollToBottom to scrollToTop for new entry handling

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/03-event-summaries.md`
