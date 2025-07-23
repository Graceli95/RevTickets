import { apiClient } from './api';
import type { Category, SubCategory, Tag } from '../types';

export const categoryService = {
  async getAllCategories(): Promise<Category[]> {
    const response = await apiClient.get('/api/categories');
    return response.data;
  },

  async getCategoryById(id: string): Promise<Category> {
    const response = await apiClient.get(`/api/categories/${id}`);
    return response.data;
  },

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const response = await apiClient.post('/api/categories', category);
    return response.data;
  },

  async updateCategory(id: string, category: Omit<Category, 'id'>): Promise<Category> {
    const response = await apiClient.put(`/api/categories/${id}`, category);
    return response.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/api/categories/${id}`);
  },

  async getAllSubCategories(): Promise<SubCategory[]> {
    const response = await apiClient.get('/api/subcategories');
    return response.data;
  },

  async getSubCategoriesByCategoryId(categoryId: string): Promise<SubCategory[]> {
    const response = await apiClient.get(`/api/categories/${categoryId}/subcategories`);
    return response.data;
  },

  async getSubCategoryById(id: string): Promise<SubCategory> {
    const response = await apiClient.get(`/api/subcategories/${id}`);
    return response.data;
  },

  async createSubCategory(subCategory: Omit<SubCategory, 'id'>): Promise<SubCategory> {
    const response = await apiClient.post('/api/subcategories', subCategory);
    return response.data;
  },

  async updateSubCategory(id: string, subCategory: Omit<SubCategory, 'id'>): Promise<SubCategory> {
    const response = await apiClient.put(`/api/subcategories/${id}`, subCategory);
    return response.data;
  },

  async deleteSubCategory(id: string): Promise<void> {
    await apiClient.delete(`/api/subcategories/${id}`);
  },

  async getAllTags(): Promise<Tag[]> {
    const response = await apiClient.get('/api/tags');
    return response.data;
  },

  async createTag(tag: Tag): Promise<Tag> {
    const response = await apiClient.post('/api/tags', tag);
    return response.data;
  },

  async updateTag(key: string, tag: Tag): Promise<Tag> {
    const response = await apiClient.put(`/api/tags/${key}`, tag);
    return response.data;
  },

  async deleteTag(key: string): Promise<void> {
    await apiClient.delete(`/api/tags/${key}`);
  },
};