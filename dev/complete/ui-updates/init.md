# Initializer: Project Setup Verification

## Objective

Verify the development environment is ready for implementing UI improvements to the Claude Code hooks viewer.

## Pre-flight Checks

### 1. Verify Working Directory
```bash
pwd
# Should be in: claude-bun-win11-hooks
```

### 2. Check Dependencies
```bash
cd .claude/hooks && bun install
```

### 3. Verify Current Tests Pass
```bash
cd .claude/hooks && bun run test:run
```

### 4. Start the Viewer (if not running)
```bash
cd .claude/hooks && bun run viewer &
```

### 5. Verify Viewer is Accessible
Navigate to http://localhost:3456 and confirm the viewer loads.

## Files to Review

Read these files to understand the current implementation:

1. `.claude/hooks/viewer/index.html` - Main Vue application
2. `.claude/hooks/viewer/styles/theme.css` - Current styling
3. `.claude/hooks/viewer/__tests__/components.test.ts` - Existing tests

## Understanding the Codebase

The viewer is a single-file Vue.js application with these key components:

- `theme-toggle` - Toggles light/dark mode
- `filter-bar` - Contains search, session selector, event filters
- `session-selector` - Dropdown for session filtering
- `log-entry` - Individual log entry card (expandable)
- `log-viewer` - Main container managing entries and SSE connection

CSS uses custom properties (CSS variables) for theming. See `constraints.md` for the variable reference.

## Acceptance Criteria

- [ ] Dependencies installed successfully
- [ ] All existing tests pass
- [ ] Viewer accessible at http://localhost:3456
- [ ] Understood component structure in index.html

## Commit

No commit needed for initialization - this is verification only.

## Next

Proceed to: `prompts/01-theme-toggle-fix.md`
