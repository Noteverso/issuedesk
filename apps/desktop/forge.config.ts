import { FuseV1Options, FuseVersion } from '@electron/fuses';

const config = {
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
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
        icon: './assets/icons/issue-desk-icon.icns',
        background: undefined,
      },
    },
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        iconUrl: 'https://raw.githubusercontent.com/Noteverso/issuedesk/main/apps/desktop/assets/icons/issue-desk-icon.ico',
        setupIcon: './assets/icons/issue-desk-icon.ico',
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          icon: './assets/icons/issue-desk-icon.png',
        },
      },
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: './assets/icons/issue-desk-icon.png',
        },
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          {
            // Electron main process
            entry: 'src/main/main.ts',
            config: 'vite.main.config.mts',
            target: 'main',
          },
          {
            // Preload script
            entry: 'src/main/preload.ts',
            config: 'vite.preload.config.mts',
            target: 'preload',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.render.config.mts',
          },
        ],
      },
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    {
      name: '@electron-forge/plugin-fuses',
      config: {
        version: FuseVersion.V1,
        [FuseV1Options.RunAsNode]: false,
        [FuseV1Options.EnableCookieEncryption]: true,
        [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
        [FuseV1Options.EnableNodeCliInspectArguments]: false,
        [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
        [FuseV1Options.OnlyLoadAppFromAsar]: true,
      },
    },
  ],
};

export default config;

