import type { TicketStatus, TicketPriority } from '../../app/shared/types';
import { 
  STATUS_COLORS, 
  PRIORITY_COLORS, 
  TICKET_STATUS_LABELS,
  PRIORITY_LABELS
} from '../../constants';

export const getStatusColor = (status: TicketStatus): string => {
  return STATUS_COLORS[status] || 'text-gray-600 bg-gray-100';
};

export const getPriorityColor = (priority: TicketPriority): string => {
  return PRIORITY_COLORS[priority] || 'text-gray-600 bg-gray-100';
};

export const formatStatusDisplay = (status: TicketStatus): string => {
  return TICKET_STATUS_LABELS[status] || status;
};

export const formatPriorityDisplay = (priority: TicketPriority): string => {
  return PRIORITY_LABELS[priority] || priority;
};