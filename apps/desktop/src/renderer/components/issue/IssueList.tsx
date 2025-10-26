import React from 'react';
import { Issue } from '@issuedesk/shared';
import { Circle, CheckCircle, Tag, ExternalLink, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface IssueListProps {
  issues: Issue[];
  loading?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onIssueClick?: (issue: Issue) => void;
}

export function IssueList({
  issues,
  loading = false,
  page = 1,
  totalPages = 1,
  onPageChange,
  onIssueClick,
}: IssueListProps) {
  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Circle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No issues found</h3>
        <p className="text-sm text-muted-foreground">
          Create your first issue to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Table header */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
        <div className="col-span-1">Status</div>
        <div className="col-span-5">Title</div>
        <div className="col-span-3">Labels</div>
        <div className="col-span-2">Created</div>
        <div className="col-span-1">Actions</div>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-border">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => onIssueClick?.(issue)}
          >
            {/* Status */}
            <div className="col-span-1 flex items-center">
              {issue.state === 'open' ? (
                <div className="flex items-center text-green-500">
                  <Circle className="h-5 w-5" />
                  <span className="ml-2 md:hidden">Open</span>
                </div>
              ) : (
                <div className="flex items-center text-purple-500">
                  <CheckCircle className="h-5 w-5" />
                  <span className="ml-2 md:hidden">Closed</span>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="col-span-1 md:col-span-5">
              <div className="flex items-start space-x-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate" title={issue.title}>
                    {issue.title}
                  </p>
                  <p className="text-xs text-muted-foreground">#{issue.number}</p>
                </div>
              </div>
            </div>

            {/* Labels */}
            <div className="col-span-1 md:col-span-3">
              {issue.labels && issue.labels.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {issue.labels.slice(0, 3).map((label) => (
                    <span
                      key={label.id}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                      style={{
                        backgroundColor: `#${label.color}20`,
                        color: `#${label.color}`,
                        borderColor: `#${label.color}40`,
                        borderWidth: '1px',
                      }}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {label.name}
                    </span>
                  ))}
                  {issue.labels.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{issue.labels.length - 3}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">No labels</span>
              )}
            </div>

            {/* Created */}
            <div className="col-span-1 md:col-span-2 flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              <span className="hidden md:inline">
                {formatTimeAgo(issue.created_at)}
              </span>
              <span className="md:hidden">
                {formatDate(issue.created_at)}
              </span>
            </div>

            {/* Actions */}
            <div className="col-span-1 flex items-center justify-end md:justify-start">
              {issue.github_url && (
                <a
                  href={issue.github_url}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.electronAPI?.system?.openExternal({ url: issue.github_url });
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  title="Open on GitHub"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>

            {/* Sync status (mobile) */}
            {issue.syncStatus !== 'synced' && (
              <div className="col-span-1 md:hidden">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    issue.syncStatus === 'conflict'
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-yellow-500/10 text-yellow-500'
                  }`}
                >
                  {issue.syncStatus === 'conflict' ? 'Conflict' : 'Pending sync'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-md border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page === totalPages}
              className="p-2 rounded-md border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default IssueList;
