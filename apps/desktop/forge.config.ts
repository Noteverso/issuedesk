import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDMG } from '@electron-forge/maker-dmg'
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    executableName: 'IssueDesk',
    name: 'IssueDesk',
    icon: './assets/icons/issue-desk-icon', // Will use .icns on macOS, .ico on Windows
    appBundleId: 'com.issuedesk.app',
    appCategoryType: 'public.app-category.productivity',
    darwinDarkModeSupport: true,
    osxSign: {},
    osxNotarize: undefined,
  },
  rebuildConfig: {},
  makers: [
    new MakerDMG({
      format: 'ULFO',
      icon: './assets/icons/issue-desk-icon.icns',
      background: undefined,
    }),
    new MakerSquirrel({
      iconUrl: 'https://raw.githubusercontent.com/Noteverso/issuedesk/main/apps/desktop/assets/icons/issue-desk-icon.ico',
      setupIcon: './assets/icons/issue-desk-icon.ico',
    }),
    new MakerRpm({
      options: {
        icon: './assets/icons/issue-desk-icon.png',
      }
    }),
    new MakerDeb({
      options: {
        icon: './assets/icons/issue-desk-icon.png',
      }
    }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          // Electron main process
          entry: 'src/main/main.ts',
          config: 'vite.main.config.mts',
          target: 'main'
        },
        {
          // Preload script
          entry: 'src/main/preload.ts',
          config: 'vite.preload.config.mts',
          target: 'preload'
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.render.config.mts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;

