import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import TurndownService from 'turndown';
import { marked } from 'marked';
import {
  Code,
  Eye,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  CodeSquare,
  Link2,
  Minus,
} from 'lucide-react';

// Initialize Turndown for HTML to Markdown conversion
const EDITOR_HEIGHT_CLASS = 'h-48';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  fence: '```',
});

// Configure marked for GFM
marked.setOptions({
  gfm: true,
  breaks: true,
});

interface MarkdownEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  className?: string;
}

type EditorMode = 'edit' | 'code';

export function MarkdownEditor({
  content,
  onChange,
  placeholder = 'Write your markdown here...',
  className = '',
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<EditorMode>('edit');
  const [codeContent, setCodeContent] = useState(content);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      // Convert HTML to Markdown before sending to parent
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);
      onChange(markdown);
      setCodeContent(markdown);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[260px] p-4 overflow-y-auto',
      },
    },
  });

  // Update editor content when content prop changes from outside
  useEffect(() => {
    if (editor && content !== undefined) {
      // Convert markdown to HTML for TipTap
      const html = marked(content) as string;
      const currentHtml = editor.getHTML();
      if (html !== currentHtml) {
        // Avoid resetting if content update
        editor.commands.setContent(html);
        setCodeContent(content);
      }
    }
  }, [content, editor]);

  const handleCodeModeChange = (value: string) => {
    setCodeContent(value);
    onChange(value);
    if (editor) {
      editor.commands.setContent(value);
    }
  };

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={`border border-border rounded-md overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        {/* Editor controls - show TipTap toolbar when using the editor */}
        {mode === 'edit' && (
          <div className="flex items-center gap-1 flex-wrap">
            {/* Text formatting */}
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded hover:bg-accent transition-colors ${
                editor.isActive('bold') ? 'bg-accent text-primary' : 'text-muted-foreground'
              }`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded hover:bg-accent transition-colors ${
                editor.isActive('italic') ? 'bg-accent text-primary' : 'text-muted-foreground'
              }`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-1.5 rounded hover:bg-accent transition-colors ${
                editor.isActive('strike') ? 'bg-accent text-primary' : 'text-muted-foreground'
              }`}
              title="Strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`p-1.5 rounded hover:bg-accent transition-colors ${
                editor.isActive('code') ? 'bg-accent text-primary' : 'text-muted-foreground'
              }`}
              title="Inline Code"
            >
              <Code className="h-4 w-4" />
            </button>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Headings */}
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
            <button
              // onClick={() => runEditorCommand((chain) => chain.toggleHeading({ level: 3 }))}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-1.5 rounded hover:bg-accent transition-colors ${
                editor.isActive('heading', { level: 3 }) ? 'bg-accent text-primary' : 'text-muted-foreground'
              }`}
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </button>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Lists */}
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
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={`p-1.5 rounded hover:bg-accent transition-colors ${
                editor.isActive('taskList') ? 'bg-accent text-primary' : 'text-muted-foreground'
              }`}
              title="Task List"
            >
              <ListTodo className="h-4 w-4" />
            </button>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Blocks */}
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-1.5 rounded hover:bg-accent transition-colors ${
                editor.isActive('blockquote') ? 'bg-accent text-primary' : 'text-muted-foreground'
              }`}
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`p-1.5 rounded hover:bg-accent transition-colors ${
                editor.isActive('codeBlock') ? 'bg-accent text-primary' : 'text-muted-foreground'
              }`}
              title="Code Block"
            >
              <CodeSquare className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground"
              title="Horizontal Rule"
            >
              <Minus className="h-4 w-4" />
            </button>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Link */}
            <button
              onClick={addLink}
              className={`p-1.5 rounded hover:bg-accent transition-colors ${
                editor.isActive('link') ? 'bg-accent text-primary' : 'text-muted-foreground'
              }`}
              title="Add Link"
            >
              <Link2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Mode toggle */}
        <div className="ml-auto flex rounded-md shadow-sm" role="group">  
          <button
            onClick={() => setMode('edit')}
            className={`
              flex items-center px-3 py-1.5 text-xs font-medium border border-l-0 border-r-0 border-border rounded-l-md
              transition-colors focus:z-10
              ${
                mode === 'edit'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-accent'
              }
            `}
          >
            <Eye className="h-3 w-3 mr-1.5" />
            Edit
          </button>
          <button
            onClick={() => setMode('code')}
            className={`
              flex items-center px-3 py-1.5 text-xs font-medium border border-border rounded-r-md
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
            value={codeContent}
            onChange={(e) => handleCodeModeChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full ${EDITOR_HEIGHT_CLASS} p-4 font-mono text-sm bg-transparent resize-none focus:outline-none text-foreground`}
          />
        ) : (
          <div className={`overflow-y-auto ${EDITOR_HEIGHT_CLASS}`} ref={scrollContainerRef}>
            <EditorContent editor={editor} key={mode} />
          </div>
        )}
      </div>
    </div>
  );
}

export default MarkdownEditor;
