# Feature: F01 - Theme Toggle Text Contrast Fix

## Context

This is the first implementation task. The project has been initialized and verified.

## Objective

Fix the theme toggle button so its text is visible in dark mode by adding the correct color CSS variable.

**IMPORTANT**: It is unacceptable to implement features beyond the scope of this task.

## Constraints

- Reference: See `constraints.md` for global rules
- Only modify `.claude/hooks/viewer/styles/theme.css`
- Only add color properties - do not restructure the CSS

## Files to Modify

- `.claude/hooks/viewer/styles/theme.css` (lines ~179-193) - Add color to theme toggle classes

## Implementation Details

Find the `.theme-toggle` and `.theme-label` classes in theme.css and add:

```css
color: var(--text-primary);
```

This ensures the text color follows the theme and is visible in both light and dark modes.

## Acceptance Criteria

- [ ] `.theme-toggle` class has `color: var(--text-primary)`
- [ ] `.theme-label` class has `color: var(--text-primary)`
- [ ] Theme toggle text is visible in dark mode
- [ ] Theme toggle text is visible in light mode
- [ ] All existing tests pass

## Verification

```bash
cd .claude/hooks && bun run test:run
```

Then visually verify using Playwright:
1. Navigate to http://localhost:3456
2. Take screenshot in light mode
3. Toggle theme to dark mode
4. Take screenshot in dark mode
5. Verify text is visible in both screenshots

## Commit

```bash
git add .claude/hooks/viewer/styles/theme.css
git commit -m "$(cat <<'EOF'
feat(viewer): fix theme toggle text contrast in dark mode

Add color: var(--text-primary) to theme toggle and label classes
so text is visible in both light and dark modes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/02-reverse-log-order.md`
