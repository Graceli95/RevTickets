'use client';

import { CategoriesList } from './CategoriesList';

export function CategoriesManagement() {
  return (
    <div className="space-y-6">
      <div className="py-6">
        <CategoriesList />
      </div>
    </div>
  );
}