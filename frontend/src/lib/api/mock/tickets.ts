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
} from '../../../app/shared/types';
import { 
  mockTickets, 
  mockComments, 
  generateTicketStats,
  withRandomDelay,
  simulateDelay 
} from '../../mock-data';

let tickets = [...mockTickets];
let comments = [...mockComments];

export const mockTicketsApi = {
  async getAll(params?: {
    status?: string;
    priority?: string;
    severity?: string;
    categoryId?: string;
    subCategoryId?: string;
    userId?: string;
    agentId?: string;
  }): Promise<Ticket[]> {
    await simulateDelay();
    
    let filteredTickets = [...tickets];
    
    if (params?.status) {
      filteredTickets = filteredTickets.filter(t => t.status === params.status);
    }
    if (params?.priority) {
      filteredTickets = filteredTickets.filter(t => t.priority === params.priority);
    }
    if (params?.severity) {
      filteredTickets = filteredTickets.filter(t => t.severity === params.severity);
    }
    if (params?.categoryId) {
      filteredTickets = filteredTickets.filter(t => t.categoryId === params.categoryId);
    }
    if (params?.subCategoryId) {
      filteredTickets = filteredTickets.filter(t => t.subCategoryId === params.subCategoryId);
    }
    if (params?.userId) {
      filteredTickets = filteredTickets.filter(t => t.userId === params.userId);
    }
    if (params?.agentId) {
      filteredTickets = filteredTickets.filter(t => t.agentId === params.agentId);
    }
    
    return filteredTickets.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async getById(id: string): Promise<Ticket> {
    await simulateDelay();
    
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) {
      throw new Error(`Ticket with id ${id} not found`);
    }
    return ticket;
  },

  async create(ticketData: CreateTicket): Promise<Ticket> {
    await simulateDelay(800);
    
    const newTicket: Ticket = {
      id: `ticket_${Date.now()}`,
      ...ticketData,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    tickets.push(newTicket);
    return newTicket;
  },

  async update(id: string, ticketData: UpdateTicket): Promise<Ticket> {
    await simulateDelay();
    
    const ticketIndex = tickets.findIndex(t => t.id === id);
    if (ticketIndex === -1) {
      throw new Error(`Ticket with id ${id} not found`);
    }
    
    const updatedTicket = {
      ...tickets[ticketIndex],
      ...ticketData,
      updatedAt: new Date().toISOString(),
    };
    
    tickets[ticketIndex] = updatedTicket;
    return updatedTicket;
  },

  async assign(id: string, assignment: TicketAssignment): Promise<Partial<Ticket>> {
    await simulateDelay();
    
    const ticket = await this.update(id, { 
      agentId: assignment.agentId, 
      status: 'assigned' 
    });
    
    return {
      id: ticket.id,
      agentId: ticket.agentId,
      status: ticket.status,
      updatedAt: ticket.updatedAt,
    };
  },

  async close(id: string, closure: TicketClosure): Promise<Partial<Ticket>> {
    await simulateDelay();
    
    const now = new Date().toISOString();
    const ticket = await this.update(id, { 
      status: 'resolved',
      closedAt: now,
    });
    
    // Add a closing comment
    await this.createComment(id, {
      userId: ticket.agentId || 'system',
      content: `Ticket resolved: ${closure.resolution}`,
    });
    
    return {
      id: ticket.id,
      status: ticket.status,
      closedAt: ticket.closedAt,
      updatedAt: ticket.updatedAt,
    };
  },

  async delete(id: string): Promise<void> {
    await simulateDelay();
    
    const ticketIndex = tickets.findIndex(t => t.id === id);
    if (ticketIndex === -1) {
      throw new Error(`Ticket with id ${id} not found`);
    }
    
    tickets.splice(ticketIndex, 1);
    // Also remove associated comments
    comments = comments.filter(c => c.ticketId !== id);
  },

  async getStats(): Promise<TicketStats> {
    await simulateDelay();
    return generateTicketStats();
  },

  async search(params: {
    q: string;
    status?: string;
    priority?: string;
    severity?: string;
    categoryId?: string;
  }): Promise<Ticket[]> {
    await simulateDelay();
    
    let filteredTickets = [...tickets];
    
    // Text search in title, description, and content
    if (params.q) {
      const query = params.q.toLowerCase();
      filteredTickets = filteredTickets.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.content.toLowerCase().includes(query)
      );
    }
    
    // Apply other filters
    if (params.status) {
      filteredTickets = filteredTickets.filter(t => t.status === params.status);
    }
    if (params.priority) {
      filteredTickets = filteredTickets.filter(t => t.priority === params.priority);
    }
    if (params.severity) {
      filteredTickets = filteredTickets.filter(t => t.severity === params.severity);
    }
    if (params.categoryId) {
      filteredTickets = filteredTickets.filter(t => t.categoryId === params.categoryId);
    }
    
    return filteredTickets.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async getComments(ticketId: string): Promise<Comment[]> {
    await simulateDelay();
    
    return comments
      .filter(c => c.ticketId === ticketId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async createComment(ticketId: string, commentData: CreateComment): Promise<Comment> {
    await simulateDelay();
    
    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      ticketId,
      ...commentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    comments.push(newComment);
    
    // Update ticket's updatedAt timestamp
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex !== -1) {
      tickets[ticketIndex].updatedAt = newComment.createdAt;
    }
    
    return newComment;
  },

  async updateComment(id: string, commentData: UpdateComment): Promise<Comment> {
    await simulateDelay();
    
    const commentIndex = comments.findIndex(c => c.id === id);
    if (commentIndex === -1) {
      throw new Error(`Comment with id ${id} not found`);
    }
    
    const updatedComment = {
      ...comments[commentIndex],
      ...commentData,
      updatedAt: new Date().toISOString(),
    };
    
    comments[commentIndex] = updatedComment;
    return updatedComment;
  },

  async deleteComment(id: string): Promise<void> {
    await simulateDelay();
    
    const commentIndex = comments.findIndex(c => c.id === id);
    if (commentIndex === -1) {
      throw new Error(`Comment with id ${id} not found`);
    }
    
    comments.splice(commentIndex, 1);
  },
};