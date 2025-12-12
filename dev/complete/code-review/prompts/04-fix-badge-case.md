# Feature: F04 - Fix Badge Class Case Mismatch

## Context
F01-F03 completed: High priority UI fixes done.

## Objective
Fix the badge class name generation to match the PascalCase CSS classes defined in `theme.css`.

## Constraints
- Reference: See `constraints.md` for global rules
- Only modify the class binding in the event-filter-dropdown template
- CSS classes use PascalCase: `.badge-SessionStart`, `.badge-PreToolUse`, etc.

## Files to Modify
- `.claude/hooks/viewer/index.html` - Remove `.toLowerCase()` call (~line 494)

## Implementation Details

Current code (around line 494):
```html
<span class="event-badge" :class="'badge-' + event.toLowerCase()">
```

Updated code:
```html
<span class="event-badge" :class="'badge-' + event">
```

CSS classes in `theme.css` (lines 47-58) use PascalCase:
```css
.badge-UserPromptSubmit { ... }
.badge-PreToolUse { ... }
.badge-SessionStart { ... }
```

## Acceptance Criteria
- [ ] `.toLowerCase()` is removed from the class binding
- [ ] Badge classes now correctly match CSS (e.g., `badge-SessionStart` not `badge-sessionstart`)
- [ ] All event type badges display with correct colors
- [ ] Type checking passes: `bun run tsc --noEmit`
- [ ] All tests pass: `bun run test`

## Verification
```bash
cd .claude/hooks && bun run tsc --noEmit && bun run test:run
```

## Commit
```bash
git add .claude/hooks/viewer/index.html
git commit -m "fix(viewer): correct badge class case to match CSS"
```

## Next
Proceed to: `prompts/05-extract-magic-numbers.md`
