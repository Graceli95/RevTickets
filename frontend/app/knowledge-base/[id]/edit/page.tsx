'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, Label, TextInput, Select, Alert } from 'flowbite-react';
import { ArrowLeft, Save, X, AlertCircle } from 'lucide-react';
import { MainLayout, ProtectedRoute } from '../../../../src/app/shared/components';
import { LoadingSpinner } from '../../../../src/app/shared/components';
import { RichTextEditor } from '../../../../src/app/shared/components/RichTextEditor';
import { articlesApi, categoriesApi, subCategoriesApi } from '../../../../src/lib/api';
import { useAuth } from '../../../../src/contexts/AuthContext';
import type { Category, SubCategory, Article, UpdateArticle, RichTextContent } from '../../../../src/app/shared/types';

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const { } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<RichTextContent>({ html: '', json: {}, text: '' });
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  
  // Data state
  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<SubCategory[]>([]);

  const articleId = params.id as string;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [articleData, categoriesData, subcategoriesData] = await Promise.all([
          articlesApi.getById(articleId),
          categoriesApi.getAll(),
          subCategoriesApi.getAll()
        ]);
        
        // Set article data and populate form with existing data
        setArticle(articleData);
        
        // Pre-populate form fields with existing article data
        setTitle(articleData.title);
        
        // Ensure content is in proper RichTextContent format for editor initialization
        console.log('Article content:', articleData.content); // Debug log
        
        // Initialize editor with existing content
        setContent(articleData.content || {
          html: '',
          json: {},
          text: ''
        });
        
        // Pre-populate category and subcategory selections
        setSelectedCategoryId(articleData.category?.id || '');
        setSelectedSubcategoryId(articleData.subCategory?.id || '');
        
        setCategories(categoriesData);
        setSubcategories(subcategoriesData);
        // Set content loading state to true to render the editor with data
        setContentLoaded(true);
      } catch (error) {
        console.error('Failed to fetch article data:', error);
        setErrors({ fetch: 'Failed to load article data' });
      } finally {
        setLoading(false);
      }
    };

    if (articleId) {
      fetchData();
    }
  }, [articleId]);

  // Filter subcategories based on selected category
  useEffect(() => {
    if (selectedCategoryId) {
      const filtered = subcategories.filter(sub => sub.category?.id === selectedCategoryId);
      setAvailableSubcategories(filtered);
      // Reset subcategory selection if the current one is not available
      if (selectedSubcategoryId && !filtered.find(sub => sub.id === selectedSubcategoryId)) {
        setSelectedSubcategoryId('');
      }
    } else {
      setAvailableSubcategories([]);
      setSelectedSubcategoryId('');
    }
  }, [selectedCategoryId, subcategories, selectedSubcategoryId]);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'title') setTitle(value);
    else if (field === 'categoryId') setSelectedCategoryId(value);
    else if (field === 'subCategoryId') setSelectedSubcategoryId(value);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleContentChange = (content: RichTextContent) => {
    setContent(content);
    // Clear error when user starts typing
    if (errors.content) {
      setErrors(prev => ({ ...prev, content: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!content.text.trim()) {
      newErrors.content = 'Article content is required';
    }
    if (!selectedCategoryId) {
      newErrors.categoryId = 'Category is required';
    }
    if (!selectedSubcategoryId) {
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
      
      const updateData: UpdateArticle = {
        title: title.trim(),
        content,
        category_id: selectedCategoryId,
        subcategory_id: selectedSubcategoryId,
      };

      await articlesApi.update(articleId, updateData);
      
      // Redirect back to article view with success message
      router.push(`/knowledge-base/${articleId}?updated=true`);
    } catch (error) {
      console.error('Failed to update article:', error);
      setErrors({ submit: 'Failed to update article. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/knowledge-base/${articleId}`);
  };

  const handleBack = () => {
    router.push(`/knowledge-base/${articleId}`);
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="agent">
        <MainLayout>
          <LoadingSpinner text="Loading article..." />
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!article) {
    return (
      <ProtectedRoute requiredRole="agent">
        <MainLayout>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Article Not Found
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              The article you&apos;re trying to edit doesn&apos;t exist or has been removed.
            </p>
            <Button onClick={handleBack} color="gray">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="agent">
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleBack}
                color="gray"
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Edit Article
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Update &quot;{article.title}&quot;
                </p>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {errors.fetch && (
            <Alert color="failure" className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              {errors.fetch}
            </Alert>
          )}

          {/* Form */}
          <Card className="max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Submit Error Alert */}
              {errors.submit && (
                <Alert color="failure">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {errors.submit}
                </Alert>
              )}

              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-base font-medium">
                  Article Title <span className="text-red-500">*</span>
                </Label>
                <TextInput
                  id="title"
                  placeholder="Enter article title..."
                  value={title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="mt-2"
                  color={errors.title ? 'failure' : 'gray'}
                  required
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
                )}
              </div>

              {/* Category and Subcategory */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="text-base font-medium">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    id="category"
                    value={selectedCategoryId}
                    onChange={(e) => handleInputChange('categoryId', e.target.value)}
                    className="mt-2"
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
                  <Label htmlFor="subcategory" className="text-base font-medium">
                    Subcategory <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    id="subcategory"
                    value={selectedSubcategoryId}
                    onChange={(e) => handleInputChange('subCategoryId', e.target.value)}
                    className="mt-2"
                    color={errors.subCategoryId ? 'failure' : 'gray'}
                    disabled={!selectedCategoryId}
                    required
                  >
                    <option value="">Select a subcategory</option>
                    {availableSubcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </Select>
                  {errors.subCategoryId && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.subCategoryId}</p>
                  )}
                  {!selectedCategoryId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Please select a category first
                    </p>
                  )}
                </div>
              </div>

              {/* Content */}
              <div>
                <Label htmlFor="content" className="text-base font-medium">
                  Article Content <span className="text-red-500">*</span>
                </Label>
                <div className="mt-2">
                  {contentLoaded ? (
                    <RichTextEditor
                      key={`editor-${articleId}-${contentLoaded}`}
                      content={content}
                      onChange={handleContentChange}
                      placeholder="Write your article content here..."
                      className="min-h-[400px]"
                    />
                  ) : (
                    <div className="min-h-[400px] border border-gray-300 rounded-lg dark:border-gray-600 p-4 flex items-center justify-center">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <span>Loading content...</span>
                      </div>
                    </div>
                  )}
                  {errors.content && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.content}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
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
                  disabled={submitting || !title.trim() || !content.text.trim() || !selectedCategoryId || !selectedSubcategoryId}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Article
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}