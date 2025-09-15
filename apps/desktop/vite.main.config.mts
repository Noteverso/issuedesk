import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';
import { resolve } from 'node:path';

// Vite config for Electron main process
export default defineConfig({
  build: {
    outDir: 'dist/main',
    emptyOutDir: false,
    sourcemap: true,
    target: 'node20',
    rollupOptions: {
      input: 'src/main/main.ts',
      output: {
        format: 'cjs',
        entryFileNames: 'main.js',
      },
      external: [
        'electron',
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
        '@issuedesk/shared',
        '@issuedesk/github-api',
      ],
    },
    minify: false,
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../../packages/shared/src'),
      '@github-api': resolve(__dirname, '../../packages/github-api/src'),
    },
  },
});

