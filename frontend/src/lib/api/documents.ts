import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants';
import type { Document, CreateDocument, SuggestedResponse, CreateSuggestedResponse } from '../../app/shared/types';

export const documentsApi = {
  async getAll(params?: {
    categoryId?: string;
    subCategoryId?: string;
  }): Promise<Document[]> {
    return apiClient.get(API_ENDPOINTS.DOCUMENTS.BASE, { params });
  },

  async getById(id: string): Promise<Document> {
    return apiClient.get(API_ENDPOINTS.DOCUMENTS.BY_ID(id));
  },

  async create(document: CreateDocument): Promise<Document> {
    return apiClient.post(API_ENDPOINTS.DOCUMENTS.BASE, document);
  },

  async update(id: string, document: CreateDocument): Promise<Document> {
    return apiClient.put(API_ENDPOINTS.DOCUMENTS.BY_ID(id), document);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.DOCUMENTS.BY_ID(id));
  },

  async search(params: {
    q: string;
    categoryId?: string;
    subCategoryId?: string;
  }): Promise<Document[]> {
    return apiClient.get(API_ENDPOINTS.DOCUMENTS.SEARCH, { params });
  },
};

export const suggestedResponsesApi = {
  async getAll(): Promise<SuggestedResponse[]> {
    return apiClient.get(API_ENDPOINTS.SUGGESTED_RESPONSES.BASE);
  },

  async getById(id: string): Promise<SuggestedResponse> {
    return apiClient.get(API_ENDPOINTS.SUGGESTED_RESPONSES.BY_ID(id));
  },

  async create(response: CreateSuggestedResponse): Promise<SuggestedResponse> {
    return apiClient.post(API_ENDPOINTS.SUGGESTED_RESPONSES.BASE, response);
  },

  async update(id: string, response: CreateSuggestedResponse): Promise<SuggestedResponse> {
    return apiClient.put(API_ENDPOINTS.SUGGESTED_RESPONSES.BY_ID(id), response);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.SUGGESTED_RESPONSES.BY_ID(id));
  },
};