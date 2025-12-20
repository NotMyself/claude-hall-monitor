# HTML Patterns

## Vite Template

Basic index.html entry point for Vite:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Claude Hall Monitor - Realtime Metrics Dashboard" />
    <title>Claude Hall Monitor</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## With Favicon

Including favicon and meta tags:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Monitor plan orchestrations, metrics, and sessions in realtime" />
    <meta name="theme-color" content="#D4A27F" />
    <title>Claude Hall Monitor</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## React Entry Point

main.tsx structure:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## App Component

Root App.tsx with router:

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppLayout } from './components/layout/app-layout';
import { OverviewPage } from './pages/overview';
import { PlansPage } from './pages/plans';
import { SessionsPage } from './pages/sessions';
import { SettingsPage } from './pages/settings';

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppLayout>
      <Toaster />
    </BrowserRouter>
  );
}
```

## Layout Structure

AppLayout component structure:

```typescript
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './app-sidebar';
import { Header } from './header';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

## Favicon SVG

Simple SVG favicon:

```xml
<!-- public/favicon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#D4A27F" stroke-width="2">
  <rect x="3" y="3" width="18" height="18" rx="2" />
  <path d="M9 9h6v6H9z" />
</svg>
```

## Loading State

HTML skeleton for initial load:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Claude Hall Monitor</title>
    <style>
      /* Inline critical CSS for loading state */
      #root {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background-color: #FDFDF7;
      }
      .loader {
        width: 48px;
        height: 48px;
        border: 4px solid #D4A27F;
        border-bottom-color: transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @media (prefers-color-scheme: dark) {
        #root {
          background-color: #09090B;
        }
      }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="loader"></div>
    </div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## Error Page

404 or error fallback HTML:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Error - Claude Hall Monitor</title>
    <style>
      body {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        font-family: system-ui, -apple-system, sans-serif;
        background-color: #FDFDF7;
        color: #333;
      }
      .error-container {
        text-align: center;
        max-width: 400px;
        padding: 2rem;
      }
      h1 {
        font-size: 4rem;
        margin: 0;
        color: #D4A27F;
      }
      p {
        font-size: 1.25rem;
        margin: 1rem 0;
      }
      a {
        color: #D4A27F;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <div class="error-container">
      <h1>404</h1>
      <p>Page not found</p>
      <a href="/">Return to dashboard</a>
    </div>
  </body>
</html>
```

## PostCSS Config

postcss.config.js for Tailwind:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

## TypeScript Config

tsconfig.json for React + Vite:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

tsconfig.node.json for Vite config:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

## Vite Config

vite.config.ts with path aliases:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3456',
      '/events': 'http://localhost:3456',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```
