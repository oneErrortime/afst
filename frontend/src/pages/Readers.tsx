import { useState, useEffect } from 'react';
import { readersApi, borrowApi } from '@/api';
import { useAuthStore } from '@/store/authStore';
import { Button, Input, Modal, Loading, EmptyState, toast } from '@/components/ui';
import { Users, Plus, Edit2, Trash2, Search, User, BookOpen } from 'lucide-react';
import type { Reader, CreateReaderRequest, BorrowedBook } from '@/types';
import { AxiosError } from 'axios';
import { Navigate } from 'react-router-dom';

export function Readers() {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReader, setEditingReader] = useState<Reader | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedReader, setSelectedReader] = useState<Reader | null>(null);
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);

  const { isAuthenticated } = useAuthStore();

  const [form, setForm] = useState<CreateReaderRequest>({
    name: '',
    email: '',
  });

  const fetchReaders = async () => {
    try {
      const response = await readersApi.getAll({ limit: 100 });
      setReaders(response.data || []);
    } catch (error) {
      toast.error('Ошибка загрузки читателей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchReaders();
    }
  }, [isAuthenticated]);

  const fetchBorrowedBooks = async (readerId: string) => {
    setLoadingBooks(true);
    try {
      const response = await borrowApi.getByReader(readerId);
      setBorrowedBooks(response.data || []);
    } catch (error) {
      toast.error('Ошибка загрузки книг читателя');
    } finally {
      setLoadingBooks(false);
    }
  };

  const openReaderDetails = (reader: Reader) => {
    setSelectedReader(reader);
    fetchBorrowedBooks(reader.id);
  };

  const openCreateModal = () => {
    setEditingReader(null);
    setForm({ name: '', email: '' });
    setModalOpen(true);
  };

  const openEditModal = (reader: Reader, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingReader(reader);
    setForm({ name: reader.name, email: reader.email });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error('Заполните все поля');
      return;
    }

    setSaving(true);
    try {
      if (editingReader) {
        await readersApi.update(editingReader.id, form);
        toast.success('Читатель обновлен');
      } else {
        await readersApi.create(form);
        toast.success('Читатель создан');
      }
      setModalOpen(false);
      fetchReaders();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await readersApi.delete(id);
      toast.success('Читатель удален');
      setDeleteConfirm(null);
      fetchReaders();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message || 'Ошибка удаления');
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const filteredReaders = readers.filter(
    (reader) =>
      reader.name.toLowerCase().includes(search.toLowerCase()) ||
      reader.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loading text="Загрузка читателей..." />;

  const activeBooks = borrowedBooks.filter((b) => !b.return_date);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Читатели</h1>
          <p className="text-gray-600">Всего читателей: {readers.length}</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Добавить читателя
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Поиск по имени или email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredReaders.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="Читатели не найдены"
          description={search ? 'Попробуйте изменить поисковый запрос' : 'Добавьте первого читателя'}
          action={
            !search ? (
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                Добавить читателя
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredReaders.map((reader) => (
            <div
              key={reader.id}
              className="card p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openReaderDetails(reader)}
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-100 rounded-lg shrink-0">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{reader.name}</h3>
                  <p className="text-sm text-gray-600 truncate">{reader.email}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Добавлен {new Date(reader.created_at).toLocaleDateString('ru')}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => openEditModal(reader, e)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(reader.id);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingReader ? 'Редактировать читателя' : 'Добавить читателя'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Имя *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Иван Иванов"
          />
          <Input
            label="Email *"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="ivan@example.com"
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Отмена
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              {editingReader ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Удалить читателя?" size="sm">
        <p className="text-gray-600 mb-6">Это действие нельзя отменить.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">
            Отмена
          </Button>
          <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="flex-1">
            Удалить
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedReader}
        onClose={() => setSelectedReader(null)}
        title={selectedReader?.name || ''}
        size="lg"
      >
        {selectedReader && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">{selectedReader.email}</div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Книги на руках ({activeBooks.length})
              </h4>

              {loadingBooks ? (
                <Loading size="sm" />
              ) : activeBooks.length === 0 ? (
                <p className="text-sm text-gray-500">Нет книг на руках</p>
              ) : (
                <div className="space-y-2">
                  {activeBooks.map((borrow) => (
                    <div key={borrow.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{borrow.book?.title || 'Книга'}</p>
                        <p className="text-xs text-gray-500">
                          Взята: {new Date(borrow.borrow_date).toLocaleDateString('ru')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
