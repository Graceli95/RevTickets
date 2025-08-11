import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';
import type { FileAttachment, FileUploadResponse } from '../../app/shared/types';

export const filesApi = {
  /**
   * Upload a single file
   */
  async upload(file: File, onProgress?: (progress: number) => void): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Create XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed: Network error'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      xhr.open('POST', `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/files/upload`);
      
      // Get auth token for authorization (must be set after xhr.open())
      const token = localStorage.getItem('authToken');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  },

  /**
   * Upload multiple files
   */
  async uploadMultiple(
    files: File[], 
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<FileUploadResponse[]> {
    const uploadPromises = files.map((file, index) => 
      this.upload(file, onProgress ? (progress) => onProgress(index, progress) : undefined)
    );

    return Promise.all(uploadPromises);
  },

  /**
   * Get file details by ID
   */
  async getById(fileId: string): Promise<FileAttachment> {
    return apiClient.get(API_ENDPOINTS.FILES.BY_ID(fileId));
  },

  /**
   * Download file by ID
   */
  async download(fileId: string): Promise<Blob> {
    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}${API_ENDPOINTS.FILES.DOWNLOAD(fileId)}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.blob();
  },

  /**
   * Delete file by ID
   */
  async delete(fileId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.FILES.DELETE(fileId));
  },

  /**
   * Get files attached to a ticket
   */
  async getTicketFiles(ticketId: string): Promise<FileAttachment[]> {
    return apiClient.get(API_ENDPOINTS.FILES.GET_TICKET_FILES(ticketId));
  },

  /**
   * Attach files to a ticket
   */
  async attachToTicket(ticketId: string, fileIds: string[]): Promise<void> {
    await apiClient.post(API_ENDPOINTS.FILES.ATTACH_TO_TICKET(ticketId), { file_ids: fileIds });
  },

  /**
   * Detach file from ticket
   */
  async detachFromTicket(ticketId: string, fileId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.FILES.DETACH_FROM_TICKET(ticketId, fileId));
  },

  /**
   * Validate file before upload
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    const ALLOWED_TYPES = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
      'text/csv'
    ];

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: `File type "${file.type}" is not allowed. Allowed types: images, PDF, documents, text files.`
      };
    }

    if (file.size > MAX_SIZE) {
      return {
        isValid: false,
        error: `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size of ${this.formatFileSize(MAX_SIZE)}.`
      };
    }

    return { isValid: true };
  },

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Get file icon based on MIME type
   */
  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.startsWith('text/')) return '📄';
    return '📁';
  },

  /**
   * Create download URL for a file
   */
  getDownloadUrl(fileId: string): string {
    return `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}${API_ENDPOINTS.FILES.DOWNLOAD(fileId)}`;
  },

  /**
   * Create preview URL for images
   */
  getPreviewUrl(fileId: string): string {
    return `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}${API_ENDPOINTS.FILES.PREVIEW(fileId)}`;
  }
};