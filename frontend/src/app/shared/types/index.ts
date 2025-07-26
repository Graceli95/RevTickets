// Re-export all types from organized domain files
export * from './ticket';
export * from './user';
export * from './category';
export * from './document';
export * from './api';

// Legacy exports for backward compatibility (these should be updated over time)
export type { Tag } from './category';
export type { Category } from './category';
export type { SubCategory } from './category';
export type { Ticket } from './ticket';
export type { TicketStatus, TicketPriority, TicketSeverity } from './ticket';
export type { User, UserRole } from './user';