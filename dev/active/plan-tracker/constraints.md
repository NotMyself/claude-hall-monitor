# Global Constraints for Plan Tracker Implementation

## Code Style

- Use TypeScript with strict type checking
- Follow existing patterns in the viewer codebase
- Use async/await for file operations
- Handle errors gracefully with try/catch

## Architecture

- Follow the existing viewer architecture patterns:
  - Types in `viewer/types.ts`
  - Config in `viewer/config.ts`
  - Services as classes (like `DashboardService`)
  - API endpoints in `server.ts`
  - Vue components inline in `index.html`

## File Watching

- Use polling-based watching (consistent with `LogFileWatcher`)
- Watch only `features.json` files, not entire directories
- Support both `dev/active/` and `dev/complete/` directories

## API Design

- REST endpoints return JSON
- SSE endpoints follow existing `/events` pattern
- Use consistent error response format

## Vue Components

- Use Vue 3 Composition API where practical
- Follow existing component patterns (Options API is acceptable)
- Use scoped CSS classes with `.plan-` prefix

## Testing

- Use Vitest for unit tests
- Mock file system operations in tests
- Follow existing test patterns in `__tests__/`

## Commit Messages

- Use conventional commits format: `feat(plan-tracker): description`
- Reference feature ID in commits when applicable

## Scope Limitations

- Do NOT modify hook handlers
- Do NOT change existing dashboard or log viewer functionality
- Focus only on adding the new Plans tab
