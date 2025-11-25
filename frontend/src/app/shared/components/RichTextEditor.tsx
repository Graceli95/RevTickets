'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect, useMemo, useRef } from 'react';
import StarterKit from '@tiptap/starter-kit';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
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
  // Track if content update is coming from user input to prevent cursor jumping
  const isInternalUpdate = useRef(false);
  
  // Convert content to proper format for editor
  const editorContent = useMemo(() => {
    if (!content) return '';
    
    // If it's already a RichTextContent object, use the JSON if it has content, otherwise use HTML
    if (typeof content === 'object' && 'json' in content) {
      // Check if JSON has meaningful content (not empty object)
      if (content.json && typeof content.json === 'object' && Object.keys(content.json).length > 0) {
        return content.json;
      }
      // Fall back to HTML if JSON is empty
      return content.html || '';
    }
    
    // If it's a string, treat as legacy HTML
    return content as string;
  }, [content]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc list-inside',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal list-inside',
          },
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc list-inside',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'list-decimal list-inside',
        },
      }),
      ListItem,
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
        // Mark this as an internal update to prevent cursor jumping
        isInternalUpdate.current = true;
        
        const html = editor.getHTML();
        const json = editor.getJSON();
        const text = editor.getText();
        
        const richTextContent: RichTextContent = {
          html,
          json,
          text
        };
        
        onChange(richTextContent);
        
        // Reset the flag after a short delay to allow the state update to complete
        setTimeout(() => {
          isInternalUpdate.current = false;
        }, 0);
      }
    },
  });

  // Update editor content when content prop changes (but not from user input)
  useEffect(() => {
    // Skip if this is an internal update from user typing
    if (isInternalUpdate.current) {
      return;
    }
    
    if (editor && !editor.isDestroyed) {
      // Only update if the content is actually different to avoid unnecessary re-renders
      const currentHTML = editor.getHTML();
      const newHTML = typeof editorContent === 'string' ? editorContent : editor.getHTML();
      
      // Don't update if content is the same (prevents cursor jumping)
      if (currentHTML !== newHTML) {
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
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`inline-flex items-center justify-center p-2 text-sm font-medium rounded-md transition-colors hover:bg-gray-200 dark:hover:bg-gray-600 ${
              editor.isActive('bold') 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Bold className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`inline-flex items-center justify-center p-2 text-sm font-medium rounded-md transition-colors hover:bg-gray-200 dark:hover:bg-gray-600 ${
              editor.isActive('italic') 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Italic className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`inline-flex items-center justify-center p-2 text-sm font-medium rounded-md transition-colors hover:bg-gray-200 dark:hover:bg-gray-600 ${
              editor.isActive('bulletList') 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <List className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`inline-flex items-center justify-center p-2 text-sm font-medium rounded-md transition-colors hover:bg-gray-200 dark:hover:bg-gray-600 ${
              editor.isActive('orderedList') 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <ListOrdered className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`inline-flex items-center justify-center p-2 text-sm font-medium rounded-md transition-colors hover:bg-gray-200 dark:hover:bg-gray-600 ${
              editor.isActive('blockquote') 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Quote className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          <button
            type="button"
            onClick={editor.isActive('link') ? removeLink : addLink}
            className={`inline-flex items-center justify-center p-2 text-sm font-medium rounded-md transition-colors hover:bg-gray-200 dark:hover:bg-gray-600 ${
              editor.isActive('link') 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <LinkIcon className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="inline-flex items-center justify-center p-2 text-sm font-medium rounded-md transition-colors hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Undo className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="inline-flex items-center justify-center p-2 text-sm font-medium rounded-md transition-colors hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Redo className="h-4 w-4" />
          </button>
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