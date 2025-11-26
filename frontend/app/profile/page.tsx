'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout, ProtectedRoute, LoadingSpinner } from '../../src/app/shared/components';
import { Button, Card } from 'flowbite-react';
import { Edit3, User } from 'lucide-react';
import { useAuth } from '../../src/contexts/AuthContext';
import { categoriesApi, subCategoriesApi, apiClient } from '../../src/lib/api';
import type { Category, SubCategory } from '../../src/app/shared/types';

interface AgentSpecialization {
  category_id: string | null;
  subcategory_ids: string[];
}

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
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
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-orange-600 flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Agent Profile
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage your specializations and ticket assignment preferences
              </p>
            </div>
          </div>

          {/* User Information */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name
                  </label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-white">
                    {user?.first_name} {user?.last_name}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-white">
                    {user?.email}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role
                  </label>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Agent
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Specializations */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Current Specializations
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Your category and subcategory specializations for ticket assignment
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/profile/edit')}
                  className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                  size="sm"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Specializations
                </Button>
              </div>

              {(specialization.category_id || specialization.subcategory_ids.length > 0) ? (
                <div className="space-y-4">
                  {specialization.category_id && (
                    <div className="flex items-center space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-orange-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">C</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {categories.find(c => c.id === specialization.category_id)?.name || 'Unknown Category'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Primary Category</p>
                      </div>
                    </div>
                  )}
                  
                  {specialization.subcategory_ids.length > 0 && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">{specialization.subcategory_ids.length}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                            Subcategory Specializations ({specialization.subcategory_ids.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {specialization.subcategory_ids.map(subcatId => {
                              const subcat = subcategories.find(s => s.id === subcatId);
                              return subcat ? (
                                <span
                                  key={subcatId}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                >
                                  {subcat.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="h-16 w-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Specializations Set
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Set your category and subcategory specializations to receive targeted ticket assignments.
                  </p>
                  <Button
                    onClick={() => router.push('/profile/edit')}
                    className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Set Specializations
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}