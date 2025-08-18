/**
 * ENHANCEMENT L2: FILE ATTACHMENTS
 * 
 * File API service for uploading, downloading, and managing file attachments
 * Supports secure file handling with JWT authentication and progress tracking
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';
import type { FileAttachment, FileUploadResponse } from '../../app/shared/types';

export const filesApi = {
  /**
   * ENHANCEMENT L2: FILE ATTACHMENTS - Upload a single file with progress tracking
   * Uses XMLHttpRequest for progress tracking during file upload
   */
  async upload(file: File, onProgress?: (progress: number) => void): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Use XMLHttpRequest for progress tracking (fetch API doesn't support upload progress)
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

      // IMPORTANT: Must call xhr.open() before setting headers
      xhr.open('POST', `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/files/upload`);
      
      // Set authentication header after xhr.open()
      const token = localStorage.getItem('authToken');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  },

  /**
   * ENHANCEMENT L2: FILE ATTACHMENTS - Download file with authentication
   * Fetches file as blob for both download and preview functionality
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
   * ENHANCEMENT L2: FILE ATTACHMENTS - Get files attached to a ticket
   */
  async getTicketFiles(ticketId: string): Promise<FileAttachment[]> {
    return apiClient.get(API_ENDPOINTS.FILES.GET_TICKET_FILES(ticketId));
  },

  /**
   * ENHANCEMENT L2: FILE ATTACHMENTS - Attach files to a ticket
   */
  async attachToTicket(ticketId: string, fileIds: string[]): Promise<void> {
    await apiClient.post(API_ENDPOINTS.FILES.ATTACH_TO_TICKET(ticketId), { file_ids: fileIds });
  },

  /**
   * ENHANCEMENT L2: FILE ATTACHMENTS - Format file size for display
   * Used in file lists and preview modals
   * BUG: File size formatting broken - shows raw bytes instead of formatted sizes
   */
  formatFileSize(bytes: number): string {
    // BUG: Proper formatting logic is disabled
    /*
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    */
    
    // BUG: Always return unformatted byte count
    return `${bytes} bytes`;
  }
};