# Bash Command Patterns

## Setup

Project initialization commands:

```bash
# Create viewer directory structure
mkdir -p hooks/viewer/src/{components/{ui,layout,plans,metrics,sessions},hooks,lib,pages,types}

# Initialize package.json
cd hooks/viewer
bun init -y

# Install React dependencies
bun add react@^19.0.0 react-dom@^19.0.0

# Install development dependencies
bun add -d @types/react@^19.0.0 @types/react-dom@^19.0.0
bun add -d @vitejs/plugin-react@^4.3.0 vite@^6.0.0
bun add -d typescript@^5.0.0

# Install routing
bun add react-router-dom@^7.0.0

# Install UI dependencies
bun add class-variance-authority clsx tailwind-merge lucide-react

# Install chart library
bun add recharts@^2.15.0

# Install Tailwind CSS
bun add -d tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0

# Install toast notifications
bun add sonner
```

## shadcn/ui Setup

Installing shadcn/ui and components:

```bash
# Initialize shadcn/ui (creates components.json)
bun x shadcn@latest init

# Install base components (do this in F003)
bun x shadcn@latest add button

# Install layout components (F008)
bun x shadcn@latest add sidebar separator

# Install plan components (F011, F014)
bun x shadcn@latest add card badge progress scroll-area

# Install metrics components (F018, F020)
bun x shadcn@latest add chart

# Install session components (F022, F025)
bun x shadcn@latest add table input select dropdown-menu

# Install page components (F027)
bun x shadcn@latest add tabs

# Install UX components (F029, F030)
bun x shadcn@latest add tooltip skeleton toast alert sheet
```

## Development

Development server and build commands:

```bash
# Start development server
bun run dev
# Opens at http://localhost:5173

# Build for production
bun run build
# Outputs to dist/

# Preview production build
bun run preview

# Type checking
bun run tsc --noEmit

# Type checking in watch mode
bun run tsc --noEmit --watch
```

## Testing

Test execution commands:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test plan-card.test.tsx

# Run tests with coverage
bun test --coverage

# Run tests matching pattern
bun test --grep "plan"

# Run tests for specific component
bun test components/plans/

# Clear test cache and run
bun test --clear-cache
```

## Verification

Feature verification commands:

```bash
# Verify Vite setup (F001)
bun run dev --help && bun run tsc --noEmit

# Verify Tailwind config (F002)
grep -r "terracotta\|D4A27F" tailwind.config.ts

# Verify shadcn/ui (F003)
test -f components.json && echo "shadcn configured"

# Verify TypeScript types (F004)
bun run tsc --noEmit

# Verify API client (F005)
bun test lib/api.test.ts

# Verify SSE hook (F006)
bun test hooks/use-sse.test.ts

# Verify data hooks (F007)
bun test hooks/use-*.test.ts

# Verify components
bun test components/**/*.test.tsx

# Verify pages
bun test pages/**/*.test.tsx
```

## Build Integration

Build process integration:

```bash
# Build React app
cd hooks/viewer
bun run build

# Verify build output
ls -la dist/

# Check bundle size
du -sh dist/

# Verify assets are hashed
ls dist/assets/*.js dist/assets/*.css

# Test production build locally
bun run preview
```

## Linting and Formatting

Code quality commands:

```bash
# TypeScript type checking
bun run tsc --noEmit

# Check for unused dependencies
bun pm ls

# Clean install
rm -rf node_modules bun.lockb
bun install
```

## Integration with hooks/build.ts

Commands to update build process:

```bash
# Run the existing hooks build script
cd ../..  # Back to project root
bun hooks/build.ts

# The build script should:
# 1. Build React app: cd hooks/viewer && bun run build
# 2. Copy dist/ to appropriate location
# 3. Bundle other hook handlers as before

# Verify bundled output
ls -la dist/
```

## Server Integration

Testing server serving React build:

```bash
# Start the viewer server (should serve React build)
bun hooks/handlers/session-start.ts

# In another terminal, check if React app is served
curl http://localhost:3456/
# Should return the React app HTML

# Check API endpoints are accessible
curl http://localhost:3456/api/plans
curl http://localhost:3456/api/dashboard/stats

# Check SSE endpoints
curl -N http://localhost:3456/events/plans
# Should return text/event-stream
```

## Package Scripts

Recommended package.json scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "type-check": "tsc --noEmit"
  }
}
```

## Environment Variables

Setting up environment variables:

```bash
# Create .env file for local development
cat > hooks/viewer/.env << 'EOF'
VITE_API_BASE_URL=http://localhost:3456
VITE_SSE_BASE_URL=http://localhost:3456
EOF

# For Docker/production (use host.docker.internal)
cat > hooks/viewer/.env.production << 'EOF'
VITE_API_BASE_URL=http://host.docker.internal:3456
VITE_SSE_BASE_URL=http://host.docker.internal:3456
EOF
```

## Debugging

Debug commands:

```bash
# Check what's running on port 5173 (Vite dev server)
lsof -i :5173

# Check what's running on port 3456 (API server)
lsof -i :3456

# View Vite dev server logs with verbose output
bun run dev --debug

# Check bundle analysis
bun run build --debug
```

## Clean Up

Cleanup commands:

```bash
# Remove build artifacts
rm -rf dist/

# Remove node_modules
rm -rf node_modules bun.lockb

# Remove test coverage
rm -rf coverage/

# Full reset
rm -rf dist/ node_modules bun.lockb coverage/
bun install
```
