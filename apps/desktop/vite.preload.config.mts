import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// __dirname equivalent for ESM
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Vite config for Electron preload script
export default defineConfig({
  resolve: {
    alias: {
      // Bundle workspace packages instead of relying on runtime resolution
      '@issuedesk/shared': resolve(__dirname, '../../packages/shared/src'),
    },
  },
  build: {
    outDir: '.vite/build',
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
      ],
    },
    minify: false,
  },
});
