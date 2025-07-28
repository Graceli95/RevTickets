'use client';

import type { TicketStatus, TicketPriority, TicketSeverity } from '../../types';
import { 
  getStatusColor, 
  getPriorityColor, 
  getSeverityColor,
  formatStatusDisplay,
  formatPriorityDisplay,
  formatSeverityDisplay
} from '../../../../lib/utils';

interface BadgeProps {
  variant?: 'status' | 'priority' | 'severity';
  value: TicketStatus | TicketPriority | TicketSeverity;
  className?: string;
  showLabel?: boolean; // Whether to show "Priority:" or "Severity:" prefix
}

export function Badge({ variant = 'status', value, className = '', showLabel = false }: BadgeProps) {
  const getColor = () => {
    switch (variant) {
      case 'status':
        return getStatusColor(value as TicketStatus);
      case 'priority':
        return getPriorityColor(value as TicketPriority);
      case 'severity':
        return getSeverityColor(value as TicketSeverity);
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getDisplayText = () => {
    const baseText = (() => {
      switch (variant) {
        case 'status':
          return formatStatusDisplay(value as TicketStatus);
        case 'priority':
          return formatPriorityDisplay(value as TicketPriority);
        case 'severity':
          return formatSeverityDisplay(value as TicketSeverity);
        default:
          return value;
      }
    })();

    if (showLabel) {
      switch (variant) {
        case 'priority':
          return `Priority: ${baseText}`;
        case 'severity':
          return `Severity: ${baseText}`;
        case 'status':
          return `Status: ${baseText}`;
        default:
          return baseText;
      }
    }

    return baseText;
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColor()} ${className}`}>
      {getDisplayText()}
    </span>
  );
}