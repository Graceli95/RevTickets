// Re-export all types from organized domain files
export * from './ticket';
export * from './user';
export * from './category';
export * from './subcategory';
export * from './article';
export * from './api';
export * from './file';

// Legacy exports for backward compatibility (these should be updated over time)
export type { Category } from './category';
export type { SubCategory } from './subcategory';
export type { Ticket } from './ticket';
export type { TicketStatus, TicketPriority } from './ticket';
export type { User, UserRole } from './user';