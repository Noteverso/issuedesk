import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { IssueFilter, CreateIssueInput, UpdateIssueInput, Issue } from '@issuedesk/shared';
import { useIssues } from '../hooks/useIssues';
import { useIssue } from '../hooks/useIssue';
import { useSettings } from '../hooks/useSettings';
import { ipcClient } from '../services/ipc';
import { IssueList } from '../components/issue/IssueList';
import { IssueCard } from '../components/issue/IssueCard';
import { IssueFilters } from '../components/issue/IssueFilters';
import { IssueEditor } from '../components/issue/IssueEditor';
import { ViewToggle, type ViewMode } from '../components/common/ViewToggle';

export default function Issues() {
  const [filter, setFilter] = useState<IssueFilter>({});
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);

  // Get settings and view preferences
  const { settings, updateViewPreferences } = useSettings();
  const [viewMode, setViewMode] = useState<ViewMode>(settings?.viewPreferences.issues || 'list');

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

  const { create } = useIssue({
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

  const handleEditIssue = (issue: Issue) => {
    setEditingIssue(issue);
    setEditorOpen(true);
  };

  const handleSaveIssue = async (data: CreateIssueInput | UpdateIssueInput) => {
    if (editingIssue) {
      await ipcClient.issues.update({ id: editingIssue.id, data: data as UpdateIssueInput });
    } else {
      await create(data as CreateIssueInput);
    }
    await refetch();
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingIssue(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Issues</h1>
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
            onIssueClick={(issue) => handleEditIssue(issue)}
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
                  onClick={() => handleEditIssue(issue)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Issue Editor Modal */}
      <IssueEditor
        key={editingIssue?.id || 'new'}
        issue={editingIssue}
        isOpen={editorOpen}
        onClose={handleCloseEditor}
        onSave={handleSaveIssue}
      />
    </div>
  );
}
