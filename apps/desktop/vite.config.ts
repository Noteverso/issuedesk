import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
  publicDir: '../public',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
      '@shared': resolve(__dirname, '../../packages/shared/src'),
      '@github-api': resolve(__dirname, '../../packages/github-api/src'),
    },
  },
  server: {
    port: 3000,
  },
});
