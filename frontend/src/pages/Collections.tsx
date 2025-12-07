import { useState, useEffect } from 'react';
import { collectionsApi, type Collection, type CreateCollectionDTO, type UpdateCollectionDTO } from '@/api';
import { Button, Input, Modal, Loading } from '@/components/ui';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { toast } from '@/components/ui/Toast';

export function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetchCollections = async () => {
    try {
      const data = await collectionsApi.getMyCollections();
      setCollections(data || []);
    } catch {
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleSave = async () => {
    try {
      if (editingCollection) {
        await collectionsApi.update(editingCollection.id!, form as UpdateCollectionDTO);
        toast.success('Collection updated');
      } else {
        await collectionsApi.create(form as CreateCollectionDTO);
        toast.success('Collection created');
      }
      setModalOpen(false);
      fetchCollections();
    } catch {
      toast.error('Failed to save collection');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this collection?')) return;
    
    try {
      await collectionsApi.delete(id);
      toast.success('Collection deleted');
      fetchCollections();
    } catch {
      toast.error('Failed to delete collection');
    }
  };

  const openModal = (collection?: Collection) => {
    if (collection) {
      setEditingCollection(collection);
      setForm({ name: collection.name || '', description: collection.description || '' });
    } else {
      setEditingCollection(null);
      setForm({ name: '', description: '' });
    }
    setModalOpen(true);
  };

  if (loading) return <Loading text="Loading collections..." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Collections</h1>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4 mr-2" />
          New Collection
        </Button>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No collections yet. Create your first collection!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <div key={collection.id} className="p-6 bg-white rounded-lg border hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{collection.name}</h3>
                    <p className="text-sm text-gray-500">
                      {(collection as any).books?.length || 0} books
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(collection)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(collection.id!)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {collection.description && (
                <p className="text-sm text-gray-600">{collection.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal isOpen={true} onClose={() => setModalOpen(false)} title={editingCollection ? 'Edit Collection' : 'New Collection'}>
          <div className="space-y-4">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Collection name"
              required
            />
            <Input
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingCollection ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
