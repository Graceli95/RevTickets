export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/users/login',
    LOGOUT: '/users/logout',
    REFRESH: '/users/refresh',
    PROFILE: '/users/profile',
  },
  
  // Tickets
  TICKETS: {
    BASE: '/tickets',
    BY_ID: (id: string) => `/tickets/${id}`,
    USER_TICKETS: '/tickets/user/',
    QUEUE: '/tickets/queue/',
    ASSIGNED: '/tickets/assigned/',
    ASSIGN: (id: string) => `/tickets/${id}/assign`,
    AUTO_ASSIGN: (id: string) => `/tickets/${id}/auto-assign`,
    UPDATE_STATUS: (id: string) => `/tickets/${id}/status`,
    CLOSE: (id: string) => `/tickets/${id}/close`,
    RESOLVE: (id: string) => `/tickets/${id}/resolve`,
    REOPEN: (id: string) => `/tickets/${id}/reopen`,
    CAN_REOPEN: (id: string) => `/tickets/${id}/can-reopen`,
    STATS: '/tickets/stats',
    SEARCH: '/tickets/search',
    COMMENTS: (ticketId: string) => `/tickets/${ticketId}/comments`,
  },
  
  // Categories
  CATEGORIES: {
    BASE: '/categories',
    BY_ID: (id: string) => `/categories/${id}`,
    SUBCATEGORIES: (categoryId: string) => `/categories/${categoryId}/subcategories`,
  },
  
  // Subcategories
  SUBCATEGORIES: {
    BASE: '/subcategories',
    BY_ID: (id: string) => `/subcategories/${id}`,
  },
  
  // Tags
  TAGS: {
    BASE: '/tags',
    BY_ID: (id: string) => `/tags/${id}`,
  },
  
  // Comments
  COMMENTS: {
    BY_ID: (id: string) => `/comments/${id}`,
  },
  
  // Documents
  DOCUMENTS: {
    BASE: '/documents',
    BY_ID: (id: string) => `/documents/${id}`,
    SEARCH: '/documents/search',
  },
  
  // Suggested Responses
  SUGGESTED_RESPONSES: {
    BASE: '/suggested-responses',
    BY_ID: (id: string) => `/suggested-responses/${id}`,
  },
} as const;