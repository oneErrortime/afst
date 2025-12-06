import React, { useEffect, useState } from 'react';
import { CollectionsService, Collection, CreateCollectionDTO, UpdateCollectionDTO, OpenAPI } from '@/shared/api';
import { Loading, EmptyState, Modal, Input, Button, toast, ConfirmDialog } from '@/components/ui';
import { Plus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';


OpenAPI.BASE = 'http://localhost:8080/api/v1';

export function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null);
  const [form, setForm] = useState<CreateCollectionDTO>({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) {
      OpenAPI.HEADERS = {
        Authorization: `Bearer ${token}`,
      };
    }
  }, [token]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const data = await CollectionsService.getCollections();
      setCollections(data || []);
    } catch (err) {
      toast.error('Failed to fetch collections.');
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
        await CollectionsService.putCollections({ id: editingCollection.id, requestBody: form as UpdateCollectionDTO });
        toast.success('Collection updated');
      } else {
        await CollectionsService.postCollections({ requestBody: form });
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
      await CollectionsService.deleteCollections({ id: deletingCollection.id });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Мои коллекции</h1>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Новая коллекция
        </Button>
      </div>

      {collections.length === 0 ? (
        <EmptyState
          title="Коллекций пока нет"
          description="Создайте свою первую коллекцию, чтобы упорядочить книги."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map(collection => (
            <div key={collection.id} className="card p-4">
              <h2 className="font-semibold text-lg">{collection.name}</h2>
              <p className="text-gray-500 text-sm">{collection.description}</p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditModal(collection)}>Редактировать</Button>
                <Button variant="danger" size="sm" onClick={() => setDeletingCollection(collection)}>Удалить</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCollection ? 'Редактировать коллекцию' : 'Новая коллекция'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Название"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Описание"
            value={form.description || ''}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" loading={saving}>
              {editingCollection ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingCollection}
        onClose={() => setDeletingCollection(null)}
        onConfirm={handleDelete}
        title="Удалить коллекцию?"
        message={`Вы уверены, что хотите удалить коллекцию "${deletingCollection?.name}"?`}
        loading={deleting}
      />
    </div>
  );
}
