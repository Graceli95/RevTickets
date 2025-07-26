'use client';

import { useState } from 'react';
import { Tabs, TabItem } from 'flowbite-react';
import { FolderOpen, Tag, Layers } from 'lucide-react';
import { CategoriesList } from './CategoriesList';
import { SubCategoriesList } from './SubCategoriesList';
import { TagsList } from './TagsList';

export function CategoriesManagement() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="space-y-6">
      <Tabs
        aria-label="Categories management tabs"
        variant="underline"
        onActiveTabChange={(tab) => setActiveTab(tab)}
      >
        <TabItem
          active={activeTab === 0}
          title="Categories"
          icon={FolderOpen}
        >
          <div className="py-6">
            <CategoriesList />
          </div>
        </TabItem>
        
        <TabItem
          active={activeTab === 1}
          title="Subcategories"
          icon={Layers}
        >
          <div className="py-6">
            <SubCategoriesList />
          </div>
        </TabItem>
        
        <TabItem
          active={activeTab === 2}
          title="Tags"
          icon={Tag}
        >
          <div className="py-6">
            <TagsList />
          </div>
        </TabItem>
      </Tabs>
    </div>
  );
}