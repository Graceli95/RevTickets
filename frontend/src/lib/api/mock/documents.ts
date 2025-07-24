import type { Document, CreateDocument, SuggestedResponse, CreateSuggestedResponse } from '../../../app/shared/types';
import { mockDocuments, mockSuggestedResponses, simulateDelay } from '../../mock-data';

let documents = [...mockDocuments];
let suggestedResponses = [...mockSuggestedResponses];

export const mockDocumentsApi = {
  async getAll(params?: {
    categoryId?: string;
    subCategoryId?: string;
  }): Promise<Document[]> {
    await simulateDelay();
    
    let filteredDocuments = [...documents];
    
    if (params?.categoryId) {
      filteredDocuments = filteredDocuments.filter(d => 
        d.categories.includes(params.categoryId!)
      );
    }
    
    if (params?.subCategoryId) {
      filteredDocuments = filteredDocuments.filter(d => 
        d.subcategories.includes(params.subCategoryId!)
      );
    }
    
    return filteredDocuments;
  },

  async getById(id: string): Promise<Document> {
    await simulateDelay();
    
    const document = documents.find(d => d.id === id);
    if (!document) {
      throw new Error(`Document with id ${id} not found`);
    }
    return document;
  },

  async create(documentData: CreateDocument): Promise<Document> {
    await simulateDelay(800);
    
    const newDocument: Document = {
      id: `doc_${Date.now()}`,
      ...documentData,
    };
    
    documents.push(newDocument);
    return newDocument;
  },

  async update(id: string, documentData: CreateDocument): Promise<Document> {
    await simulateDelay();
    
    const documentIndex = documents.findIndex(d => d.id === id);
    if (documentIndex === -1) {
      throw new Error(`Document with id ${id} not found`);
    }
    
    const updatedDocument = {
      id,
      ...documentData,
    };
    
    documents[documentIndex] = updatedDocument;
    return updatedDocument;
  },

  async delete(id: string): Promise<void> {
    await simulateDelay();
    
    const documentIndex = documents.findIndex(d => d.id === id);
    if (documentIndex === -1) {
      throw new Error(`Document with id ${id} not found`);
    }
    
    documents.splice(documentIndex, 1);
  },

  async search(params: {
    q: string;
    categoryId?: string;
    subCategoryId?: string;
  }): Promise<Document[]> {
    await simulateDelay();
    
    let filteredDocuments = [...documents];
    
    // For mock purposes, we'll do a simple tag-based search
    if (params.q) {
      const query = params.q.toLowerCase();
      filteredDocuments = filteredDocuments.filter(d => 
        d.tags.some(tag => 
          tag.key.toLowerCase().includes(query) || 
          tag.value.toLowerCase().includes(query)
        )
      );
    }
    
    if (params.categoryId) {
      filteredDocuments = filteredDocuments.filter(d => 
        d.categories.includes(params.categoryId!)
      );
    }
    
    if (params.subCategoryId) {
      filteredDocuments = filteredDocuments.filter(d => 
        d.subcategories.includes(params.subCategoryId!)
      );
    }
    
    return filteredDocuments;
  },
};

export const mockSuggestedResponsesApi = {
  async getAll(): Promise<SuggestedResponse[]> {
    await simulateDelay();
    return [...suggestedResponses];
  },

  async getById(id: string): Promise<SuggestedResponse> {
    await simulateDelay();
    
    const response = suggestedResponses.find(r => r.id === id);
    if (!response) {
      throw new Error(`Suggested response with id ${id} not found`);
    }
    return response;
  },

  async create(responseData: CreateSuggestedResponse): Promise<SuggestedResponse> {
    await simulateDelay(800);
    
    const newResponse: SuggestedResponse = {
      id: `response_${Date.now()}`,
      ...responseData,
    };
    
    suggestedResponses.push(newResponse);
    return newResponse;
  },

  async update(id: string, responseData: CreateSuggestedResponse): Promise<SuggestedResponse> {
    await simulateDelay();
    
    const responseIndex = suggestedResponses.findIndex(r => r.id === id);
    if (responseIndex === -1) {
      throw new Error(`Suggested response with id ${id} not found`);
    }
    
    const updatedResponse = {
      id,
      ...responseData,
    };
    
    suggestedResponses[responseIndex] = updatedResponse;
    return updatedResponse;
  },

  async delete(id: string): Promise<void> {
    await simulateDelay();
    
    const responseIndex = suggestedResponses.findIndex(r => r.id === id);
    if (responseIndex === -1) {
      throw new Error(`Suggested response with id ${id} not found`);
    }
    
    suggestedResponses.splice(responseIndex, 1);
  },
};