export const ROUTES = {
  HOME: '/',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  
  // Authentication
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  
  // Tickets
  TICKETS: '/tickets',
  TICKET_DETAIL: (id: string) => `/tickets/${id}`,
  CREATE_TICKET: '/tickets/create',
  EDIT_TICKET: (id: string) => `/tickets/${id}/edit`,
  
  // Categories
  CATEGORIES: '/categories',
  CATEGORY_DETAIL: (id: string) => `/categories/${id}`,
  CREATE_CATEGORY: '/categories/create',
  EDIT_CATEGORY: (id: string) => `/categories/${id}/edit`,
  
  // Knowledge Base
  KNOWLEDGE_BASE: '/knowledge-base',
  DOCUMENT_DETAIL: (id: string) => `/knowledge-base/${id}`,
  CREATE_DOCUMENT: '/knowledge-base/create',
  EDIT_DOCUMENT: (id: string) => `/knowledge-base/${id}/edit`,
  
  // Users
  USERS: '/users',
  USER_PROFILE: (id: string) => `/users/${id}`,
  PROFILE: '/profile',
  
  // Analytics
  ANALYTICS: '/analytics',
  
  // Settings
  SETTINGS: '/settings',
  ACCOUNT_SETTINGS: '/settings/account',
  NOTIFICATION_SETTINGS: '/settings/notifications',
  SYSTEM_SETTINGS: '/settings/system',
} as const;