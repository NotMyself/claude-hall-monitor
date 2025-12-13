# Feature: plan-styles - Plan Tracker CSS Styles

## Context

The viewer styles are in `.claude/hooks/viewer/styles/theme.css`. We need to add styles for the plan tracker components.

## Objective

Add CSS styles for plan tracker components including plan cards, progress bars, and feature lists.

## Constraints

- Reference: See constraints.md for global rules
- Use `.plan-` prefix for all new classes
- Include dark theme variants
- Follow existing styling patterns

## Files to Create/Modify

- `.claude/hooks/viewer/styles/theme.css` - Add plan tracker styles

## Implementation Details

Add these styles at the end of the CSS file:

```css
/* ===== Plan Tracker Styles ===== */

.plan-tracker {
  padding: 1rem;
}

.plan-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
}

.plan-controls label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1rem;
}

.plan-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.plan-card.status-active {
  border-left: 4px solid var(--color-info);
}

.plan-card.status-completed {
  border-left: 4px solid var(--color-success);
}

.plan-card-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
}

.plan-card-header:hover {
  background: var(--bg-hover);
}

.plan-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.plan-title h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.plan-status-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.plan-status-badge.active {
  background: var(--color-info-bg);
  color: var(--color-info);
}

.plan-status-badge.completed {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.plan-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.plan-progress {
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-success);
  transition: width 0.3s ease;
}

.progress-fill.has-failed {
  background: linear-gradient(90deg, var(--color-success) 0%, var(--color-error) 100%);
}

.progress-fill.in-progress {
  background: var(--color-info);
  animation: progress-pulse 1.5s ease-in-out infinite;
}

@keyframes progress-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.progress-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.plan-card-content {
  padding: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}

.feature-item:last-child {
  border-bottom: none;
}

.feature-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 0.35rem;
  flex-shrink: 0;
}

.feature-status-dot.pending {
  background: var(--text-tertiary);
}

.feature-status-dot.in_progress {
  background: var(--color-info);
  animation: pulse 1.5s ease-in-out infinite;
}

.feature-status-dot.completed {
  background: var(--color-success);
}

.feature-status-dot.failed {
  background: var(--color-error);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

.feature-content {
  flex: 1;
  min-width: 0;
}

.feature-title {
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.feature-meta {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.feature-layer {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  background: var(--bg-tertiary);
  border-radius: 3px;
  margin-right: 0.5rem;
}

.feature-details {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-size: 0.75rem;
}

.feature-details h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.feature-details ul {
  margin: 0;
  padding-left: 1rem;
}

.feature-details li {
  margin-bottom: 0.125rem;
}

.plan-empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.plan-empty h3 {
  margin-bottom: 0.5rem;
}

/* Layer grouping */
.layer-group {
  margin-bottom: 1rem;
}

.layer-header {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 0.5rem;
}

/* Dark theme adjustments */
[data-theme="dark"] .plan-card {
  background: var(--bg-secondary);
}

[data-theme="dark"] .progress-bar {
  background: var(--bg-tertiary);
}
```

Also add these CSS variables if not already present:

```css
:root {
  --color-info: #3b82f6;
  --color-info-bg: rgba(59, 130, 246, 0.1);
  --color-success: #22c55e;
  --color-success-bg: rgba(34, 197, 94, 0.1);
  --color-error: #ef4444;
  --color-error-bg: rgba(239, 68, 68, 0.1);
}
```

## Acceptance Criteria

- [ ] .plan-tracker container styles added
- [ ] .plan-card with status variants (active/completed)
- [ ] .progress-bar with animated fill
- [ ] .feature-item with status dots (pending/in_progress/completed/failed)
- [ ] .feature-status-dot with appropriate colors and animations
- [ ] Dark theme variants work correctly
- [ ] Styles are responsive

## Verification

```bash
grep -q 'plan-tracker' .claude/hooks/viewer/styles/theme.css
```

## Commit

```bash
git add .claude/hooks/viewer/styles/theme.css
git commit -m "feat(plan-tracker): add CSS styles for plan tracker"
```

## Next

Proceed to: `06-plan-component.md`
