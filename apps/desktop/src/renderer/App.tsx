import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { AppSettings } from '@issuedesk/shared';
import Layout from './components/common/Layout';
import { ConfigProvider } from './contexts/ConfigContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './components/common/ThemeProvider';
import { InstallAppPrompt } from './components/auth/InstallAppPrompt';
import { OfflineIndicator } from './components/common/OfflineIndicator'; // T070d

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading, session, refreshSession } = useAuth();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingInstallations, setCheckingInstallations] = useState(false);

  useEffect(() => {
    // Debug: Check if electronAPI is available
    console.log('🔍 Checking window.electronAPI availability...');
    console.log('window.electronAPI:', window.electronAPI);
    console.log('typeof window.electronAPI:', typeof window.electronAPI);
    console.log('Available methods:', window.electronAPI ? Object.keys(window.electronAPI) : 'N/A');
    console.log(isAuthenticated, session?.credentials, settings?.activeRepositoryId);
    
    const loadSettings = async () => {
      try {
        if (!window.electronAPI) {
          throw new Error('window.electronAPI is not available');
        }
        console.log('✅ window.electronAPI is available, calling settings.get...');
        const { settings: appSettings } = await window.electronAPI.settings.get();
        console.log('✅ Settings loaded successfully:', appSettings);
        setSettings(appSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
        // Set default settings if loading fails
        setSettings({
          activeRepositoryId: null,
          repositories: [],
          theme: 'light',
          editorMode: 'preview',
          viewPreferences: {
            issues: 'list',
            labels: 'list',
          },
          rateLimit: null,
          r2Config: null,
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = async (updates: Partial<AppSettings>) => {
    try {
      const { settings: updatedSettings } = await window.electronAPI.settings.update(updates);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleCheckInstallations = async () => {
    setCheckingInstallations(true);
    try {
      await window.electronAPI.auth.checkInstallations();
      await refreshSession();
    } catch (error) {
      console.error('Failed to check installations:', error);
    } finally {
      setCheckingInstallations(false);
    }
  };

  const handleRepositorySelected = async (owner: string, name: string) => {
    console.log(`[App] Configuring repository: ${owner}/${name}`);
    try {
      // Set the repository in settings
      await window.electronAPI.settings.setRepository({ owner, name });
      
      // Reload settings to get updated activeRepositoryId
      const { settings: updatedSettings } = await window.electronAPI.settings.get();
      setSettings(updatedSettings);
      
      console.log(`[App] ✅ Repository configured successfully`);
    } catch (error) {
      console.error('[App] Failed to configure repository:', error);
      throw error;
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated && location.pathname !== '/login') {
      console.log('[App] Not authenticated, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location.pathname]);

  // Show install prompt if authenticated but no installations
  // This should be shown BEFORE the Layout/routing
  if (isAuthenticated && session && (!session.installations || session.installations.length === 0)) {
    return <InstallAppPrompt onRetry={handleCheckInstallations} isRetrying={checkingInstallations} />;
  }

  // Show login page without layout
  if (location.pathname === '/login') {
    return <Outlet />;
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">正在加载...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive">配置加载失败</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ConfigProvider value={{ settings, updateSettings }}>
        <OfflineIndicator />
        <Layout 
          needsRepositorySelection={!!(isAuthenticated && session?.credentials && !settings?.activeRepositoryId)}
          installationToken={session?.credentials?.token}
          onRepositorySelected={handleRepositorySelected}
        />
      </ConfigProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
