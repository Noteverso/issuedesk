import { IpcApi } from '@issuedesk/shared';

declare global {
  interface Window {
    electronAPI: IpcApi;
  }
}

export {};
