'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Label, TextInput, Textarea, Select } from 'flowbite-react';
import { Save, X, AlertCircle } from 'lucide-react';
import { ticketsApi, categoriesApi, subCategoriesApi } from '../../../lib/api';
import { RichTextEditor } from '../../shared/components';
import type { Category, SubCategory, CreateTicket, TicketPriority, TicketSeverity } from '../../shared/types';

export function CreateTicketForm() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    categoryId: '',
    subCategoryId: '',
    priority: 'medium' as TicketPriority,
    severity: 'medium' as TicketSeverity,
  });

  useEffect(() => {
    fetchFormData();
  }, []);

  useEffect(() => {
    if (formData.categoryId) {
      const filtered = subCategories.filter(sub => sub.categoryId === formData.categoryId);
      setFilteredSubCategories(filtered);
      // Reset subcategory if it doesn't belong to the selected category
      if (formData.subCategoryId && !filtered.find(sub => sub.id === formData.subCategoryId)) {
        setFormData(prev => ({ ...prev, subCategoryId: '' }));
      }
    } else {
      setFilteredSubCategories([]);
    }
  }, [formData.categoryId, subCategories]);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      const [categoriesData, subCategoriesData] = await Promise.all([
        categoriesApi.getAll(),
        subCategoriesApi.getAll(),
      ]);
      setCategories(categoriesData);
      setSubCategories(subCategoriesData);
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Summary is required';
    }
    if (!formData.content.trim()) {
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
      
      const ticketData: CreateTicket = {
        ...formData,
        userId: 'current-user-id', // TODO: Get from auth context
        tagIds: [], // TODO: Add tag selection
      };

      const newTicket = await ticketsApi.create(ticketData);
      
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
          <Label htmlFor="title" value="Title *" className="mb-2 block" />
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
          <Label htmlFor="description" value="Summary *" className="mb-2 block" />
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
            <Label htmlFor="category" value="Category *" className="mb-2 block" />
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
            <Label htmlFor="subcategory" value="Subcategory *" className="mb-2 block" />
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
            <Label htmlFor="priority" value="Priority" className="mb-2 block" />
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
            <Label htmlFor="severity" value="Severity" className="mb-2 block" />
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

        {/* Detailed Description */}
        <div>
          <Label htmlFor="content" value="Detailed Description *" className="mb-2 block" />
          <div className="space-y-2">
            <RichTextEditor
              content={formData.content}
              onChange={(content) => handleInputChange('content', content)}
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
            color="blue"
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