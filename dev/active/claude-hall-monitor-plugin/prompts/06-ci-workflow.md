# Feature: F006 - GitHub Actions CI Workflow

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000-F005**: Project restructured, plugin ready, versioning established

## Objective

Create the CI workflow that runs on pull requests and pushes to main, testing across all platforms.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D005**: GitHub Actions for CI/CD — Native GitHub integration, free for public repos

## Edge Cases to Handle

From `edge-cases.md`:
- **EC009**: GitHub Actions fails on Windows runners → Test on all three OS platforms

## Code References

Read these sections before implementing:
- `code/yaml.md#ci-workflow` - Complete ci.yml structure
- `code/yaml.md#caching-dependencies` - Bun cache configuration

## Constraints

- See `constraints.md` for global rules
- Must test on ubuntu, windows, macos
- Must run type checking, unit tests, and build

## Files to Create

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | PR and push workflow |

## Implementation Details

### ci.yml

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Cache Bun dependencies
        uses: actions/cache@v4
        with:
          path: |
            ~/.bun/install/cache
            hooks/node_modules
          key: ${{ runner.os }}-bun-${{ hashFiles('hooks/bun.lockb') }}
          restore-keys: |
            ${{ runner.os }}-bun-

      - name: Install dependencies
        run: |
          cd hooks
          bun install

      - name: Type check
        run: |
          cd hooks
          bun run tsc --noEmit

      - name: Run tests
        run: |
          cd hooks
          bun run test:run

      - name: Build bundles
        run: bun run build.ts

      - name: Verify bundles exist
        shell: bash
        run: |
          test -d dist/handlers && echo "✓ handlers directory exists"
          test -d dist/viewer && echo "✓ viewer directory exists"
          ls -la dist/handlers/
          ls -la dist/viewer/

      - name: Test handler execution
        shell: bash
        run: |
          echo '{"session_id":"ci-test"}' | bun run dist/handlers/session-start.js

  version-check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Check version consistency
        run: |
          PLUGIN_VERSION=$(jq -r '.version' .claude-plugin/plugin.json)
          PACKAGE_VERSION=$(jq -r '.version' hooks/package.json)
          CHANGELOG_VERSION=$(grep -m1 '## \[' CHANGELOG.md | sed 's/.*\[\([^]]*\)\].*/\1/')

          echo "Versions:"
          echo "  plugin.json:  $PLUGIN_VERSION"
          echo "  package.json: $PACKAGE_VERSION"
          echo "  CHANGELOG.md: $CHANGELOG_VERSION"

          if [ "$PLUGIN_VERSION" != "$PACKAGE_VERSION" ]; then
            echo "❌ Version mismatch: plugin.json ($PLUGIN_VERSION) != package.json ($PACKAGE_VERSION)"
            exit 1
          fi

          if [ "$PLUGIN_VERSION" != "$CHANGELOG_VERSION" ]; then
            echo "❌ Version mismatch: plugin.json ($PLUGIN_VERSION) != CHANGELOG.md ($CHANGELOG_VERSION)"
            exit 1
          fi

          echo "✓ All versions match: $PLUGIN_VERSION"

  lint:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Validate JSON files
        run: |
          cat .claude-plugin/plugin.json | jq '.' > /dev/null
          cat .claude-plugin/hooks.json | jq '.' > /dev/null
          echo "✓ JSON files are valid"
```

## Acceptance Criteria

- [ ] `.github/workflows/ci.yml` exists
- [ ] Workflow runs on PR to main
- [ ] Workflow runs on push to main
- [ ] Tests run on ubuntu, windows, macos
- [ ] Type checking is included
- [ ] Build step is included
- [ ] Version consistency check is included

## Verification

```bash
# Verify workflow file exists
test -f .github/workflows/ci.yml && echo "✓ ci.yml exists"

# Validate YAML syntax (if yq installed)
yq '.' .github/workflows/ci.yml > /dev/null && echo "✓ Valid YAML"

# Check for required elements
grep -q "ubuntu-latest" .github/workflows/ci.yml && echo "✓ Ubuntu runner"
grep -q "windows-latest" .github/workflows/ci.yml && echo "✓ Windows runner"
grep -q "macos-latest" .github/workflows/ci.yml && echo "✓ macOS runner"
grep -q "bun run test" .github/workflows/ci.yml && echo "✓ Test step"
grep -q "build.ts" .github/workflows/ci.yml && echo "✓ Build step"
```

## Commit

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions CI workflow

Add ci.yml with:
- Cross-platform testing (ubuntu, windows, macos)
- Type checking with tsc
- Unit tests with vitest
- Build verification
- Version consistency check

Implements: F006
Decisions: D005"
```

## Next

Proceed to: `prompts/07-release-workflow.md` (F007)
