# Global Constraints

## Project Context

See `context.md` for the feature summary and architectural vision.

## Architectural Decisions

See `decisions.md` before making implementation choices. Reference decision IDs in commit messages when relevant.

## Edge Cases

See `edge-cases.md` for cases that may span multiple features. Each prompt lists its relevant edge cases.

## Code Patterns

See `code/` directory for reusable code samples organized by language. Each prompt references specific sections:
- Read the referenced code sections before implementing
- Follow the established patterns for consistency
- Code is organized by progressive disclosure (simple to complex)

## Testing Philosophy

See `testing-strategy.md` for the holistic testing approach.

## Rules

### Scope Management
- **One feature per session** - Do not implement beyond the scope defined in each prompt
- Complete the feature fully before moving to the next
- If you discover additional issues, note them but don't fix them

### Code Quality
- Run type checking after each change: `bun run tsc --noEmit`
- Maintain existing code style and patterns
- Use `join()` from `node:path` for all file paths (cross-platform)
- Add JSDoc comments for new functions

### Security
- Never log sensitive data (tokens, passwords, API keys)
- Validate all user inputs before use
- Use the security utilities from `viewer/security.ts`
- Test security fixes with both valid and malicious inputs

### Error Handling
- Never swallow errors silently - at minimum use `console.error()`
- Handlers must always output valid JSON, even on errors
- Use safe defaults when errors occur

### Git Workflow
- Commit after each feature with descriptive message
- Reference feature ID and decision IDs in commit message
- Run verification command before committing

### File Modifications
- Prefer editing existing files over creating new ones
- Only create new files when explicitly specified in the prompt
- Keep changes minimal and focused on the feature

## Cross-Platform Compatibility

This project runs on Windows with Bun. Follow these conventions:

### Path Handling
```typescript
import { join } from "node:path";

// Good - works on all platforms
const filePath = join(baseDir, "subdir", "file.ts");

// Bad - breaks on Windows
const filePath = `${baseDir}/subdir/file.ts`;
```

### Background Processes
Use PowerShell on Windows for reliable background process spawning:
```typescript
const cmd = process.platform === "win32"
  ? ["powershell", "-NoProfile", "-Command", `Start-Process ...`]
  : ["sh", "-c", `command &`];
```

## Working Directory

All commands run from `.claude/hooks` directory unless otherwise specified:
```bash
cd .claude/hooks
bun run tsc --noEmit
bun run test:run
```

## Commit Message Format

```
feat(viewer): add path traversal protection to styles endpoint

Implements: F004
Decisions: D003, D008
Edge cases: EC001, EC002
```
