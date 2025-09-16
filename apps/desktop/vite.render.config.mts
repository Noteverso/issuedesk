import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

// Vite config for Electron renderer (React UI)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: 'src/renderer',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
      '@shared': resolve(__dirname, '../../packages/shared/src'),
      '@github-api': resolve(__dirname, '../../packages/github-api/src'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
});
