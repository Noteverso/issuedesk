import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useConfig } from '../contexts/ConfigContext';
import { Issue, Label } from '@issuedesk/shared';
import { ipcClient } from '../services/ipc';
import { 
  Github, 
  FileText, 
  Tag, 
  AlertCircle, 
  CheckCircle,
  Clock,
  TrendingUp,
  Settings
} from 'lucide-react';

export default function Dashboard() {
  const { settings } = useConfig();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings.activeRepositoryId) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [settings.activeRepositoryId]);

  const loadDashboardData = async () => {
    if (!settings.activeRepositoryId) return;

    try {
      setLoading(true);
      setError(null);

      // Load issues and labels using the new IPC API
      const [issuesResponse, labelsResponse] = await Promise.all([
        ipcClient.issues.list({ perPage: 10 }),
        ipcClient.labels.list()
      ]);

      setIssues(issuesResponse.issues);
      setLabels(labelsResponse.labels);
    } catch (err) {
      setError('加载数据失败');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalIssues: issues.length,
    openIssues: issues.filter(issue => issue.state === 'open').length,
    closedIssues: issues.filter(issue => issue.state === 'closed').length,
    totalLabels: labels.length,
    blogIssues: issues.filter(issue => 
      issue.labels.some(label => label.name === 'blog' || label.name === 'Blog')
    ).length,
    noteIssues: issues.filter(issue => 
      issue.labels.some(label => label.name === 'note' || label.name === 'Note')
    ).length,
  };

  if (!settings.activeRepositoryId) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Github className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">欢迎使用 IssueDesk</h1>
            <p className="text-muted-foreground mb-6">
              请先在设置中配置 GitHub Token 和仓库以开始使用
            </p>
            <div className="space-x-4">
              <Link 
                to="/settings" 
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                前往设置
              </Link>
              <button
                onClick={() => {
                  console.log('🧪 Testing window.electronAPI...');
                  console.log('window.electronAPI:', window.electronAPI);
                  if (window.electronAPI) {
                    console.log('✅ window.electronAPI is available!');
                    console.log('Available methods:', Object.keys(window.electronAPI));
                  } else {
                    console.log('❌ window.electronAPI is not available');
                  }
                }}
                className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
              >
                测试 Electron API
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">正在加载数据...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">加载失败</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button 
              onClick={loadDashboardData}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            {settings.activeRepositoryId 
              ? `管理仓库 ${settings.activeRepositoryId} 的 Issues 和标签`
              : '请设置默认仓库以查看详细信息'
            }
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">总 Issues</p>
                <p className="text-2xl font-bold">{stats.totalIssues}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">开放 Issues</p>
                <p className="text-2xl font-bold text-green-600">{stats.openIssues}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">博客文章</p>
                <p className="text-2xl font-bold text-blue-600">{stats.blogIssues}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">标签数量</p>
                <p className="text-2xl font-bold">{stats.totalLabels}</p>
              </div>
              <Tag className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Recent Issues */}
        {issues.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">最近的 Issues</h2>
            <div className="space-y-3">
              {issues.slice(0, 5).map((issue) => (
                <div key={issue.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex-1">
                    <h3 className="font-medium truncate">{issue.title}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        issue.state === 'open' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {issue.state === 'open' ? '开放' : '已关闭'}
                      </span>
                      {issue.labels.map((label) => {
                        return (
                          <span 
                            key={label.id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={label ? { 
                              backgroundColor: `#${label.color}20`,
                              color: `#${label.color}`
                            } : {}}
                          >
                            {label.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    #{issue.number}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link 
            to="/issues" 
            className="bg-card border border-border rounded-lg p-6 hover:bg-accent transition-colors"
          >
            <FileText className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">管理 Issues</h3>
            <p className="text-sm text-muted-foreground">
              创建、编辑和管理你的博客文章和笔记
            </p>
          </Link>

          <Link 
            to="/labels" 
            className="bg-card border border-border rounded-lg p-6 hover:bg-accent transition-colors"
          >
            <Tag className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">管理标签</h3>
            <p className="text-sm text-muted-foreground">
              创建和管理标签，组织你的内容
            </p>
          </Link>

          <Link 
            to="/settings" 
            className="bg-card border border-border rounded-lg p-6 hover:bg-accent transition-colors"
          >
            <Settings className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">设置</h3>
            <p className="text-sm text-muted-foreground">
              配置 GitHub 连接和应用程序设置
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
