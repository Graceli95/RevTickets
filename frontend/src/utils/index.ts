import { format, parseISO, formatDistanceToNow } from 'date-fns';
import type { TicketPriority, TicketSeverity, TicketStatus } from '../types';

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy');
};

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy HH:mm');
};

export const formatTimeAgo = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

export const getPriorityColor = (priority: TicketPriority): string => {
  switch (priority) {
    case 'low':
      return 'text-green-600 bg-green-100';
    case 'medium':
      return 'text-yellow-600 bg-yellow-100';
    case 'high':
      return 'text-orange-600 bg-orange-100';
    case 'critical':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const getSeverityColor = (severity: TicketSeverity): string => {
  switch (severity) {
    case 'low':
      return 'text-blue-600 bg-blue-100';
    case 'medium':
      return 'text-indigo-600 bg-indigo-100';
    case 'high':
      return 'text-purple-600 bg-purple-100';
    case 'critical':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const getStatusColor = (status: TicketStatus): string => {
  switch (status) {
    case 'new':
      return 'text-blue-600 bg-blue-100';
    case 'open':
      return 'text-green-600 bg-green-100';
    case 'assigned':
      return 'text-yellow-600 bg-yellow-100';
    case 'in_progress':
      return 'text-orange-600 bg-orange-100';
    case 'waiting_for_customer':
      return 'text-purple-600 bg-purple-100';
    case 'waiting_for_agent':
      return 'text-indigo-600 bg-indigo-100';
    case 'closed':
      return 'text-gray-600 bg-gray-100';
    case 'resolved':
      return 'text-green-800 bg-green-200';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const formatStatusDisplay = (status: TicketStatus): string => {
  switch (status) {
    case 'new':
      return 'New';
    case 'open':
      return 'Open';
    case 'assigned':
      return 'Assigned';
    case 'in_progress':
      return 'In Progress';
    case 'waiting_for_customer':
      return 'Waiting for Customer';
    case 'waiting_for_agent':
      return 'Waiting for Agent';
    case 'closed':
      return 'Closed';
    case 'resolved':
      return 'Resolved';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

export const formatPriorityDisplay = (priority: TicketPriority): string => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

export const formatSeverityDisplay = (severity: TicketSeverity): string => {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};