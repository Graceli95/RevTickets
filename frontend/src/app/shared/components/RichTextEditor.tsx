'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect, useMemo } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from 'flowbite-react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Quote,
  Undo,
  Redo,
} from 'lucide-react';

import type { RichTextContent } from '../types';

interface RichTextEditorProps {
  content?: RichTextContent | string; // Accept both new format and legacy HTML string
  onChange?: (content: RichTextContent) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

export function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Start typing...',
  editable = true,
  className = '',
}: RichTextEditorProps) {
  // Convert content to proper format for editor
  const editorContent = useMemo(() => {
    if (!content) return '';
    
    // If it's already a RichTextContent object, use the JSON
    if (typeof content === 'object' && 'json' in content) {
      return content.json;
    }
    
    // If it's a string, treat as legacy HTML
    return content as string;
  }, [content]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: editorContent,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (onChange) {
        const html = editor.getHTML();
        const json = editor.getJSON();
        const text = editor.getText();
        
        const richTextContent: RichTextContent = {
          html,
          json,
          text
        };
        
        onChange(richTextContent);
      }
    },
  });

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      // Only update if the content is actually different to avoid unnecessary re-renders
      if (editor.getHTML() !== (typeof editorContent === 'string' ? editorContent : '')) {
        if (typeof editorContent === 'object') {
          editor.commands.setContent(editorContent);
        } else {
          editor.commands.setContent(editorContent || '');
        }
      }
    }
  }, [editorContent, editor]);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  return (
    <div className={`border border-gray-300 rounded-lg dark:border-gray-600 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-500 focus-within:ring-opacity-20 transition-colors ${className}`}>
      {editable && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
          <Button
            size="xs"
            color="gray"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-600' : ''}
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            size="xs"
            color="gray"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-600' : ''}
          >
            <Italic className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          <Button
            size="xs"
            color="gray"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-600' : ''}
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            size="xs"
            color="gray"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-600' : ''}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <Button
            size="xs"
            color="gray"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-600' : ''}
          >
            <Quote className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          <Button
            size="xs"
            color="gray"
            onClick={editor.isActive('link') ? removeLink : addLink}
            className={editor.isActive('link') ? 'bg-gray-200 dark:bg-gray-600' : ''}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          <Button
            size="xs"
            color="gray"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>

          <Button
            size="xs"
            color="gray"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className={`p-4 min-h-[120px] ${!editable ? 'bg-gray-50 dark:bg-gray-800' : ''}`}>
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none dark:prose-invert outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[88px] [&_.ProseMirror]:focus:outline-none"
        />
      </div>
    </div>
  );
}