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
