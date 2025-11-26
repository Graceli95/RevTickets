/**
 * ENHANCEMENT L2: FILE ATTACHMENTS
 * 
 * File upload component with drag-and-drop functionality
 * Provides secure file validation, progress tracking, and visual feedback
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from 'flowbite-react';
import { Upload, X, FileIcon, ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { validateFile, formatFileSize, MAX_FILES_PER_TICKET, ALLOWED_FILE_TYPES } from '../../../lib/utils/fileValidation';
import type { FileAttachmentUpload } from '../types';

interface FileUploadProps {
  attachments: FileAttachmentUpload[];
  onAttachmentsChange: (attachments: FileAttachmentUpload[]) => void;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({ attachments, onAttachmentsChange, disabled = false, className = '' }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ENHANCEMENT L2: FILE ATTACHMENTS - Enhanced validation with security checks
  const validateFileSecurely = useCallback((file: File): string | null => {
    const result = validateFile(file);
    if (!result.isValid) {
      return result.error || 'File validation failed';
    }
    
    // Check against current attachments count
    if (attachments.length >= MAX_FILES_PER_TICKET) {
      return `Maximum ${MAX_FILES_PER_TICKET} files allowed.`;
    }
    
    return null;
  }, [attachments.length]);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-green-500" />;
    }
    return <FileIcon className="h-8 w-8 text-blue-500" />;
  };

  // Handle file selection
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || disabled) return;

    const newAttachments: FileAttachmentUpload[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      const error = validateFileSecurely(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        newAttachments.push({
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          uploaded: false,
        });
      }
    });

    if (errors.length > 0) {
      // In a real app, you'd show these errors in a toast/notification
      console.error('File validation errors:', errors);
      alert('Some files could not be added:\n' + errors.join('\n'));
    }

    if (newAttachments.length > 0) {
      onAttachmentsChange([...attachments, ...newAttachments]);
    }
  }, [attachments, onAttachmentsChange, disabled, validateFileSecurely]);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  // File input change handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    onAttachmentsChange(newAttachments);
  };

  // Open file selector
  const openFileSelector = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors
          ${dragActive 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileSelector}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_FILE_TYPES.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="text-center">
          <Upload className={`mx-auto h-12 w-12 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          <div className="mt-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {dragActive ? 'Drop files here' : 'Drag and drop files here, or click to select'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Max {MAX_FILES_PER_TICKET} files, up to {formatFileSize(5 * 1024 * 1024)} each
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Supports: Images, PDF, Documents, Text files
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Attached Files ({attachments.length}/{MAX_FILES_PER_TICKET})
          </h4>
          
          <div className="space-y-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  {getFileIcon(attachment.type)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {attachment.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(attachment.size)}
                    </p>
                    
                    {/* Upload Progress - Only show when actively uploading */}
                    {typeof attachment.uploadProgress === 'number' && !attachment.uploaded && (
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${attachment.uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Uploading... {attachment.uploadProgress}%
                        </p>
                      </div>
                    )}
                    
                    {/* Upload Error */}
                    {attachment.uploadError && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {attachment.uploadError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Upload Status */}
                  {attachment.uploaded && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  
                  {/* Remove Button */}
                  <Button
                    size="xs"
                    color="gray"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAttachment(index);
                    }}
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}