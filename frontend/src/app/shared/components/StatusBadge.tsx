'use client';

import { Badge } from 'flowbite-react';
import type { TicketStatus, TicketPriority, TicketSeverity } from '../../../types';
import { 
  getStatusColor, 
  getPriorityColor, 
  getSeverityColor,
  formatStatusDisplay,
  formatPriorityDisplay,
  formatSeverityDisplay
} from '../../../lib/utils';

interface StatusBadgeProps {
  status: TicketStatus;
}

interface PriorityBadgeProps {
  priority: TicketPriority;
}

interface SeverityBadgeProps {
  severity: TicketSeverity;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass = getStatusColor(status);
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {formatStatusDisplay(status)}
    </span>
  );
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const colorClass = getPriorityColor(priority);
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {formatPriorityDisplay(priority)}
    </span>
  );
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const colorClass = getSeverityColor(severity);
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {formatSeverityDisplay(severity)}
    </span>
  );
}