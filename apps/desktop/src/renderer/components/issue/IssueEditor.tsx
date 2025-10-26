import React, { useState, useEffect } from 'react';
import { Issue, CreateIssueInput, UpdateIssueInput } from '@issuedesk/shared';
import { X } from 'lucide-react';
import MarkdownEditor from '../markdown/MarkdownEditor';

interface IssueEditorProps {
  issue?: Issue | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateIssueInput | UpdateIssueInput) => Promise<void>;
}

export function IssueEditor({ issue, isOpen, onClose, onSave }: IssueEditorProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when issue changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(issue?.title || '');
      setBody(issue?.body || '');
      setError(null);
    }
  }, [issue, isOpen]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (issue) {
        // Update existing issue
        await onSave({ title, body });
      } else {
        // Create new issue
        await onSave({ title, body });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save issue');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-card rounded-lg shadow-xl w-full max-w-3xl border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              {issue ? `Edit Issue #${issue.number}` : 'Create New Issue'}
            </h2>
            <button
              onClick={handleClose}
              disabled={saving}
              className="p-1 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <div className="px-6 py-4 space-y-4">
            {/* Error message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Title input */}
            <div>
              <label htmlFor="issue-title" className="block text-sm font-medium text-foreground mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="issue-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter issue title..."
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                disabled={saving}
                maxLength={256}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {title.length}/256 characters
              </p>
            </div>

            {/* Body markdown editor */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <MarkdownEditor
                content={body}
                onChange={setBody}
                placeholder="Add a description... (supports GitHub Flavored Markdown)"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Use markdown formatting: **bold**, *italic*, `code`, lists, and more
              </p>
            </div>

            {/* Labels placeholder (US3) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Labels
              </label>
              <div className="px-4 py-3 bg-muted/50 border border-border rounded-md">
                <p className="text-xs text-muted-foreground">
                  Label management will be available in User Story 3
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
            <button
              onClick={handleClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : issue ? 'Update Issue' : 'Create Issue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IssueEditor;
