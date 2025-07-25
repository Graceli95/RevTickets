import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';
import type { Category, SubCategory, Tag } from '../../app/shared/types';

export const categoriesApi = {
  async getAll(): Promise<Category[]> {
    return apiClient.get(API_ENDPOINTS.CATEGORIES.BASE);
  },

  async getById(id: string): Promise<Category> {
    return apiClient.get(API_ENDPOINTS.CATEGORIES.BY_ID(id));
  },

  async create(category: Omit<Category, 'id'>): Promise<Category> {
    return apiClient.post(API_ENDPOINTS.CATEGORIES.BASE, category);
  },

  async update(id: string, category: Omit<Category, 'id'>): Promise<Category> {
    return apiClient.put(API_ENDPOINTS.CATEGORIES.BY_ID(id), category);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.CATEGORIES.BY_ID(id));
  },
};

export const subCategoriesApi = {
  async getAll(): Promise<SubCategory[]> {
    return apiClient.get(API_ENDPOINTS.SUBCATEGORIES.BASE);
  },

  async getByCategoryId(categoryId: string): Promise<SubCategory[]> {
    return apiClient.get(API_ENDPOINTS.CATEGORIES.SUBCATEGORIES(categoryId));
  },

  async getById(id: string): Promise<SubCategory> {
    return apiClient.get(API_ENDPOINTS.SUBCATEGORIES.BY_ID(id));
  },

  async create(subCategory: Omit<SubCategory, 'id'>): Promise<SubCategory> {
    return apiClient.post(API_ENDPOINTS.SUBCATEGORIES.BASE, subCategory);
  },

  async update(id: string, subCategory: Omit<SubCategory, 'id'>): Promise<SubCategory> {
    return apiClient.put(API_ENDPOINTS.SUBCATEGORIES.BY_ID(id), subCategory);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.SUBCATEGORIES.BY_ID(id));
  },
};

export const tagsApi = {
  async getAll(): Promise<Tag[]> {
    return apiClient.get(API_ENDPOINTS.TAGS.BASE);
  },

  async create(tag: Tag): Promise<Tag> {
    return apiClient.post(API_ENDPOINTS.TAGS.BASE, tag);
  },

  async update(key: string, tag: Tag): Promise<Tag> {
    return apiClient.put(API_ENDPOINTS.TAGS.BY_KEY(key), tag);
  },

  async delete(key: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.TAGS.BY_KEY(key));
  },
};