import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// __dirname equivalent for ESM
const __dirname = fileURLToPath(new URL('.', import.meta.url));

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
        'uuid',
        'better-sqlite3',
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
