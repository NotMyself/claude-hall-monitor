# Feature: F007 - GitHub Actions Release Workflow

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

- **F000-F006**: Project ready, CI workflow created

## Objective

Create the release workflow that builds, tests, creates a zip archive, and publishes GitHub releases on tag push.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.

## Relevant Decisions

From `decisions.md`:
- **D005**: GitHub Actions for CI/CD — Automated release pipeline
- **D006**: Zip archive for releases — Universal format for distribution

## Edge Cases to Handle

From `edge-cases.md`:
- **EC009**: Windows runner issues → Test build on all platforms before release
- **EC010**: Zip extraction permissions → Use standard zip tooling

## Code References

Read these sections before implementing:
- `code/yaml.md#release-workflow` - Complete release.yml structure
- `code/bash.md#release-commands` - Archive creation

## Constraints

- See `constraints.md` for global rules
- Trigger on version tags only (v*)
- Include only distribution files in archive (not source TypeScript)
- Auto-generate release notes from commits

## Files to Create

| File | Purpose |
|------|---------|
| `.github/workflows/release.yml` | Tag-triggered release workflow |

## Implementation Details

### release.yml

```yaml
name: Release

on:
  push:
    tags:
      - "v*"

permissions:
  contents: write

jobs:
  build-and-release:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: |
          cd hooks
          bun install

      - name: Run tests
        run: |
          cd hooks
          bun run test:run

      - name: Build bundles
        run: bun run build.ts

      - name: Extract version from tag
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Verify version matches
        run: |
          TAG_VERSION=${{ steps.version.outputs.VERSION }}
          PLUGIN_VERSION=$(jq -r '.version' .claude-plugin/plugin.json)

          if [ "$TAG_VERSION" != "$PLUGIN_VERSION" ]; then
            echo "❌ Tag version ($TAG_VERSION) != plugin.json version ($PLUGIN_VERSION)"
            exit 1
          fi
          echo "✓ Versions match: $TAG_VERSION"

      - name: Create release archive
        run: |
          VERSION=${{ steps.version.outputs.VERSION }}

          # Create release directory structure
          mkdir -p release/claude-hall-monitor

          # Copy plugin files (not source TypeScript)
          cp -r .claude-plugin release/claude-hall-monitor/
          cp -r dist release/claude-hall-monitor/
          cp -r rules release/claude-hall-monitor/
          cp -r commands release/claude-hall-monitor/
          cp README.md release/claude-hall-monitor/
          cp CHANGELOG.md release/claude-hall-monitor/
          cp LICENSE release/claude-hall-monitor/ 2>/dev/null || true

          # Create zip archive
          cd release
          zip -r "claude-hall-monitor-${VERSION}.zip" claude-hall-monitor

          echo "Created: claude-hall-monitor-${VERSION}.zip"
          ls -la

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: release/claude-hall-monitor-${{ steps.version.outputs.VERSION }}.zip
          generate_release_notes: true
          draft: false
          prerelease: ${{ contains(github.ref, '-beta') || contains(github.ref, '-alpha') }}
          body: |
            ## Claude Hall Monitor v${{ steps.version.outputs.VERSION }}

            ### Installation

            Download the zip file and extract to your Claude Code plugins directory.

            Or install via marketplace:
            ```bash
            claude plugin install claude-hall-monitor
            ```

            ### Prerequisites

            - [Bun](https://bun.sh) runtime

            See CHANGELOG.md for detailed changes.
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  cross-platform-verify:
    needs: build-and-release
    strategy:
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

      - name: Build and verify
        run: |
          cd hooks
          bun install
          cd ..
          bun run build.ts

      - name: Test handler execution
        shell: bash
        run: |
          echo '{"session_id":"release-verify"}' | bun run dist/handlers/session-start.js
```

## Release Process

When ready to release:

1. **Update version** in all files (plugin.json, package.json, CHANGELOG.md)
2. **Commit** the version bump
3. **Tag** with version: `git tag v1.0.0`
4. **Push** tag: `git push origin v1.0.0`
5. **Watch** the release workflow create the GitHub release

```bash
# Example release commands
VERSION="1.0.0"
git add -A
git commit -m "chore: release v${VERSION}"
git tag "v${VERSION}"
git push origin main "v${VERSION}"
```

## Acceptance Criteria

- [ ] `.github/workflows/release.yml` exists
- [ ] Workflow triggers on v* tags only
- [ ] Tests run before archive creation
- [ ] Version from tag matches plugin.json
- [ ] Archive contains: .claude-plugin/, dist/, rules/, commands/, README.md, CHANGELOG.md
- [ ] Archive does NOT contain: hooks/ source, node_modules/, build.ts
- [ ] GitHub release is created with zip attachment
- [ ] Release notes are auto-generated

## Verification

```bash
# Verify workflow file exists
test -f .github/workflows/release.yml && echo "✓ release.yml exists"

# Check trigger configuration
grep -q "tags:" .github/workflows/release.yml && echo "✓ Tag trigger configured"
grep -q 'v\*' .github/workflows/release.yml && echo "✓ v* pattern set"

# Check release action
grep -q "softprops/action-gh-release" .github/workflows/release.yml && echo "✓ Release action used"
```

## Commit

```bash
git add .github/workflows/release.yml
git commit -m "ci: add release workflow for tagged versions

Add release.yml that:
- Triggers on v* tags
- Builds and tests before release
- Creates zip archive with plugin files
- Publishes GitHub release with attachment
- Verifies cross-platform compatibility

Implements: F007
Decisions: D005, D006"
```

## Next

Proceed to: `prompts/08-e2e-tests.md` (F008)
