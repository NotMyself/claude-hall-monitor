# Project Commands

All commands run from `.claude/hooks` directory unless otherwise specified.

## Development

```bash
# Install dependencies
bun install

# Type check
bun run tsc --noEmit

# Start realtime log viewer
bun run viewer

# Start viewer with hot reload
bun run viewer:dev
```

## Testing

```bash
# Run tests (watch mode)
bun run test

# Run tests once
bun run test:run

# Run tests with coverage
bun run test:coverage
```

## Debugging

```bash
# View structured logs
cat hooks-log.txt

# Run a hook directly
bun run handlers/<hook-name>.ts
```
