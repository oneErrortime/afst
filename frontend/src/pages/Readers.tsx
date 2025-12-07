import { useState, useEffect } from 'react';
import { readersApi, borrowApi, booksApi } from '@/api';
import { useAuthStore } from '@/store/authStore';
import { Button, Input, Modal, Loading, EmptyState, toast, ConfirmDialog } from '@/components/ui';
import { Users, Plus, Edit2, Trash2, Search, User, BookOpen, Mail, Calendar, RotateCcw } from 'lucide-react';
import type { Reader, CreateReaderRequest, BorrowedBook, Book } from '@/types';
import { AxiosError } from 'axios';
import { Navigate } from 'react-router-dom';

export function Readers() {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReader, setEditingReader] = useState<Reader | null>(null);
  const [deleteReader, setDeleteReader] = useState<Reader | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedReader, setSelectedReader] = useState<Reader | null>(null);
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { isAuthenticated } = useAuthStore();

  const [form, setForm] = useState<CreateReaderRequest>({
    name: '',
    email: '',
  });

  const fetchReaders = async () => {
    try {
      const response = await readersApi.getAll({ limit: 100 });
      setReaders(response || []);
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
      setBorrowedBooks(response || []);
    } catch (error) {
      toast.error('Ошибка загрузки книг читателя');
    } finally {
      setLoadingBooks(false);
    }
  };

  const loadBooksForBorrow = async () => {
    try {
        const res = await booksApi.getAll({ limit: 100 });
        setBooks((res || []) as Book[]);
    } catch (e) {
        toast.error('Ошибка загрузки списка книг');
    }
  };

  const handleBorrowBook = async () => {
      if (!selectedReader || !selectedBookId) return;
      setActionLoading(true);
      try {
          await borrowApi.borrow({ book_id: selectedBookId, reader_id: selectedReader.id });
          toast.success('Книга выдана');
          setShowBorrowModal(false);
          setSelectedBookId('');
          fetchBorrowedBooks(selectedReader.id);
      } catch (e: any) {
          toast.error(e.response?.data?.message || 'Ошибка выдачи');
      } finally {
          setActionLoading(false);
      }
  };

  const handleReturnBook = async (bookId: string) => {
      if (!selectedReader) return;
      if (!confirm('Вернуть книгу?')) return;
      setActionLoading(true);
      try {
          await borrowApi.return({ book_id: bookId, reader_id: selectedReader.id });
          toast.success('Книга возвращена');
          fetchBorrowedBooks(selectedReader.id);
      } catch (e: any) {
          toast.error(e.response?.data?.message || 'Ошибка возврата');
      } finally {
          setActionLoading(false);
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

  const handleDelete = async () => {
    if (!deleteReader) return;
    
    setDeleting(true);
    try {
      await readersApi.delete(deleteReader.id);
      toast.success('Читатель удален');
      setDeleteReader(null);
      fetchReaders();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message || 'Ошибка удаления');
    } finally {
      setDeleting(false);
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
          <p className="text-gray-500">Всего читателей: {readers.length}</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Добавить читателя
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Поиск по имени или email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12"
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
              className="card p-5 hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => openReaderDetails(reader)}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-50 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{reader.name}</h3>
                  <p className="text-sm text-gray-500 truncate flex items-center gap-1.5">
                    <Mail className="h-3 w-3" />
                    {reader.email}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  {new Date(reader.created_at).toLocaleDateString('ru')}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => openEditModal(reader, e)}
                    className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                    title="Редактировать"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteReader(reader);
                    }}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Удалить"
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

      <ConfirmDialog
        isOpen={!!deleteReader}
        onClose={() => setDeleteReader(null)}
        onConfirm={handleDelete}
        title="Удалить читателя?"
        message={`Вы уверены, что хотите удалить читателя "${deleteReader?.name}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        type="danger"
        loading={deleting}
      />

      <Modal
        isOpen={!!selectedReader}
        onClose={() => setSelectedReader(null)}
        title={selectedReader?.name || ''}
        size="lg"
      >
        {selectedReader && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-500">
              <Mail className="h-4 w-4" />
              {selectedReader.email}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary-600" />
                    Книги на руках ({activeBooks.length})
                </h4>
                <Button size="sm" onClick={() => { loadBooksForBorrow(); setShowBorrowModal(true); }}>
                    Выдать
                </Button>
              </div>

              {loadingBooks ? (
                <Loading size="sm" />
              ) : activeBooks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Нет книг на руках</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeBooks.map((borrow) => (
                    <div key={borrow.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <BookOpen className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{borrow.book?.title || 'Книга'}</p>
                          <p className="text-xs text-gray-500">
                            Взята: {new Date(borrow.borrow_date).toLocaleDateString('ru')}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleReturnBook(borrow.book_id)} disabled={actionLoading} title="Вернуть">
                        <RotateCcw className="h-4 w-4 text-blue-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showBorrowModal} onClose={() => setShowBorrowModal(false)} title="Выдача книги">
         <div className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Выберите книгу</label>
                <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500"
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                >
                    <option value="">-- Выберите --</option>
                    {books.filter(b => b.copies_count > 0).map(b => (
                        <option key={b.id} value={b.id}>{b.title} ({b.author}) - {b.copies_count} шт.</option>
                    ))}
                </select>
             </div>
             <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowBorrowModal(false)} className="flex-1">Отмена</Button>
                <Button onClick={handleBorrowBook} disabled={!selectedBookId} loading={actionLoading} className="flex-1">Выдать</Button>
             </div>
         </div>
      </Modal>
    </div>
  );
}
