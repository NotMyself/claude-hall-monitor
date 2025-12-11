# Feature: 09-eventbadge - EventBadge Component

## Context
Feature 08-html-skeleton is complete. The HTML file has Vue 3 setup and component registration placeholders.

## Objective
Create the EventBadge Vue component that displays a colored badge based on the hook event type.

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- Use Vue 3 Options API or Composition API (inline in HTML)
- Component receives `event` prop (HookEventType string)
- Use CSS classes from theme.css (badge-EventName)

## Files to Create/Modify
- `.claude/hooks/viewer/index.html` - Add EventBadge component registration

## Implementation Details

Add the component registration before `app.mount('#app')`:

```javascript
// ===== EventBadge Component =====
app.component('event-badge', {
  props: {
    event: {
      type: String,
      required: true,
    },
  },
  template: `
    <span class="event-badge" :class="badgeClass">
      {{ event }}
    </span>
  `,
  computed: {
    badgeClass() {
      return 'badge-' + this.event;
    },
  },
});
```

### Usage Example (for reference, not to implement yet)
```html
<event-badge event="SessionStart"></event-badge>
<event-badge event="PreToolUse"></event-badge>
<event-badge event="PostToolUseFailure"></event-badge>
```

### Supported Event Types
The component should work with all 12 event types:
- UserPromptSubmit (blue)
- PreToolUse (purple)
- PostToolUse (green)
- PostToolUseFailure (red)
- Notification (amber)
- SessionStart (cyan)
- SessionEnd (indigo)
- Stop (pink)
- SubagentStart (teal)
- SubagentStop (orange)
- PreCompact (violet)
- PermissionRequest (yellow)

## Acceptance Criteria
- [ ] Component registered as 'event-badge'
- [ ] Accepts `event` prop of type String
- [ ] Displays event name as text content
- [ ] Applies CSS class `badge-{eventName}` dynamically
- [ ] Uses the .event-badge base class from theme.css
- [ ] Works with all 12 event types

## Verification
```bash
grep -q "app.component('event-badge'" .claude/hooks/viewer/index.html && echo "EventBadge registered"
grep -q "badge-.*this.event" .claude/hooks/viewer/index.html && echo "Dynamic badge class found"
```

## Commit
After verification passes:
```bash
git add .claude/hooks/viewer/index.html
git commit -m "feat(viewer): add EventBadge component

- Displays hook event type as colored badge
- Dynamic CSS class based on event type
- Supports all 12 hook event types"
```

## Next
Proceed to: `prompts/10-themetoggle.md`
