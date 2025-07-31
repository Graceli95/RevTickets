// Ticket-related types matching backend API
import { Category } from './category';
import { SubCategory } from './subcategory';

export type TicketStatus = 'new' | 'in_progress' | 'waiting_for_customer' | 'waiting_for_agent' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

// Rich text content structure
export interface RichTextContent {
  html: string;
  json: Record<string, unknown>;
  text: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  content: RichTextContent;
  category: Category;
  subCategory: SubCategory;
  userInfo: UserInfo;
  agentInfo?: UserInfo;
  tagIds?: Array<{ key: string; value: string }>;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  // ENHANCEMENT L1 AI TICKET SUMMARY - Add AI summary fields
  aiSummary?: string;
  summaryGeneratedAt?: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name?: string;
  role?: string; // "user" or "agent" - helps identify user type in comments and tickets
}

export interface CreateTicketRequest {
  category_id: string;
  sub_category_id: string;
  title: string;
  description: string;
  content: RichTextContent;
  priority?: TicketPriority;
  tag_ids?: { [key: string]: string }[];
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  content?: RichTextContent;
  status?: TicketStatus;
  priority?: TicketPriority;
  agent_id?: string;
  tag_ids?: { [key: string]: string }[];
}

export interface TicketStats {
  total: number;
  new: number;
  in_progress: number;
  waiting_for_customer: number;
  waiting_for_agent: number;
  resolved: number;
  closed: number;
  by_priority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export interface Comment {
  id: string;
  ticket_id: string;
  user: UserInfo;
  content: RichTextContent;
  created_at: string;
  updated_at: string;
}

export interface CreateComment {
  content: RichTextContent;
}

export interface UpdateComment {
  content: RichTextContent;
}

// ENHANCEMENT L1 AI TICKET SUMMARY - AI summary types
export interface TicketSummaryResponse {
  summary: string;
}

export interface ClosingCommentsResponse {
  suggestions: string[];
}

// Legacy aliases for backward compatibility
export type CreateTicket = CreateTicketRequest;
export type UpdateTicket = UpdateTicketRequest;

export interface TicketAssignment {
  agent_id: string;
}

export interface TicketClosure {
  resolution: string;
}