import React, { useState, useEffect } from 'react';
import { Comment } from '@issuedesk/shared';
import { X, AlertCircle } from 'lucide-react';
import { MarkdownEditor } from '../markdown/MarkdownEditor';

interface CreateCommentData {
  issueNumber: number;
  title?: string;
  description?: string;
  body: string;
  tags?: string[];
}

interface UpdateCommentData {
  commentId: number;
  title?: string;
  description?: string;
  body?: string;
  tags?: string[];
}

interface CommentEditorProps {
  comment?: Comment | null;
  issueNumber: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateCommentData | UpdateCommentData) => Promise<void>;
}

export function CommentEditor({ comment, issueNumber, isOpen, onClose, onSave }: CommentEditorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when comment changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(comment?.title || '');
      setDescription(comment?.description || '');
      setBody(comment?.body || '');
      setTags(comment?.tags || []);
      setTagInput('');
      setError(null);
    }
  }, [comment, isOpen]);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      if (tags.length >= 20) {
        setError('Maximum 20 tags allowed');
        return;
      }
      if (tag.length > 30) {
        setError('Tag must be 30 characters or less');
        return;
      }
      setTags([...tags, tag]);
      setTagInput('');
      setError(null);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = async () => {
    // Validate required fields
    if (!body.trim()) {
      setError('Comment body is required');
      return;
    }

    // Validate lengths
    if (title.length > 100) {
      setError('Title must be 100 characters or less');
      return;
    }
    if (description.length > 200) {
      setError('Description must be 200 characters or less');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (comment && comment.commentId !== null) {
        // Update existing comment
        await onSave({
          commentId: comment.commentId,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          body: body.trim(),
          tags: tags.length > 0 ? tags : undefined,
        });
      } else {
        // Create new comment
        await onSave({
          issueNumber,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          body: body.trim(),
          tags: tags.length > 0 ? tags : undefined,
        });
      }
      // Don't close here - let parent handle it after success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save comment');
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
          className="relative bg-card rounded-lg shadow-xl w-full max-w-6xl h-[90vh] border border-border flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
            <h2 className="text-lg font-semibold text-foreground">
              {comment ? `Edit Comment #${comment.commentId}` : `Add Comment to Issue #${issueNumber}`}
            </h2>
            <button
              onClick={handleClose}
              disabled={saving}
              className="p-1 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form - Two Column Layout */}
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-3 gap-6 h-full p-6">
              {/* Left Column - Main Editor (2/3 width) */}
              <div className="col-span-2 flex flex-col space-y-4 overflow-y-auto pr-2">
                {/* Error message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-md text-sm flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Body markdown editor - takes most space */}
                <div className="flex-1 flex flex-col min-h-0">
                  <label className="block text-sm font-medium text-foreground mb-2 flex-shrink-0">
                    Comment <span className="text-red-500">*</span>
                  </label>
                  <div className="flex-1 min-h-0">
                    <MarkdownEditor
                      content={body}
                      onChange={setBody}
                      placeholder="Write your comment... (supports GitHub Flavored Markdown)"
                      className="h-full"
                    />
                  </div>
                  {/* <p className="mt-2 text-xs text-muted-foreground flex-shrink-0">
                    Use markdown formatting: **bold**, *italic*, `code`, lists, and more
                  </p> */}
                </div>
              </div>

              {/* Right Column - Metadata (1/3 width) */}
              <div className="col-span-1 flex flex-col space-y-4 border-l border-border pl-6 overflow-y-auto">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Metadata</h3>
                </div>

                {/* Title input (optional) */}
                <div>
                  <label htmlFor="comment-title" className="block text-sm font-medium text-foreground mb-2">
                    Title <span className="text-muted-foreground text-xs">(optional)</span>
                  </label>
                  <input
                    id="comment-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief summary..."
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    disabled={saving}
                    maxLength={100}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {title.length}/100
                  </p>
                </div>

                {/* Description input (optional) */}
                <div>
                  <label htmlFor="comment-description" className="block text-sm font-medium text-foreground mb-2">
                    Description <span className="text-muted-foreground text-xs">(optional)</span>
                  </label>
                  <textarea
                    id="comment-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Longer description..."
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                    disabled={saving}
                    maxLength={200}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {description.length}/200
                  </p>
                </div>

                {/* Tags input (optional) */}
                <div>
                  <label htmlFor="comment-tags" className="block text-sm font-medium text-foreground mb-2">
                    Tags <span className="text-muted-foreground text-xs">(max 20)</span>
                  </label>
                  
                  {/* Selected tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-destructive transition-colors"
                            type="button"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Tag input */}
                  <form onSubmit={handleAddTag} className="space-y-2">
                    <input
                      id="comment-tags"
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder={tags.length >= 20 ? '20 tag limit reached' : 'Type a tag...'}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={saving || tags.length >= 20}
                      maxLength={30}
                    />
                    <button
                      type="submit"
                      disabled={saving || !tagInput.trim() || tags.length >= 20}
                      className="w-full px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Tag
                    </button>
                  </form>
                  
                  <p className="mt-2 text-xs text-muted-foreground">
                    {tags.length}/20 tags
                  </p>
                </div>

                {/* Comment Info */}
                {comment && (
                  <div className="pt-4 border-t border-border space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Comment Info</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>ID: #{comment.commentId}</p>
                      {comment.createdAt && (
                        <p>Created: {new Date(comment.createdAt).toLocaleDateString()}</p>
                      )}
                      {comment.updatedAt && (
                        <p>Updated: {new Date(comment.updatedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
            <button
              onClick={handleClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !body.trim()}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : comment ? 'Update Comment' : 'Add Comment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommentEditor;
