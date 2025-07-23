import { apiClient } from './api';
import type { Document, CreateDocument, SuggestedResponse, CreateSuggestedResponse } from '../types';

export const documentService = {
  async getAllDocuments(params?: {
    categoryId?: string;
    subCategoryId?: string;
  }): Promise<Document[]> {
    const response = await apiClient.get('/api/documents', { params });
    return response.data;
  },

  async getDocumentById(id: string): Promise<Document> {
    const response = await apiClient.get(`/api/documents/${id}`);
    return response.data;
  },

  async createDocument(document: CreateDocument): Promise<Document> {
    const response = await apiClient.post('/api/documents', document);
    return response.data;
  },

  async updateDocument(id: string, document: CreateDocument): Promise<Document> {
    const response = await apiClient.put(`/api/documents/${id}`, document);
    return response.data;
  },

  async deleteDocument(id: string): Promise<void> {
    await apiClient.delete(`/api/documents/${id}`);
  },

  async searchDocuments(params: {
    q: string;
    categoryId?: string;
    subCategoryId?: string;
  }): Promise<Document[]> {
    const response = await apiClient.get('/api/documents/search', { params });
    return response.data;
  },

  async getAllSuggestedResponses(): Promise<SuggestedResponse[]> {
    const response = await apiClient.get('/api/suggested-responses');
    return response.data;
  },

  async getSuggestedResponseById(id: string): Promise<SuggestedResponse> {
    const response = await apiClient.get(`/api/suggested-responses/${id}`);
    return response.data;
  },

  async createSuggestedResponse(response: CreateSuggestedResponse): Promise<SuggestedResponse> {
    const res = await apiClient.post('/api/suggested-responses', response);
    return res.data;
  },

  async updateSuggestedResponse(id: string, response: CreateSuggestedResponse): Promise<SuggestedResponse> {
    const res = await apiClient.put(`/api/suggested-responses/${id}`, response);
    return res.data;
  },

  async deleteSuggestedResponse(id: string): Promise<void> {
    await apiClient.delete(`/api/suggested-responses/${id}`);
  },
};