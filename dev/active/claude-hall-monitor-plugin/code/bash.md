# Bash/Shell Patterns

## Project Structure Commands

### Move Files from .claude/ to Root

```bash
# Create new directory structure
mkdir -p hooks/handlers hooks/utils hooks/viewer
mkdir -p rules
mkdir -p commands

# Move hook files
mv .claude/hooks/handlers/* hooks/handlers/
mv .claude/hooks/utils/* hooks/utils/
mv .claude/hooks/viewer/* hooks/viewer/
mv .claude/hooks/package.json hooks/
mv .claude/hooks/tsconfig.json hooks/
mv .claude/hooks/hooks-log.txt hooks/

# Move rules
mv .claude/rules/* rules/

# Move commands
mv .claude/commands/* commands/

# Clean up old structure
rm -rf .claude/hooks .claude/rules .claude/commands
```

### Create Plugin Directory

```bash
mkdir -p .claude-plugin
```

## Build Commands

### Build All Bundles

```bash
# Clean and create dist directories
rm -rf dist
mkdir -p dist/handlers dist/viewer

# Build handlers (run from project root)
bun run build.ts
```

### Build Individual Handler

```bash
bun build hooks/handlers/session-start.ts \
  --outdir dist/handlers \
  --target bun \
  --minify
```

### Build Viewer

```bash
bun build hooks/viewer/server.ts \
  --outdir dist/viewer \
  --target bun \
  --minify
```

## Testing Commands

### Type Check

```bash
cd hooks && bun run tsc --noEmit
```

### Run Unit Tests

```bash
cd hooks && bun run test:run
```

### Run Tests with Coverage

```bash
cd hooks && bun run test:coverage
```

### Test Handler Execution

```bash
# Test session-start handler
echo '{"session_id":"test-123","cwd":"/tmp"}' | bun run dist/handlers/session-start.js

# Test pre-tool-use handler
echo '{"session_id":"test-123","tool_name":"Bash","tool_input":{"command":"ls"}}' | \
  bun run dist/handlers/pre-tool-use.js
```

## Version Management

### Check Version Consistency

```bash
#!/bin/bash
# version-check.sh

PLUGIN_VERSION=$(jq -r '.version' .claude-plugin/plugin.json)
PACKAGE_VERSION=$(jq -r '.version' hooks/package.json)
CHANGELOG_VERSION=$(grep -m1 '## \[' CHANGELOG.md | sed 's/.*\[\([^]]*\)\].*/\1/')

echo "Versions found:"
echo "  plugin.json:  $PLUGIN_VERSION"
echo "  package.json: $PACKAGE_VERSION"
echo "  CHANGELOG.md: $CHANGELOG_VERSION"

if [ "$PLUGIN_VERSION" = "$PACKAGE_VERSION" ] && [ "$PLUGIN_VERSION" = "$CHANGELOG_VERSION" ]; then
  echo "✓ All versions match"
  exit 0
else
  echo "✗ Version mismatch detected"
  exit 1
fi
```

### Bump Version

```bash
#!/bin/bash
# bump-version.sh <new-version>

NEW_VERSION=$1

if [ -z "$NEW_VERSION" ]; then
  echo "Usage: ./bump-version.sh <version>"
  exit 1
fi

# Update plugin.json
jq ".version = \"$NEW_VERSION\"" .claude-plugin/plugin.json > tmp.json && mv tmp.json .claude-plugin/plugin.json

# Update package.json
jq ".version = \"$NEW_VERSION\"" hooks/package.json > tmp.json && mv tmp.json hooks/package.json

echo "Updated version to $NEW_VERSION in plugin.json and package.json"
echo "Don't forget to update CHANGELOG.md manually"
```

## Release Commands

### Create Release Archive

```bash
#!/bin/bash
# create-release.sh

VERSION=$(jq -r '.version' .claude-plugin/plugin.json)

# Build first
bun run build.ts

# Create release directory
mkdir -p release/claude-hall-monitor

# Copy plugin files
cp -r .claude-plugin release/claude-hall-monitor/
cp -r dist release/claude-hall-monitor/
cp -r rules release/claude-hall-monitor/
cp -r commands release/claude-hall-monitor/
cp README.md release/claude-hall-monitor/
cp CHANGELOG.md release/claude-hall-monitor/

# Create zip
cd release
zip -r "claude-hall-monitor-${VERSION}.zip" claude-hall-monitor

echo "Created release/claude-hall-monitor-${VERSION}.zip"
```

### Tag and Push Release

```bash
VERSION=$(jq -r '.version' .claude-plugin/plugin.json)

git tag -a "v${VERSION}" -m "Release v${VERSION}"
git push origin "v${VERSION}"
```

## Development Commands

### Start Viewer

```bash
bun run hooks/viewer/server.ts
```

### Watch Mode Development

```bash
# Run tests in watch mode
cd hooks && bun run test

# Type check on save (requires additional tooling)
bun run tsc --watch --noEmit
```

### View Logs

```bash
# View structured logs
cat hooks/hooks-log.txt

# Follow logs in realtime
tail -f hooks/hooks-log.txt

# Parse and pretty-print JSONL
cat hooks/hooks-log.txt | jq '.'
```

## Git Commands

### Commit After Feature

```bash
git add .
git commit -m "feat(plugin): add build system for handler bundling

Implements: F003
Decisions: D002"
```

### Create Feature Branch

```bash
git checkout -b feature/plugin-manifest
```
