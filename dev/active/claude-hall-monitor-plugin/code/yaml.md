# YAML Patterns (GitHub Actions)

## CI Workflow

### ci.yml - Pull Request Testing

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
        run: |
          ls -la dist/handlers/
          ls -la dist/viewer/
        shell: bash

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

          echo "plugin.json:  $PLUGIN_VERSION"
          echo "package.json: $PACKAGE_VERSION"
          echo "CHANGELOG.md: $CHANGELOG_VERSION"

          if [ "$PLUGIN_VERSION" != "$PACKAGE_VERSION" ]; then
            echo "❌ Version mismatch between plugin.json and package.json"
            exit 1
          fi

          if [ "$PLUGIN_VERSION" != "$CHANGELOG_VERSION" ]; then
            echo "❌ Version mismatch between plugin.json and CHANGELOG.md"
            exit 1
          fi

          echo "✓ All versions match: $PLUGIN_VERSION"
```

## Release Workflow

### release.yml - Tag-Based Releases

```yaml
name: Release

on:
  push:
    tags:
      - "v*"

permissions:
  contents: write

jobs:
  build:
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

      - name: Create release archive
        run: |
          mkdir -p release/claude-hall-monitor
          cp -r .claude-plugin release/claude-hall-monitor/
          cp -r dist release/claude-hall-monitor/
          cp -r rules release/claude-hall-monitor/
          cp -r commands release/claude-hall-monitor/
          cp README.md release/claude-hall-monitor/
          cp CHANGELOG.md release/claude-hall-monitor/
          cd release
          zip -r claude-hall-monitor-${{ steps.version.outputs.VERSION }}.zip claude-hall-monitor

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: release/claude-hall-monitor-${{ steps.version.outputs.VERSION }}.zip
          generate_release_notes: true
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  cross-platform-test:
    needs: build
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

      - name: Build and test
        run: |
          cd hooks
          bun install
          bun run test:run

      - name: Build bundles
        run: bun run build.ts

      - name: Test handler execution
        run: |
          echo '{"session_id":"test"}' | bun run dist/handlers/session-start.js
        shell: bash
```

## Workflow Patterns

### Reusable Job for Testing

```yaml
# Can be extracted to .github/workflows/test.yml and called with workflow_call

jobs:
  test:
    runs-on: ${{ inputs.os || 'ubuntu-latest' }}
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install and test
        run: |
          cd hooks
          bun install
          bun run tsc --noEmit
          bun run test:run
```

### Caching Dependencies

```yaml
- name: Cache Bun dependencies
  uses: actions/cache@v4
  with:
    path: |
      ~/.bun/install/cache
      hooks/node_modules
    key: ${{ runner.os }}-bun-${{ hashFiles('hooks/bun.lockb') }}
    restore-keys: |
      ${{ runner.os }}-bun-
```

### Matrix Strategy for All Platforms

```yaml
strategy:
  fail-fast: false  # Continue testing other platforms if one fails
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    bun-version: [latest]
    include:
      - os: ubuntu-latest
        shell: bash
      - os: windows-latest
        shell: pwsh
      - os: macos-latest
        shell: bash
```
