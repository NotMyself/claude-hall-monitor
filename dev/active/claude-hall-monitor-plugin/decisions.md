# Architectural Decisions

| ID | Decision | Rationale | Affected Features |
|----|----------|-----------|-------------------|
| D001 | Rename existing repo to `claude-hall-monitor` | Single repo for development and distribution simplifies maintenance; avoids syncing two repositories | F007 |
| D002 | Bundle TypeScript to standalone JavaScript | Eliminates `bun install` step for users; faster startup; inlined dependencies reduce failure points; still requires Bun runtime for execution | F003, F004, F005 |
| D003 | Start at semantic version 1.0.0 | Industry standard versioning; signals production-ready initial release; MAJOR.MINOR.PATCH allows clear communication of change impact | F008 |
| D004 | Use Keep a Changelog format | Standard format widely recognized; categories (Added, Changed, Fixed, etc.) make changes scannable; links to comparison views | F008 |
| D005 | GitHub Actions for CI/CD | Native integration with GitHub; free for public repos; workflow files version-controlled with code | F009, F010 |
| D006 | Zip archive for releases | Universal format; easy to download and extract; GitHub releases support zip attachments natively | F010 |
| D007 | Use `${CLAUDE_PLUGIN_ROOT}` in hook commands | Standard pattern from claude-dotnet-marketplace; expanded at runtime to plugin install location; enables portable paths | F002, F006 |

## Decision Details

### D001: Repository Strategy

**Context**: The project currently lives at `bobby/claude-bun-win11-hooks`. For plugin distribution, a cleaner name is needed.

**Options Considered**:
1. Create new repo `claude-hall-monitor`, maintain both
2. Rename existing repo, use for both dev and distribution
3. Fork existing repo with new name

**Choice**: Option 2 - Rename existing repo

**Consequences**:
- Git history preserved
- Existing forks/clones will break (acceptable for this project)
- Simpler maintenance with single source of truth

### D002: Build Strategy

**Context**: Plugin needs to work on user machines without running `bun install`.

**Options Considered**:
1. Distribute TypeScript source, require users to build
2. Bundle to JavaScript with inlined dependencies
3. Publish to npm, use npm install

**Choice**: Option 2 - Bundle to JavaScript

**Consequences**:
- Larger distribution size (dependencies inlined)
- No runtime dependency resolution needed
- Bun still required as runtime (not bundled)
- Build step added to development workflow

### D007: Plugin Path Variables

**Context**: Hook commands need to reference files within the plugin directory, but the install location varies per user.

**Pattern**: `bun run ${CLAUDE_PLUGIN_ROOT}/dist/handlers/session-start.js`

**Expansion**: At runtime, `${CLAUDE_PLUGIN_ROOT}` becomes the absolute path to the plugin's install directory.

**Example**:
- Windows: `C:\Users\bobby\.claude\plugins\claude-hall-monitor`
- macOS: `/Users/bobby/.claude/plugins/claude-hall-monitor`
