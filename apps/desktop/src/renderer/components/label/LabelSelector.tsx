import React, { useState, useMemo } from 'react';
import { Label } from '@issuedesk/shared';
import { Search, X, Check } from 'lucide-react';

interface LabelSelectorProps {
  labels: Label[];
  selectedLabels: string[];
  onChange: (labels: string[]) => void;
  disabled?: boolean;
}

/**
 * LabelSelector component - allows selecting/deselecting labels for an issue
 */
export function LabelSelector({ labels, selectedLabels, onChange, disabled = false }: LabelSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Filter labels based on search query
  const filteredLabels = useMemo(() => {
    if (!searchQuery.trim()) return labels;
    const query = searchQuery.toLowerCase();
    return labels.filter(label => 
      label.name.toLowerCase().includes(query) ||
      label.description?.toLowerCase().includes(query)
    );
  }, [labels, searchQuery]);

  const toggleLabel = (labelName: string) => {
    if (disabled) return;
    
    if (selectedLabels.includes(labelName)) {
      onChange(selectedLabels.filter(name => name !== labelName));
    } else {
      onChange([...selectedLabels, labelName]);
    }
  };

  const removeLabel = (labelName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selectedLabels.filter(name => name !== labelName));
  };

  // Get selected label objects for display
  const selectedLabelObjects = useMemo(() => {
    return selectedLabels
      .map(name => labels.find(label => label.name === name))
      .filter((label): label is Label => label !== undefined);
  }, [selectedLabels, labels]);

  return (
    <div className="space-y-2">
      {/* Selected labels display */}
      {selectedLabelObjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLabelObjects.map(label => (
            <div
              key={label.name}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
              style={{
                backgroundColor: `#${label.color}20`,
                borderColor: `#${label.color}`,
                color: `#${label.color}`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: `#${label.color}` }}
              />
              <span>{label.name}</span>
              {!disabled && (
                <button
                  onClick={(e) => removeLabel(label.name, e)}
                  className="hover:opacity-70 transition-opacity"
                  title="Remove label"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full px-3 py-2 text-left bg-background border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-between"
        >
          <span className="text-muted-foreground">
            {selectedLabels.length === 0
              ? 'Select labels...'
              : `${selectedLabels.length} label${selectedLabels.length !== 1 ? 's' : ''} selected`}
          </span>
          <svg
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {isOpen && !disabled && (
          <>
            {/* Backdrop to close dropdown */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown content */}
            <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-64 overflow-hidden">
              {/* Search input */}
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search labels..."
                    className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Labels list */}
              <div className="overflow-y-auto max-h-48">
                {filteredLabels.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {searchQuery ? 'No labels found' : 'No labels available'}
                  </div>
                ) : (
                  filteredLabels.map(label => {
                    const isSelected = selectedLabels.includes(label.name);
                    return (
                      <button
                        key={label.name}
                        type="button"
                        onClick={() => toggleLabel(label.name)}
                        className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <div className="flex-shrink-0 w-5 h-5 rounded border border-border flex items-center justify-center">
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-primary" />
                          )}
                        </div>
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: `#${label.color}` }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">
                            {label.name}
                          </div>
                          {label.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {label.description}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default LabelSelector;
