export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },
  
  // Tickets
  TICKETS: {
    BASE: '/api/tickets',
    BY_ID: (id: string) => `/api/tickets/${id}`,
    ASSIGN: (id: string) => `/api/tickets/${id}/assign`,
    CLOSE: (id: string) => `/api/tickets/${id}/close`,
    STATS: '/api/tickets/stats',
    SEARCH: '/api/tickets/search',
    COMMENTS: (ticketId: string) => `/api/tickets/${ticketId}/comments`,
  },
  
  // Categories
  CATEGORIES: {
    BASE: '/api/categories',
    BY_ID: (id: string) => `/api/categories/${id}`,
    SUBCATEGORIES: (categoryId: string) => `/api/categories/${categoryId}/subcategories`,
  },
  
  // Subcategories
  SUBCATEGORIES: {
    BASE: '/api/subcategories',
    BY_ID: (id: string) => `/api/subcategories/${id}`,
  },
  
  // Tags
  TAGS: {
    BASE: '/api/tags',
    BY_KEY: (key: string) => `/api/tags/${key}`,
  },
  
  // Comments
  COMMENTS: {
    BY_ID: (id: string) => `/api/comments/${id}`,
  },
  
  // Documents
  DOCUMENTS: {
    BASE: '/api/documents',
    BY_ID: (id: string) => `/api/documents/${id}`,
    SEARCH: '/api/documents/search',
  },
  
  // Suggested Responses
  SUGGESTED_RESPONSES: {
    BASE: '/api/suggested-responses',
    BY_ID: (id: string) => `/api/suggested-responses/${id}`,
  },
} as const;