#!/usr/bin/env python3
import os

base_dir = "C:/Users/bobby/src/claude/claude-hall-monitor/dev/active/realtime-metrics-dashboard/prompts"

prompts = [
    # F010
    {
        "num": 10, "title": "Install shadcn/ui Data Display Components",
        "objective": "Install shadcn/ui components for data display: card, badge, progress, table, tabs.",
        "depends": ["F003"], "files": ["src/components/ui/*"],
        "commands": "bun x shadcn@latest add card badge progress table tabs", "scope": "shadcn-data"
    },
    # F011
    {
        "num": 11, "title": "Install shadcn/ui Form & Feedback Components",
        "objective": "Install shadcn/ui components: button, input, select, dropdown-menu, tooltip, skeleton, toast, alert.",
        "depends": ["F003"], "files": ["src/components/ui/*"],
        "commands": "bun x shadcn@latest add button input select dropdown-menu tooltip skeleton toast alert", "scope": "shadcn-forms"
    },
    # F012
    {
        "num": 12, "title": "Install shadcn/ui Chart Components",
        "objective": "Install shadcn/ui chart components and Recharts dependency.",
        "depends": ["F003"], "files": ["src/components/ui/chart.tsx"],
        "commands": "bun x shadcn@latest add chart", "scope": "shadcn-charts"
    },
    # F013
    {
        "num": 13, "title": "Build Layout Components",
        "objective": "Create app-sidebar, header, and page-container layout components.",
        "depends": ["F009"], "files": ["src/components/layout/app-sidebar.tsx", "src/components/layout/header.tsx", "src/components/layout/page-container.tsx"],
        "commands": "", "scope": "layout", "decisions": ["D003"], "code_refs": ["code/typescript.md#components"]
    },
    # F014
    {
        "num": 14, "title": "Create App Shell with Layout",
        "objective": "Update App.tsx with sidebar, header, and main content area layout.",
        "depends": ["F004", "F013"], "files": ["src/App.tsx"],
        "commands": "", "scope": "app-shell", "code_refs": ["code/typescript.md#components"]
    },
    # F015
    {
        "num": 15, "title": "Build Plan Card Components",
        "objective": "Create plan-card (expanded) and plan-card-compact components.",
        "depends": ["F010"], "files": ["src/components/plans/plan-card.tsx", "src/components/plans/plan-card-compact.tsx"],
        "commands": "", "scope": "plans", "decisions": ["D009"], "edge_cases": ["EC003"], "code_refs": ["code/typescript.md#components"]
    },
    # F016
    {
        "num": 16, "title": "Build Active Orchestrations Component",
        "objective": "Create active-orchestrations component with SSE integration for realtime updates.",
        "depends": ["F015", "F008"], "files": ["src/components/plans/active-orchestrations.tsx"],
        "commands": "", "scope": "plans", "decisions": ["D001", "D007"], "edge_cases": ["EC001", "EC002", "EC003"], "code_refs": ["code/typescript.md#components"]
    },
    # F017
    {
        "num": 17, "title": "Build Metrics Display Components",
        "objective": "Create stat-card and metrics-grid components.",
        "depends": ["F010"], "files": ["src/components/metrics/stat-card.tsx", "src/components/metrics/metrics-grid.tsx"],
        "commands": "", "scope": "metrics", "code_refs": ["code/typescript.md#components"]
    },
    # F018
    {
        "num": 18, "title": "Build Chart Components",
        "objective": "Create cost-chart (area) and tokens-chart (bar) components using Recharts.",
        "depends": ["F012"], "files": ["src/components/metrics/cost-chart.tsx", "src/components/metrics/tokens-chart.tsx"],
        "commands": "", "scope": "metrics", "decisions": ["D011"], "code_refs": ["code/typescript.md#components"]
    },
    # F019
    {
        "num": 19, "title": "Build Plan List and Detail Components",
        "objective": "Create plan-list, plan-detail, and feature-list components.",
        "depends": ["F010"], "files": ["src/components/plans/plan-list.tsx", "src/components/plans/plan-detail.tsx", "src/components/plans/feature-list.tsx"],
        "commands": "", "scope": "plans", "decisions": ["D004"], "edge_cases": ["EC008", "EC009"], "code_refs": ["code/typescript.md#components"]
    },
    # F020
    {
        "num": 20, "title": "Build Orchestration Timeline",
        "objective": "Create orchestration-timeline component for visual parallel execution.",
        "depends": ["F010"], "files": ["src/components/plans/orchestration-timeline.tsx"],
        "commands": "", "scope": "plans", "decisions": ["D005"], "code_refs": ["code/typescript.md#components"]
    },
    # F021
    {
        "num": 21, "title": "Build Session Components",
        "objective": "Create session-list, session-detail, and tool-usage-chart components.",
        "depends": ["F010", "F012"], "files": ["src/components/sessions/session-list.tsx", "src/components/sessions/session-detail.tsx", "src/components/sessions/tool-usage-chart.tsx"],
        "commands": "", "scope": "sessions", "edge_cases": ["EC005"], "code_refs": ["code/typescript.md#components"]
    },
    # F022
    {
        "num": 22, "title": "Build Overview Page",
        "objective": "Assemble Overview page with ActiveOrchestrations, MetricsGrid, and Charts.",
        "depends": ["F016", "F017", "F018"], "files": ["src/pages/overview.tsx"],
        "commands": "", "scope": "overview", "decisions": ["D001"], "edge_cases": ["EC002"], "code_refs": ["code/typescript.md#components"]
    },
    # F023
    {
        "num": 23, "title": "Build Plans Page",
        "objective": "Assemble Plans page with tabs, PlanList, PlanDetail, and OrchestrationTimeline.",
        "depends": ["F019", "F020"], "files": ["src/pages/plans.tsx"],
        "commands": "", "scope": "plans", "decisions": ["D004", "D005"], "code_refs": ["code/typescript.md#components"]
    },
    # F024
    {
        "num": 24, "title": "Build Sessions Page",
        "objective": "Assemble Sessions page with filters, SessionList, and SessionDetail.",
        "depends": ["F021"], "files": ["src/pages/sessions.tsx"],
        "commands": "", "scope": "sessions", "decisions": ["D004"], "edge_cases": ["EC005"], "code_refs": ["code/typescript.md#components"]
    },
    # F025
    {
        "num": 25, "title": "Build Settings Page",
        "objective": "Create Settings page with theme toggle and preferences.",
        "depends": ["F011"], "files": ["src/pages/settings.tsx"],
        "commands": "", "scope": "settings", "code_refs": ["code/typescript.md#components"]
    },
    # F026
    {
        "num": 26, "title": "Implement Loading and Error States",
        "objective": "Add skeletons, error boundaries, toasts, and empty states to all pages.",
        "depends": ["F011", "F022", "F023", "F024"], "files": ["src/components/ui/error-boundary.tsx", "src/lib/toast.ts"],
        "commands": "", "scope": "polish", "edge_cases": ["EC002", "EC004", "EC010"], "code_refs": ["code/typescript.md#error-handling"]
    },
    # F027
    {
        "num": 27, "title": "Add Responsive Design",
        "objective": "Implement mobile viewport handling with collapsible sidebar.",
        "depends": ["F014"], "files": ["src/App.tsx", "src/components/layout/app-sidebar.tsx"],
        "commands": "", "scope": "responsive", "edge_cases": ["EC007"], "code_refs": ["code/css.md#responsive"]
    },
    # F028
    {
        "num": 28, "title": "Implement Keyboard Shortcuts",
        "objective": "Add keyboard shortcuts for navigation and sidebar toggle.",
        "depends": ["F014", "F022", "F023", "F024"], "files": ["src/hooks/use-keyboard.ts", "src/App.tsx"],
        "commands": "", "scope": "keyboard", "code_refs": ["code/typescript.md#hooks"]
    },
    # F029
    {
        "num": 29, "title": "Theme Persistence and System Integration",
        "objective": "Implement localStorage theme persistence with system theme fallback.",
        "depends": ["F025"], "files": ["src/hooks/use-theme.ts", "src/pages/settings.tsx"],
        "commands": "", "scope": "theme", "edge_cases": ["EC006"], "code_refs": ["code/typescript.md#hooks"]
    },
    # F030
    {
        "num": 30, "title": "Update Server Integration",
        "objective": "Modify server.ts to serve React build from dist/.",
        "depends": ["F022", "F023", "F024"], "files": ["hooks/viewer/server.ts"],
        "commands": "", "scope": "server", "decisions": ["D012"], "code_refs": ["code/typescript.md#server"]
    },
    # F031
    {
        "num": 31, "title": "Configure Vite Build Process",
        "objective": "Configure vite.config.ts and update build.ts for production builds.",
        "depends": ["F001", "F030"], "files": ["hooks/viewer/vite.config.ts", "hooks/build.ts"],
        "commands": "", "scope": "build", "code_refs": ["code/html.md#vite-config", "code/bash.md#build"]
    },
    # F032
    {
        "num": 32, "title": "Integration Testing and Verification",
        "objective": "Test all pages with real API, verify SSE, theme, and keyboard shortcuts.",
        "depends": ["F031"], "files": ["src/__tests__/integration.test.tsx"],
        "commands": "", "scope": "testing", "code_refs": ["code/typescript.md#testing"]
    },
]

def generate_prompt(p):
    num = p['num']
    title = p['title']
    obj = p['objective']
    deps = p.get('depends', [])
    files = p.get('files', [])
    cmds = p.get('commands', '')
    scope = p.get('scope', 'viewer')
    decisions = p.get('decisions', [])
    edge_cases = p.get('edge_cases', [])
    code_refs = p.get('code_refs', [])

    next_num = num + 1 if num < 32 else None

    content = f"""# Feature: F{num:03d} - {title}

## Project Context

See `context.md` for feature rationale and architecture vision.

## Prior Work

{chr(10).join([f'- **{d}**: Completed' for d in deps])}

## Objective

{obj}

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope.
"""

    if decisions:
        content += f"""
## Relevant Decisions

From `decisions.md`:
{chr(10).join([f'- **{d}**: See decisions.md for details' for d in decisions])}
"""

    if edge_cases:
        content += f"""
## Edge Cases to Handle

From `edge-cases.md`:
{chr(10).join([f'- **{ec}**: See edge-cases.md for handling details' for ec in edge_cases])}
"""

    if code_refs:
        content += f"""
## Code References

Read these sections before implementing:
{chr(10).join([f'- `{ref}` - Implementation patterns' for ref in code_refs])}
"""

    content += """
## Constraints

- See `constraints.md` for global rules
"""

    if cmds:
        content += f"- Install components using: `{cmds}`\n"

    content += f"""
## Files to Create/Modify

| File | Purpose |
|------|---------|
"""
    for f in files:
        content += f"| `hooks/viewer/{f}` | See objective |\n"

    if cmds:
        content += f"""
## Implementation Details

Run these commands:
```bash
cd C:/Users/bobby/src/claude/claude-hall-monitor/hooks/viewer
{cmds}
```
"""
    else:
        content += """
## Implementation Details

See code references for complete implementation patterns.
"""

    content += f"""
## Acceptance Criteria

- [ ] All files created/modified as specified
- [ ] TypeScript compiles without errors
- [ ] Functionality works as expected

## Verification

```bash
cd C:/Users/bobby/src/claude/claude-hall-monitor/hooks/viewer
bun run tsc --noEmit
```

## Commit

```bash
git add hooks/viewer/
git commit -m "$(cat <<'EOF'
feat({scope}): {title.lower()}

{obj}

Implements: F{num:03d}
"""

    if decisions:
        content += f"Decisions: {', '.join(decisions)}\n"
    if edge_cases:
        content += f"Edge Cases: {', '.join(edge_cases)}\n"

    content += """
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```
"""

    if next_num:
        content += f"\n## Next\n\nProceed to: `prompts/{next_num:02d}-*.md` (F{next_num:03d})\n"
    else:
        content += "\n## Next\n\nAll features complete! Create manifest.jsonl and README.md.\n"

    return content

# Generate all prompts
for p in prompts:
    num = p['num']
    filename = f"{base_dir}/{num:02d}-{p['scope']}.md"
    content = generate_prompt(p)

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Created F{num:03d}")

print(f"\nTotal prompts created: {len(prompts)}")
