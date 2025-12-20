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
      '/api': {
        target: 'http://localhost:3456',
        changeOrigin: true,
      },
      '/events': {
        target: 'http://localhost:3456',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Output to dist/ directory (default)
    outDir: 'dist',
    // Generate source maps for debugging
    sourcemap: true,
    // Rollup options
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-slot', 'lucide-react'],
        },
      },
    },
    // Target modern browsers
    target: 'esnext',
  },
});
