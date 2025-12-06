import React, { useEffect, useState } from 'react';
import { collectionsApi } from '@/api';
import { Collection, CreateCollectionRequest, UpdateCollectionRequest } from '@/types';
import { Loading, EmptyState, Modal, Input, Button, toast, ConfirmDialog } from '@/components/ui';
import { Plus } from 'lucide-react';

export function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null);
  const [form, setForm] = useState<CreateCollectionRequest>({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const data = await collectionsApi.getMyCollections();
      setCollections(data);
    } catch (err) {
      setError('Failed to fetch collections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const openCreateModal = () => {
    setEditingCollection(null);
    setForm({ name: '', description: '' });
    setModalOpen(true);
  };

  const openEditModal = (collection: Collection) => {
    setEditingCollection(collection);
    setForm({ name: collection.name, description: collection.description });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCollection) {
        await collectionsApi.updateCollection(editingCollection.id, form);
        toast.success('Collection updated');
      } else {
        await collectionsApi.createCollection(form);
        toast.success('Collection created');
      }
      setModalOpen(false);
      fetchCollections();
    } catch (error) {
      toast.error('Failed to save collection.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCollection) return;
    setDeleting(true);
    try {
      await collectionsApi.deleteCollection(deletingCollection.id);
      toast.success('Collection deleted');
      setDeletingCollection(null);
      fetchCollections();
    } catch (error) {
      toast.error('Failed to delete collection.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <Loading text="Loading collections..." />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Collections</h1>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          New Collection
        </Button>
      </div>

      {collections.length === 0 ? (
        <EmptyState
          title="No collections yet"
          description="Create your first collection to organize your books."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map(collection => (
            <div key={collection.id} className="card p-4">
              <h2 className="font-semibold text-lg">{collection.name}</h2>
              <p className="text-gray-500 text-sm">{collection.description}</p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditModal(collection)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => setDeletingCollection(collection)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCollection ? 'Edit Collection' : 'New Collection'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Description"
            value={form.description || ''}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingCollection ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingCollection}
        onClose={() => setDeletingCollection(null)}
        onConfirm={handleDelete}
        title="Delete Collection"
        message={`Are you sure you want to delete the collection "${deletingCollection?.name}"?`}
        loading={deleting}
      />
    </div>
  );
}
