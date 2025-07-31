'use client';

import type { TicketStatus, TicketPriority } from '../../types';
import { 
  getStatusColor, 
  getPriorityColor, 
  formatStatusDisplay,
  formatPriorityDisplay
} from '../../../../lib/utils';

interface BadgeProps {
  variant?: 'status' | 'priority';
  value: TicketStatus | TicketPriority;
  className?: string;
  showLabel?: boolean; // Whether to show "Priority:" prefix
}

export function Badge({ variant = 'status', value, className = '', showLabel = false }: BadgeProps) {
  const getColor = () => {
    switch (variant) {
      case 'status':
        return getStatusColor(value as TicketStatus);
      case 'priority':
        return getPriorityColor(value as TicketPriority);
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
        default:
          return value;
      }
    })();

    if (showLabel) {
      switch (variant) {
        case 'priority':
          return `Priority: ${baseText}`;
        case 'status':
          return `Status: ${baseText}`;
        default:
          return baseText;
      }
    }

    return baseText;
  };

  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium min-w-[60px] ${getColor()} ${className}`}>
      {getDisplayText()}
    </span>
  );
}