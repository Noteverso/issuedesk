import React from 'react';
import { Comment } from '@issuedesk/shared';
import { MessageSquare, Tag, Calendar, User } from 'lucide-react';

interface CommentListProps {
  comments: Comment[];
  loading?: boolean;
  onCommentClick?: (comment: Comment) => void;
  onEdit?: (comment: Comment) => void;
  onDelete?: (comment: Comment) => void;
}

export function CommentList({
  comments,
  loading = false,
  onCommentClick,
  onEdit,
  onDelete,
}: CommentListProps) {
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateBody = (body: string, maxLength = 100) => {
    if (!body) return '';
    // Strip HTML metadata comments
    const cleanBody = body
      .replace(/<!--\s*title:.*?-->/gi, '')
      .replace(/<!--\s*description:.*?-->/gi, '')
      .replace(/<!--\s*tags:.*?-->/gi, '')
      .trim();
    return cleanBody.length > maxLength ? `${cleanBody.slice(0, maxLength)}...` : cleanBody;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No comments yet</h3>
        <p className="text-sm text-muted-foreground">
          Be the first to comment on this issue
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Table header */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
        {/* <div className="col-span-1">Author</div> */}
        <div className="col-span-4">Title / Body</div>
        <div className="col-span-3">Tags</div>
        <div className="col-span-2">Created</div>
        <div className="col-span-2">Actions</div>
      </div>

      {/* Table rows - sorted newest first */}
      <div className="divide-y divide-border">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => onCommentClick?.(comment)}
          >
            {/* Author */}
            {/* <div className="col-span-1 flex items-center">
              <div className="flex items-center text-muted-foreground">
                <User className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium truncate">{comment.author}</span>
              </div>
            </div> */}

            {/* Title / Body */}
            <div className="col-span-4 flex flex-col min-w-0">
              {comment.title && (
                <div className="font-medium text-foreground truncate mb-1" title={comment.title}>
                  {comment.title}
                </div>
              )}
              {comment.description && (
                <div className="text-xs text-muted-foreground italic mb-1">
                  {comment.description}
                </div>
              )}
              <div className="text-sm text-muted-foreground truncate">
                {truncateBody(comment.body)}
              </div>
            </div>

            {/* Tags */}
            <div className="col-span-3 flex flex-wrap gap-1 items-center">
              {comment.tags.length > 0 ? (
                comment.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">No tags</span>
              )}
              {comment.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{comment.tags.length - 3} more
                </span>
              )}
            </div>

            {/* Created */}
            <div className="col-span-2 flex items-center">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                <span title={formatDate(comment.createdAt)}>
                  {formatTimeAgo(comment.createdAt)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="col-span-2 flex items-center space-x-2">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(comment);
                  }}
                  className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(comment);
                  }}
                  className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CommentList;
