'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Label, TextInput, Textarea, Select } from 'flowbite-react';
import { Save, X, AlertCircle, Tag as TagIcon, Plus } from 'lucide-react';
import { ticketsApi, categoriesApi, subCategoriesApi, tagsApi } from '../../../lib/api';
import { RichTextEditor } from '../../shared/components';
import type { Category, SubCategory, Tag, CreateTicketRequest, TicketPriority, TicketSeverity, RichTextContent } from '../../shared/types';
import { createEmptyRichText, isRichTextEmpty } from '../../../lib/utils';

export function CreateTicketForm() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<SubCategory[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: createEmptyRichText(),
    categoryId: '',
    subCategoryId: '',
    priority: 'medium' as TicketPriority,
    severity: 'medium' as TicketSeverity,
  });

  useEffect(() => {
    fetchFormData();
  }, []);

  useEffect(() => {
    const fetchSubCategories = async () => {
      if (formData.categoryId) {
        try {
          const subCategoriesData = await subCategoriesApi.getByCategoryId(formData.categoryId);
          setFilteredSubCategories(subCategoriesData);
          // Reset subcategory selection when category changes
          setFormData(prev => ({ ...prev, subCategoryId: '' }));
        } catch (error) {
          console.error('Failed to fetch subcategories:', error);
          setFilteredSubCategories([]);
        }
      } else {
        setFilteredSubCategories([]);
      }
    };

    fetchSubCategories();
  }, [formData.categoryId]);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      const [categoriesData, tagsData] = await Promise.all([
        categoriesApi.getAll(),
        tagsApi.getAll()
      ]);
      setCategories(categoriesData);
      setTags(tagsData);
    } catch (error) {
      console.error('Failed to fetch form data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleContentChange = (content: RichTextContent) => {
    setFormData(prev => ({ ...prev, content }));
    // Clear error when user starts typing
    if (errors.content) {
      setErrors(prev => ({ ...prev, content: '' }));
    }
  };

  const handleTagToggle = (tag: Tag) => {
    setSelectedTags(prev => {
      const isSelected = prev.some(t => t.id === tag.id);
      if (isSelected) {
        return prev.filter(t => t.id !== tag.id);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleTagRemove = (tagId: string) => {
    setSelectedTags(prev => prev.filter(t => t.id !== tagId));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Summary is required';
    }
    if (isRichTextEmpty(formData.content)) {
      newErrors.content = 'Detailed description is required';
    }
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    if (!formData.subCategoryId) {
      newErrors.subCategoryId = 'Subcategory is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      const ticketData: CreateTicketRequest = {
        category_id: formData.categoryId,
        sub_category_id: formData.subCategoryId,
        title: formData.title,
        description: formData.description,
        content: formData.content,
        priority: formData.priority,
        severity: formData.severity,
        tag_ids: selectedTags.map(tag => ({ [tag.key]: tag.value })),
      };

      await ticketsApi.create(ticketData);
      
      // Redirect to tickets list with success message
      router.push('/tickets?success=created');
    } catch (error) {
      console.error('Failed to create ticket:', error);
      setErrors({ submit: 'Failed to create ticket. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/tickets');
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading form...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert */}
        {errors.submit && (
          <div className="flex items-center p-4 mb-4 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800">
            <AlertCircle className="h-4 w-4 mr-2" />
            {errors.submit}
          </div>
        )}

        {/* Title */}
        <div>
          <Label htmlFor="title" className="mb-2 block">Title *</Label>
          <TextInput
            id="title"
            placeholder="Brief title describing your issue"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            color={errors.title ? 'failure' : 'gray'}
            required
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
          )}
        </div>

        {/* Summary/Description */}
        <div>
          <Label htmlFor="description" className="mb-2 block">Summary *</Label>
          <Textarea
            id="description"
            placeholder="Brief summary of your issue (1-2 sentences)"
            rows={2}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            color={errors.description ? 'failure' : 'gray'}
            required
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
          )}
        </div>

        {/* Category and Subcategory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category" className="mb-2 block">Category *</Label>
            <Select
              id="category"
              value={formData.categoryId}
              onChange={(e) => handleInputChange('categoryId', e.target.value)}
              color={errors.categoryId ? 'failure' : 'gray'}
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.categoryId}</p>
            )}
          </div>

          <div>
            <Label htmlFor="subcategory" className="mb-2 block">Subcategory *</Label>
            <Select
              id="subcategory"
              value={formData.subCategoryId}
              onChange={(e) => handleInputChange('subCategoryId', e.target.value)}
              color={errors.subCategoryId ? 'failure' : 'gray'}
              disabled={!formData.categoryId}
              required
            >
              <option value="">Select a subcategory</option>
              {filteredSubCategories.map((subCategory) => (
                <option key={subCategory.id} value={subCategory.id}>
                  {subCategory.name}
                </option>
              ))}
            </Select>
            {errors.subCategoryId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.subCategoryId}</p>
            )}
          </div>
        </div>

        {/* Priority and Severity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priority" className="mb-2 block">Priority</Label>
            <Select
              id="priority"
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value as TicketPriority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              How important is this issue to your work?
            </p>
          </div>

          <div>
            <Label htmlFor="severity" className="mb-2 block">Severity</Label>
            <Select
              id="severity"
              value={formData.severity}
              onChange={(e) => handleInputChange('severity', e.target.value as TicketSeverity)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              How severely does this issue impact your work?
            </p>
          </div>
        </div>

        {/* Tags Selection */}
        <div>
          <Label className="mb-2 block">Tags (Optional)</Label>
          <div className="space-y-3">
            {/* Selected Tags Display */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {selectedTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-3 py-1 text-sm font-medium bg-orange-100 text-orange-800 rounded-full dark:bg-orange-900/20 dark:text-orange-400"
                  >
                    <TagIcon className="h-3 w-3 mr-1" />
                    {tag.key}: {tag.value}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag.id)}
                      className="ml-2 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Available Tags by Category */}
            {tags.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <Plus className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Available Tags
                    </span>
                  </div>
                </div>
                <div className="p-3 max-h-32 overflow-y-auto">
                  {Object.entries(
                    tags.reduce((acc, tag) => {
                      if (!acc[tag.key]) acc[tag.key] = [];
                      acc[tag.key].push(tag);
                      return acc;
                    }, {} as Record<string, Tag[]>)
                  ).map(([key, keyTags]) => (
                    <div key={key} className="mb-2 last:mb-0">
                      <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 capitalize">
                        {key.replace('_', ' ')}
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {keyTags.map((tag) => {
                          const isSelected = selectedTags.some(t => t.id === tag.id);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => handleTagToggle(tag)}
                              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                                isSelected
                                  ? 'bg-orange-600 text-white dark:bg-orange-600'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                              }`}
                            >
                              {tag.value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Add tags to help categorize and organize your ticket for better tracking and routing.
            </p>
          </div>
        </div>

        {/* Detailed Description */}
        <div>
          <Label htmlFor="content" className="mb-2 block">Detailed Description *</Label>
          <div className="space-y-2">
            <RichTextEditor
              content={formData.content}
              onChange={handleContentChange}
              placeholder="Provide detailed information about your issue. Include steps to reproduce, error messages, screenshots, or any other relevant details."
              className="min-h-[200px]"
            />
            {errors.content && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.content}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              The more details you provide, the faster we can help resolve your issue.
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            color="gray"
            onClick={handleCancel}
            disabled={submitting}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
            disabled={submitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {submitting ? 'Creating...' : 'Create Ticket'}
          </Button>
        </div>
      </form>
    </Card>
  );
}