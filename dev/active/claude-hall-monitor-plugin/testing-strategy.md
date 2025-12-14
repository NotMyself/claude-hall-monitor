# Testing Strategy

## Philosophy

The plugin must work reliably across platforms and through the distribution pipeline. Testing covers three levels:

1. **Unit Tests** - Individual handlers and utilities work correctly
2. **Build Tests** - Bundles compile without errors and are self-contained
3. **E2E Tests** - Complete plugin works when installed via marketplace

## Test Types

### Unit Tests

**Tool**: Vitest with happy-dom for browser API mocking

**Location**: `hooks/viewer/__tests__/`

**Run Command**: `bun run test:run` (from hooks/ directory)

**Coverage**:
- Hook handler input/output contracts
- Utility functions (logger, security)
- Vue components (viewer UI)

**Existing Tests**:
- `components.test.ts` - Vue component unit tests
- `server.test.ts` - Server endpoint tests

### Build Tests

**Purpose**: Verify TypeScript compiles and bundles are valid JavaScript

**Commands**:
```bash
# Type checking
bun run tsc --noEmit

# Build all bundles
bun run build

# Verify bundles execute without errors
bun run dist/handlers/session-start.js < test-input.json
```

**Verification Points**:
- No TypeScript errors
- All 12 handlers bundle successfully
- Viewer server bundles successfully
- No external imports in bundles (all dependencies inlined)

### E2E Tests

**Purpose**: Verify plugin works when installed via marketplace

**Tool**: Custom test script (`test:e2e.ts`)

**Test Flow**:
1. Build plugin bundles
2. Create temp plugin directory structure
3. Simulate hook invocations with test inputs
4. Verify outputs match expected format
5. Test viewer starts and serves UI

**Key Scenarios**:
- SessionStart hook logs correctly and starts viewer
- PreToolUse hook can allow/deny/modify
- PostToolUse hook can inject context
- SessionEnd hook stops viewer
- All 12 hooks produce valid JSON output

## CI/CD Testing

### Pull Request Workflow (ci.yml)

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    steps:
      - bun install
      - bun run tsc --noEmit
      - bun run test:run
      - bun run build
```

### Release Workflow (release.yml)

```yaml
jobs:
  release:
    steps:
      - bun install
      - bun run test:run
      - bun run build
      - # Create zip archive
      - # Upload to GitHub release
```

## Test Data

### Hook Input Fixtures

Create test fixtures for each hook type at `hooks/__tests__/fixtures/`:

```json
// session-start.json
{
  "session_id": "test-session-123",
  "cwd": "/tmp/test-project"
}

// pre-tool-use.json
{
  "session_id": "test-session-123",
  "tool_name": "Bash",
  "tool_input": {
    "command": "ls -la"
  }
}
```

### Expected Outputs

```json
// session-start expected
{
  "additionalContext": "Session clear at ..."
}

// pre-tool-use expected (allow)
{
  "permissionDecision": "allow"
}
```

## Cross-Platform Testing

All tests run on three platforms in CI:
- **ubuntu-latest** - Primary Linux testing
- **windows-latest** - Windows path handling (EC001)
- **macos-latest** - macOS compatibility

## Version Validation

CI validates version consistency:

```bash
# Extract versions from all files
PLUGIN_VERSION=$(jq -r '.version' .claude-plugin/plugin.json)
PACKAGE_VERSION=$(jq -r '.version' hooks/package.json)
CHANGELOG_VERSION=$(grep -m1 '## \[' CHANGELOG.md | sed 's/.*\[\([^]]*\)\].*/\1/')

# Fail if any mismatch
if [ "$PLUGIN_VERSION" != "$PACKAGE_VERSION" ] || [ "$PLUGIN_VERSION" != "$CHANGELOG_VERSION" ]; then
  echo "Version mismatch detected"
  exit 1
fi
```
