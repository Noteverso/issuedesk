import { Label } from '@issuedesk/shared';
import { Edit, Trash2 } from 'lucide-react';

interface LabelListProps {
  labels: Label[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * LabelList component - displays labels in a table/grid view
 */
export default function LabelList({ labels, onEdit, onDelete }: LabelListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {labels.map((label) => (
        <div
          key={label.id}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: `#${label.color}` }}
              />
              <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {label.name}
              </span>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
              <button
                onClick={() => onEdit(label.name)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="Edit label"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(label.name)}
                className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                title="Delete label"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {label.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {label.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
            <span className="font-mono">#{label.color}</span>
            {label.issueCount !== undefined && (
              <span>{label.issueCount} issue{label.issueCount !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
