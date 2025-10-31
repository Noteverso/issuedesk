import React from 'react';
import { Comment } from '@issuedesk/shared';
import { Tag, Calendar, User, Edit, Trash2 } from 'lucide-react';

interface CommentCardProps {
  comment: Comment;
  onClick?: (comment: Comment) => void;
  onEdit?: (comment: Comment) => void;
  onDelete?: (comment: Comment) => void;
}

export function CommentCard({ comment, onClick, onEdit, onDelete }: CommentCardProps) {
  const truncateBody = (body: string, maxLength = 200) => {
    if (!body) return '';
    // Strip HTML metadata comments
    const cleanBody = body
      .replace(/<!--\s*title:.*?-->/gi, '')
      .replace(/<!--\s*description:.*?-->/gi, '')
      .replace(/<!--\s*tags:.*?-->/gi, '')
      .trim();
    return cleanBody.length > maxLength ? `${cleanBody.slice(0, maxLength)}...` : cleanBody;
  };

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

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(comment);
    }
  };

  return (
    <div
      className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <User className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-foreground">{comment.author}</span>
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(comment.createdAt)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 shrink-0 ml-2">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(comment);
              }}
              className="p-1 rounded hover:bg-accent transition-colors"
              title="Edit comment"
            >
              <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(comment);
              }}
              className="p-1 rounded hover:bg-accent transition-colors"
              title="Delete comment"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </button>
          )}
        </div>
      </div>

      {/* Title & Description */}
      {comment.title && (
        <div className="mb-2">
          <h3 className="font-semibold text-foreground text-lg">{comment.title}</h3>
        </div>
      )}
      {comment.description && (
        <div className="mb-2">
          <p className="text-sm text-muted-foreground italic">{comment.description}</p>
        </div>
      )}

      {/* Body preview */}
      <div className="mb-3">
        <p className="text-sm text-foreground whitespace-pre-wrap">
          {truncateBody(comment.body)}
        </p>
      </div>

      {/* Tags */}
      {comment.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {comment.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
            >
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            Created {formatTimeAgo(comment.createdAt)}
          </span>
          {comment.updatedAt !== comment.createdAt && (
            <span className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              Updated {formatTimeAgo(comment.updatedAt)}
            </span>
          )}
        </div>
        {comment.tags.length > 0 && (
          <span className="flex items-center">
            <Tag className="h-3 w-3 mr-1" />
            {comment.tags.length} {comment.tags.length === 1 ? 'tag' : 'tags'}
          </span>
        )}
      </div>
    </div>
  );
}

export default CommentCard;
