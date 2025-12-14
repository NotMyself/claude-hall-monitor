# Edge Cases

| ID | Case | Handling | Affected Features |
|----|------|----------|-------------------|
| EC001 | Cross-platform path handling (Windows backslashes vs Unix forward slashes) | Use `node:path` join() for all path construction; normalize paths to forward slashes for shell commands | F003, F004, F005 |
| EC002 | Bun runtime not installed on user machine | Document Bun as prerequisite; provide installation link in README; plugin.json declares runtime dependency | F000, F007 |
| EC003 | Build failures due to TypeScript errors | Run `tsc --noEmit` before bundling; CI catches errors before release | F003, F004, F005 |
| EC004 | Plugin variable `${CLAUDE_PLUGIN_ROOT}` not expanded at runtime | Test with actual plugin installation; document expected behavior; fall back to relative paths if not expanded | F006 |
| EC005 | Version mismatch between plugin.json, package.json, and CHANGELOG | Create version sync script; CI validates version consistency | F008 |
| EC006 | Viewer port 3456 already in use | Viewer already handles this with error message; document in troubleshooting | F005 |
| EC007 | Missing dependencies during build | Bun bundler inlines all dependencies; verify bundle is self-contained with no external imports | F003, F004 |
| EC008 | Existing .claude/hooks/ conflicts with plugin hooks | Document that plugin hooks merge with local hooks; explain precedence | F007 |
| EC009 | GitHub Actions fails on Windows runners | Test workflows on all three OS runners (ubuntu, windows, macos) | F009, F010 |
| EC010 | Zip archive extraction preserves permissions | Use GitHub's upload-artifact/download-artifact for consistent behavior; test on all platforms | F010 |

## Edge Case Details

### EC001: Cross-Platform Paths

**Problem**: Windows uses backslashes (`\`), Unix uses forward slashes (`/`). Path strings in code or configs may break on different platforms.

**Solution**:
```typescript
import { join } from "node:path";

// Always use join() for path construction
const handlerPath = join(rootDir, "dist", "handlers", "session-start.js");

// Normalize for shell commands (Windows cmd.exe has issues with backslashes)
function normalizePath(p: string): string {
  return p.replace(/\\/g, "/");
}
```

### EC002: Bun Not Installed

**Problem**: Plugin requires Bun runtime but user may not have it installed.

**Solution**:
1. Declare in plugin.json: `"runtime": "bun"`
2. README includes installation prerequisites
3. Hooks fail gracefully with clear error message

### EC004: Plugin Variable Expansion

**Problem**: If `${CLAUDE_PLUGIN_ROOT}` is not expanded, hooks will fail to find their scripts.

**Test Strategy**:
1. Unit test: Mock variable expansion
2. Integration test: Install plugin via marketplace, verify hooks execute
3. Fallback: Document manual path configuration if variable expansion fails

### EC005: Version Sync

**Problem**: Version declared in multiple files can drift.

**Files with version**:
- `.claude-plugin/plugin.json` - `version` field
- `hooks/package.json` - `version` field
- `CHANGELOG.md` - Header for each release

**Solution**: CI job validates all versions match before allowing release.
