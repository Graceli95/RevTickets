export interface Tag {
  key: string;
  value: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  tags: Tag[];
}

export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  description: string;
}

export type TicketStatus = 'new' | 'open' | 'assigned' | 'in_progress' | 'waiting_for_customer' | 'waiting_for_agent' | 'closed' | 'resolved';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Ticket {
  id: string;
  categoryId: string;
  subCategoryId: string;
  userId: string;
  title: string;
  description: string;
  content: string;
  tagIds: string[];
  agentId?: string;
  status: TicketStatus;
  priority: TicketPriority;
  severity: TicketSeverity;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface CreateTicket {
  categoryId: string;
  subCategoryId: string;
  userId: string;
  title: string;
  description: string;
  content: string;
  tagIds: string[];
  priority: TicketPriority;
  severity: TicketSeverity;
}

export interface UpdateTicket {
  categoryId?: string;
  subCategoryId?: string;
  userId?: string;
  title?: string;
  description?: string;
  content?: string;
  tagIds?: string[];
  agentId?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  severity?: TicketSeverity;
}

export interface TicketAssignment {
  agentId: string;
}

export interface TicketClosure {
  resolution: string;
}

export interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  closed: number;
  by_priority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  by_severity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export interface Comment {
  id: string;
  ticketId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComment {
  userId: string;
  content: string;
}

export interface UpdateComment {
  content: string;
}

export interface Document {
  id: string;
  tags: Tag[];
  categories: string[];
  subcategories: string[];
}

export interface CreateDocument {
  tags: Tag[];
  categories: string[];
  subcategories: string[];
}

export interface SuggestedResponse {
  id: string;
  response: string;
  documents: string[];
}

export interface CreateSuggestedResponse {
  response: string;
  documents: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'agent';
  createdAt: string;
  updatedAt: string;
}

export interface APIResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}