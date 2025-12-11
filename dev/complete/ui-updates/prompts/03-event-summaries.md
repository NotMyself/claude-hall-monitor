# Feature: F03 - Event-Specific Collapsed Display

## Context

F01 (Theme Toggle Fix) and F02 (Reverse Log Order) are complete. The viewer now shows newest entries first with proper theme contrast.

## Objective

Add contextual summaries to collapsed log entries that show relevant information based on the event type.

**IMPORTANT**: It is unacceptable to implement features beyond the scope of this task.

## Constraints

- Reference: See `constraints.md` for global rules
- Only modify the files listed below
- Summary should be truncated with ellipsis if too long

## Files to Modify

- `.claude/hooks/viewer/index.html` (log-entry component, ~lines 463-541)
- `.claude/hooks/viewer/styles/theme.css` (add .entry-summary class)

## Implementation Details

### 1. Add getSummary method to log-entry component

In the `log-entry` component's methods, add:

```javascript
getSummary(entry) {
  const data = entry.data || {};
  const truncate = (str, len = 50) =>
    str && str.length > len ? str.substring(0, len) + '...' : str;

  switch (entry.event) {
    case 'UserPromptSubmit':
      return truncate(data.prompt || data.message || '');
    case 'PreToolUse':
      return data.tool_name || data.toolName || '';
    case 'PostToolUse':
      const toolName = data.tool_name || data.toolName || '';
      const success = data.error ? '✗' : '✓';
      return `${toolName} ${success}`;
    case 'PostToolUseFailure':
      const failedTool = data.tool_name || data.toolName || '';
      const errorMsg = truncate(data.error || '', 30);
      return `${failedTool} - ${errorMsg}`;
    case 'SessionStart':
    case 'SessionEnd':
      return `Session: ${truncate(entry.session_id || '', 20)}`;
    case 'SubagentStart':
    case 'SubagentStop':
      return data.subagent_type || data.type || '';
    case 'Notification':
      return truncate(data.message || data.notification || '');
    case 'PermissionRequest':
      return data.permission_type || data.permission || '';
    case 'PreCompact':
      return truncate(data.reason || 'Context compaction');
    case 'Stop':
      return truncate(data.reason || 'User interrupt');
    default:
      return '';
  }
}
```

### 2. Update card-header template

In the `log-entry` template, add the summary between the badge and expand icon:

```html
<div class="card-header" @click="toggle">
  <span class="event-badge" :class="badgeClass">{{ entry.event }}</span>
  <span class="entry-summary">{{ getSummary(entry) }}</span>
  <span class="expand-icon">{{ expanded ? '▼' : '▶' }}</span>
</div>
```

### 3. Add CSS for entry-summary

In `theme.css`, add:

```css
.entry-summary {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 0.85em;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 var(--spacing-sm);
}
```

## Acceptance Criteria

- [ ] `getSummary(entry)` method implemented with logic for all 12 event types
- [ ] UserPromptSubmit shows truncated prompt text
- [ ] PreToolUse shows tool name
- [ ] PostToolUse shows tool name + ✓ or ✗
- [ ] PostToolUseFailure shows tool name + error snippet
- [ ] SessionStart/End shows session ID
- [ ] SubagentStart/Stop shows subagent type
- [ ] Notification shows message
- [ ] PermissionRequest shows permission type
- [ ] PreCompact shows compaction reason
- [ ] Stop shows stop reason
- [ ] Summary displayed in card-header with proper styling
- [ ] Long summaries truncate with ellipsis
- [ ] All existing tests pass

## Verification

```bash
cd .claude/hooks && bun run test:run
```

Then visually verify using Playwright:
1. Navigate to http://localhost:3456
2. Look at collapsed log entries
3. Verify each entry type shows appropriate summary
4. Verify long text is truncated with ellipsis

## Commit

```bash
git add .claude/hooks/viewer/index.html .claude/hooks/viewer/styles/theme.css
git commit -m "$(cat <<'EOF'
feat(viewer): add event-specific summaries to collapsed log entries

- Add getSummary() method with logic for all 12 event types
- Display summary in card-header between badge and expand icon
- Add .entry-summary CSS with ellipsis overflow

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/04-json-syntax-highlighting.md`
