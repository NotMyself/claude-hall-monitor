# Project Context

## Summary

Transform the `claude-bun-win11-hooks` project into an installable Claude Code plugin named **claude-hall-monitor**. This plugin packages all 12 hook handlers, the Hall Monitor realtime viewer UI, 6 rules files, and 3 slash commands into a distributable package that can be installed via the claude-dotnet-marketplace.

### Why This Matters

The current implementation works well as a development project but requires manual setup. Converting it to a plugin enables:

1. **One-command installation** - Users install with a single marketplace command
2. **Zero-config setup** - Plugin system handles hook registration automatically
3. **Cross-platform distribution** - Same package works on Windows, macOS, Linux
4. **Version management** - Semantic versioning enables controlled updates
5. **Community sharing** - Marketplace listing makes it discoverable

## Architecture Vision

```
claude-hall-monitor/
├── .claude-plugin/
│   ├── plugin.json          # Plugin metadata (name, version, description)
│   └── hooks.json           # Hook configurations using ${CLAUDE_PLUGIN_ROOT}
├── dist/
│   ├── handlers/            # Bundled JS files (12 handlers)
│   │   ├── session-start.js
│   │   ├── session-end.js
│   │   └── ... (10 more)
│   └── viewer/
│       └── server.js        # Bundled viewer server
├── hooks/                   # Source TypeScript (moved from .claude/hooks/)
│   ├── handlers/
│   ├── utils/
│   ├── viewer/
│   ├── package.json
│   └── tsconfig.json
├── rules/                   # Rule files (moved from .claude/rules/)
├── commands/                # Slash commands (moved from .claude/commands/)
├── build.ts                 # Bun build script
├── CHANGELOG.md             # Version history
└── .github/workflows/       # CI/CD pipelines
```

### Key Architectural Decisions

1. **Bundled JavaScript Distribution**: TypeScript source is compiled to standalone JavaScript bundles with all dependencies inlined. Users only need Bun runtime installed - no `bun install` required.

2. **Plugin Variable Paths**: Hook commands use `${CLAUDE_PLUGIN_ROOT}` which expands at runtime to the plugin's installation location.

3. **Dual-Purpose Repository**: The repo serves as both development environment (TypeScript source) and distribution package (built bundles).

## Goals

- Package existing hooks implementation as installable plugin
- Maintain cross-platform compatibility (Windows, macOS, Linux)
- Enable zero-dependency installation (only Bun runtime required)
- Integrate with existing claude-dotnet-marketplace
- Establish semantic versioning for future updates
- Automate builds and releases via GitHub Actions
