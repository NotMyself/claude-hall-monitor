# Support

Thank you for using Claude Code Bun Hooks! This document outlines how to get help.

## Documentation

Before seeking support, please review the available documentation:

- **[README.md](README.md)** - Installation, quick start, and feature overview
- **[CLAUDE.md](CLAUDE.md)** - Architecture and development guidance
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute to the project

## Common Issues & Solutions

### Claude Hall Monitor won't start

**Symptoms:** Viewer doesn't launch automatically or shows connection errors.

**Solutions:**
1. Ensure Bun is installed: `bun --version`
2. Install dependencies: `cd .claude/hooks && bun install`
3. Check if port 3456 is available: `lsof -i :3456`
4. Start manually: `cd .claude/hooks && bun run viewer`

### Hooks not triggering

**Symptoms:** Claude Code runs but hooks don't fire.

**Solutions:**
1. Verify `.claude/settings.json` exists and contains hook configuration
2. Check that Bun is in your PATH
3. Run a hook manually to check for errors:
   ```bash
   echo '{}' | bun run .claude/hooks/handlers/session-start.ts
   ```

### Type checking fails

**Symptoms:** `bun run tsc --noEmit` shows errors.

**Solutions:**
1. Ensure dependencies are installed: `cd .claude/hooks && bun install`
2. Check TypeScript version: `bun run tsc --version`
3. Clear Bun's cache: `bun pm cache rm`

### Tests failing

**Symptoms:** `bun run test:run` shows failures.

**Solutions:**
1. Update dependencies: `cd .claude/hooks && bun install`
2. Clear test cache: `bun run test:run --clearCache`
3. Run specific test file: `bun run test:run viewer/__tests__/components.test.ts`

## Getting Help

### 1. Search Existing Issues

Before creating a new issue, [search existing issues](../../issues) to see if your question has been answered.

### 2. GitHub Discussions

For general questions, ideas, or help with usage:
- [Start a discussion](../../discussions)
- Browse existing discussions for similar topics

### 3. Bug Reports

If you've found a bug:
1. [Create a new issue](../../issues/new?template=bug_report.yml)
2. Include environment details (OS, Bun version, Claude Code version)
3. Provide steps to reproduce
4. Include relevant log output

### 4. Feature Requests

Have an idea for improvement?
1. [Create a feature request](../../issues/new?template=feature_request.yml)
2. Describe the problem you're trying to solve
3. Explain your proposed solution

## Support Expectations

This is a community-maintained project. Please set appropriate expectations:

| Request Type | Typical Response Time |
|--------------|----------------------|
| Bug reports (critical) | 1-3 days |
| Bug reports (normal) | 3-7 days |
| Feature requests | Varies |
| General questions | 3-7 days |

## Community Guidelines

When seeking help:

- **Be respectful** - Treat others as you'd like to be treated
- **Be specific** - Include error messages, versions, and steps to reproduce
- **Be patient** - Maintainers are volunteers
- **Be constructive** - Focus on solutions, not just problems

## Supported Environments

| Environment | Support Level |
|-------------|---------------|
| Windows 11 + Bun | Full support |
| macOS + Bun | Community support |
| Linux + Bun | Community support |
| Claude Code CLI | Full support |
| Claude Code VSCode Extension | Full support |

## Contributing

The best way to get support is to become part of the community! See [CONTRIBUTING.md](CONTRIBUTING.md) for how to:

- Report bugs effectively
- Submit pull requests
- Improve documentation
- Help other users
