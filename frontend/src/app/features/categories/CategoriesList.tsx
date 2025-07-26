'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Table, TableHead, TableHeadCell, TableRow, TableCell, TableBody, Modal, ModalHeader, ModalBody, Label, TextInput, Textarea } from 'flowbite-react';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import { categoriesApi, subCategoriesApi } from '../../../lib/api';
import { LoadingSpinner } from '../../shared/components';
import type { Category, SubCategory } from '../../shared/types';

export function CategoriesList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesData, subCategoriesData] = await Promise.all([
        categoriesApi.getAll(),
        subCategoriesApi.getAll(),
      ]);
      setCategories(categoriesData);
      setSubCategories(subCategoriesData);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubCategoryCount = (categoryId: string) => {
    return subCategories.filter(sub => sub.category_id === categoryId).length;
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) return;

    try {
      setSubmitting(true);
      
      if (editingCategory) {
        // Update existing category
        await categoriesApi.update(editingCategory.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
        });
      } else {
        // Create new category
        await categoriesApi.create({
          name: formData.name.trim(),
          description: formData.description.trim(),
        });
      }
      
      await fetchData();
      setShowModal(false);
      setFormData({ name: '', description: '' });
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category: Category) => {
    const subcategoryCount = getSubCategoryCount(category.id);
    
    if (subcategoryCount > 0) {
      alert(`Cannot delete category "${category.name}" because it has ${subcategoryCount} subcategory(ies). Please delete the subcategories first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      return;
    }

    try {
      await categoriesApi.delete(category.id);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading categories..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Categories</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage main ticket categories
          </p>
        </div>
        <Button
          className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
          onClick={handleCreate}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Categories Table */}
      <Card>
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No categories found</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Get started by creating your first ticket category
            </p>
            <Button
              className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
              onClick={handleCreate}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Name</TableHeadCell>
                  <TableHeadCell>Description</TableHeadCell>
                  <TableHeadCell>Subcategories</TableHeadCell>
                  <TableHeadCell>Tags</TableHeadCell>
                  <TableHeadCell>
                    <span className="sr-only">Actions</span>
                  </TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="divide-y">
                {categories.map((category) => (
                  <TableRow
                    key={category.id}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center space-x-2">
                        <FolderOpen className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <span>{category.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      {category.description}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full dark:bg-orange-900/20 dark:text-orange-400">
                        {getSubCategoryCount(category.id)} subcategories
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-gray-400 dark:text-gray-600">Tags managed separately</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="xs"
                          onClick={() => handleEdit(category)}
                          className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 text-white dark:bg-orange-600 dark:hover:bg-orange-700"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="xs"
                          onClick={() => handleDelete(category)}
                          className="bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white dark:bg-red-600 dark:hover:bg-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onClose={() => setShowModal(false)} size="md">
        <ModalHeader>
          {editingCategory ? 'Edit Category' : 'Create New Category'}
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="mb-2 block">Category Name *</Label>
              <TextInput
                id="name"
                placeholder="Enter category name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="mb-2 block">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what this category is for"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="bg-gray-500 hover:bg-gray-600 focus:ring-gray-400 text-white dark:bg-gray-600 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                disabled={submitting || !formData.name.trim() || !formData.description.trim()}
              >
                {submitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
            </div>
          </form>
        </ModalBody>
      </Modal>
    </div>
  );
}