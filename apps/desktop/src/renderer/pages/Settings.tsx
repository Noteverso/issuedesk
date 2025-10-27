import React, { useState, useEffect } from 'react';
import { useConfig } from '../contexts/ConfigContext';
import { useTheme } from '../components/common/ThemeProvider';
import { Repository } from '@issuedesk/shared';
import { 
  Github, 
  Key, 
  Database, 
  User, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Save
} from 'lucide-react';

export default function Settings() {
  const { settings, updateSettings } = useConfig();
  const { theme, setTheme } = useTheme();
  const [repositories, setRepositories] = useState<any[]>([]); // Use any[] for GitHub API responses
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);

  // Get active repository info
  const activeRepo = settings.repositories.find(r => r.id === settings.activeRepositoryId);
  
  // Form states
  const [githubToken, setGithubToken] = useState('');
  const [defaultRepository, setDefaultRepository] = useState(settings.activeRepositoryId || '');
  const [fontSize, setFontSize] = useState(14); // Default from old config
  const [autoSave, setAutoSave] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(5000);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);

  useEffect(() => {
    // Load token on mount
    window.electronAPI.settings.getToken().then((response) => {
      if (response.token) {
        setGithubToken(response.token);
      }
    });
  }, []);

  useEffect(() => {
    if (githubToken) {
      loadRepositories();
    }
  }, [githubToken]);

  const loadRepositories = async () => {
    if (!githubToken) return;

    try {
      setLoading(true);
      // Use new settings handler to get repositories
      const response = await window.electronAPI.settings.getRepositories(githubToken);
      if (response.success && response.data) {
        setRepositories(response.data);
      }
    } catch (error) {
      console.error('Load repositories error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!githubToken) return;

    try {
      setTesting(true);
      setConnectionStatus('idle');
      setConnectionMessage('');

      // Test connection using new settings handlers
      const response = await window.electronAPI.settings.testConnection(githubToken);
      const userResponse = await window.electronAPI.settings.getUser(githubToken);

      if (response?.success) {
        setConnectionStatus('success');
        setConnectionMessage('连接成功！');
        if (userResponse?.success && userResponse.data) {
          setUserInfo(userResponse.data);
        }
      } else {
        setConnectionStatus('error');
        setConnectionMessage(response?.message || '连接失败');
        setUserInfo(null);
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionMessage('连接失败');
      setUserInfo(null);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveStatus('idle');
      
      // Save token
      await window.electronAPI.settings.setToken({
        token: githubToken
      });

      // Save repository if changed
      if (defaultRepository && defaultRepository !== settings.activeRepositoryId) {
        const [owner, name] = defaultRepository.split('/');
        if (owner && name) {
          await window.electronAPI.settings.setRepository({ owner, name });
        }
      }

      // Update theme
      await updateSettings({ theme });
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleTokenChange = (token: string) => {
    setGithubToken(token);
    setConnectionStatus('idle');
    setConnectionMessage('');
    setUserInfo(null);
    setRepositories([]);
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">设置</h1>
          <p className="text-muted-foreground">
            配置 GitHub 连接和应用程序设置
          </p>
        </div>

        <div className="space-y-8">
          {/* GitHub Configuration */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Github className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">GitHub 配置</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Personal Access Token *
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="password"
                      value={githubToken}
                      onChange={(e) => handleTokenChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    />
                  </div>
                  <button
                    onClick={testConnection}
                    disabled={!githubToken || testing}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {testing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      '测试连接'
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  需要 repo 和 user 权限。在 GitHub 设置中创建 Personal Access Token。
                </p>
              </div>

              {/* Connection Status */}
              {connectionMessage && (
                <div className={`flex items-center space-x-2 p-3 rounded-md ${
                  connectionStatus === 'success' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {connectionStatus === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm ${
                    connectionStatus === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {connectionMessage}
                  </span>
                </div>
              )}

              {/* User Info */}
              {userInfo && (
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-md">
                  <img
                    src={userInfo.avatar_url}
                    alt={userInfo.login}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{userInfo.name || userInfo.login}</p>
                    <p className="text-sm text-muted-foreground">@{userInfo.login}</p>
                  </div>
                </div>
              )}

              {/* Repository Selection */}
              {repositories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    默认仓库
                  </label>
                  <select
                    value={defaultRepository}
                    onChange={(e) => setDefaultRepository(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">选择仓库</option>
                    {repositories.map((repo) => (
                      <option key={repo.id} value={repo.full_name}>
                        {repo.full_name}
                        {repo.private && ' (私有)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Editor Settings */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Database className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">编辑器设置</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">主题</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="light">浅色</option>
                  <option value="dark">深色</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  字体大小: {fontSize}px
                </label>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={autoSave}
                    onChange={(e) => setAutoSave(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm font-medium">自动保存</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  自动保存间隔: {autoSaveInterval / 1000}秒
                </label>
                <input
                  type="range"
                  min="1000"
                  max="60000"
                  step="1000"
                  value={autoSaveInterval}
                  onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* UI Settings */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">界面设置</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  侧边栏宽度: {sidebarWidth}px
                </label>
                <input
                  type="range"
                  min="200"
                  max="500"
                  value={sidebarWidth}
                  onChange={(e) => setSidebarWidth(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showLineNumbers}
                    onChange={(e) => setShowLineNumbers(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm font-medium">显示行号</span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={wordWrap}
                    onChange={(e) => setWordWrap(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm font-medium">自动换行</span>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-4 items-center">
            {saveStatus === 'success' && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                保存成功！
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                保存失败
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  保存设置
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
