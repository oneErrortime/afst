import { useState, useEffect } from 'react';
import { collectionsApi, booksApi } from '@/api';
import type { Collection, Book, CreateCollectionRequest } from '@/types';
import { Button, Input, Loading, Modal, toast } from '@/components/ui';
import { Layout } from '@/components/layout';
import { Plus, Trash2, BookOpen, Lock, Globe, Edit, X } from 'lucide-react';

export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [collectionBooks, setCollectionBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newCollection, setNewCollection] = useState<CreateCollectionRequest>({
    name: '',
    is_public: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [collectionsData, booksData] = await Promise.all([
        collectionsApi.getMy(),
        booksApi.getAll(),
      ]);
      setCollections(collectionsData);
      setAllBooks(booksData);
    } catch (error) {
      console.error('Failed to load collections:', error);
      toast.error('Не удалось загрузить коллекции');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCollection.name) {
      toast.error('Введите название коллекции');
      return;
    }

    try {
      setCreating(true);
      await collectionsApi.create(newCollection);
      await loadData();
      setShowCreateModal(false);
      setNewCollection({ name: '', is_public: false });
      toast.success('Коллекция создана');
    } catch (error) {
      console.error('Failed to create collection:', error);
      toast.error('Не удалось создать коллекцию');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingCollection) return;

    try {
      await collectionsApi.update(editingCollection.id, {
        name: editingCollection.name,
        description: editingCollection.description,
        is_public: editingCollection.is_public,
        cover_url: editingCollection.cover_url,
      });
      await loadData();
      setEditingCollection(null);
      toast.success('Коллекция обновлена');
    } catch (error) {
      console.error('Failed to update collection:', error);
      toast.error('Не удалось обновить коллекцию');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить эту коллекцию?')) return;

    try {
      await collectionsApi.delete(id);
      await loadData();
      toast.success('Коллекция удалена');
    } catch (error) {
      console.error('Failed to delete collection:', error);
      toast.error('Не удалось удалить коллекцию');
    }
  };

  const handleViewBooks = async (collection: Collection) => {
    setSelectedCollection(collection);
    setLoadingBooks(true);
    try {
      const books = await collectionsApi.getBooks(collection.id);
      setCollectionBooks(books);
    } catch (error) {
      console.error('Failed to load collection books:', error);
      toast.error('Не удалось загрузить книги');
    } finally {
      setLoadingBooks(false);
    }
  };

  const handleRemoveBook = async (bookId: string) => {
    if (!selectedCollection) return;

    try {
      await collectionsApi.removeBook(selectedCollection.id, bookId);
      const books = await collectionsApi.getBooks(selectedCollection.id);
      setCollectionBooks(books);
      await loadData();
      toast.success('Книга удалена из коллекции');
    } catch (error) {
      console.error('Failed to remove book:', error);
      toast.error('Не удалось удалить книгу');
    }
  };

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Мои коллекции</h1>
            <p className="text-gray-500">Организуйте книги в тематические подборки</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Создать коллекцию
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
            >
              <div className="aspect-[16/9] bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center relative">
                {collection.cover_url ? (
                  <img src={collection.cover_url} alt={collection.name} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="h-16 w-16 text-primary-400 opacity-50" />
                )}
                <div className="absolute top-3 right-3">
                  {collection.is_public ? (
                    <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Публичная
                    </div>
                  ) : (
                    <div className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Приватная
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{collection.name}</h3>
                {collection.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{collection.description}</p>
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">{collection.books_count} книг</span>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleViewBooks(collection)} className="flex-1">
                    Открыть
                  </Button>
                  <button
                    onClick={() => setEditingCollection(collection)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  {!collection.is_system && (
                    <button
                      onClick={() => handleDelete(collection.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {collections.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет коллекций</h3>
            <p className="text-gray-500 mb-6">Создайте свою первую коллекцию книг</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Создать коллекцию
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Создать коллекцию"
      >
        <div className="space-y-4">
          <Input
            label="Название"
            value={newCollection.name}
            onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
            placeholder="Например: Любимые книги"
            required
          />
          <textarea
            value={newCollection.description || ''}
            onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
            placeholder="Описание коллекции (опционально)..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <Input
            label="URL обложки"
            value={newCollection.cover_url || ''}
            onChange={(e) => setNewCollection({ ...newCollection, cover_url: e.target.value })}
            placeholder="https://example.com/cover.jpg"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_public"
              checked={newCollection.is_public}
              onChange={(e) => setNewCollection({ ...newCollection, is_public: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="is_public" className="text-sm text-gray-700">
              Сделать коллекцию публичной
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1">
              Отмена
            </Button>
            <Button onClick={handleCreate} loading={creating} className="flex-1">
              Создать
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!editingCollection}
        onClose={() => setEditingCollection(null)}
        title="Редактировать коллекцию"
      >
        {editingCollection && (
          <div className="space-y-4">
            <Input
              label="Название"
              value={editingCollection.name}
              onChange={(e) => setEditingCollection({ ...editingCollection, name: e.target.value })}
              required
            />
            <textarea
              value={editingCollection.description || ''}
              onChange={(e) => setEditingCollection({ ...editingCollection, description: e.target.value })}
              placeholder="Описание коллекции..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <Input
              label="URL обложки"
              value={editingCollection.cover_url || ''}
              onChange={(e) => setEditingCollection({ ...editingCollection, cover_url: e.target.value })}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit_public"
                checked={editingCollection.is_public}
                onChange={(e) => setEditingCollection({ ...editingCollection, is_public: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="edit_public" className="text-sm text-gray-700">
                Публичная коллекция
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={() => setEditingCollection(null)} className="flex-1">
                Отмена
              </Button>
              <Button onClick={handleUpdate} className="flex-1">
                Сохранить
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {selectedCollection && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedCollection(null)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-xl text-gray-900">{selectedCollection.name}</h3>
                  {selectedCollection.description && (
                    <p className="text-sm text-gray-500 mt-1">{selectedCollection.description}</p>
                  )}
                  <p className="text-sm text-gray-400 mt-2">{selectedCollection.books_count} книг в коллекции</p>
                </div>
                <button onClick={() => setSelectedCollection(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {loadingBooks ? (
                <Loading />
              ) : collectionBooks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>В коллекции пока нет книг</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {collectionBooks.map((book) => (
                    <div key={book.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex gap-3">
                        <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center shrink-0 overflow-hidden">
                          {book.cover_url ? (
                            <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{book.title}</h4>
                          <p className="text-sm text-gray-500 truncate">{book.author}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveBook(book.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
