import React, { useState } from 'react';
import { IssueFilter } from '@issuedesk/shared';
import { Search, Filter, X } from 'lucide-react';

interface IssueFiltersProps {
  filter: IssueFilter;
  onFilterChange: (filter: IssueFilter) => void;
}

export function IssueFilters({ filter, onFilterChange }: IssueFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(filter.search || '');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onFilterChange({ ...filter, search: value || undefined });
  };

  const handleStateChange = (state: 'open' | 'closed' | undefined) => {
    onFilterChange({ ...filter, state });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    onFilterChange({});
  };

  const hasActiveFilters = filter.search || filter.state;

  return (
    <div className="space-y-4">
      {/* Search bar and state filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search issues..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* State filter buttons */}
        <div className="flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => handleStateChange(undefined)}
            className={`
              px-4 py-2 text-sm font-medium border border-border rounded-l-md
              transition-colors focus:z-10 focus:ring-2 focus:ring-primary
              ${
                !filter.state
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
              }
            `}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => handleStateChange('open')}
            className={`
              px-4 py-2 text-sm font-medium border-t border-b border-border
              transition-colors focus:z-10 focus:ring-2 focus:ring-primary
              ${
                filter.state === 'open'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
              }
            `}
          >
            Open
          </button>
          <button
            type="button"
            onClick={() => handleStateChange('closed')}
            className={`
              px-4 py-2 text-sm font-medium border border-border rounded-r-md
              transition-colors focus:z-10 focus:ring-2 focus:ring-primary
              ${
                filter.state === 'closed'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
              }
            `}
          >
            Closed
          </button>
        </div>

        {/* Advanced filters toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-2 text-sm font-medium border border-border rounded-md bg-background text-foreground hover:bg-accent transition-colors flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
        </button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Advanced filters (expandable) */}
      {isExpanded && (
        <div className="p-4 bg-muted/50 rounded-md border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Label filter (placeholder for US2) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Labels
              </label>
              <p className="text-xs text-muted-foreground">
                Label filtering will be available in User Story 2
              </p>
            </div>

            {/* Sort by (future enhancement) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sort by
              </label>
              <select
                disabled
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm opacity-50 cursor-not-allowed"
              >
                <option>Created (newest)</option>
                <option>Created (oldest)</option>
                <option>Updated</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IssueFilters;
