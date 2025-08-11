/**
 * Shared file attachment types
 */

// Base file attachment from API
export interface FileAttachment {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  uploaded_at: string;
  url?: string;
}

// Extended file attachment for upload component
export interface FileAttachmentUpload extends Omit<FileAttachment, 'id' | 'filename' | 'content_type' | 'uploaded_at'> {
  id?: string;
  file?: File;
  name: string;
  type: string;
  uploadProgress?: number;
  uploadError?: string;
  uploaded?: boolean;
}

// File upload response from API
export interface FileUploadResponse {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  url: string;
  uploaded_at: string;
}