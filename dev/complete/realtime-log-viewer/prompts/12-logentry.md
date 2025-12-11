# Feature: 12-logentry - LogEntry Component

## Context
Features 09-11 are complete. EventBadge, ThemeToggle, and FilterBar components exist.

## Objective
Create the LogEntry Vue component that displays a single log entry as an expandable card.

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- Use EventBadge component for event type display
- Expandable to show JSON data
- Copy to clipboard functionality
- Pretty-print JSON with indentation

## Files to Create/Modify
- `.claude/hooks/viewer/index.html` - Add LogEntry component registration

## Implementation Details

```javascript
// ===== LogEntry Component =====
app.component('log-entry', {
  props: {
    entry: {
      type: Object,
      required: true,
    },
  },
  template: `
    <div class="card log-entry" :class="{ expanded: isExpanded }">
      <div class="card-header" @click="toggle">
        <span class="timestamp">{{ formatTime(entry.timestamp) }}</span>
        <event-badge :event="entry.event"></event-badge>
        <span class="session-id" :title="entry.session_id">
          {{ truncateId(entry.session_id) }}
        </span>
        <span class="expand-icon">{{ isExpanded ? '▼' : '▶' }}</span>
      </div>

      <div v-if="isExpanded" class="card-content">
        <div class="json-header">
          <span>Data</span>
          <button class="copy-btn" @click.stop="copyJson">
            {{ copied ? '✓ Copied' : '📋 Copy' }}
          </button>
        </div>
        <pre class="json-view">{{ formattedJson }}</pre>
      </div>
    </div>
  `,
  data() {
    return {
      isExpanded: false,
      copied: false,
    };
  },
  computed: {
    formattedJson() {
      try {
        return JSON.stringify(this.entry.data, null, 2);
      } catch {
        return String(this.entry.data);
      }
    },
  },
  methods: {
    toggle() {
      this.isExpanded = !this.isExpanded;
    },
    formatTime(iso) {
      try {
        const date = new Date(iso);
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
      } catch {
        return iso;
      }
    },
    truncateId(id) {
      if (!id || id.length <= 12) return id;
      return id.substring(0, 8) + '...';
    },
    async copyJson() {
      try {
        const fullEntry = JSON.stringify(this.entry, null, 2);
        await navigator.clipboard.writeText(fullEntry);
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    },
  },
});
```

### Additional CSS (add to theme.css or inline styles)

```css
.log-entry .card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.log-entry .expand-icon {
  margin-left: auto;
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.log-entry .json-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.log-entry.expanded {
  border-color: var(--primary);
}
```

## Acceptance Criteria
- [ ] Component registered as 'log-entry'
- [ ] Accepts `entry` prop with LogEntry object
- [ ] Displays formatted timestamp (HH:MM:SS)
- [ ] Uses EventBadge for event type
- [ ] Shows truncated session ID with full ID on hover (title)
- [ ] Click header to expand/collapse
- [ ] Expand icon shows ▶ when collapsed, ▼ when expanded
- [ ] Expanded view shows pretty-printed JSON data
- [ ] Copy button copies full entry JSON to clipboard
- [ ] Copy button shows "✓ Copied" feedback for 2 seconds
- [ ] Visual indication of expanded state (border color)

## Verification
```bash
grep -q "app.component('log-entry'" .claude/hooks/viewer/index.html && echo "LogEntry registered"
grep -q "<event-badge" .claude/hooks/viewer/index.html && echo "EventBadge used"
grep -q "navigator.clipboard" .claude/hooks/viewer/index.html && echo "Clipboard API found"
grep -q "JSON.stringify" .claude/hooks/viewer/index.html && echo "JSON formatting found"
```

## Commit
After verification passes:
```bash
git add .claude/hooks/viewer/index.html
git commit -m "feat(viewer): add LogEntry component

- Expandable card showing log entry details
- EventBadge for event type display
- Formatted timestamp and truncated session ID
- Pretty-printed JSON data view
- Copy to clipboard with feedback"
```

## Next
Proceed to: `prompts/13-logviewer.md`
