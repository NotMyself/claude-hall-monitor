# Feature: 10-themetoggle - ThemeToggle Component

## Context
Feature 09-eventbadge is complete. The EventBadge component is registered.

The HTML skeleton already has inline theme toggle logic in the main app. This feature extracts it into a reusable component.

## Objective
Create the ThemeToggle Vue component that cycles between light/dark/system themes.

**It is unacceptable to implement features beyond the scope of this task.**

## Constraints
- Reference: See `constraints.md` for global rules
- Extract existing theme logic into component
- Persist theme preference to localStorage
- Update data-theme attribute on document
- Show icon indicating current theme

## Files to Create/Modify
- `.claude/hooks/viewer/index.html` - Add ThemeToggle component, update header to use it

## Implementation Details

### Add Component Registration

```javascript
// ===== ThemeToggle Component =====
app.component('theme-toggle', {
  template: `
    <button class="theme-toggle" @click="cycle" :title="'Theme: ' + current">
      <span class="theme-icon">{{ icon }}</span>
      <span class="theme-label">{{ current }}</span>
    </button>
  `,
  data() {
    return {
      current: localStorage.getItem('theme') || 'system',
    };
  },
  computed: {
    icon() {
      const icons = { light: '☀️', dark: '🌙', system: '💻' };
      return icons[this.current] || '💻';
    },
  },
  methods: {
    cycle() {
      const modes = ['light', 'dark', 'system'];
      const idx = modes.indexOf(this.current);
      this.current = modes[(idx + 1) % modes.length];
      this.apply();
    },
    apply() {
      localStorage.setItem('theme', this.current);
      document.documentElement.setAttribute('data-theme', this.current);
    },
  },
  mounted() {
    this.apply();
  },
});
```

### Update Header in Template

Replace the inline theme toggle div in the header:

```html
<header class="header">
  <h1>Hook Viewer</h1>
  <theme-toggle></theme-toggle>
</header>
```

### Remove Inline Theme Logic

Remove these from the main app's setup():
- `theme` ref
- `themeIcon` computed
- `cycleTheme` function
- The onMounted theme initialization

Keep only what's needed for connection status and entries.

## Acceptance Criteria
- [ ] Component registered as 'theme-toggle'
- [ ] Cycles through light → dark → system → light on click
- [ ] Persists preference to localStorage key 'theme'
- [ ] Updates data-theme attribute on html element
- [ ] Shows icon (☀️/🌙/💻) for current theme
- [ ] Shows text label of current theme
- [ ] Applies theme on component mount
- [ ] Header uses <theme-toggle> component
- [ ] Inline theme logic removed from main app

## Verification
```bash
grep -q "app.component('theme-toggle'" .claude/hooks/viewer/index.html && echo "ThemeToggle registered"
grep -q "<theme-toggle>" .claude/hooks/viewer/index.html && echo "ThemeToggle used in template"
grep -q "localStorage.setItem('theme'" .claude/hooks/viewer/index.html && echo "localStorage persistence found"
```

## Commit
After verification passes:
```bash
git add .claude/hooks/viewer/index.html
git commit -m "feat(viewer): add ThemeToggle component

- Cycles light/dark/system themes
- Persists to localStorage
- Updates data-theme attribute
- Shows icon and label for current theme"
```

## Next
Proceed to: `prompts/11-filterbar.md`
