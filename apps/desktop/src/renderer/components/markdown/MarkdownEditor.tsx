import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import TurndownService from 'turndown';
import { marked } from 'marked';
import { useConfig } from '../../contexts/ConfigContext';
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
  Image as ImageIcon,
  Upload,
  X,
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
  // Force re-render when cursor position changes to update button states
  const [, setEditorState] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { settings } = useConfig();

  const handleImageUpload = async () => {
    try {
      setIsUploading(true);
      const result = await window.electronAPI.system.selectImage();
      
      if (result.success && result.filePath && result.data) {
        let imageUrl = '';
        const fileName = result.data.fileName || 'image';
        
        // Check if R2 is configured and enabled
        if (settings?.r2Config?.enabled) {
          try {
            // Upload to R2
            const uploadResult = await window.electronAPI.settings.uploadToR2({
              buffer: result.data.buffer,
              fileName: fileName,
              contentType: result.data.contentType
            });
            
            if (uploadResult.success && uploadResult.data?.url) {
              imageUrl = uploadResult.data.url;
            } else {
              console.warn('R2 upload failed, falling back to data URL');
              // Fallback to data URL
              const dataUrlResult = await window.electronAPI.system.imageToDataUrl({
                buffer: result.data.buffer,
                contentType: result.data.contentType
              });
              if (dataUrlResult.success && dataUrlResult.data?.url) {
                imageUrl = dataUrlResult.data.url;
              }
            }
          } catch (r2Error) {
            console.warn('R2 upload error, falling back to data URL:', r2Error);
            // Fallback to data URL
            const dataUrlResult = await window.electronAPI.system.imageToDataUrl({
              buffer: result.data.buffer,
              contentType: result.data.contentType
            });
            if (dataUrlResult.success && dataUrlResult.data?.url) {
              imageUrl = dataUrlResult.data.url;
            }
          }
        } else {
          // Use data URL as default
          const dataUrlResult = await window.electronAPI.system.imageToDataUrl({
            buffer: result.data.buffer,
            contentType: result.data.contentType
          });
          if (dataUrlResult.success && dataUrlResult.data?.url) {
            imageUrl = dataUrlResult.data.url;
          }
        }
        
        // Insert image if we have a URL
        if (imageUrl) {
          if (mode === 'edit' && editor) {
            // Insert image in WYSIWYG mode
            editor.chain().focus().insertContent({
              type: 'image',
              attrs: {
                src: imageUrl,
                alt: fileName,
                title: fileName
              }
            }).run();
          } else {
            // Insert image markdown in code mode
            const imageMarkdown = `![${fileName}](${imageUrl})`;
            const newContent = codeContent + '\n' + imageMarkdown;
            setCodeContent(newContent);
            onChange(newContent);
          }
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) return;
    
    try {
      setIsUploading(true);
      
      for (const file of imageFiles) {
        let imageUrl = '';
        
        // Check if R2 is configured and enabled
        if (settings?.r2Config?.enabled) {
          try {
            // Convert File to Buffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            // Upload to R2
            const uploadResult = await window.electronAPI.settings.uploadToR2({
              buffer: Array.from(buffer),
              fileName: file.name,
              contentType: file.type
            });
            
            if (uploadResult.success && uploadResult.data?.url) {
              imageUrl = uploadResult.data.url;
            } else {
              console.warn('R2 upload failed for dropped image, falling back to data URL');
              // Fallback to data URL
              imageUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                  resolve(event.target?.result as string || '');
                };
                reader.readAsDataURL(file);
              });
            }
          } catch (r2Error) {
            console.warn('R2 upload error for dropped image, falling back to data URL:', r2Error);
            // Fallback to data URL
            imageUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (event) => {
                resolve(event.target?.result as string || '');
              };
              reader.readAsDataURL(file);
            });
          }
        } else {
          // Use data URL as default
          imageUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              resolve(event.target?.result as string || '');
            };
            reader.readAsDataURL(file);
          });
        }
        
        // Insert image if we have a URL
        if (imageUrl) {
          if (mode === 'edit' && editor) {
            // Insert image in WYSIWYG mode
            editor.chain().focus().insertContent({
              type: 'image',
              attrs: {
                src: imageUrl,
                alt: file.name,
                title: file.name
              }
            }).run();
          } else {
            // Insert image markdown in code mode
            const imageMarkdown = `![${file.name}](${imageUrl})`;
            const newContent = codeContent + '\n' + imageMarkdown;
            setCodeContent(newContent);
            onChange(newContent);
          }
        }
      }
    } catch (error) {
      console.error('Error handling dropped images:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Only update editor when content changes from external source (not from user editing)
  const isInternalUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-primary underline cursor-pointer',
          }
        }
      }),
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
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
    ],
    content: marked(content) as string, // Set initial content here
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true;

      // Convert HTML to Markdown before sending to parent
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);
      onChange(markdown);
      setCodeContent(markdown);
    },
    onSelectionUpdate: () => {
      // Force re-render to update toolbar button active states
      setEditorState(prev => prev + 1);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[260px] p-4 overflow-y-auto',
      },
    },
  });
 
  useEffect(() => {
    if(!editor || !content) return;
    if (isInternalUpdate.current) {
      return;
    }

    const html = marked(content) as string;
    
    // Only update if content genuinely changed from outside
    if (html !== editor.getHTML()) {
      editor.commands.setContent(html, { emitUpdate: false });
      setCodeContent(content);
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

            {/* Image Upload */}
            <button
              onClick={handleImageUpload}
              disabled={isUploading}
              className={`p-1.5 rounded hover:bg-accent transition-colors ${
                isUploading ? 'opacity-50 cursor-not-allowed' : 'text-muted-foreground'
              }`}
              title="Upload Image"
            >
              {isUploading ? (
                <Upload className="h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
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
          <div 
            className={`overflow-y-auto ${EDITOR_HEIGHT_CLASS} relative`} 
            ref={scrollContainerRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {dragOver && (
              <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary/30 rounded-md flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2 text-primary">
                  <Upload className="h-8 w-8" />
                  <span className="text-sm font-medium">Drop images here to upload</span>
                </div>
              </div>
            )}
            <EditorContent editor={editor} key={mode} />
          </div>
        )}
      </div>
    </div>
  );
}

export default MarkdownEditor;
