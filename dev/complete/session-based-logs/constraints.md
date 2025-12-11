# Global Constraints for All Agents

## Code Style
- Use TypeScript with strict mode
- Use Bun APIs (not Node.js fs where Bun equivalents exist)
- Follow existing patterns in the codebase
- No emojis in code or comments

## Implementation Rules
- ONE feature per session - do not implement beyond scope
- Read the target file before editing
- Use `as const` for configuration objects
- Export types and constants that may be needed elsewhere

## Error Handling
- Handle missing files gracefully (log directory may not exist)
- Use `{ recursive: true }` for mkdir operations
- Silent skip for invalid JSONL lines (existing pattern)

## Testing
- Type-check with: `cd .claude/hooks && bun run tsc --noEmit`
- Run tests with: `cd .claude/hooks && bun run test:run`

## Git Protocol
- Commit after each feature with: `feat(hooks): <description>`
- Do not push until all features complete

## Available MCP Tools
- Playwright: browser_navigate, browser_snapshot, browser_click for E2E
- Context7: resolve-library-id, get-library-docs for docs lookup
