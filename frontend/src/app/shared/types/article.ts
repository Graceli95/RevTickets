// Article-related types matching backend API
import { Category, SubCategory } from './';
import { RichTextContent } from './ticket';

export interface Tag {
  key: string;
  value: string;
}

export interface Article {
  id: string;
  title: string;
  content: RichTextContent;
  category: Category;
  subCategory: SubCategory;
  tags: Tag[];
  aiGeneratedTags: string[];
  vectorIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateArticle {
  title: string;
  content: RichTextContent;
  category_id: string;
  subcategory_id: string;
  tags?: Array<{ key: string; value: string }>;
  vector_ids?: string[];
}

export interface UpdateArticle {
  title?: string;
  content?: RichTextContent;
  category_id?: string;
  subcategory_id?: string;
  tags?: Array<{ key: string; value: string }>;
  vector_ids?: string[];
}