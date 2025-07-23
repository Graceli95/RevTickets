import { apiClient } from './api';
import type { 
  Ticket, 
  CreateTicket, 
  UpdateTicket, 
  TicketAssignment, 
  TicketClosure, 
  TicketStats,
  Comment,
  CreateComment,
  UpdateComment
} from '../types';

export const ticketService = {
  async getAllTickets(params?: {
    status?: string;
    priority?: string;
    severity?: string;
    categoryId?: string;
    subCategoryId?: string;
    userId?: string;
    agentId?: string;
  }): Promise<Ticket[]> {
    const response = await apiClient.get('/api/tickets', { params });
    return response.data;
  },

  async getTicketById(id: string): Promise<Ticket> {
    const response = await apiClient.get(`/api/tickets/${id}`);
    return response.data;
  },

  async createTicket(ticket: CreateTicket): Promise<Ticket> {
    const response = await apiClient.post('/api/tickets', ticket);
    return response.data;
  },

  async updateTicket(id: string, ticket: UpdateTicket): Promise<Ticket> {
    const response = await apiClient.put(`/api/tickets/${id}`, ticket);
    return response.data;
  },

  async assignTicket(id: string, assignment: TicketAssignment): Promise<Partial<Ticket>> {
    const response = await apiClient.patch(`/api/tickets/${id}/assign`, assignment);
    return response.data;
  },

  async closeTicket(id: string, closure: TicketClosure): Promise<Partial<Ticket>> {
    const response = await apiClient.patch(`/api/tickets/${id}/close`, closure);
    return response.data;
  },

  async deleteTicket(id: string): Promise<void> {
    await apiClient.delete(`/api/tickets/${id}`);
  },

  async getTicketStats(): Promise<TicketStats> {
    const response = await apiClient.get('/api/tickets/stats');
    return response.data;
  },

  async searchTickets(params: {
    q: string;
    status?: string;
    priority?: string;
    severity?: string;
    categoryId?: string;
  }): Promise<Ticket[]> {
    const response = await apiClient.get('/api/tickets/search', { params });
    return response.data;
  },

  async getTicketComments(ticketId: string): Promise<Comment[]> {
    const response = await apiClient.get(`/api/tickets/${ticketId}/comments`);
    return response.data;
  },

  async createComment(ticketId: string, comment: CreateComment): Promise<Comment> {
    const response = await apiClient.post(`/api/tickets/${ticketId}/comments`, comment);
    return response.data;
  },

  async updateComment(id: string, comment: UpdateComment): Promise<Comment> {
    const response = await apiClient.put(`/api/comments/${id}`, comment);
    return response.data;
  },

  async deleteComment(id: string): Promise<void> {
    await apiClient.delete(`/api/comments/${id}`);
  },
};