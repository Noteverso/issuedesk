import { defineConfig, loadEnv } from 'vite';
import { builtinModules } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// __dirname equivalent for ESM
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Vite config for Electron main process
export default defineConfig(({ mode }) => {
  // Load env file from project root
  const env = loadEnv(mode, __dirname, '');
  
  return {
    resolve: {
      alias: {
        // Bundle workspace packages instead of relying on runtime resolution
        '@issuedesk/shared': resolve(__dirname, '../../packages/shared/src'),
        '@issuedesk/github-api': resolve(__dirname, '../../packages/github-api/src'),
      },
    },
    define: {
      // Inject environment variables as process.env.*
      'process.env.AUTH_WORKER_URL': JSON.stringify(env.AUTH_WORKER_URL || ''),
      'process.env.PROD_AUTH_WORKER_URL': JSON.stringify(env.PROD_AUTH_WORKER_URL || ''),
    },
    build: {
      outDir: '.vite/build',
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
        ],
      },
      minify: false,
    },
  };
});
