# Feature: F000 - Project Initialization

## Project Context

See `context.md` for feature rationale and architecture vision.

This is the initialization step - creating the foundational directory structure and package configuration for the React dashboard.

## Objective

Initialize the `hooks/viewer/` directory with the basic React project structure and package.json configuration.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope. Only create the directory structure and package.json - do not install dependencies or create components yet.

## Relevant Decisions

From `decisions.md`:
- **D002**: React 19 + Vite — Modern tooling with better TypeScript integration

## Code References

Read these sections before implementing:
- `code/bash.md#setup` - Directory creation commands
- `code/html.md#vite-config` - Package.json structure reference

## Constraints

- See `constraints.md` for global rules
- Use Bun as package manager (not npm/yarn)
- Follow exact directory structure specified below
- Do not install dependencies yet (that happens in F001)

## Files to Create

| File | Purpose |
|------|---------|
| `hooks/viewer/package.json` | Package configuration with dependencies |
| `hooks/viewer/.gitignore` | Ignore node_modules and build artifacts |
| `hooks/viewer/README.md` | Basic project documentation |
| `hooks/viewer/src/` | Source directory (empty for now) |
| `hooks/viewer/public/` | Static assets directory |

## Directory Structure

Create this structure in `hooks/viewer/`:

```
hooks/viewer/
├── package.json
├── .gitignore
├── README.md
├── public/           # Static assets
└── src/              # Source code (subdirs created in later features)
    ├── components/
    │   ├── ui/
    │   ├── layout/
    │   ├── plans/
    │   ├── metrics/
    │   └── sessions/
    ├── hooks/
    ├── lib/
    ├── pages/
    └── types/
```

## Implementation Details

### package.json

```json
{
  "name": "claude-hall-monitor-viewer",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "recharts": "^2.15.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.6.0",
    "lucide-react": "^0.468.0",
    "sonner": "^1.4.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^6.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "happy-dom": "^12.0.0"
  }
}
```

### .gitignore

```gitignore
# Dependencies
node_modules
bun.lockb

# Build output
dist
*.local

# Environment
.env
.env.local
.env.production.local

# Editor
.vscode/*
!.vscode/settings.json
.idea
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Test coverage
coverage

# Logs
*.log
npm-debug.log*
```

### README.md

```markdown
# Claude Hall Monitor - Dashboard

Realtime metrics dashboard for monitoring plan orchestrations, metrics, and sessions.

## Tech Stack

- React 19
- Vite 6
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build

# Run tests
bun test

# Type checking
bun run type-check
```

## Architecture

- `src/components/` - React components
  - `ui/` - shadcn/ui base components
  - `layout/` - Layout components (sidebar, header)
  - `plans/` - Plan-related components
  - `metrics/` - Metrics visualization components
  - `sessions/` - Session management components
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utilities and API client
- `src/pages/` - Page components
- `src/types/` - TypeScript type definitions

## API Integration

The dashboard connects to the data collection API at `http://localhost:3456`:
- REST endpoints: `/api/*`
- SSE streams: `/events/plans`, `/events/metrics`
```

## Acceptance Criteria

- [ ] `hooks/viewer/` directory exists
- [ ] `package.json` created with all dependencies listed
- [ ] `.gitignore` created with proper exclusions
- [ ] `README.md` created with project documentation
- [ ] `src/` directory structure created with subdirectories
- [ ] `public/` directory created

## Verification

```bash
# Verify directory structure
ls -la C:/Users/bobby/src/claude/claude-hall-monitor/hooks/viewer/

# Verify subdirectories exist
ls -la C:/Users/bobby/src/claude/claude-hall-monitor/hooks/viewer/src/

# Verify files created
test -f C:/Users/bobby/src/claude/claude-hall-monitor/hooks/viewer/package.json && echo "package.json exists"
test -f C:/Users/bobby/src/claude/claude-hall-monitor/hooks/viewer/.gitignore && echo ".gitignore exists"
test -f C:/Users/bobby/src/claude/claude-hall-monitor/hooks/viewer/README.md && echo "README.md exists"
```

## Commit

```bash
git add hooks/viewer/
git commit -m "$(cat <<'EOF'
feat(viewer): initialize React dashboard project structure

Create foundational directory structure and package configuration
for the realtime metrics dashboard. Sets up React 19 + Vite project
with TypeScript, Tailwind CSS, and shadcn/ui dependencies.

Implements: F000

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

## Next

Proceed to: `prompts/01-vite-react-setup.md` (F001)
