import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Markdown } from 'tiptap-markdown';
import { Code, Eye, Bold, Italic, List, ListOrdered, Quote, Heading1, Heading2 } from 'lucide-react';

interface MarkdownEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  className?: string;
}

export function MarkdownEditor({
  content,
  onChange,
  placeholder = 'Write your markdown here...',
  className = '',
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'code' | 'preview'>('preview');

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Markdown,
    ],
    content,
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown();
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  const handleCodeModeChange = (value: string) => {
    onChange(value);
    editor?.commands.setContent(value);
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={`border border-border rounded-md overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        {/* Editor controls */}
        {mode === 'preview' && (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded hover:bg-accent transition-colors ${
                editor.isActive('bold') ? 'bg-accent text-primary' : 'text-muted-foreground'
              }`}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded hover:bg-accent transition-colors ${
                editor.isActive('italic') ? 'bg-accent text-primary' : 'text-muted-foreground'
              }`}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </button>
            <div className="w-px h-5 bg-border mx-1" />
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-1.5 rounded hover:bg-accent transition-colors ${
                editor.isActive('heading', { level: 1 }) ? 'bg-accent text-primary' : 'text-muted-foreground'
              }`}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-1.5 rounded hover:bg-accent transition-colors ${
                editor.isActive('heading', { level: 2 }) ? 'bg-accent text-primary' : 'text-muted-foreground'
              }`}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <div className="w-px h-5 bg-border mx-1" />
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded hover:bg-accent transition-colors ${
                editor.isActive('bulletList') ? 'bg-accent text-primary' : 'text-muted-foreground'
              }`}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-1.5 rounded hover:bg-accent transition-colors ${
                editor.isActive('orderedList') ? 'bg-accent text-primary' : 'text-muted-foreground'
              }`}
              title="Ordered List"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-1.5 rounded hover:bg-accent transition-colors ${
                editor.isActive('blockquote') ? 'bg-accent text-primary' : 'text-muted-foreground'
              }`}
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Mode toggle */}
        <div className="ml-auto flex rounded-md shadow-sm" role="group">
          <button
            onClick={() => setMode('preview')}
            className={`
              flex items-center px-3 py-1.5 text-xs font-medium border border-border rounded-l-md
              transition-colors focus:z-10
              ${
                mode === 'preview'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-accent'
              }
            `}
          >
            <Eye className="h-3 w-3 mr-1.5" />
            Preview
          </button>
          <button
            onClick={() => setMode('code')}
            className={`
              flex items-center px-3 py-1.5 text-xs font-medium border border-l-0 border-border rounded-r-md
              transition-colors focus:z-10
              ${
                mode === 'code'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-accent'
              }
            `}
          >
            <Code className="h-3 w-3 mr-1.5" />
            Code
          </button>
        </div>
      </div>

      {/* Editor content */}
      <div className="bg-background">
        {mode === 'code' ? (
          <textarea
            value={content}
            onChange={(e) => handleCodeModeChange(e.target.value)}
            placeholder={placeholder}
            className="w-full min-h-[200px] p-4 font-mono text-sm bg-transparent resize-none focus:outline-none"
          />
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>
    </div>
  );
}

export default MarkdownEditor;
