import type { TicketStatus, TicketPriority, TicketSeverity } from '../types';

export const TICKET_STATUS: Record<string, TicketStatus> = {
  NEW: 'new',
  OPEN: 'open',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  WAITING_FOR_CUSTOMER: 'waiting_for_customer',
  WAITING_FOR_AGENT: 'waiting_for_agent',
  CLOSED: 'closed',
  RESOLVED: 'resolved',
} as const;

export const TICKET_PRIORITY: Record<string, TicketPriority> = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const TICKET_SEVERITY: Record<string, TicketSeverity> = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  new: 'New',
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  waiting_for_customer: 'Waiting for Customer',
  waiting_for_agent: 'Waiting for Agent',
  closed: 'Closed',
  resolved: 'Resolved',
} as const;

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
} as const;

export const SEVERITY_LABELS: Record<TicketSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
} as const;

export const STATUS_COLORS: Record<TicketStatus, string> = {
  new: 'text-blue-600 bg-blue-100',
  open: 'text-green-600 bg-green-100',
  assigned: 'text-yellow-600 bg-yellow-100',
  in_progress: 'text-orange-600 bg-orange-100',
  waiting_for_customer: 'text-purple-600 bg-purple-100',
  waiting_for_agent: 'text-indigo-600 bg-indigo-100',
  closed: 'text-gray-600 bg-gray-100',
  resolved: 'text-green-800 bg-green-200',
} as const;

export const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: 'text-green-600 bg-green-100',
  medium: 'text-yellow-600 bg-yellow-100',
  high: 'text-orange-600 bg-orange-100',
  critical: 'text-red-600 bg-red-100',
} as const;

export const SEVERITY_COLORS: Record<TicketSeverity, string> = {
  low: 'text-blue-600 bg-blue-100',
  medium: 'text-indigo-600 bg-indigo-100',
  high: 'text-purple-600 bg-purple-100',
  critical: 'text-red-600 bg-red-100',
} as const;