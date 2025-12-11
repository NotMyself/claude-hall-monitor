# Initializer Agent: Project Setup

## Role
You are the initializer agent responsible for setting up the realtime-log-viewer project structure. You will NOT implement any features - only create the foundation for coding agents.

## Objective
Create the directory structure and install dependencies for the realtime-log-viewer project.

## Constraints
- **It is unacceptable to implement any features** - only create empty files and directory structure
- **It is unacceptable to write any business logic** - placeholder comments only
- Follow the directory structure exactly as specified
- All files go in `.claude/hooks/viewer/`

## Tasks

### 1. Create Directory Structure
```bash
mkdir -p .claude/hooks/viewer/styles
mkdir -p .claude/hooks/viewer/__tests__
```

### 2. Create Placeholder Files
Create empty files with placeholder comments:

**`.claude/hooks/viewer/types.ts`**
```typescript
// Types will be implemented in feature 01-types
export {};
```

**`.claude/hooks/viewer/config.ts`**
```typescript
// Configuration will be implemented in feature 02-config
export {};
```

**`.claude/hooks/viewer/watcher.ts`**
```typescript
// File watcher will be implemented in feature 03-watcher
export {};
```

**`.claude/hooks/viewer/server.ts`**
```typescript
// Server will be implemented in features 04-06
export {};
```

**`.claude/hooks/viewer/index.html`**
```html
<!-- UI will be implemented in features 08-16 -->
<!DOCTYPE html>
<html><head><title>Hook Viewer</title></head><body></body></html>
```

**`.claude/hooks/viewer/styles/theme.css`**
```css
/* Theme will be implemented in feature 07-theme-css */
```

**`.claude/hooks/viewer/vitest.config.ts`**
```typescript
// Test config will be implemented in feature 17-test-setup
export {};
```

**`.claude/hooks/viewer/__tests__/setup.ts`**
```typescript
// Test setup will be implemented in feature 17-test-setup
export {};
```

### 3. Update package.json
Add the following devDependencies to `.claude/hooks/package.json`:
```json
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vue/test-utils": "^2.4.0",
    "happy-dom": "^15.0.0"
  }
}
```

### 4. Install Dependencies
```bash
cd .claude/hooks && bun install
```

### 5. Verify Setup
```bash
# Check all files exist
ls -la .claude/hooks/viewer/
ls -la .claude/hooks/viewer/styles/
ls -la .claude/hooks/viewer/__tests__/

# Check TypeScript compiles
cd .claude/hooks && bun run tsc --noEmit
```

## Acceptance Criteria
- [ ] Directory `.claude/hooks/viewer/` exists
- [ ] Directory `.claude/hooks/viewer/styles/` exists
- [ ] Directory `.claude/hooks/viewer/__tests__/` exists
- [ ] All placeholder files created
- [ ] Dependencies installed successfully
- [ ] TypeScript compiles without errors

## Commit
After verification:
```bash
git add .claude/hooks/viewer/ .claude/hooks/package.json .claude/hooks/bun.lockb
git commit -m "feat(viewer): initialize project structure

- Create viewer directory structure
- Add placeholder files for all features
- Install test dependencies (vitest, vue-test-utils, happy-dom)"
```

## Next
Proceed to: `prompts/01-types.md`
