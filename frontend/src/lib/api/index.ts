export { apiClient } from './client';

// Import all APIs
import { ticketsApi as realTicketsApi } from './tickets';
import { categoriesApi as realCategoriesApi, subCategoriesApi as realSubCategoriesApi, tagsApi as realTagsApi } from './categories';
import { documentsApi as realDocumentsApi, suggestedResponsesApi as realSuggestedResponsesApi } from './documents';

import { mockTicketsApi } from './mock/tickets';
import { mockCategoriesApi, mockSubCategoriesApi, mockTagsApi } from './mock/categories';
import { mockDocumentsApi, mockSuggestedResponsesApi } from './mock/documents';

// Environment-based API switching
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

if (USE_MOCK_API) {
  console.log('🔧 Using Mock API for development');
} else {
  console.log('🚀 Using Real API');
}

// Export the appropriate APIs based on environment
export const ticketsApi = USE_MOCK_API ? mockTicketsApi : realTicketsApi;
export const categoriesApi = USE_MOCK_API ? mockCategoriesApi : realCategoriesApi;
export const subCategoriesApi = USE_MOCK_API ? mockSubCategoriesApi : realSubCategoriesApi;
export const tagsApi = USE_MOCK_API ? mockTagsApi : realTagsApi;
export const documentsApi = USE_MOCK_API ? mockDocumentsApi : realDocumentsApi;
export const suggestedResponsesApi = USE_MOCK_API ? mockSuggestedResponsesApi : realSuggestedResponsesApi;