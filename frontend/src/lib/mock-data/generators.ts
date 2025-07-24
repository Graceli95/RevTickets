import type { TicketStats } from '../../app/shared/types';
import { mockTickets } from './tickets';

export const generateTicketStats = (): TicketStats => {
  const stats = mockTickets.reduce(
    (acc, ticket) => {
      acc.total += 1;
      
      // Count by status
      switch (ticket.status) {
        case 'new':
        case 'open':
        case 'assigned':
          acc.open += 1;
          break;
        case 'in_progress':
        case 'waiting_for_agent':
        case 'waiting_for_customer':
          acc.in_progress += 1;
          break;
        case 'closed':
        case 'resolved':
          acc.closed += 1;
          break;
      }
      
      // Count by priority
      acc.by_priority[ticket.priority] += 1;
      
      // Count by severity  
      acc.by_severity[ticket.severity] += 1;
      
      return acc;
    },
    {
      total: 0,
      open: 0,
      in_progress: 0,
      closed: 0,
      by_priority: { low: 0, medium: 0, high: 0, critical: 0 },
      by_severity: { low: 0, medium: 0, high: 0, critical: 0 },
    }
  );
  
  return stats;
};

export const getTicketsByStatus = (status: string) => {
  return mockTickets.filter(ticket => ticket.status === status);
};

export const getTicketsByUser = (userId: string) => {
  return mockTickets.filter(ticket => ticket.userId === userId);
};

export const getTicketsByAgent = (agentId: string) => {
  return mockTickets.filter(ticket => ticket.agentId === agentId);
};

export const getTicketsByCategory = (categoryId: string) => {
  return mockTickets.filter(ticket => ticket.categoryId === categoryId);
};

export const getRecentTickets = (limit: number = 5) => {
  return [...mockTickets]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
};

// Utility to simulate API delays for realistic testing
export const simulateDelay = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Generate realistic data variations for testing
export const withRandomDelay = async <T>(data: T, minMs: number = 200, maxMs: number = 1000): Promise<T> => {
  const delay = Math.random() * (maxMs - minMs) + minMs;
  await simulateDelay(delay);
  return data;
};