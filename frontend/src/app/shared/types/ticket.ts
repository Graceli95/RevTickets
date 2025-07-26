// Ticket-related types matching backend API

export type TicketStatus = 'new' | 'open' | 'assigned' | 'in_progress' | 'waiting_for_customer' | 'waiting_for_agent' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketSeverity = 'low' | 'medium' | 'high' | 'critical';

// Rich text content structure
export interface RichTextContent {
  html: string;
  json: Record<string, unknown>;
  text: string;
}

export interface Ticket {
  id: string;
  category_id: string;
  sub_category_id: string;
  user_id: string;
  agent_id?: string;
  title: string;
  description: string;
  content: RichTextContent;
  tag_ids?: { [key: string]: string }[];
  status: TicketStatus;
  priority: TicketPriority;
  severity: TicketSeverity;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface CreateTicketRequest {
  category_id: string;
  sub_category_id: string;
  title: string;
  description: string;
  content: RichTextContent;
  priority?: TicketPriority;
  severity?: TicketSeverity;
  tag_ids?: { [key: string]: string }[];
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  content?: RichTextContent;
  status?: TicketStatus;
  priority?: TicketPriority;
  severity?: TicketSeverity;
  agent_id?: string;
  tag_ids?: { [key: string]: string }[];
}

export interface TicketStats {
  total: number;
  new: number;
  open: number;
  assigned: number;
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
  by_severity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export interface Comment {
  id: string;
  ticket_id: string;
  user_id: string;
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

// Legacy aliases for backward compatibility
export type CreateTicket = CreateTicketRequest;
export type UpdateTicket = UpdateTicketRequest;

export interface TicketAssignment {
  agent_id: string;
}

export interface TicketClosure {
  resolution: string;
}