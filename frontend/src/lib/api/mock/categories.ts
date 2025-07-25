import type { Category, SubCategory, Tag } from '../../../app/shared/types';
import { mockCategories, mockSubCategories, mockTags, simulateDelay } from '../../mock-data';

const categories = [...mockCategories];
const subCategories = [...mockSubCategories];
const tags = [...mockTags];

export const mockCategoriesApi = {
  async getAll(): Promise<Category[]> {
    await simulateDelay();
    return [...categories];
  },

  async getById(id: string): Promise<Category> {
    await simulateDelay();
    
    const category = categories.find(c => c.id === id);
    if (!category) {
      throw new Error(`Category with id ${id} not found`);
    }
    return category;
  },

  async create(categoryData: Omit<Category, 'id'>): Promise<Category> {
    await simulateDelay(800);
    
    const newCategory: Category = {
      id: `cat_${Date.now()}`,
      ...categoryData,
    };
    
    categories.push(newCategory);
    return newCategory;
  },

  async update(id: string, categoryData: Omit<Category, 'id'>): Promise<Category> {
    await simulateDelay();
    
    const categoryIndex = categories.findIndex(c => c.id === id);
    if (categoryIndex === -1) {
      throw new Error(`Category with id ${id} not found`);
    }
    
    const updatedCategory = {
      id,
      ...categoryData,
    };
    
    categories[categoryIndex] = updatedCategory;
    return updatedCategory;
  },

  async delete(id: string): Promise<void> {
    await simulateDelay();
    
    const categoryIndex = categories.findIndex(c => c.id === id);
    if (categoryIndex === -1) {
      throw new Error(`Category with id ${id} not found`);
    }
    
    categories.splice(categoryIndex, 1);
    // Also remove associated subcategories
    subCategories = subCategories.filter(sc => sc.categoryId !== id);
  },
};

export const mockSubCategoriesApi = {
  async getAll(): Promise<SubCategory[]> {
    await simulateDelay();
    return [...subCategories];
  },

  async getByCategoryId(categoryId: string): Promise<SubCategory[]> {
    await simulateDelay();
    return subCategories.filter(sc => sc.categoryId === categoryId);
  },

  async getById(id: string): Promise<SubCategory> {
    await simulateDelay();
    
    const subCategory = subCategories.find(sc => sc.id === id);
    if (!subCategory) {
      throw new Error(`SubCategory with id ${id} not found`);
    }
    return subCategory;
  },

  async create(subCategoryData: Omit<SubCategory, 'id'>): Promise<SubCategory> {
    await simulateDelay(800);
    
    const newSubCategory: SubCategory = {
      id: `subcat_${Date.now()}`,
      ...subCategoryData,
    };
    
    subCategories.push(newSubCategory);
    return newSubCategory;
  },

  async update(id: string, subCategoryData: Omit<SubCategory, 'id'>): Promise<SubCategory> {
    await simulateDelay();
    
    const subCategoryIndex = subCategories.findIndex(sc => sc.id === id);
    if (subCategoryIndex === -1) {
      throw new Error(`SubCategory with id ${id} not found`);
    }
    
    const updatedSubCategory = {
      id,
      ...subCategoryData,
    };
    
    subCategories[subCategoryIndex] = updatedSubCategory;
    return updatedSubCategory;
  },

  async delete(id: string): Promise<void> {
    await simulateDelay();
    
    const subCategoryIndex = subCategories.findIndex(sc => sc.id === id);
    if (subCategoryIndex === -1) {
      throw new Error(`SubCategory with id ${id} not found`);
    }
    
    subCategories.splice(subCategoryIndex, 1);
  },
};

export const mockTagsApi = {
  async getAll(): Promise<Tag[]> {
    await simulateDelay();
    return [...tags];
  },

  async create(tag: Tag): Promise<Tag> {
    await simulateDelay();
    
    // Check if tag already exists
    const existingTag = tags.find(t => t.key === tag.key && t.value === tag.value);
    if (existingTag) {
      return existingTag;
    }
    
    tags.push(tag);
    return tag;
  },

  async update(key: string, tag: Tag): Promise<Tag> {
    await simulateDelay();
    
    const tagIndex = tags.findIndex(t => t.key === key);
    if (tagIndex === -1) {
      throw new Error(`Tag with key ${key} not found`);
    }
    
    tags[tagIndex] = tag;
    return tag;
  },

  async delete(key: string): Promise<void> {
    await simulateDelay();
    
    const tagIndex = tags.findIndex(t => t.key === key);
    if (tagIndex === -1) {
      throw new Error(`Tag with key ${key} not found`);
    }
    
    tags.splice(tagIndex, 1);
  },
};