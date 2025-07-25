'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Table, TableHead, TableHeadCell, TableRow, TableCell, TableBody, Modal, ModalHeader, ModalBody, Label, TextInput } from 'flowbite-react';
import { Plus, Edit, Trash2, Tag as TagIcon } from 'lucide-react';
import { tagsApi } from '../../../lib/api';
import { LoadingSpinner } from '../../shared/components';
import type { Tag } from '../../shared/types';

export function TagsList() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    key: '',
    value: '',
  });

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const tagsData = await tagsApi.getAll();
      setTags(tagsData);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group tags by key for better display
  const groupedTags = tags.reduce((acc, tag) => {
    if (!acc[tag.key]) {
      acc[tag.key] = [];
    }
    acc[tag.key].push(tag);
    return acc;
  }, {} as Record<string, Tag[]>);

  const handleCreate = () => {
    setEditingTag(null);
    setFormData({ key: '', value: '' });
    setShowModal(true);
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      key: tag.key,
      value: tag.value,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.key.trim() || !formData.value.trim()) return;

    // Check if tag already exists (except when editing the same tag)
    const existingTag = tags.find(tag => 
      tag.key === formData.key.trim() && 
      tag.value === formData.value.trim() &&
      (!editingTag || (tag.key !== editingTag.key || tag.value !== editingTag.value))
    );

    if (existingTag) {
      alert('A tag with this key and value already exists.');
      return;
    }

    try {
      setSubmitting(true);
      
      if (editingTag) {
        // Update existing tag
        await tagsApi.update(`${editingTag.key}:${editingTag.value}`, {
          key: formData.key.trim(),
          value: formData.value.trim(),
        });
      } else {
        // Create new tag
        await tagsApi.create({
          key: formData.key.trim(),
          value: formData.value.trim(),
        });
      }
      
      await fetchTags();
      setShowModal(false);
      setFormData({ key: '', value: '' });
    } catch (error) {
      console.error('Failed to save tag:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`Are you sure you want to delete the tag "${tag.key}: ${tag.value}"?`)) {
      return;
    }

    try {
      await tagsApi.delete(`${tag.key}:${tag.value}`);
      await fetchTags();
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading tags..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tags</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage key-value tags for organizing and categorizing content
          </p>
        </div>
        <Button
          className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
          onClick={handleCreate}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Tag
        </Button>
      </div>

      {/* Tags Overview Cards */}
      {Object.keys(groupedTags).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(groupedTags).map(([key, keyTags]) => (
            <Card key={key}>
              <div className="flex items-center space-x-2 mb-3">
                <TagIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <h3 className="font-medium text-gray-900 dark:text-white capitalize">{key}</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({keyTags.length} values)
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {keyTags.map((tag) => (
                  <span
                    key={`${tag.key}:${tag.value}`}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full dark:bg-orange-900/20 dark:text-orange-400"
                  >
                    {tag.value}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tags Table */}
      <Card>
        {tags.length === 0 ? (
          <div className="text-center py-12">
            <TagIcon className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tags found</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Create tags to help organize and categorize your content
            </p>
            <Button
              className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
              onClick={handleCreate}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Tag
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Key</TableHeadCell>
                  <TableHeadCell>Value</TableHeadCell>
                  <TableHeadCell>
                    <span className="sr-only">Actions</span>
                  </TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="divide-y">
                {tags.map((tag) => (
                  <TableRow
                    key={`${tag.key}:${tag.value}`}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center space-x-2">
                        <TagIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <span className="font-mono text-sm">{tag.key}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 text-sm font-medium bg-orange-100 text-orange-800 rounded-full dark:bg-orange-900/20 dark:text-orange-400">
                        {tag.value}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="xs"
                          color="gray"
                          onClick={() => handleEdit(tag)}
                          className="hover:bg-orange-50 dark:hover:bg-orange-900/20"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="xs"
                          color="gray"
                          onClick={() => handleDelete(tag)}
                          className="hover:bg-red-50 dark:hover:bg-red-900/20"
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
          {editingTag ? 'Edit Tag' : 'Create New Tag'}
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="key" value="Tag Key *" className="mb-2 block" />
              <TextInput
                id="key"
                placeholder="e.g., department, priority, type"
                value={formData.key}
                onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                The category or type of this tag (e.g., &quot;department&quot;, &quot;priority&quot;)
              </p>
            </div>

            <div>
              <Label htmlFor="value" value="Tag Value *" className="mb-2 block" />
              <TextInput
                id="value"
                placeholder="e.g., IT, high, bug"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                The specific value for this tag (e.g., &quot;IT&quot;, &quot;high&quot;, &quot;bug&quot;)
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                color="gray"
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                disabled={submitting || !formData.key.trim() || !formData.value.trim()}
              >
                {submitting ? 'Saving...' : editingTag ? 'Update Tag' : 'Create Tag'}
              </Button>
            </div>
          </form>
        </ModalBody>
      </Modal>
    </div>
  );
}