import type { TicketStatus, TicketPriority, TicketSeverity } from '../../types';
import { 
  STATUS_COLORS, 
  PRIORITY_COLORS, 
  SEVERITY_COLORS,
  TICKET_STATUS_LABELS,
  PRIORITY_LABELS,
  SEVERITY_LABELS
} from '../../constants';

export const getStatusColor = (status: TicketStatus): string => {
  return STATUS_COLORS[status] || 'text-gray-600 bg-gray-100';
};

export const getPriorityColor = (priority: TicketPriority): string => {
  return PRIORITY_COLORS[priority] || 'text-gray-600 bg-gray-100';
};

export const getSeverityColor = (severity: TicketSeverity): string => {
  return SEVERITY_COLORS[severity] || 'text-gray-600 bg-gray-100';
};

export const formatStatusDisplay = (status: TicketStatus): string => {
  return TICKET_STATUS_LABELS[status] || status;
};

export const formatPriorityDisplay = (priority: TicketPriority): string => {
  return PRIORITY_LABELS[priority] || priority;
};

export const formatSeverityDisplay = (severity: TicketSeverity): string => {
  return SEVERITY_LABELS[severity] || severity;
};