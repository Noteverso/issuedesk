import React, { useState } from 'react';
import { CommentFilter, CommentSince } from '@issuedesk/shared';
import { Tag, X, ChevronDown, Clock } from 'lucide-react';

interface CommentFiltersProps {
  filter: CommentFilter;
  onFilterChange: (filter: CommentFilter) => void;
  availableTags?: string[];
}

// Helper function to convert since options to ISO string
const getSinceTimestamp = (since: CommentSince): string => {
  const now = new Date();
  switch (since) {
    case '2hours':
      return new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    case '1day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case '3days':
      return new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    case '1week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '1month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case 'custom':
    default:
      return '';
  }
};



export function CommentFilters({
  filter,
  onFilterChange,
  availableTags = [],
}: CommentFiltersProps) {
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [customSinceDate, setCustomSinceDate] = useState('');

  const selectedTags = filter.tags || [];
  const currentSince = filter.since || null;

  const handleAddTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      const newTags = [...selectedTags, tag];
      onFilterChange({ ...filter, tags: newTags });
      setTagInput('');
      setShowTagSuggestions(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter((tag) => tag !== tagToRemove);
    onFilterChange({ ...filter, tags: newTags.length > 0 ? newTags : undefined });
  };

  const handleSinceChange = (since: CommentSince) => {
    if (since === 'custom') {
      // For custom, we'll use a date input
      setCustomSinceDate('');
      onFilterChange({ ...filter, since: undefined });
    } else if (since) {
      const timestamp = getSinceTimestamp(since);
      onFilterChange({ ...filter, since: timestamp });
    } else {
      onFilterChange({ ...filter, since: undefined });
    }
  };

  const handleCustomSinceChange = (dateStr: string) => {
    setCustomSinceDate(dateStr);
    if (dateStr) {
      const timestamp = new Date(dateStr).toISOString();
      onFilterChange({ ...filter, since: timestamp });
    } else {
      onFilterChange({ ...filter, since: undefined });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleAddTag(tagInput.trim());
    }
  };

  const filteredSuggestions = availableTags.filter(
    (tag) =>
      tag.toLowerCase().includes(tagInput.toLowerCase()) &&
      !selectedTags.includes(tag)
  );

  // Get current since selection for display
  const getCurrentSinceOption = (): CommentSince | null => {
    if (!currentSince) return null;
    
    const now = new Date();
    const sinceDate = new Date(currentSince);
    const diffMs = now.getTime() - sinceDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours <= 2.1) return '2hours';
    if (diffHours <= 24.1) return '1day';
    if (diffHours <= 72.1) return '3days';
    if (diffHours <= 168.1) return '1week';
    if (diffHours <= 720.1) return '1month';
    return 'custom';
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 bg-muted/30 rounded-lg border border-border">
      {/* Since Filter Dropdown */}
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-foreground whitespace-nowrap flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          Show since:
        </label>
        <div className="relative">
          <select
            value={getCurrentSinceOption() || 'all'}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'all') {
                onFilterChange({ ...filter, since: undefined });
              } else {
                handleSinceChange(value as CommentSince);
              }
            }}
            className="appearance-none px-3 py-1.5 pr-8 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All time</option>
            <option value="2hours">2 hours ago</option>
            <option value="1day">1 day ago</option>
            <option value="3days">3 days ago</option>
            <option value="1week">1 week ago</option>
            <option value="1month">1 month ago</option>
            <option value="custom">Custom date</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        
        {/* Custom Date Input */}
        {getCurrentSinceOption() === 'custom' && (
          <input
            type="datetime-local"
            value={customSinceDate}
            onChange={(e) => handleCustomSinceChange(e.target.value)}
            className="px-3 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        )}
      </div>

      {/* Tag Filter */}
      <div className="flex-1">
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center">
            <Tag className="h-4 w-4 mr-1" />
            Filter by tags (AND logic):
          </label>
          
          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <span className="text-xs text-muted-foreground self-center">
                ({selectedTags.length}/20 tags selected)
              </span>
            </div>
          )}

          {/* Tag Input */}
          <div className="relative">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setShowTagSuggestions(e.target.value.length > 0);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowTagSuggestions(tagInput.length > 0)}
              onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
              placeholder={selectedTags.length >= 20 ? '20 tag limit reached' : 'Type to add tags...'}
              disabled={selectedTags.length >= 20}
              className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            
            {/* Tag Suggestions Dropdown */}
            {showTagSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredSuggestions.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleAddTag(tag)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center"
                  >
                    <Tag className="h-3 w-3 mr-2 text-muted-foreground" />
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Helper Text */}
          <p className="text-xs text-muted-foreground">
            Comments must have ALL selected tags to appear (AND logic). Press Enter to add a tag.
          </p>
          {currentSince && (
            <p className="text-xs text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Showing comments updated since {new Date(currentSince).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Clear Filters */}
      {(selectedTags.length > 0 || currentSince) && (
        <div className="flex items-end">
          <button
            onClick={() => {
              onFilterChange({});
              setCustomSinceDate('');
            }}
            className="px-3 py-1.5 text-sm bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md transition-colors whitespace-nowrap"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

export default CommentFilters;
