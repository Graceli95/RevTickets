'use client';

import { MainLayout, ProtectedRoute } from '../../src/app/shared/components';
import { CategoriesManagement } from '../../src/app/features/categories';

export default function CategoriesPage() {
  return (
    <ProtectedRoute requiredRole="agent">
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Categories Management</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Organize and manage ticket categories, subcategories, and tags
            </p>
          </div>
          
          <CategoriesManagement />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}