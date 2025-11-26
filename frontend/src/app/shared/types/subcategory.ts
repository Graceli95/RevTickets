// SubCategory-related types matching backend API
import { Category } from './category';

export interface SubCategory {
  id: string;
  name: string;
  description: string;
  category?: Category;
  created_at: string;
  updated_at: string;
}

export interface CreateSubCategoryRequest {
  name: string;
  description: string;
  category_id: string;
}

export interface UpdateSubCategoryRequest {
  name?: string;
  description?: string;
  category_id?: string;
}

// Legacy aliases for backward compatibility
export type CreateSubCategory = CreateSubCategoryRequest;
export type UpdateSubCategory = UpdateSubCategoryRequest;