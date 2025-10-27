import { Label } from '@issuedesk/shared';
import { Edit, Trash2 } from 'lucide-react';

interface LabelCardProps {
  label: Label;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * LabelCard component - displays a single label with color preview
 */
export default function LabelCard({ label, onEdit, onDelete }: LabelCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div
            className="w-6 h-6 rounded-full flex-shrink-0 border-2 border-gray-300 dark:border-gray-600"
            style={{ backgroundColor: `#${label.color}` }}
            title={`Color: #${label.color}`}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {label.name}
            </h3>
            {label.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {label.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
          <button
            onClick={() => onEdit(label.name)}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Edit label"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(label.name)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Delete label"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          #{label.color}
        </span>
        {label.issueCount !== undefined && (
          <span className="text-gray-600 dark:text-gray-400">
            {label.issueCount} issue{label.issueCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
