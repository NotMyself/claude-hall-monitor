# Feature: 21-package-json - Package.json Updates

## Context
Feature 20-session-start is complete. All code is written.

## Objective
Update package.json with scripts and dependencies for the viewer and testing.

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- Add only necessary dependencies
- Use workspace-compatible versions
- Don't remove existing scripts/dependencies

## Files to Create/Modify
- `.claude/hooks/package.json` - Add scripts and devDependencies

## Implementation Details

### Scripts to Add

```json
{
  "scripts": {
    "viewer": "bun run viewer/server.ts",
    "viewer:dev": "bun --watch run viewer/server.ts",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### DevDependencies to Add

```json
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vue/test-utils": "^2.4.0",
    "happy-dom": "^15.0.0",
    "@vitest/coverage-v8": "^2.0.0"
  }
}
```

### Full package.json Example

The final package.json should look something like this (preserving existing content):

```json
{
  "name": "claude-hooks",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "viewer": "bun run viewer/server.ts",
    "viewer:dev": "bun --watch run viewer/server.ts",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "^0.1.0"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.0.0",
    "vitest": "^2.0.0",
    "@vue/test-utils": "^2.4.0",
    "happy-dom": "^15.0.0",
    "@vitest/coverage-v8": "^2.0.0"
  }
}
```

## Acceptance Criteria
- [ ] `viewer` script runs the server
- [ ] `viewer:dev` script runs with watch mode
- [ ] `test` script runs vitest in watch mode
- [ ] `test:run` script runs tests once
- [ ] `test:coverage` script runs with coverage
- [ ] `vitest` added to devDependencies
- [ ] `@vue/test-utils` added to devDependencies
- [ ] `happy-dom` added to devDependencies
- [ ] `@vitest/coverage-v8` added to devDependencies
- [ ] Existing dependencies preserved
- [ ] `bun install` succeeds

## Verification
```bash
cd .claude/hooks && bun install
cd .claude/hooks && bun run viewer --help || true  # Just check script exists
cd .claude/hooks && bun test --run  # Run tests once
```

## Commit
After verification passes:
```bash
git add .claude/hooks/package.json .claude/hooks/bun.lockb
git commit -m "feat(hooks): add viewer and test scripts

- Add viewer/viewer:dev scripts for server
- Add test/test:run/test:coverage scripts for testing
- Add vitest, @vue/test-utils, happy-dom dependencies
- Add @vitest/coverage-v8 for coverage reports"
```

## Next
Proceed to: `prompts/22-final-validation.md`
