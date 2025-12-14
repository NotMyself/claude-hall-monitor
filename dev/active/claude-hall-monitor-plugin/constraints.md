# Global Constraints

## Project Context

See `context.md` for the feature summary and architectural vision.

## Architectural Decisions

See `decisions.md` before making implementation choices. Reference decision IDs in commit messages when relevant:
- **D001**: Rename repo to `claude-hall-monitor`
- **D002**: Bundle to JavaScript (not distribute TypeScript)
- **D003**: Semantic versioning starting at 1.0.0
- **D004**: Keep a Changelog format
- **D005**: GitHub Actions for CI/CD
- **D006**: Zip archive for releases
- **D007**: Use `${CLAUDE_PLUGIN_ROOT}` in hook commands

## Edge Cases

See `edge-cases.md` for cases that span multiple features:
- **EC001**: Cross-platform path handling
- **EC002**: Bun runtime prerequisite
- **EC003**: Build failure handling
- **EC004**: Plugin variable expansion
- **EC005**: Version sync validation
- **EC006**: Viewer port conflicts

## Code Patterns

See `code/` directory for reusable code samples:
- `code/typescript.md` - Types, build scripts, testing patterns
- `code/json.md` - Plugin manifest, hooks config, package.json
- `code/yaml.md` - GitHub Actions workflows
- `code/bash.md` - Shell commands for build/test/release

## Testing Philosophy

See `testing-strategy.md` for the holistic testing approach:
- Unit tests with Vitest
- Build verification
- E2E testing
- Cross-platform CI

## MCP Tools (if available)

These tools may be available to assist implementation. Check availability before use.

- **Playwright MCP** (optional): `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_take_screenshot`, `browser_console_messages` for E2E testing. Use `host.docker.internal` instead of `localhost` for local servers.
- **Context7 MCP** (optional): `resolve-library-id`, `get-library-docs` for fetching up-to-date library documentation.
- **Documentation MCP** (optional): Search Microsoft/Azure docs for official guidance.

## Rules

1. **One feature per session** - Do not implement beyond the scope of the current prompt
2. **Commit after each feature** - Create atomic commits with feature ID references
3. **Run verification before marking complete** - Execute the verification command in each prompt
4. **Reference decision IDs** - When implementing code related to a decision, mention it
5. **Follow code patterns** - Use patterns from the `code/` directory for consistency
6. **Cross-platform paths** - Always use `node:path` join() for path construction
7. **Test on all platforms** - CI runs on ubuntu, windows, macos

## File Naming Conventions

- Hook handlers: `kebab-case.ts` (e.g., `session-start.ts`)
- Bundled output: Same name with `.js` extension
- Workflow files: `kebab-case.yml` (e.g., `ci.yml`, `release.yml`)
- Test files: `*.test.ts`

## Commit Message Format

```
<type>(<scope>): <description>

Implements: <feature-id>
Decisions: <decision-ids>
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`

Example:
```
feat(build): add TypeScript bundling with Bun

Implements: F003
Decisions: D002
```

## Version Sync Requirement

All three files must have matching versions:
- `.claude-plugin/plugin.json`
- `hooks/package.json`
- `CHANGELOG.md`

CI validates this before releases.

## Security Considerations

- Never commit secrets or credentials
- Viewer binds to localhost only
- Validate all file paths to prevent traversal
- Use HTTPS for external resources
