'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Table, TableHead, TableHeadCell, TableRow, TableCell, TableBody, Modal, ModalHeader, ModalBody, Label, TextInput, Textarea, Select } from 'flowbite-react';
import { Plus, Edit, Trash2, Layers, FolderOpen } from 'lucide-react';
import { categoriesApi, subCategoriesApi } from '../../../lib/api';
import { LoadingSpinner } from '../../shared/components';
import type { Category, SubCategory } from '../../shared/types';

export function SubCategoriesList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
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
      console.error('Failed to fetch subcategories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const handleCreate = () => {
    setEditingSubCategory(null);
    setFormData({ name: '', description: '', categoryId: '' });
    setShowModal(true);
  };

  const handleEdit = (subCategory: SubCategory) => {
    setEditingSubCategory(subCategory);
    setFormData({
      name: subCategory.name,
      description: subCategory.description,
      categoryId: subCategory.categoryId,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim() || !formData.categoryId) return;

    try {
      setSubmitting(true);
      
      if (editingSubCategory) {
        // Update existing subcategory
        await subCategoriesApi.update(editingSubCategory.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          categoryId: formData.categoryId,
        });
      } else {
        // Create new subcategory
        await subCategoriesApi.create({
          name: formData.name.trim(),
          description: formData.description.trim(),
          categoryId: formData.categoryId,
        });
      }
      
      await fetchData();
      setShowModal(false);
      setFormData({ name: '', description: '', categoryId: '' });
    } catch (error) {
      console.error('Failed to save subcategory:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (subCategory: SubCategory) => {
    if (!confirm(`Are you sure you want to delete the subcategory "${subCategory.name}"?`)) {
      return;
    }

    try {
      await subCategoriesApi.delete(subCategory.id);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete subcategory:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading subcategories..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Subcategories</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage detailed subcategories within main categories
          </p>
        </div>
        <Button
          className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
          onClick={handleCreate}
          disabled={categories.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Subcategory
        </Button>
      </div>

      {categories.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No categories available</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You need to create categories first before adding subcategories
            </p>
          </div>
        </Card>
      )}

      {/* Subcategories Table */}
      {categories.length > 0 && (
        <Card>
          {subCategories.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No subcategories found</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Add subcategories to provide more detailed ticket organization
              </p>
              <Button
                className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                onClick={handleCreate}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Subcategory
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Name</TableHeadCell>
                    <TableHeadCell>Category</TableHeadCell>
                    <TableHeadCell>Description</TableHeadCell>
                    <TableHeadCell>
                      <span className="sr-only">Actions</span>
                    </TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody className="divide-y">
                  {subCategories.map((subCategory) => (
                    <TableRow
                      key={subCategory.id}
                      className="bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center space-x-2">
                          <Layers className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          <span>{subCategory.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <FolderOpen className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {getCategoryName(subCategory.categoryId)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {subCategory.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="xs"
                            onClick={() => handleEdit(subCategory)}
                            className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 text-white dark:bg-orange-600 dark:hover:bg-orange-700"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="xs"
                            onClick={() => handleDelete(subCategory)}
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
      )}

      {/* Create/Edit Modal */}
      <Modal show={showModal} onClose={() => setShowModal(false)} size="md">
        <ModalHeader>
          {editingSubCategory ? 'Edit Subcategory' : 'Create New Subcategory'}
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="categoryId" value="Parent Category *" className="mb-2 block" />
              <Select
                id="categoryId"
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
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
              <Label htmlFor="name" value="Subcategory Name *" className="mb-2 block" />
              <TextInput
                id="name"
                placeholder="Enter subcategory name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="description" value="Description *" className="mb-2 block" />
              <Textarea
                id="description"
                placeholder="Describe what this subcategory is for"
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
                disabled={submitting || !formData.name.trim() || !formData.description.trim() || !formData.categoryId}
              >
                {submitting ? 'Saving...' : editingSubCategory ? 'Update Subcategory' : 'Create Subcategory'}
              </Button>
            </div>
          </form>
        </ModalBody>
      </Modal>
    </div>
  );
}