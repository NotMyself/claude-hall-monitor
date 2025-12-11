# Global Constraints

These rules apply to ALL sub-agent implementation sessions.

## Scope Discipline

**CRITICAL**: It is unacceptable to implement features beyond the scope of the current task.

- Only modify files explicitly listed in the prompt
- Only implement the single feature assigned
- Do not refactor unrelated code
- Do not add "nice-to-have" improvements
- Do not add comments, docstrings, or type annotations to unchanged code

## Code Style

- Follow existing code patterns in the codebase
- Use CSS variables from `theme.css` for colors (e.g., `var(--text-primary)`)
- Vue components use Options API style (matching existing code)
- Keep functions small and focused
- No unused imports or dead code

## File Locations

- **HTML/Vue components**: `.claude/hooks/viewer/index.html`
- **CSS styles**: `.claude/hooks/viewer/styles/theme.css`
- **Tests**: `.claude/hooks/viewer/__tests__/components.test.ts`
- **Config**: `.claude/hooks/viewer/config.ts`
- **Types**: `.claude/hooks/viewer/types.ts`

## Testing Requirements

- Run `cd .claude/hooks && bun run test` after every change
- All existing tests must continue to pass
- New functionality requires new tests (added in F07)

## Git Protocol

- Commit after each feature is complete
- Use conventional commit format: `feat(viewer): description`
- Include all modified files in commit
- Commit message footer:
  ```
  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

## MCP Tools Available

### Playwright MCP (E2E Testing)
- `browser_navigate` - Navigate to URL
- `browser_snapshot` - Capture accessibility tree (preferred for interactions)
- `browser_click` - Click elements
- `browser_type` - Type into fields
- `browser_take_screenshot` - Visual verification
- `browser_console_messages` - Check for JS errors

### Context7 MCP (Documentation)
- `resolve-library-id` - Find library ID
- `get-library-docs` - Get library documentation

## CSS Variables Reference

```css
/* Colors (light/dark aware) */
--bg-primary: background color
--bg-secondary: secondary background
--text-primary: main text color
--text-secondary: muted text color
--border-color: border color
--accent-color: accent/highlight color

/* Spacing */
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px

/* Font */
--font-mono: monospace font stack
```

## Event Types Reference

All 12 hook event types:
1. UserPromptSubmit
2. PreToolUse
3. PostToolUse
4. PostToolUseFailure
5. SessionStart
6. SessionEnd
7. SubagentStart
8. SubagentStop
9. Notification
10. PermissionRequest
11. PreCompact
12. Stop
