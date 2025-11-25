'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Label, TextInput, Select } from 'flowbite-react';
import { ArrowLeft, Save } from 'lucide-react';
import { MainLayout, ProtectedRoute } from '../../../src/app/shared/components';
import { LoadingSpinner } from '../../../src/app/shared/components';
import { RichTextEditor } from '../../../src/app/shared/components/RichTextEditor';
import { articlesApi, categoriesApi, subCategoriesApi } from '../../../src/lib/api';
import { useAuth } from '../../../src/contexts/AuthContext';
import type { Category, SubCategory, CreateArticle, RichTextContent } from '../../../src/app/shared/types';
import { createEmptyRichText } from '../../../src/lib/utils';

export default function CreateArticlePage() {
  const router = useRouter();
  const { } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<RichTextContent>(createEmptyRichText());
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  
  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<SubCategory[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesData, subcategoriesData] = await Promise.all([
          categoriesApi.getAll(),
          subCategoriesApi.getAll()
        ]);
        setCategories(categoriesData);
        setSubcategories(subcategoriesData);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.text.trim() || !selectedCategoryId || !selectedSubcategoryId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      const articleData: CreateArticle = {
        title: title.trim(),
        content,
        category_id: selectedCategoryId,
        subcategory_id: selectedSubcategoryId,
      };

      const newArticle = await articlesApi.create(articleData);
      
      // Redirect to the new article
      router.push(`/knowledge-base/${newArticle.id}`);
    } catch (error) {
      console.error('Failed to create article:', error);
      alert('Failed to create article. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="agent">
        <MainLayout>
          <LoadingSpinner text="Loading categories..." />
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
                  Create New Article
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add a new article to the knowledge base
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <Card className="max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-base font-medium">
                  Article Title <span className="text-red-500">*</span>
                </Label>
                <TextInput
                  id="title"
                  placeholder="Enter article title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2"
                  required
                />
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
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="mt-2"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subcategory" className="text-base font-medium">
                    Subcategory <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    id="subcategory"
                    value={selectedSubcategoryId}
                    onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                    className="mt-2"
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
                  <RichTextEditor
                    content={content}
                    onChange={setContent}
                    placeholder="Write your article content here..."
                    className="min-h-[400px]"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  color="gray"
                  onClick={handleBack}
                  disabled={submitting}
                >
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Article
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