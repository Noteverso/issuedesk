import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';
import { resolve } from 'node:path';

// Vite config for Electron preload script
export default defineConfig({
  build: {
    outDir: 'dist/main',
    emptyOutDir: false,
    sourcemap: true,
    target: 'node20',
    rollupOptions: {
      input: 'src/main/preload.ts',
      output: {
        format: 'cjs',
        entryFileNames: 'preload.js',
      },
      external: [
        'electron',
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
        '@issuedesk/shared',
      ],
    },
    minify: false,
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../../packages/shared/src'),
    },
  },
});

