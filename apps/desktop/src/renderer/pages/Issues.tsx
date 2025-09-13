import React, { useState, useEffect } from 'react';
import { useConfig } from '../contexts/ConfigContext';
import { Issue, CreateIssue, UpdateIssue } from '@gitissueblog/shared';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  CheckCircle,
  Circle,
  Tag
} from 'lucide-react';

export default function Issues() {
  const { config } = useConfig();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'open' | 'closed'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);

  useEffect(() => {
    if (config.github.token && config.github.defaultRepository) {
      loadIssues();
    }
  }, [config.github.token, config.github.defaultRepository]);

  const loadIssues = async () => {
    if (!config.github.token || !config.github.defaultRepository) return;

    try {
      setLoading(true);
      setError(null);
      
      const [owner, repo] = config.github.defaultRepository.split('/');
      const response = await window.electronAPI.getIssues(
        config.github.token, 
        owner, 
        repo, 
        { 
          state: filterState,
          per_page: 100 
        }
      );

      if (response.success) {
        setIssues(response.data);
      } else {
        setError(response.message || '加载 Issues 失败');
      }
    } catch (err) {
      setError('加载 Issues 失败');
      console.error('Load issues error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIssue = async (issueData: CreateIssue) => {
    if (!config.github.token || !config.github.defaultRepository) return;

    try {
      const [owner, repo] = config.github.defaultRepository.split('/');
      const response = await window.electronAPI.createIssue(
        config.github.token,
        owner,
        repo,
        issueData
      );

      if (response.success) {
        setShowCreateModal(false);
        loadIssues(); // 重新加载列表
      } else {
        setError(response.message || '创建 Issue 失败');
      }
    } catch (err) {
      setError('创建 Issue 失败');
      console.error('Create issue error:', err);
    }
  };

  const handleUpdateIssue = async (issueNumber: number, issueData: UpdateIssue) => {
    if (!config.github.token || !config.github.defaultRepository) return;

    try {
      const [owner, repo] = config.github.defaultRepository.split('/');
      const response = await window.electronAPI.updateIssue(
        config.github.token,
        owner,
        repo,
        issueNumber,
        issueData
      );

      if (response.success) {
        setEditingIssue(null);
        loadIssues(); // 重新加载列表
      } else {
        setError(response.message || '更新 Issue 失败');
      }
    } catch (err) {
      setError('更新 Issue 失败');
      console.error('Update issue error:', err);
    }
  };

  const filteredIssues = issues.filter(issue => 
    issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (issue.body && issue.body.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!config.github.token) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">请先在设置中配置 GitHub Token</p>
        </div>
      </div>
    );
  }

  if (!config.github.defaultRepository) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">请先在设置中配置默认仓库</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Issues 管理</h1>
            <p className="text-muted-foreground">
              管理仓库 {config.github.defaultRepository} 的 Issues
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            创建 Issue
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索 Issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value as 'all' | 'open' | 'closed')}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">全部</option>
              <option value="open">开放</option>
              <option value="closed">已关闭</option>
            </select>
          </div>

          <button
            onClick={loadIssues}
            disabled={loading}
            className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
          >
            {loading ? '加载中...' : '刷新'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Issues List */}
        <div className="space-y-4">
          {filteredIssues.map((issue) => (
            <div key={issue.id} className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {issue.state === 'open' ? (
                      <Circle className="h-4 w-4 text-green-600" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-gray-600" />
                    )}
                    <h3 className="text-lg font-semibold">{issue.title}</h3>
                    <span className="text-sm text-muted-foreground">#{issue.number}</span>
                  </div>
                  
                  {issue.body && (
                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {issue.body}
                    </p>
                  )}

                  <div className="flex items-center space-x-2">
                    {issue.labels.map((label) => (
                      <span
                        key={label.id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `#${label.color}20`,
                          color: `#${label.color}`
                        }}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {label.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setEditingIssue(issue)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredIssues.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">没有找到 Issues</p>
          </div>
        )}
      </div>

      {/* Create Issue Modal */}
      {showCreateModal && (
        <CreateIssueModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateIssue}
        />
      )}

      {/* Edit Issue Modal */}
      {editingIssue && (
        <EditIssueModal
          issue={editingIssue}
          onClose={() => setEditingIssue(null)}
          onSubmit={(data) => handleUpdateIssue(editingIssue.number, data)}
        />
      )}
    </div>
  );
}

// Create Issue Modal Component
function CreateIssueModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (data: CreateIssue) => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [labelInput, setLabelInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      body: body.trim() || undefined,
      labels: labels.length > 0 ? labels : undefined,
    });
  };

  const addLabel = () => {
    if (labelInput.trim() && !labels.includes(labelInput.trim())) {
      setLabels([...labels, labelInput.trim()]);
      setLabelInput('');
    }
  };

  const removeLabel = (labelToRemove: string) => {
    setLabels(labels.filter(label => label !== labelToRemove));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">创建 Issue</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Issue 标题"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">内容</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Issue 内容（支持 Markdown）"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">标签</label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())}
                className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="输入标签名称"
              />
              <button
                type="button"
                onClick={addLabel}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                添加
              </button>
            </div>
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() => removeLabel(label)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Issue Modal Component
function EditIssueModal({ issue, onClose, onSubmit }: {
  issue: Issue;
  onClose: () => void;
  onSubmit: (data: UpdateIssue) => void;
}) {
  const [title, setTitle] = useState(issue.title);
  const [body, setBody] = useState(issue.body || '');
  const [state, setState] = useState(issue.state);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      body: body.trim() || undefined,
      state,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">编辑 Issue #{issue.number}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">状态</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value as 'open' | 'closed')}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="open">开放</option>
              <option value="closed">已关闭</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">内容</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
