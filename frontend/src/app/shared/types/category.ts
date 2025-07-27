// Category-related types matching backend API

export interface Category {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}


export interface Tag {
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
}


export interface CreateTagRequest {
  key: string;
  value: string;
}