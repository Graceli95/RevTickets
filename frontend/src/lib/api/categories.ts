import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';
import type { Category, SubCategory, Tag, CreateCategoryRequest, CreateSubCategoryRequest, CreateTagRequest } from '../../app/shared/types';

export const categoriesApi = {
  async getAll(): Promise<Category[]> {
    return apiClient.get(API_ENDPOINTS.CATEGORIES.BASE);
  },

  async getById(id: string): Promise<Category> {
    return apiClient.get(API_ENDPOINTS.CATEGORIES.BY_ID(id));
  },

  async create(category: CreateCategoryRequest): Promise<Category> {
    return apiClient.post(API_ENDPOINTS.CATEGORIES.BASE, category);
  },

  async update(id: string, category: CreateCategoryRequest): Promise<Category> {
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
    const endpoint = API_ENDPOINTS.CATEGORIES.SUBCATEGORIES(categoryId);
    console.log('Fetching subcategories from endpoint:', endpoint);
    const result = await apiClient.get<SubCategory[]>(endpoint);
    console.log('API response for subcategories:', result);
    return result;
  },

  async getById(id: string): Promise<SubCategory> {
    return apiClient.get(API_ENDPOINTS.SUBCATEGORIES.BY_ID(id));
  },

  async create(subCategory: CreateSubCategoryRequest): Promise<SubCategory> {
    return apiClient.post(API_ENDPOINTS.SUBCATEGORIES.BASE, subCategory);
  },

  async update(id: string, subCategory: CreateSubCategoryRequest): Promise<SubCategory> {
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

  async create(tag: CreateTagRequest): Promise<Tag> {
    return apiClient.post(API_ENDPOINTS.TAGS.BASE, tag);
  },

  async update(id: string, tag: CreateTagRequest): Promise<Tag> {
    return apiClient.put(API_ENDPOINTS.TAGS.BY_ID(id), tag);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.TAGS.BY_ID(id));
  },
};