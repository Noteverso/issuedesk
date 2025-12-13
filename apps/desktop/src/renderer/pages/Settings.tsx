import React, { useState, useEffect } from 'react';
import { useConfig } from '../contexts/ConfigContext';
import { useTheme } from '../components/common/ThemeProvider';
import { 
  Database, 
  User, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Save,
  Cloud,
  Upload
} from 'lucide-react';

export default function Settings() {
  const { updateSettings } = useConfig();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [fontSize, setFontSize] = useState(14); // Default from old config
  const [autoSave, setAutoSave] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(5000);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);

  // R2 Configuration states
  const [r2Enabled, setR2Enabled] = useState(false);
  const [r2AccountId, setR2AccountId] = useState('');
  const [r2AccessKeyId, setR2AccessKeyId] = useState('');
  const [r2SecretAccessKey, setR2SecretAccessKey] = useState('');
  const [r2BucketName, setR2BucketName] = useState('');
  const [r2PublicUrl, setR2PublicUrl] = useState('');
  const [r2Testing, setR2Testing] = useState(false);
  const [r2Status, setR2Status] = useState<'idle' | 'success' | 'error'>('idle');
  const [r2Message, setR2Message] = useState('');

  // Load R2 configuration on mount
  useEffect(() => {
    window.electronAPI.settings.getR2Config().then((response) => {
      if (response.config) {
        setR2Enabled(response.config.enabled);
        setR2AccountId(response.config.accountId);
        setR2AccessKeyId(response.config.accessKeyId);
        setR2SecretAccessKey(response.config.secretAccessKey);
        setR2BucketName(response.config.bucketName);
        setR2PublicUrl(response.config.publicUrl);
      }
    });
  }, []);

  const testR2Connection = async () => {
    try {
      setR2Testing(true);
      setR2Status('idle');
      setR2Message('');

      // First save the config (temporarily) so the test can use it
      const config = {
        accountId: r2AccountId,
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
        bucketName: r2BucketName,
        publicUrl: r2PublicUrl,
        enabled: r2Enabled,
      };

      await window.electronAPI.settings.setR2Config(config);

      // Now test the connection
      const response = await window.electronAPI.settings.testR2Connection();
      
      if (response.success) {
        setR2Status('success');
        setR2Message('连接成功');
      } else {
        setR2Status('error');
        setR2Message(response.message || '连接失败');
      }
    } catch (error) {
      setR2Status('error');
      setR2Message('连接测试失败');
    } finally {
      setR2Testing(false);
    }
  };

  const saveR2Config = async () => {
    try {
      const config = {
        accountId: r2AccountId,
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
        bucketName: r2BucketName,
        publicUrl: r2PublicUrl,
        enabled: r2Enabled,
      };

      await window.electronAPI.settings.setR2Config(config);
      console.log('R2 configuration saved');
    } catch (error) {
      console.error('Failed to save R2 configuration:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveStatus('idle');
      
      // Update theme
      await updateSettings({ theme });
      
      // Save R2 configuration
      await saveR2Config();
      
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

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            配置 GitHub 连接和应用程序设置
          </p>
        </div>

        <div className="space-y-8">
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

          {/* Cloudflare R2 Settings */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Cloud className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Cloudflare R2 图片存储</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="r2-enabled"
                  checked={r2Enabled}
                  onChange={(e) => setR2Enabled(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="r2-enabled" className="text-sm font-medium">
                  启用 R2 图片上传
                </label>
              </div>

              {r2Enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Account ID
                    </label>
                    <input
                      type="text"
                      value={r2AccountId}
                      onChange={(e) => setR2AccountId(e.target.value)}
                      placeholder="你的 Cloudflare Account ID"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Access Key ID
                    </label>
                    <input
                      type="text"
                      value={r2AccessKeyId}
                      onChange={(e) => setR2AccessKeyId(e.target.value)}
                      placeholder="R2 Access Key ID"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Secret Access Key
                    </label>
                    <input
                      type="password"
                      value={r2SecretAccessKey}
                      onChange={(e) => setR2SecretAccessKey(e.target.value)}
                      placeholder="R2 Secret Access Key"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Bucket Name
                    </label>
                    <input
                      type="text"
                      value={r2BucketName}
                      onChange={(e) => setR2BucketName(e.target.value)}
                      placeholder="R2 存储桶名称"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Public URL
                    </label>
                    <input
                      type="url"
                      value={r2PublicUrl}
                      onChange={(e) => setR2PublicUrl(e.target.value)}
                      placeholder="https://your-domain.com 或 https://pub-xxx.r2.dev"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      自定义域名或 R2.dev 公共 URL
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <button
                      onClick={testR2Connection}
                      disabled={r2Testing || !r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2BucketName}
                      className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {r2Testing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          测试中...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          测试连接
                        </>
                      )}
                    </button>

                    {r2Status !== 'idle' && (
                      <div className={`mt-2 flex items-center space-x-2 p-2 rounded-md ${
                        r2Status === 'success' 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        {r2Status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm ${
                          r2Status === 'success' ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {r2Message}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
