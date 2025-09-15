import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { VitePlugin } from '@electron-forge/plugin-vite';

const config: ForgeConfig = {
  packagerConfig: {
    asar: false,
    executableName: 'IssueDesk',
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({}),
    new MakerZIP({}, ['darwin']),
    new MakerDeb({}),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          // Electron main process
          entry: 'src/main/main.ts',
          config: 'vite.main.config.mts',
        },
        {
          // Preload script
          entry: 'src/main/preload.ts',
          config: 'vite.preload.config.mts',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.render.config.mts',
        },
      ],
    }),
  ],
};

export default config;

