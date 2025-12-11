# Global Constraints

These rules apply to ALL feature implementations in this project.

## Scope Rules

1. **One Feature Per Session**: Each prompt implements exactly ONE feature. It is unacceptable to implement features beyond the scope of the current task.

2. **No Scope Creep**: Do not refactor, optimize, or "improve" code outside the feature scope.

3. **Minimal Changes**: Make the smallest change necessary to satisfy acceptance criteria.

## Code Standards

1. **Preserve Existing Patterns**: Match the existing code style in the file being modified.

2. **No New Dependencies**: Do not add npm packages or external libraries.

3. **CSS Variables**: Use existing CSS variables (e.g., `var(--text-primary)`) - do not hardcode colors.

4. **Vue.js Conventions**: Follow Vue 3 Options API patterns used in the existing codebase.

## File Locations

- **CSS**: `.claude/hooks/viewer/styles/theme.css`
- **HTML/Vue**: `.claude/hooks/viewer/index.html`
- **Server**: `.claude/hooks/viewer/server.ts`

## Testing

1. **Visual Verification**: Use Playwright MCP for visual testing
2. **Start Server**: `cd .claude/hooks && bun run viewer`
3. **Server URL**: `http://localhost:3456` (or `http://host.docker.internal:3456` from Docker)

## MCP Tools Available

### Playwright MCP (for E2E testing)
- `browser_navigate` - Navigate to URL
- `browser_snapshot` - Get accessibility tree
- `browser_click` - Click elements
- `browser_type` - Type text
- `browser_take_screenshot` - Capture screenshot
- `browser_console_messages` - Get console logs
- `browser_evaluate` - Run JavaScript in browser

### Context7 MCP (for documentation)
- `resolve-library-id` - Find library ID
- `get-library-docs` - Get library documentation

## Git Workflow

1. Stage only files related to the current feature
2. Use conventional commit format: `feat(viewer): description`
3. Include feature ID in commit body
4. Do NOT push - commits are local only
