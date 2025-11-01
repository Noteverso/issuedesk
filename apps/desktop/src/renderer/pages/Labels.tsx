import React, { useState, useEffect } from 'react';
import { useConfig } from '../contexts/ConfigContext';
import { Label, CreateLabelInput, UpdateLabelInput } from '@issuedesk/shared';
import { ipcClient } from '../services/ipc';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Tag,
  Palette,
  Loader2
} from 'lucide-react';
import { useToast, ToastContainer } from '../components/common/Toast';

export default function Labels() {
  const { settings } = useConfig();
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingLabel, setDeletingLabel] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (settings.activeRepositoryId) {
      loadLabels();
    }
  }, [settings.activeRepositoryId]);

  const loadLabels = async () => {
    if (!settings.activeRepositoryId) return;

    try {
      setLoading(true);
      
      const result = await ipcClient.labels.list();
      console.log(result)
      setLabels(result.labels || []);
    } catch (err: any) {
      toast.error('加载标签失败', err?.message || '请稍后重试');
      console.error('Load labels error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLabel = async (labelData: CreateLabelInput) => {
    if (!settings.activeRepositoryId) return;

    try {
      await ipcClient.labels.create(labelData);
      toast.success('创建成功', `标签 "${labelData.name}" 已创建`);
      setShowCreateModal(false);
      loadLabels(); // 重新加载列表
    } catch (err: any) {
      toast.error('创建标签失败', err?.message || '请稍后重试');
      console.error('Create label error:', err);
      throw err; // Re-throw to let modal handle it
    }
  };

  const handleUpdateLabel = async (labelName: string, labelData: UpdateLabelInput) => {
    if (!settings.activeRepositoryId) return;

    try {
      await ipcClient.labels.update({ id: labelName, data: labelData });
      toast.success('更新成功', `标签已更新`);
      setEditingLabel(null);
      loadLabels(); // 重新加载列表
    } catch (err: any) {
      toast.error('更新标签失败', err?.message || '请稍后重试');
      console.error('Update label error:', err);
      throw err; // Re-throw to let modal handle it
    }
  };

  const handleDeleteLabel = async (labelName: string) => {
    if (!settings.activeRepositoryId) return;
    if (deletingLabel) return; // Prevent multiple deletes at once
    if (!confirm(`确定要删除标签 "${labelName}" 吗？`)) return;

    try {
      setDeletingLabel(labelName);
      await ipcClient.labels.delete({ id: labelName });
      toast.success('删除成功', `标签 "${labelName}" 已删除`);
      loadLabels(); // 重新加载列表
    } catch (err: any) {
      toast.error('删除标签失败', err?.message || '请稍后重试');
      console.error('Delete label error:', err);
    } finally {
      setDeletingLabel(null);
    }
  };

  console.log('labels:', labels);
  const filteredLabels = labels.filter(label => 
    label.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (label.description && label.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get active repository info
  const activeRepo = settings.repositories.find(r => r.id === settings.activeRepositoryId);
  const repoFullName = activeRepo ? `${activeRepo.owner}/${activeRepo.name}` : '';

  if (!settings.activeRepositoryId) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">请先在设置中配置仓库</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ToastContainer messages={toast.messages} onClose={toast.closeToast} />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Labels</h1>
            <p className="text-muted-foreground">
              管理仓库 {repoFullName} 的标签
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            title="创建新标签"
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
            title="刷新标签列表"
          >
            {loading ? '加载中...' : '刷新'}
          </button>
        </div>

        {/* Labels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLabels.map((label) => {
            const isDeleting = deletingLabel === label.name;
            return (
              <div 
                key={label.id} 
                className={`bg-card border border-border rounded-lg p-4 transition-opacity ${
                  isDeleting ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: `#${label.color}` }}
                    />
                    <span className="font-medium">{label.name}</span>
                    {isDeleting && (
                      <span className="text-xs text-muted-foreground">(删除中...)</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setEditingLabel(label)}
                      disabled={isDeleting}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      title="编辑标签"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteLabel(label.name)}
                      disabled={isDeleting}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                      title={isDeleting ? '删除中...' : '删除标签'}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {label.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {label.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>颜色: #{label.color}</span>
                </div>
              </div>
            );
          })}
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
  onSubmit: (data: CreateLabelInput) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('0366d6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        color: color,
      });
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setIsSubmitting(false);
    }
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
              disabled={isSubmitting}
              className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSubmitting ? '创建中...' : '创建'}
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
  onSubmit: (data: UpdateLabelInput) => Promise<void>;
}) {
  const [name, setName] = useState(label.name);
  const [description, setDescription] = useState(label.description || '');
  const [color, setColor] = useState(label.color);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        new_name: name.trim(),
        description: description.trim() || undefined,
        color: color,
      });
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setIsSubmitting(false);
    }
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
              disabled={isSubmitting}
              className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSubmitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
