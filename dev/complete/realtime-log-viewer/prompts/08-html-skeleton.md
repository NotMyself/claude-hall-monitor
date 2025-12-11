# Feature: 08-html-skeleton - HTML Skeleton

## Context
Features 01-07 are complete:
- `.claude/hooks/viewer/types.ts` - Type definitions
- `.claude/hooks/viewer/config.ts` - Configuration
- `.claude/hooks/viewer/watcher.ts` - File watcher
- `.claude/hooks/viewer/server.ts` - HTTP server with SSE and API
- `.claude/hooks/viewer/styles/theme.css` - Complete theme

## Objective
Create the base HTML structure with Vue 3 CDN setup, font loading, and app initialization scaffold.

**It is unacceptable to implement features beyond the scope of this task.**
**It is unacceptable to implement Vue components** - only create the skeleton and app mount point.

## Constraints
- Reference: See `constraints.md` for global rules
- Use Vue 3 from CDN (unpkg or jsdelivr)
- Load Poppins font from Google Fonts
- Link theme.css
- Create minimal Vue app that mounts to #app

## Files to Create/Modify
- `.claude/hooks/viewer/index.html` - Replace placeholder with HTML skeleton

## Implementation Details

```html
<!DOCTYPE html>
<html lang="en" data-theme="system">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claude Code Hook Viewer</title>

  <!-- Google Fonts: Poppins -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">

  <!-- Theme CSS -->
  <link rel="stylesheet" href="/styles/theme.css">

  <!-- Vue 3 from CDN -->
  <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
</head>
<body>
  <div id="app">
    <div class="app-container">
      <!-- Header -->
      <header class="header">
        <h1>Hook Viewer</h1>
        <!-- ThemeToggle component will go here -->
        <div class="theme-toggle" @click="cycleTheme">
          {{ themeIcon }}
        </div>
      </header>

      <!-- Main Content -->
      <main>
        <!-- TabContainer and LogViewer components will go here -->
        <p>Loading...</p>
      </main>

      <!-- Footer -->
      <footer class="footer">
        <div class="connection-status">
          <span class="status-dot" :class="{ connected: isConnected }"></span>
          <span>{{ connectionText }}</span>
        </div>
        <div class="entry-count">
          {{ entries.length }} entries
        </div>
      </footer>
    </div>
  </div>

  <script>
    const { createApp, ref, computed, onMounted, onUnmounted } = Vue;

    // ===== Vue App =====
    const app = createApp({
      setup() {
        // Theme state
        const theme = ref(localStorage.getItem('theme') || 'system');
        const themeIcon = computed(() => {
          const icons = { light: '☀️', dark: '🌙', system: '💻' };
          return icons[theme.value];
        });

        function cycleTheme() {
          const modes = ['light', 'dark', 'system'];
          const idx = modes.indexOf(theme.value);
          theme.value = modes[(idx + 1) % modes.length];
          localStorage.setItem('theme', theme.value);
          document.documentElement.setAttribute('data-theme', theme.value);
        }

        // Connection state (placeholder for SSE)
        const isConnected = ref(false);
        const connectionText = computed(() =>
          isConnected.value ? 'Connected' : 'Disconnected'
        );

        // Entries state (placeholder)
        const entries = ref([]);

        // Initialize theme on mount
        onMounted(() => {
          document.documentElement.setAttribute('data-theme', theme.value);
        });

        return {
          theme,
          themeIcon,
          cycleTheme,
          isConnected,
          connectionText,
          entries,
        };
      },
    });

    // ===== Component Registration (placeholders) =====
    // Components will be registered in subsequent features:
    // - 09-eventbadge: app.component('event-badge', {...})
    // - 10-themetoggle: app.component('theme-toggle', {...})
    // - 11-filterbar: app.component('filter-bar', {...})
    // - 12-logentry: app.component('log-entry', {...})
    // - 13-logviewer: app.component('log-viewer', {...})
    // - 14-tabcontainer: app.component('tab-container', {...})

    // Mount the app
    app.mount('#app');
  </script>
</body>
</html>
```

## Acceptance Criteria
- [ ] Valid HTML5 document with lang="en"
- [ ] Vue 3 loaded from CDN (unpkg)
- [ ] Poppins and Fira Code fonts from Google Fonts
- [ ] Theme CSS linked at /styles/theme.css
- [ ] App mount point div#app exists
- [ ] Basic Vue app created with createApp()
- [ ] Theme state with localStorage persistence
- [ ] Theme toggle button cycles light/dark/system
- [ ] data-theme attribute updated on html element
- [ ] Footer shows connection status and entry count
- [ ] Comments indicate where components will be added

## Verification
```bash
test -f .claude/hooks/viewer/index.html && echo "HTML file exists"
grep -q 'vue@3' .claude/hooks/viewer/index.html && echo "Vue 3 CDN found"
grep -q 'Poppins' .claude/hooks/viewer/index.html && echo "Poppins font found"
grep -q "div id=\"app\"" .claude/hooks/viewer/index.html && echo "App mount point found"
```

## Commit
After verification passes:
```bash
git add .claude/hooks/viewer/index.html
git commit -m "feat(viewer): add HTML skeleton with Vue 3 setup

- Load Vue 3 from CDN
- Load Poppins and Fira Code fonts
- Link theme.css stylesheet
- Basic Vue app with theme toggle
- Footer with connection status placeholder
- Scaffold for component registration"
```

## Next
Proceed to: `prompts/09-eventbadge.md`
