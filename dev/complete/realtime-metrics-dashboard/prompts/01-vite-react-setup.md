# Feature: F001 - Vite + React + Router Setup

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

F000: Project directory structure and package.json created

## Objective

Set up Vite with React 19, configure TypeScript, and initialize React Router for the dashboard application.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope. Only set up the build tooling and basic routing structure - do not create page components yet.

## Relevant Decisions

From `decisions.md`:
- **D002**: React 19 + Vite — Native shadcn/ui support, modern tooling, faster builds, better TypeScript integration

## Code References

Read these sections before implementing:
- `code/bash.md#setup` - Installation commands
- `code/html.md#vite-template` - HTML entry point structure
- `code/html.md#react-entry-point` - main.tsx structure
- `code/html.md#app-component` - App.tsx with router setup
- `code/html.md#vite-config` - Vite configuration with path aliases

## Constraints

- See `constraints.md` for global rules
- Use Bun for dependency installation
- Configure path aliases (`@/*` → `./src/*`)
- Enable React strict mode
- Set up proxy for API calls to `http://localhost:3456`

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `hooks/viewer/index.html` | HTML entry point with loading state |
| `hooks/viewer/vite.config.ts` | Vite configuration with React plugin and aliases |
| `hooks/viewer/tsconfig.json` | TypeScript configuration for React |
| `hooks/viewer/tsconfig.node.json` | TypeScript configuration for Vite config |
| `hooks/viewer/src/main.tsx` | React app entry point |
| `hooks/viewer/src/App.tsx` | Root component with router |
| `hooks/viewer/src/index.css` | Placeholder for Tailwind (populated in F002) |
| `hooks/viewer/public/favicon.svg` | Simple SVG favicon |

## Implementation Details

### Installation

First, install dependencies:

```bash
cd C:/Users/bobby/src/claude/claude-hall-monitor/hooks/viewer
bun install
```

### index.html

Use the structure from `code/html.md#with-favicon` with inline loading state.

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3456',
        changeOrigin: true,
      },
      '/events': {
        target: 'http://localhost:3456',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

### TypeScript Configs

Use configurations from `code/html.md#typescript-config`:
- `tsconfig.json` - Main TypeScript config with path aliases
- `tsconfig.node.json` - Vite config TypeScript settings

### React Entry Points

Follow patterns from `code/html.md`:
- `src/main.tsx` - ReactDOM.createRoot with StrictMode
- `src/App.tsx` - BrowserRouter with Routes for /overview, /plans, /sessions, /settings

For now, create placeholder components that just render the route name:

```typescript
// Placeholder page components (will be replaced in later features)
function OverviewPage() {
  return <div>Overview Page</div>;
}

function PlansPage() {
  return <div>Plans Page</div>;
}

function SessionsPage() {
  return <div>Sessions Page</div>;
}

function SettingsPage() {
  return <div>Settings Page</div>;
}
```

### index.css

Create empty file with comment:

```css
/* Tailwind CSS will be configured in F002 */
```

### Favicon

Use the simple SVG from `code/html.md#favicon-svg`.

## Acceptance Criteria

- [ ] Dependencies installed successfully with `bun install`
- [ ] Development server starts without errors: `bun run dev`
- [ ] TypeScript compiles without errors: `bun run tsc --noEmit`
- [ ] Browser shows placeholder pages when navigating routes
- [ ] Path aliases (@/*) resolve correctly
- [ ] API proxy configured for /api and /events endpoints
- [ ] Favicon displays in browser tab

## Verification

```bash
cd C:/Users/bobby/src/claude/claude-hall-monitor/hooks/viewer

# Install dependencies
bun install

# Type checking
bun run tsc --noEmit

# Test dev server starts (will need to manually verify in browser)
bun run dev
```

## Commit

```bash
git add hooks/viewer/
git commit -m "$(cat <<'EOF'
feat(viewer): configure Vite, React 19, and React Router

Set up build tooling with Vite 6 and React 19. Configure TypeScript
with path aliases, proxy API requests to port 3456, and create basic
routing structure with placeholder pages.

Implements: F001
Decisions: D002

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/02-tailwind-config.md` (F002)
