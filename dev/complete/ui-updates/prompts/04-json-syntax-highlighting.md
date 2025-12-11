# Feature: F04 - JSON Syntax Highlighting

## Context

F01-F03 are complete. The viewer now has proper theme contrast, reverse log order, and event-specific summaries.

## Objective

Add syntax highlighting for JSON data displayed in expanded log entries, using VS Code-style colors.

**IMPORTANT**: It is unacceptable to implement features beyond the scope of this task.

## Constraints

- Reference: See `constraints.md` for global rules
- Only modify the files listed below
- Use regex-based highlighting (no external libraries)
- Colors must work in both light and dark themes

## Files to Modify

- `.claude/hooks/viewer/index.html` (log-entry component)
- `.claude/hooks/viewer/styles/theme.css` (add syntax highlighting classes)

## Implementation Details

### 1. Add syntaxHighlight method to log-entry component

```javascript
syntaxHighlight(json) {
  if (typeof json !== 'string') {
    json = JSON.stringify(json, null, 2);
  }
  // Escape HTML entities
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Apply syntax highlighting
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match) {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    }
  );
}
```

### 2. Add computed property for highlighted JSON

```javascript
computed: {
  // ... existing computed properties
  highlightedJson() {
    return this.syntaxHighlight(this.entry);
  }
}
```

### 3. Update template to use v-html

Change the JSON display from:
```html
<pre>{{ formattedJson }}</pre>
```

To:
```html
<pre class="json-content" v-html="highlightedJson"></pre>
```

### 4. Add CSS syntax highlighting classes

In `theme.css`, add these classes with colors for both themes:

```css
/* JSON Syntax Highlighting */
.json-content {
  font-family: var(--font-mono);
  font-size: 0.9em;
  line-height: 1.4;
}

/* Light theme colors (VS Code Light+) */
.json-key {
  color: #0451a5;
}

.json-string {
  color: #a31515;
}

.json-number {
  color: #098658;
}

.json-boolean {
  color: #0000ff;
}

.json-null {
  color: #0000ff;
}

/* Dark theme colors (VS Code Dark+) */
[data-theme="dark"] .json-key {
  color: #9cdcfe;
}

[data-theme="dark"] .json-string {
  color: #ce9178;
}

[data-theme="dark"] .json-number {
  color: #b5cea8;
}

[data-theme="dark"] .json-boolean {
  color: #569cd6;
}

[data-theme="dark"] .json-null {
  color: #569cd6;
}
```

## Acceptance Criteria

- [ ] `syntaxHighlight(json)` method implemented
- [ ] HTML entities properly escaped to prevent XSS
- [ ] JSON keys highlighted with `.json-key` class
- [ ] JSON strings highlighted with `.json-string` class
- [ ] JSON numbers highlighted with `.json-number` class
- [ ] JSON booleans highlighted with `.json-boolean` class
- [ ] JSON null values highlighted with `.json-null` class
- [ ] Template uses `v-html` with `highlightedJson`
- [ ] Colors work correctly in light mode (VS Code Light+ style)
- [ ] Colors work correctly in dark mode (VS Code Dark+ style)
- [ ] All existing tests pass

## Verification

```bash
cd .claude/hooks && bun run test:run
```

Then visually verify using Playwright:
1. Navigate to http://localhost:3456
2. Expand a log entry to view JSON data
3. Verify different JSON elements have different colors
4. Toggle theme and verify colors change appropriately
5. Take screenshots in both modes

## Commit

```bash
git add .claude/hooks/viewer/index.html .claude/hooks/viewer/styles/theme.css
git commit -m "$(cat <<'EOF'
feat(viewer): add JSON syntax highlighting for expanded entries

- Add syntaxHighlight() method with regex-based token detection
- Use v-html binding for highlighted JSON display
- Add VS Code-style colors for both light and dark themes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/05-event-filter-dropdown.md`
