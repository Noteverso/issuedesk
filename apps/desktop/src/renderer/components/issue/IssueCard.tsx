import React from 'react';
import { Issue } from '@issuedesk/shared';
import { Circle, CheckCircle, Tag, ExternalLink, Calendar } from 'lucide-react';

interface IssueCardProps {
  issue: Issue;
  onClick?: (issue: Issue) => void;
  onEdit?: (issue: Issue) => void;
  onDelete?: (issue: Issue) => void;
}

export function IssueCard({ issue, onClick, onEdit, onDelete }: IssueCardProps) {
  const truncateBody = (body: string | null, maxLength = 150) => {
    if (!body) return '';
    return body.length > maxLength ? `${body.slice(0, maxLength)}...` : body;
  };

  const formatTimeAgo = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - date.getTime();
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

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(issue);
    }
  };

  return (
    <div
      className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {issue.state === 'open' ? (
            <Circle className="h-5 w-5 text-green-500 shrink-0" />
          ) : (
            <CheckCircle className="h-5 w-5 text-purple-500 shrink-0" />
          )}
          <h3 className="font-medium text-foreground truncate" title={issue.title}>
            {issue.title}
          </h3>
          <span className="text-sm text-muted-foreground shrink-0">
            #{issue.number}
          </span>
        </div>
        
        {issue.html_url && (
          <a
            href={issue.html_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.electronAPI?.system?.openExternal({ url: issue.html_url });
            }}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      {/* Body preview */}
      {issue.body && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {truncateBody(issue.body)}
        </p>
      )}

      {/* Labels */}
      {issue.labels && issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {issue.labels.map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
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
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3" />
          <span>
            {formatTimeAgo(issue.created_at)}
          </span>
        </div>

        {/* Sync status indicator */}
        {issue.syncStatus !== 'synced' && (
          <span
            className={`px-2 py-0.5 rounded text-xs ${
              issue.syncStatus === 'conflict'
                ? 'bg-red-500/10 text-red-500'
                : 'bg-yellow-500/10 text-yellow-500'
            }`}
          >
            {issue.syncStatus === 'conflict' ? 'Conflict' : 'Pending sync'}
          </span>
        )}
      </div>
    </div>
  );
}

export default IssueCard;
