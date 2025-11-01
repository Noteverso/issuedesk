import React, { useState, useEffect } from 'react';
import { Plus, Edit, MessageSquare } from 'lucide-react';
import { IssueFilter, CreateIssueInput, UpdateIssueInput, Issue, CommentFilter } from '@issuedesk/shared';
import { useIssues } from '../hooks/useIssues';
import { useIssue } from '../hooks/useIssue';
import { useSettings } from '../hooks/useSettings';
import { useComments } from '../hooks/useComments';
import { useComment } from '../hooks/useComment';
import { ipcClient } from '../services/ipc';
import { IssueList } from '../components/issue/IssueList';
import { IssueCard } from '../components/issue/IssueCard';
import { IssueFilters } from '../components/issue/IssueFilters';
import { IssueEditor } from '../components/issue/IssueEditor';
import { CommentList } from '../components/comment/CommentList';
import { CommentCard } from '../components/comment/CommentCard';
import { CommentFilters } from '../components/comment/CommentFilters';
import { CommentEditor } from '../components/comment/CommentEditor';
import { ViewToggle, type ViewMode } from '../components/common/ViewToggle';
import { useToast, ToastContainer } from '../components/common/Toast';

export default function Issues() {
  const [filter, setFilter] = useState<IssueFilter>({});
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [commentEditorOpen, setCommentEditorOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<any>(null);
  const [commentFilter, setCommentFilter] = useState<CommentFilter>({});

  // Toast notifications
  const toast = useToast();

  // Get settings and view preferences
  const { settings, updateViewPreferences } = useSettings();
  const [viewMode, setViewMode] = useState<ViewMode>(settings?.viewPreferences.issues || 'list');
  const [commentViewMode, setCommentViewMode] = useState<ViewMode>('list');

  // Sync viewMode with settings when settings change
  useEffect(() => {
    if (settings?.viewPreferences.issues) {
      setViewMode(settings.viewPreferences.issues);
    }
  }, [settings]);

  const { issues, total, page, totalPages, loading, error, refetch, setPage, setFilter: updateFilter } = useIssues({
    filter,
    autoLoad: true,
  });

  // Hook for creating new issues
  const { create } = useIssue({
    autoLoad: false,
  });

  // Hook for updating/deleting the current editing issue
  const { update, deleteIssue } = useIssue({
    id: editingIssue?.number,
    autoLoad: false,
  });

  const handleFilterChange = (newFilter: IssueFilter) => {
    setFilter(newFilter);
    updateFilter(newFilter);
    setPage(1); // Reset to first page when filter changes
  };

  const handleViewModeChange = async (mode: ViewMode) => {
    setViewMode(mode);
    // Persist the preference
    try {
      await updateViewPreferences({ issues: mode });
    } catch (error) {
      console.error('Failed to save view preference:', error);
    }
  };

  const handleCreateIssue = () => {
    setEditingIssue(null);
    setEditorOpen(true);
  };

  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue);
  };

  const handleBackToList = () => {
    setSelectedIssue(null);
  };

  const handleEditIssue = (issue: Issue) => {
    setEditingIssue(issue);
    setEditorOpen(true);
  };

  const handleSaveIssue = async (data: CreateIssueInput | UpdateIssueInput) => {
    try {
      if (editingIssue) {
        await update(data as UpdateIssueInput);
        toast.success('Issue updated', `Issue #${editingIssue.number} has been updated successfully`);
      } else {
        const newIssue = await create(data as CreateIssueInput);
        toast.success('Issue created', `Issue #${newIssue.number} has been created successfully`);
      }
      await refetch();
      handleCloseEditor();
    } catch (err: any) {
      toast.error(
        editingIssue ? 'Failed to update issue' : 'Failed to create issue',
        err?.message || 'Please try again later'
      );
    }
  };

  const handleCloseIssue = async (issue: Issue) => {
    try {
      await deleteIssue();
      toast.success('Issue closed', `Issue #${issue.number} has been closed successfully`);
      await refetch();
      handleCloseEditor();
    } catch (err: any) {
      toast.error('Failed to close issue', err?.message || 'Please try again later');
    }
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingIssue(null);
  };

  // Comments hooks - only load when an issue is selected
  const { comments, loading: commentsLoading, refetch: refetchComments } = useComments({
    issueNumber: selectedIssue?.number || 0,
    filter: commentFilter,
    autoLoad: !!selectedIssue,
  });

  const { create: createComment, update: updateComment } = useComment({
    autoLoad: false,
  });

  // Extract unique tags from comments for filter
  const availableTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    comments.forEach((comment) => {
      comment.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [comments]);

  const handleCreateComment = () => {
    setEditingComment(null);
    setCommentEditorOpen(true);
  };

  const handleEditComment = (comment: any) => {
    setEditingComment(comment);
    setCommentEditorOpen(true);
  };

  const handleSaveComment = async (data: any) => {
    try {
      if (editingComment && 'githubId' in data) {
        await updateComment(data);
        toast.success('Comment updated', 'Comment has been updated successfully');
      } else {
        await createComment(data);
        toast.success('Comment created', 'Comment has been created successfully');
      }
      await refetchComments();
      handleCloseCommentEditor();
    } catch (err: any) {
      toast.error(
        editingComment ? 'Failed to update comment' : 'Failed to create comment',
        err?.message || 'Please try again later'
      );
    }
  };

  const handleDeleteComment = async (comment: any) => {
    if (!comment.githubId) {
      toast.error('Cannot delete comment', 'Comment ID not found');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this comment?');
    if (!confirmed) return;

    try {
      await ipcClient.comments.delete({
        id: String(comment.githubId),
        githubId: comment.githubId,
      });
      toast.success('Comment deleted', 'Comment has been deleted successfully');
      await refetchComments();
    } catch (err: any) {
      toast.error('Failed to delete comment', err?.message || 'Please try again later');
    }
  };

  const handleCloseCommentEditor = () => {
    setCommentEditorOpen(false);
    setEditingComment(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toast notifications */}
      <ToastContainer messages={toast.messages} onClose={toast.closeToast} />

      {selectedIssue ? (
        // Issue Detail View with Comments
        <>
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToList}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to Issues
                </button>
                <div>
                  <h2 className="text-1xl font-bold text-foreground">
                    #{selectedIssue.number}: {selectedIssue.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleEditIssue(selectedIssue)}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm font-medium"
                >
                  <Edit className="h-4 w-4" />
                  Edit Issue
                </button>
                <button
                  onClick={handleCreateComment}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <MessageSquare className="h-4 w-4" />
                  Add Comment
                </button>
              </div>
            </div>

            {/* Comment Filters and View Toggle */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <CommentFilters
                  filter={commentFilter}
                  onFilterChange={setCommentFilter}
                  availableTags={availableTags}
                />
              </div>
              <ViewToggle value={commentViewMode} onChange={setCommentViewMode} />
            </div>
          </div>

          {/* Comments Content */}
          <div className="flex-1 overflow-auto px-6 py-4">
            {commentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : commentViewMode === 'list' ? (
              <CommentList
                comments={comments}
                loading={commentsLoading}
                onEdit={(comment) => handleEditComment(comment)}
                onDelete={(comment) => handleDeleteComment(comment)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comments.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                    <h3 className="text-lg font-medium text-foreground mb-2">No comments yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Be the first to comment on this issue
                    </p>
                    <button
                      onClick={handleCreateComment}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Add Comment
                    </button>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <CommentCard
                      key={comment.id}
                      comment={comment}
                      onEdit={() => handleEditComment(comment)}
                      onDelete={() => handleDeleteComment(comment)}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          {/* Comment Editor Modal */}
          <CommentEditor
            key={editingComment?.id || 'new'}
            comment={editingComment}
            issueNumber={selectedIssue.number}
            isOpen={commentEditorOpen}
            onClose={handleCloseCommentEditor}
            onSave={handleSaveComment}
          />
        </>
      ) : (
        // Issues List View
        <>
          {/* Header */}
          <div className="flex-shrink-0 p-6 bg-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Issues</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {total} {total === 1 ? 'issue' : 'issues'} total
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ViewToggle value={viewMode} onChange={handleViewModeChange} />
                <button
                  onClick={handleCreateIssue}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  New Issue
                </button>
              </div>
            </div>

            {/* Filters */}
            <IssueFilters filter={filter} onFilterChange={handleFilterChange} />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto px-6 py-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-md mb-4">
                {error.message}
              </div>
            )}

            {viewMode === 'list' ? (
              <IssueList
                issues={issues}
                loading={loading}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                onIssueClick={handleIssueClick}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                  <div className="col-span-full flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : issues.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                    <h3 className="text-lg font-medium text-foreground mb-2">No issues found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create your first issue to get started
                    </p>
                    <button
                      onClick={handleCreateIssue}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      New Issue
                    </button>
                  </div>
                ) : (
                  issues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      onClick={() => handleIssueClick(issue)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Issue Editor Modal */}
      <IssueEditor
        key={editingIssue?.id || 'new'}
        issue={editingIssue}
        isOpen={editorOpen}
        onClose={handleCloseEditor}
        onSave={handleSaveIssue}
        onCloseIssue={handleCloseIssue}
      />
    </div>
  );
}
