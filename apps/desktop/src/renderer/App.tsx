import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppConfig } from '@gitissueblog/shared';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Issues from './pages/Issues';
import Labels from './pages/Labels';
import Settings from './pages/Settings';
import { ConfigProvider } from './contexts/ConfigContext';

function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const appConfig = await window.electronAPI.getConfig();
        setConfig(appConfig);
      } catch (error) {
        console.error('Failed to load config:', error);
        // Set default config if loading fails
        setConfig({
          github: {
            token: '',
            username: '',
            defaultRepository: '',
          },
          editor: {
            theme: 'light',
            fontSize: 14,
            autoSave: true,
            autoSaveInterval: 5000,
          },
          ui: {
            sidebarWidth: 300,
            showLineNumbers: true,
            wordWrap: true,
          },
        });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const updateConfig = async (newConfig: Partial<AppConfig>) => {
    try {
      const updatedConfig = await window.electronAPI.setConfig(newConfig);
      setConfig(updatedConfig);
    } catch (error) {
      console.error('Failed to update config:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">正在加载...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive">配置加载失败</p>
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider value={{ config, updateConfig }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/issues" element={<Issues />} />
          <Route path="/labels" element={<Labels />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
