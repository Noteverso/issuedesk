import React, { useState, useEffect } from 'react';
import { useConfig } from '../contexts/ConfigContext';
import { Label, CreateLabelInput, UpdateLabelInput } from '@issuedesk/shared';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Tag,
  Palette
} from 'lucide-react';

export default function Labels() {
  const { config } = useConfig();
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);

  useEffect(() => {
    if (config.github.token && config.github.defaultRepository) {
      loadLabels();
    }
  }, [config.github.token, config.github.defaultRepository]);

  const loadLabels = async () => {
    if (!config.github.token || !config.github.defaultRepository) return;

    try {
      setLoading(true);
      setError(null);
      
      const [owner, repo] = config.github.defaultRepository.split('/');
      const response = await window.electronAPI.getLabels(
        config.github.token, 
        owner, 
        repo
      );

      if (response.success) {
        setLabels(response.data);
      } else {
        setError(response.message || '加载标签失败');
      }
    } catch (err) {
      setError('加载标签失败');
      console.error('Load labels error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLabel = async (labelData: CreateLabelInput) => {
    if (!config.github.token || !config.github.defaultRepository) return;

    try {
      const [owner, repo] = config.github.defaultRepository.split('/');
      const response = await window.electronAPI.createLabel(
        config.github.token,
        owner,
        repo,
        labelData
      );

      if (response.success) {
        setShowCreateModal(false);
        loadLabels(); // 重新加载列表
      } else {
        setError(response.message || '创建标签失败');
      }
    } catch (err) {
      setError('创建标签失败');
      console.error('Create label error:', err);
    }
  };

  const handleUpdateLabel = async (labelName: string, labelData: UpdateLabelInput) => {
    if (!config.github.token || !config.github.defaultRepository) return;

    try {
      const [owner, repo] = config.github.defaultRepository.split('/');
      const response = await window.electronAPI.updateLabel(
        config.github.token,
        owner,
        repo,
        labelName,
        labelData
      );

      if (response.success) {
        setEditingLabel(null);
        loadLabels(); // 重新加载列表
      } else {
        setError(response.message || '更新标签失败');
      }
    } catch (err) {
      setError('更新标签失败');
      console.error('Update label error:', err);
    }
  };

  const handleDeleteLabel = async (labelName: string) => {
    if (!config.github.token || !config.github.defaultRepository) return;
    if (!confirm(`确定要删除标签 "${labelName}" 吗？`)) return;

    try {
      const [owner, repo] = config.github.defaultRepository.split('/');
      const response = await window.electronAPI.deleteLabel(
        config.github.token,
        owner,
        repo,
        labelName
      );

      if (response.success) {
        loadLabels(); // 重新加载列表
      } else {
        setError(response.message || '删除标签失败');
      }
    } catch (err) {
      setError('删除标签失败');
      console.error('Delete label error:', err);
    }
  };

  const filteredLabels = labels.filter(label => 
    label.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (label.description && label.description.toLowerCase().includes(searchTerm.toLowerCase()))
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
            <h1 className="text-3xl font-bold mb-2">标签管理</h1>
            <p className="text-muted-foreground">
              管理仓库 {config.github.defaultRepository} 的标签
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            创建标签
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索标签..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            onClick={loadLabels}
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

        {/* Labels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLabels.map((label) => (
            <div key={label.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: `#${label.color}` }}
                  />
                  <span className="font-medium">{label.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setEditingLabel(label)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  {!label.default && (
                    <button
                      onClick={() => handleDeleteLabel(label.name)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {label.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {label.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>颜色: #{label.color}</span>
                {label.default && (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                    默认标签
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredLabels.length === 0 && !loading && (
          <div className="text-center py-12">
            <Tag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">没有找到标签</p>
          </div>
        )}
      </div>

      {/* Create Label Modal */}
      {showCreateModal && (
        <CreateLabelModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateLabel}
        />
      )}

      {/* Edit Label Modal */}
      {editingLabel && (
        <EditLabelModal
          label={editingLabel}
          onClose={() => setEditingLabel(null)}
          onSubmit={(data) => handleUpdateLabel(editingLabel.name, data)}
        />
      )}
    </div>
  );
}

// Create Label Modal Component
function CreateLabelModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (data: CreateLabelInput) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('0366d6');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      color: color,
    });
  };

  const generateRandomColor = () => {
    const colors = [
      'FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7',
      'DDA0DD', '98D8C8', 'F7DC6F', 'BB8FCE', '85C1E9',
      'F8C471', '82E0AA', 'F1948A', '85C1E9', 'D7BDE2'
    ];
    setColor(colors[Math.floor(Math.random() * colors.length)]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">创建标签</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="标签名称"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">描述</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="标签描述"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">颜色</label>
            <div className="flex items-center space-x-2">
              <div
                className="w-8 h-8 rounded border border-border"
                style={{ backgroundColor: `#${color}` }}
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value.replace('#', ''))}
                className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="0366d6"
                pattern="[0-9a-fA-F]{6}"
              />
              <button
                type="button"
                onClick={generateRandomColor}
                className="p-2 border border-border rounded-md hover:bg-accent transition-colors"
                title="随机颜色"
              >
                <Palette className="h-4 w-4" />
              </button>
            </div>
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

// Edit Label Modal Component
function EditLabelModal({ label, onClose, onSubmit }: {
  label: Label;
  onClose: () => void;
  onSubmit: (data: UpdateLabelInput) => void;
}) {
  const [name, setName] = useState(label.name);
  const [description, setDescription] = useState(label.description || '');
  const [color, setColor] = useState(label.color);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      color: color,
    });
  };

  const generateRandomColor = () => {
    const colors = [
      'FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7',
      'DDA0DD', '98D8C8', 'F7DC6F', 'BB8FCE', '85C1E9',
      'F8C471', '82E0AA', 'F1948A', '85C1E9', 'D7BDE2'
    ];
    setColor(colors[Math.floor(Math.random() * colors.length)]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">编辑标签</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">描述</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">颜色</label>
            <div className="flex items-center space-x-2">
              <div
                className="w-8 h-8 rounded border border-border"
                style={{ backgroundColor: `#${color}` }}
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value.replace('#', ''))}
                className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                pattern="[0-9a-fA-F]{6}"
              />
              <button
                type="button"
                onClick={generateRandomColor}
                className="p-2 border border-border rounded-md hover:bg-accent transition-colors"
                title="随机颜色"
              >
                <Palette className="h-4 w-4" />
              </button>
            </div>
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
