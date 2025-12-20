# Edge Cases

| ID | Case | Handling | Affected Features |
|----|------|----------|-------------------|
| EC001 | SSE connection drops unexpectedly | Implement auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s). Show connection status indicator in header. | F006, F010 |
| EC002 | No active plans running | Display empty state with helpful message: "No active orchestrations. Plans will appear here when started." Include link to documentation. | F013 |
| EC003 | Many concurrent plans (5+ running simultaneously) | Automatically switch from expanded PlanCard to compact PlanCardCompact view to fit more plans on screen. Use virtualization if >10 plans. | F011, F012, F013 |
| EC004 | API request fails | Show toast notification with error message. Use error boundaries to prevent page crashes. Provide retry button where applicable. | F005, F030 |
| EC005 | Large session list (100+ sessions) | Implement virtual scrolling to render only visible items. Load sessions in pages of 50. | F022 |
| EC006 | Theme preference persistence | Store theme choice in localStorage. Fall back to system preference if no saved value. Sync across tabs using storage events. | F009 |
| EC007 | Mobile/tablet viewport | Collapse sidebar into sheet drawer. Stack split-panel views vertically. Use bottom sheet for detail views on mobile. | F008, F030 |
