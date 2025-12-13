# Contributing to Claude Code Bun Hooks

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) v1.0 or later
- Git
- VS Code (recommended)
- [Claude Code](https://claude.ai/code)

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/claude-bun-win11-hooks
   cd claude-bun-win11-hooks
   ```

3. Install dependencies:
   ```bash
   cd .claude/hooks && bun install
   ```

4. Verify setup:
   ```bash
   bun run tsc --noEmit  # Type check
   bun run test:run      # Run tests
   ```

## Project Structure

```
claude-bun-win11-hooks/
├── .claude/
│   ├── settings.json          # Hook configuration
│   ├── commands/              # Slash commands
│   └── hooks/
│       ├── handlers/          # Hook handler scripts (12 files)
│       ├── utils/             # Shared utilities
│       ├── viewer/            # Claude Hall Monitor web UI
│       │   ├── server.ts      # Bun HTTP server
│       │   ├── watcher.ts     # File watcher
│       │   ├── dashboard.ts   # Dashboard service
│       │   ├── index.html     # Vue.js single-file app
│       │   ├── config.ts      # Configuration
│       │   ├── types.ts       # TypeScript types
│       │   └── __tests__/     # Test files
│       └── logs/              # Log output directory
├── dev/                       # Development plans
│   ├── active/               # In-progress features
│   └── complete/             # Completed features
└── .devcontainer/            # GitHub Codespaces config
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

### 2. Make Changes

Follow these guidelines:

**TypeScript Code Style:**
- Use camelCase for variables and functions
- Use PascalCase for types, interfaces, and classes
- Use explicit types where clarity is needed
- Prefer `const` over `let`
- Use async/await over raw promises

**Example:**
```typescript
import type { PreToolUseInput } from "@anthropic-ai/claude-agent-sdk";

interface ToolResult {
  allowed: boolean;
  reason?: string;
}

async function validateTool(input: PreToolUseInput): Promise<ToolResult> {
  const { tool_name, tool_input } = input;

  if (tool_name === "Bash") {
    return { allowed: true };
  }

  return { allowed: false, reason: "Unknown tool" };
}
```

### 3. Write Tests

All new functionality should include tests:

**Unit Tests:**
- Create in `.claude/hooks/viewer/__tests__/`
- Name pattern: `feature-name.test.ts`
- Use Vitest with happy-dom for browser APIs

**Example:**
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("FeatureName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle valid input", () => {
    const result = processInput({ valid: true });
    expect(result).toBe(true);
  });

  it("should throw on invalid input", () => {
    expect(() => processInput(null)).toThrow();
  });
});
```

### 4. Run Tests

```bash
cd .claude/hooks

# Watch mode (development)
bun run test

# Single run
bun run test:run

# With coverage
bun run test:coverage
```

### 5. Type Check

```bash
cd .claude/hooks && bun run tsc --noEmit
```

### 6. Commit Changes

Use conventional commit messages:

```bash
git commit -m "feat: add new hook capability"
git commit -m "fix: resolve viewer connection issue"
git commit -m "docs: update README installation steps"
git commit -m "test: add unit tests for watcher"
git commit -m "refactor: simplify logger utility"
git commit -m "chore: update dependencies"
```

**Commit Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions/changes
- `refactor:` Code refactoring
- `style:` Formatting changes
- `chore:` Maintenance tasks

### 7. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## Pull Request Guidelines

### Before Submitting

- [ ] All tests pass (`bun run test:run`)
- [ ] Type check passes (`bun run tsc --noEmit`)
- [ ] Code follows the style guidelines
- [ ] New functionality includes tests
- [ ] Documentation is updated if needed
- [ ] No merge conflicts with main branch
- [ ] Commit messages are clear and follow conventions

### PR Description

Include:
- **Summary** of changes
- **Type** of change (bug fix, feature, etc.)
- **Testing** approach
- **Related issues** (if any)

## Code Review Process

1. Submit your pull request
2. Automated checks run (tests, type check)
3. Maintainer reviews code
4. Address any feedback
5. Once approved, maintainer merges PR

## Reporting Issues

### Bug Reports

Include:
- Bun version (`bun --version`)
- Operating system and version
- Claude Code version
- Steps to reproduce
- Expected vs actual behavior
- Error messages or logs

### Feature Requests

Include:
- Clear description of the feature
- Use case(s) / problem being solved
- Why it would be useful
- Potential implementation approach (optional)

## Areas to Contribute

### High Priority
- Additional test coverage
- Bug fixes
- Documentation improvements
- Cross-platform compatibility (macOS, Linux)

### Medium Priority
- New hook handler capabilities
- Viewer UI enhancements
- Performance optimizations
- Error message improvements

### Ideas for Features
- Additional log filtering options
- Export logs to different formats
- Hook execution metrics
- Custom hook templates

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discriminatory language
- Personal attacks
- Trolling or insulting comments
- Publishing others' private information

## Questions?

- Open an issue for discussion
- Check existing issues for related topics
- Review the [README](README.md) and [CLAUDE.md](CLAUDE.md)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
