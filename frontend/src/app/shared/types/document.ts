// Document and Knowledge Base related types

export interface Document {
  id: string;
  title: string;
  content: string;
  category_id: string;
  sub_category_id: string;
  author_id: string;
  tags?: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDocument {
  title: string;
  content: string;
  category_id: string;
  sub_category_id: string;
  tags?: string[];
  is_public?: boolean;
}

export interface SuggestedResponse {
  id: string;
  title: string;
  content: string;
  category_id?: string;
  sub_category_id?: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSuggestedResponse {
  title: string;
  content: string;
  category_id?: string;
  sub_category_id?: string;
}