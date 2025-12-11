# Global Constraints for All Agents

These constraints apply to every feature implementation. Agents MUST follow these rules without exception.

## Code Quality

1. **It is unacceptable to remove or edit existing tests** - this could lead to missing or buggy functionality
2. **It is unacceptable to implement features beyond the scope of the current task** - focus on ONE feature only
3. **It is unacceptable to leave code in a broken state** - all code must compile and pass existing tests before committing
4. **It is unacceptable to skip type safety** - use TypeScript strict mode, no `any` types unless absolutely necessary

## Git Discipline

5. **Commit after completing each feature** - use conventional commit format: `feat(viewer): description`
6. **Never commit broken code** - run verification before committing
7. **Write descriptive commit messages** - explain what was added/changed and why

## File Organization

8. **All viewer files go in `.claude/hooks/viewer/`** - maintain the established directory structure
9. **Follow existing code patterns** - match the style of `session-start.ts` and other hook files
10. **Use relative imports within viewer/** - e.g., `import { config } from './config'`

## Implementation Standards

11. **Use Bun APIs** - this project uses Bun, not Node.js
12. **Follow the existing logger pattern** - use structured JSONL logging where appropriate
13. **No external dependencies without approval** - only use deps listed in the feature requirements
14. **Preserve existing functionality** - modifications to existing files must not break current behavior

## Testing Requirements

15. **Write tests for new code** - when specified in the feature requirements
16. **Run type checking before committing** - `bun run tsc --noEmit`
17. **Verify the feature works** - run the verification command specified in each prompt

## Documentation

18. **Add JSDoc comments to exported functions** - follow existing patterns
19. **Update types.ts when adding new interfaces** - keep type definitions centralized
20. **Do not create README files** - unless explicitly requested

## Error Handling

21. **Handle errors gracefully** - never crash the server on recoverable errors
22. **Log errors with context** - include relevant data for debugging
23. **Provide user feedback** - errors visible in UI should be human-readable

## Security

24. **No secrets in code** - never hardcode API keys, passwords, or sensitive data
25. **Validate user input** - sanitize data from external sources
26. **Use safe file operations** - prevent path traversal attacks

## Progress Tracking

27. **Update features.json after completing each feature** - set status to `completed`
28. **Mark failed features** - if a feature cannot be completed, set status to `failed` with a reason
29. **Document blockers** - if stuck, note the issue in the commit message

## MCP Tools Available

30. **Use Playwright MCP for browser testing** - available tools include `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_take_screenshot`, `browser_console_messages`, `browser_close`
31. **Prefer automated browser testing over manual** - use Playwright MCP in feature 22 for E2E validation
32. **Use Context7 MCP for documentation** - `resolve-library-id` and `get-library-docs` available for Vue, Vitest, Bun docs
33. **Localhost avoids bot protection** - Playwright works reliably on localhost:3456 (no Cloudflare challenges)
