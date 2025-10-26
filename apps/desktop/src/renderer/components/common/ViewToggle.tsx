import React from 'react';
import { List, LayoutGrid } from 'lucide-react';

export type ViewMode = 'list' | 'card';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ value, onChange, className = '' }: ViewToggleProps) {
  return (
    <div className={`inline-flex rounded-md shadow-sm ${className}`} role="group">
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`
          px-3 py-2 text-sm font-medium border border-border rounded-l-md
          transition-colors focus:z-10 focus:ring-2 focus:ring-primary
          ${
            value === 'list'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
          }
        `}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('card')}
        className={`
          px-3 py-2 text-sm font-medium border border-l-0 border-border rounded-r-md
          transition-colors focus:z-10 focus:ring-2 focus:ring-primary
          ${
            value === 'card'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
          }
        `}
        aria-label="Card view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
    </div>
  );
}

export default ViewToggle;
