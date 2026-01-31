/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GITHUB_APP_SLUG?: string;

  /**
   * Authentication worker backend URL
   * Overrides the default backend URL for both dev and prod
   * @example 'http://localhost:8787' (development)
   * @example 'https://yourname.workers.dev' (production)
   */
  readonly AUTH_WORKER_URL?: string;

  /**
   * Production authentication worker URL
   * Used as fallback when NODE_ENV is 'production' and AUTH_WORKER_URL is not set
   * @example 'https://yourname.workers.dev'
   */
  readonly PROD_AUTH_WORKER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production' | 'test';
      ELECTRON_IS_DEV?: string;

      /**
       * Authentication worker backend URL
       * Overrides the default backend URL for both dev and prod
       * @example 'http://localhost:8787' (development)
       * @example 'https://yourname.workers.dev' (production)
       */
      AUTH_WORKER_URL?: string;

      /**
       * Production authentication worker URL
       * Used as fallback when NODE_ENV is 'production' and AUTH_WORKER_URL is not set
       * @example 'https://yourname.workers.dev'
       */
      PROD_AUTH_WORKER_URL?: string;
    }
  }
}

export {};
