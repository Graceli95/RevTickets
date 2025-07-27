// User-related types matching backend API
import { Category } from './category';
import { SubCategory } from './subcategory';

export type UserRole = 'user' | 'agent';

export interface AgentSkills {
  category?: Category;
  subcategories?: SubCategory[];
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  agent_skills?: AgentSkills; // Only present for agents
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}