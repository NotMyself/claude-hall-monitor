# Plan Tracker - Initialization

## Pre-flight Checks

Before implementing features, verify the following:

### 1. Environment

```bash
# Verify Bun is installed
bun --version

# Verify we're in the correct directory
ls .claude/hooks/viewer/
```

Expected: Should see `index.html`, `server.ts`, `types.ts`, `config.ts`, etc.

### 2. Dependencies

```bash
# Verify dependencies are installed
cd .claude/hooks && bun install
```

### 3. Type Checking

```bash
# Verify TypeScript compiles
cd .claude/hooks && bun run tsc --noEmit
```

Expected: No errors

### 4. Tests

```bash
# Verify existing tests pass
cd .claude/hooks && bun run test:run
```

Expected: All tests pass

### 5. Viewer Starts

```bash
# Start the viewer
cd .claude/hooks && bun run viewer &

# Wait for startup
sleep 2

# Verify it's running
curl -s http://localhost:3456/ | head -20

# Stop the viewer
pkill -f "bun run viewer" || true
```

Expected: HTML response from the viewer

### 6. Plan Directories

```bash
# Check dev directories exist
ls -la dev/

# Check for existing completed plans (for reference)
ls dev/complete/ 2>/dev/null || echo "No completed plans"
```

## Initialization Complete

All pre-flight checks passed. Ready to implement features.

Proceed to: `prompts/01-types.md`
