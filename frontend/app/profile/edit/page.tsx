'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout, ProtectedRoute, LoadingSpinner } from '../../../src/app/shared/components';
import { Button, Card } from 'flowbite-react';
import { Save, ArrowLeft, User } from 'lucide-react';
import { useAuth } from '../../../src/contexts/AuthContext';
import { categoriesApi, subCategoriesApi, apiClient } from '../../../src/lib/api';
import type { Category, SubCategory } from '../../../src/app/shared/types';

interface AgentSpecialization {
  category_id: string | null;
  subcategory_ids: string[];
}

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [specialization, setSpecialization] = useState<AgentSpecialization>({
    category_id: null,
    subcategory_ids: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesData, subcategoriesData, specializationData] = await Promise.all([
        categoriesApi.getAll(),
        subCategoriesApi.getAll(),
        apiClient.get<AgentSpecialization>('/users/profile/agent-specialization')
      ]);
      
      
      setCategories(categoriesData);
      setSubcategories(subcategoriesData);
      setSpecialization(specializationData);
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'agent') {
      fetchData();
    }
  }, [user]);

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setSpecialization(prev => ({
      ...prev,
      category_id: checked ? categoryId : null,
      // Clear subcategories when category changes
      subcategory_ids: checked ? [] : []
    }));
  };

  const handleSubcategoryChange = (subcategoryId: string, checked: boolean) => {
    setSpecialization(prev => ({
      ...prev,
      subcategory_ids: checked
        ? [...prev.subcategory_ids, subcategoryId]
        : prev.subcategory_ids.filter(id => id !== subcategoryId)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (!specialization.category_id) {
        alert('Please select a category before saving.');
        return;
      }
      
      
      await apiClient.put('/users/profile/agent-specialization', {
        category_id: specialization.category_id,
        subcategory_ids: specialization.subcategory_ids
      });
      
      alert('Profile updated successfully!');
      router.push('/profile');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/profile');
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <LoadingSpinner text="Loading profile..." />
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleCancel}
                color="gray"
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Profile
              </Button>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-orange-600 flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Edit Specializations
                  </h1>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Update your category and subcategory specializations
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleCancel}
                color="gray"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
              >
                {saving ? (
                  <>
                    <Save className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Debug info - remove this later */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h4 className="font-medium text-yellow-800">Debug Info:</h4>
              <pre className="text-xs text-yellow-700 mt-2">
                {JSON.stringify({ specialization, categoriesLength: categories.length, subcategoriesLength: subcategories.length }, null, 2)}
              </pre>
            </div>
          )}

          {/* Specialization Settings */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Update Specializations
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Choose your category and subcategory specializations. Tickets from these areas will be prioritized for assignment to you.
              </p>
              
              <div className="space-y-6">
                {/* Category Selection */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    Primary Category
                  </h4>
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <div 
                        key={category.id} 
                        className={`relative rounded-lg border p-4 cursor-pointer transition-all ${
                          specialization.category_id === category.id
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => handleCategoryChange(category.id, specialization.category_id !== category.id)}
                      >
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id={`category-${category.id}`}
                              name="category"
                              type="radio"
                              checked={specialization.category_id === category.id}
                              onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                              className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300"
                            />
                          </div>
                          <div className="ml-3 flex-1">
                            <label htmlFor={`category-${category.id}`} className="font-medium text-gray-900 dark:text-white cursor-pointer">
                              {category.name}
                            </label>
                            {category.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subcategory Selection */}
                {specialization.category_id ? (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="h-6 w-6 rounded-full bg-orange-600 flex items-center justify-center">
                        <span className="text-xs font-medium text-white">→</span>
                      </div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        {categories.find(c => c.id === specialization.category_id)?.name} Subcategories
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {subcategories
                        .filter(subcat => subcat.category?.id === specialization.category_id)
                        .map((subcategory) => (
                          <div 
                            key={subcategory.id} 
                            className={`relative rounded-lg border p-3 cursor-pointer transition-all ${
                              specialization.subcategory_ids.includes(subcategory.id)
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            onClick={() => handleSubcategoryChange(subcategory.id, !specialization.subcategory_ids.includes(subcategory.id))}
                          >
                            <div className="flex items-start">
                              <div className="flex items-center h-5">
                                <input
                                  id={`subcategory-${subcategory.id}`}
                                  type="checkbox"
                                  checked={specialization.subcategory_ids.includes(subcategory.id)}
                                  onChange={(e) => handleSubcategoryChange(subcategory.id, e.target.checked)}
                                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
                              </div>
                              <div className="ml-3 flex-1">
                                <label htmlFor={`subcategory-${subcategory.id}`} className="font-medium text-gray-900 dark:text-white cursor-pointer text-sm">
                                  {subcategory.name}
                                </label>
                                {subcategory.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {subcategory.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    
                    {subcategories.filter(subcat => subcat.category?.id === specialization.category_id).length === 0 && (
                      <div className="text-center py-6">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No subcategories available for this category
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="text-center py-8">
                      <div className="h-12 w-12 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                        <span className="text-lg text-gray-400">↑</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Select a category above to choose subcategory specializations
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}