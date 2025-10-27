import { useState, useEffect } from 'react';
import { Label, CreateLabelInput } from '@issuedesk/shared';
import { X, Palette } from 'lucide-react';

interface LabelEditorProps {
  label?: Label;
  onSave: (input: CreateLabelInput) => Promise<void>;
  onClose: () => void;
}

const PRESET_COLORS = [
  'FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7',
  'DDA0DD', '98D8C8', 'F7DC6F', 'BB8FCE', '85C1E9',
  'F8C471', '82E0AA', 'F1948A', 'D7BDE2', 'AED6F1',
  '0366d6', 'd73a4a', '0e8a16', 'fbca04', 'f66a0a',
];

/**
 * LabelEditor component - modal form for creating/editing labels with color picker
 */
export default function LabelEditor({ label, onSave, onClose }: LabelEditorProps) {
  const [name, setName] = useState(label?.name || '');
  const [color, setColor] = useState(label?.color || '0366d6');
  const [description, setDescription] = useState(label?.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (label) {
      setName(label.name);
      setColor(label.color);
      setDescription(label.description || '');
    }
  }, [label]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Label name is required');
      return;
    }

    if (!/^[0-9a-fA-F]{6}$/.test(color)) {
      setError('Invalid color format. Use 6-digit hex color (e.g., FF5733)');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      await onSave({
        name: name.trim(),
        color: color.toUpperCase(),
        description: description.trim() || undefined,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to save label');
      setSaving(false);
    }
  };

  const generateRandomColor = () => {
    const randomColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
    setColor(randomColor);
  };

  const selectPresetColor = (presetColor: string) => {
    setColor(presetColor);
  };

  const handleColorChange = (value: string) => {
    // Remove # if present and keep only hex characters
    const cleaned = value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
    setColor(cleaned);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {label ? 'Edit Label' : 'Create Label'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            disabled={saving}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Name Input */}
          <div>
            <label htmlFor="label-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name *
            </label>
            <input
              id="label-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="bug"
              required
              maxLength={50}
              disabled={saving}
            />
          </div>

          {/* Color Input */}
          <div>
            <label htmlFor="label-color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color *
            </label>
            <div className="flex items-center space-x-2 mb-3">
              <div
                className="w-10 h-10 rounded-md border-2 border-gray-300 dark:border-gray-600 flex-shrink-0"
                style={{ backgroundColor: `#${color}` }}
              />
              <input
                id="label-color"
                type="text"
                value={color}
                onChange={(e) => handleColorChange(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="0366d6"
                pattern="[0-9a-fA-F]{6}"
                required
                disabled={saving}
              />
              <button
                type="button"
                onClick={generateRandomColor}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Random color"
                disabled={saving}
              >
                <Palette className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
            
            {/* Preset Colors */}
            <div className="grid grid-cols-10 gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => selectPresetColor(presetColor)}
                  className={`w-6 h-6 rounded border-2 transition-all ${
                    color.toUpperCase() === presetColor
                      ? 'border-blue-500 dark:border-blue-400 scale-110'
                      : 'border-gray-300 dark:border-gray-600 hover:scale-110'
                  }`}
                  style={{ backgroundColor: `#${presetColor}` }}
                  title={`#${presetColor}`}
                  disabled={saving}
                />
              ))}
            </div>
          </div>

          {/* Description Input */}
          <div>
            <label htmlFor="label-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <input
              id="label-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="Something is broken"
              maxLength={100}
              disabled={saving}
            />
          </div>

          {/* Preview */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview</p>
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border"
              style={{
                backgroundColor: `#${color}20`,
                borderColor: `#${color}`,
                color: `#${color}`,
              }}
            >
              {name.trim() || 'label-name'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? 'Saving...' : label ? 'Update Label' : 'Create Label'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
