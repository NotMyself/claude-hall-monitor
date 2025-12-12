# Feature: dashboard-styles - Dashboard CSS Styles

## Context

The viewer uses CSS in `viewer/styles/theme.css` with CSS variables for theming. It supports light, dark, and system themes via `[data-theme]` attribute.

## Objective

Add CSS styles for all dashboard UI components.

**IMPORTANT**: Only implement this feature. Do not implement any other features.

## Constraints

Reference: See `constraints.md` for global rules.

- Add to existing `viewer/styles/theme.css` file
- Use existing CSS variables
- Support both light and dark themes
- Follow existing naming conventions

## Files to Modify

- `.claude/hooks/viewer/styles/theme.css` - Add dashboard styles

## Implementation Details

Add these styles at the end of `theme.css`:

```css
/* ===== Dashboard Styles ===== */

.dashboard {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 24px;
}

.dashboard-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
}

.dashboard-section h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--primary);
}

/* Session Grid */
.session-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.session-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 16px;
  transition: border-color 0.2s;
}

.session-card.status-active {
  border-left: 3px solid #10B981;
}

.session-card.status-inactive {
  border-left: 3px solid #F59E0B;
}

.session-card.status-ended {
  border-left: 3px solid #6B7280;
  opacity: 0.7;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.session-id {
  font-family: var(--font-mono);
  font-size: 0.9em;
  font-weight: 500;
}

.status-badge {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 9999px;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.active {
  background: #D1FAE5;
  color: #065F46;
}

.status-badge.inactive {
  background: #FEF3C7;
  color: #92400E;
}

.status-badge.ended {
  background: #E5E7EB;
  color: #4B5563;
}

[data-theme="dark"] .status-badge.active {
  background: #064E3B;
  color: #6EE7B7;
}

[data-theme="dark"] .status-badge.inactive {
  background: #78350F;
  color: #FCD34D;
}

[data-theme="dark"] .status-badge.ended {
  background: #374151;
  color: #9CA3AF;
}

.session-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.stat {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.session-time {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-align: right;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.model-stats {
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  padding: 16px;
}

.model-stats h3 {
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0 0 12px 0;
}

.token-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.token-stat {
  display: flex;
  flex-direction: column;
}

.token-stat .label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.token-stat .value {
  font-size: 1rem;
  font-weight: 600;
  font-family: var(--font-mono);
}

/* Configuration Groups */
.config-group {
  margin-top: 16px;
}

.config-group:first-child {
  margin-top: 0;
}

.config-group h3 {
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0 0 8px 0;
  color: var(--text-secondary);
}

.config-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-item {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.config-name {
  font-family: var(--font-mono);
  font-size: 0.85em;
  font-weight: 500;
  color: var(--primary);
  min-width: 140px;
  flex-shrink: 0;
}

.config-desc {
  font-size: 0.85em;
  color: var(--text-secondary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.config-list .empty {
  padding: 8px 12px;
  color: var(--text-secondary);
  font-style: italic;
}

/* Dashboard Loading State */
.dashboard-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-secondary);
}

.dashboard-empty {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.dashboard-empty h3 {
  margin: 0 0 8px 0;
  color: var(--text-primary);
}

.dashboard-empty p {
  margin: 0;
}
```

## Acceptance Criteria

- [ ] `.dashboard` container styles added
- [ ] `.dashboard-section` with card styling
- [ ] `.session-grid` with responsive grid layout
- [ ] `.session-card` with status-based left border colors
- [ ] `.status-badge` with active (green), inactive (yellow), ended (gray) variants
- [ ] Dark theme overrides for status badges
- [ ] `.session-stats` grid for message/tool/compaction counts
- [ ] `.stats-grid` and `.model-stats` for token display
- [ ] `.token-stats` with label/value pairs
- [ ] `.config-group`, `.config-list`, `.config-item` for configuration display
- [ ] Loading and empty states styled
- [ ] All styles use existing CSS variables where applicable

## Verification

```bash
# Check file was modified
cat .claude/hooks/viewer/styles/theme.css | grep -c "dashboard"
# Should return > 0
```

## Commit

```bash
git add .claude/hooks/viewer/styles/theme.css
git commit -m "feat(dashboard): add dashboard CSS styles"
```

## Next

Proceed to: `prompts/08-dashboard-component.md` (can run in parallel with this feature)
