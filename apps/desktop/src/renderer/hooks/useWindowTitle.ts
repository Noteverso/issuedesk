import { useEffect } from 'react';

interface UseWindowTitleOptions {
  repositoryName?: string;
  baseName?: string;
}

/**
 * Hook for managing the window title based on the current repository
 * Updates both the document title and the native window title via IPC
 */
export function useWindowTitle(options: UseWindowTitleOptions = {}) {
  const { repositoryName, baseName = 'IssueDesk' } = options;

  useEffect(() => {
    const updateTitle = async () => {
      let title = baseName;
      
      if (repositoryName) {
        title = `${repositoryName} - ${baseName}`;
      }

      // Update document title (appears in browser tab during development)
      document.title = title;

      // Update native window title via IPC
      try {
        if (window.electronAPI?.system?.setWindowTitle) {
          await window.electronAPI.system.setWindowTitle(title);
        }
      } catch (error) {
        console.error('Failed to update window title:', error);
      }
    };

    updateTitle();
  }, [repositoryName, baseName]);
}

export default useWindowTitle;