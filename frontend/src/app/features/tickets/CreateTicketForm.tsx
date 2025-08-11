'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Label, TextInput, Textarea, Select } from 'flowbite-react';
import { Save, X, AlertCircle } from 'lucide-react';
import { ticketsApi, categoriesApi, subCategoriesApi } from '../../../lib/api';
import { RichTextEditor, FileUpload } from '../../shared/components';
import type { Category, SubCategory, CreateTicketRequest, TicketPriority, RichTextContent, FileAttachmentUpload } from '../../shared/types';
import { filesApi } from '../../../lib/api/files';
import { createEmptyRichText, isRichTextEmpty } from '../../../lib/utils';

export function CreateTicketForm() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<FileAttachmentUpload[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: createEmptyRichText(),
    categoryId: '',
    subCategoryId: '',
    priority: 'medium' as TicketPriority,
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
      const categoriesData = await categoriesApi.getAll();
      setCategories(categoriesData);
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
      
      // First, upload any pending file attachments
      const uploadedFiles: string[] = [];
      let uploadFailed = false;
      
      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];
        if (attachment.file && !attachment.uploaded) {
          try {
            // Update progress
            setAttachments(prev => prev.map((att, index) => 
              index === i ? { ...att, uploadProgress: 0, uploadError: undefined } : att
            ));

            const uploadResponse = await filesApi.upload(attachment.file, (progress) => {
              setAttachments(prev => prev.map((att, index) => 
                index === i ? { ...att, uploadProgress: progress } : att
              ));
            });

            uploadedFiles.push(uploadResponse.id);
            
            // Mark as uploaded
            setAttachments(prev => prev.map((att, index) => 
              index === i ? { 
                ...att, 
                uploaded: true, 
                uploadProgress: 100,
                id: uploadResponse.id,
                url: uploadResponse.url
              } : att
            ));
          } catch (error) {
            console.error(`Failed to upload file ${attachment.name}:`, error);
            setAttachments(prev => prev.map((att, index) => 
              index === i ? { ...att, uploadError: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` } : att
            ));
            uploadFailed = true;
            setErrors({ submit: `Failed to upload file: ${attachment.name}. Please try again.` });
            return; // Stop processing and don't create ticket
          }
        } else if (attachment.id) {
          // File already uploaded
          uploadedFiles.push(attachment.id);
        }
      }
      
      // Only proceed if no upload failures
      if (!uploadFailed) {
        const ticketData: CreateTicketRequest = {
          category_id: formData.categoryId,
          sub_category_id: formData.subCategoryId,
          title: formData.title,
          description: formData.description,
          content: formData.content,
          priority: formData.priority,
        };

        const ticket = await ticketsApi.create(ticketData);
        
        // Attach files to the ticket if any were uploaded
        if (uploadedFiles.length > 0) {
          try {
            await filesApi.attachToTicket(ticket.id, uploadedFiles);
          } catch (attachError) {
            console.error('Failed to attach files to ticket:', attachError);
            // Ticket was created but file attachment failed - still consider it a success
            // The user can attach files later if needed
            console.warn('Ticket created successfully but file attachment failed. Files can be attached later.');
          }
        }
        
        // Redirect to tickets list with success message
        router.push('/tickets?success=created');
      }
    } catch (error) {
      console.error('Failed to create ticket:', error);
      setErrors({ submit: `Failed to create ticket: ${error instanceof Error ? error.message : 'Please try again.'}` });
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

        {/* File Attachments */}
        <div>
          <Label className="mb-2 block">File Attachments</Label>
          <FileUpload
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            disabled={submitting}
            className="w-full"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Optional: Attach relevant files like screenshots, documents, or logs to help us understand your issue better.
          </p>
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