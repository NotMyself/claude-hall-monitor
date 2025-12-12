# Global Constraints for Dashboard Implementation

## Scope Rules

**CRITICAL**: Each prompt implements exactly ONE feature. It is unacceptable to implement features beyond the scope of the current task.

## Code Style

- Follow existing patterns in the codebase
- Use TypeScript strict mode
- Use `as const` for configuration objects
- Export types from `types.ts`, not inline
- Use async/await, not callbacks
- Handle errors gracefully with try/catch

## File Conventions

- Hooks directory: `.claude/hooks/`
- Viewer files: `.claude/hooks/viewer/`
- Handler files: `.claude/hooks/handlers/`
- Utility files: `.claude/hooks/utils/`
- Test files: `.claude/hooks/viewer/__tests__/`

## Import Patterns

```typescript
// Node.js APIs
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve, basename } from "node:path";

// Local types
import type { DashboardData, SessionInfo } from "./types";

// Local modules
import { PATHS, DASHBOARD_CONFIG } from "./config";
```

## Type Safety

- All new interfaces go in `viewer/types.ts`
- Use `Record<string, T>` for dynamic keys
- Use optional properties (`?`) appropriately
- Export all types needed by other modules

## Configuration

- New paths go in `PATHS` object in `config.ts`
- New timing constants go in appropriate config object
- Use environment variables for user-specific paths (USERPROFILE, HOME)

## Logging

- Use existing `log()` function from `utils/logger.ts`
- Event names should be PascalCase (e.g., "Heartbeat")
- Include session_id in all log entries
- Log data should be JSON-serializable

## Vue Components

- Components defined inline in `index.html`
- Use Vue 3 Composition API patterns
- Use `ref()` for reactive state
- Use `watch()` for side effects
- Clean up intervals/subscriptions on unmount

## CSS Styling

- Use CSS variables from existing theme
- Support both light and dark themes
- Use `[data-theme="dark"]` selector for dark overrides
- Follow existing class naming conventions

## API Endpoints

- RESTful naming: `/api/dashboard`, `/api/config`
- Return JSON with `Response.json()`
- Handle errors with appropriate status codes
- Use GET for read-only operations

## Testing

- Use Vitest for unit tests
- Use happy-dom for browser API mocking
- Test files named `*.test.ts`
- Co-locate tests in `__tests__/` directory

## Git Commits

- Use conventional commits: `feat(dashboard): description`
- One commit per feature
- Include all modified files in commit

## MCP Tools Available

For documentation lookup:
- `resolve-library-id` - Find library ID for docs
- `get-library-docs` - Fetch library documentation

For E2E testing:
- `browser_navigate` - Navigate to URL
- `browser_snapshot` - Get accessibility snapshot
- `browser_click` - Click elements
- `browser_type` - Type into inputs
- `browser_take_screenshot` - Capture screenshot
- `browser_console_messages` - Check for errors

## Windows Compatibility

- Use `path.join()` for path construction
- Handle both USERPROFILE and HOME environment variables
- Use forward slashes in URLs, path module for file paths
