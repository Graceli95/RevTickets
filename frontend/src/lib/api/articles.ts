import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants';
import type { 
  Article, 
  CreateArticle, 
  UpdateArticle
} from '../../app/shared/types';

export const articlesApi = {
  async getAll(): Promise<Article[]> {
    return apiClient.get(API_ENDPOINTS.ARTICLES.BASE);
  },

  async getById(id: string): Promise<Article> {
    return apiClient.get(API_ENDPOINTS.ARTICLES.BY_ID(id));
  },

  async create(article: CreateArticle): Promise<Article> {
    return apiClient.post(API_ENDPOINTS.ARTICLES.BASE, article);
  },

  async update(id: string, article: UpdateArticle): Promise<Article> {
    return apiClient.put(API_ENDPOINTS.ARTICLES.BY_ID(id), article);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.ARTICLES.BY_ID(id));
  },

  async getByCategory(categoryId: string): Promise<Article[]> {
    return apiClient.get(`${API_ENDPOINTS.ARTICLES.BASE}/category/${categoryId}`);
  },

  async getBySubcategory(subcategoryId: string): Promise<Article[]> {
    return apiClient.get(`${API_ENDPOINTS.ARTICLES.BASE}/subcategory/${subcategoryId}`);
  },

  async search(params: {
    q: string;
    categoryId?: string;
    subcategoryId?: string;
  }): Promise<Article[]> {
    return apiClient.get(API_ENDPOINTS.ARTICLES.SEARCH, { params });
  },

  // ENHANCEMENT L2 AI KB TAGS - AI tag generation methods
  async generateTags(title: string, content: string): Promise<{ tags: string[] }> {
    return apiClient.post(API_ENDPOINTS.ARTICLES.GENERATE_TAGS, { title, content });
  },

  async generateTagsFromArticle(id: string): Promise<{ tags: string[] }> {
    return apiClient.post(API_ENDPOINTS.ARTICLES.GENERATE_TAGS_FROM_ARTICLE(id), {});
  },

  async updateAITags(id: string, tags: string[]): Promise<Article> {
    return apiClient.put(API_ENDPOINTS.ARTICLES.UPDATE_AI_TAGS(id), { tags });
  },
};