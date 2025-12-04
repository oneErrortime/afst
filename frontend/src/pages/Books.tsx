import { useState, useEffect } from 'react';
import { booksApi } from '@/api';
import { useAuthStore } from '@/store/authStore';
import { Button, Input, Modal, Loading, EmptyState, toast } from '@/components/ui';
import { Book as BookIcon, Plus, Edit2, Trash2, Search, BookOpen } from 'lucide-react';
import type { Book, CreateBookRequest, UpdateBookRequest } from '@/types';
import { AxiosError } from 'axios';

export function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { isAuthenticated } = useAuthStore();

  const [form, setForm] = useState<CreateBookRequest>({
    title: '',
    author: '',
    publication_year: undefined,
    isbn: '',
    copies_count: 1,
    description: '',
  });

  const fetchBooks = async () => {
    try {
      const response = await booksApi.getAll({ limit: 100 });
      setBooks(response.data || []);
    } catch (error) {
      toast.error('Ошибка загрузки книг');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const openCreateModal = () => {
    setEditingBook(null);
    setForm({
      title: '',
      author: '',
      publication_year: undefined,
      isbn: '',
      copies_count: 1,
      description: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setForm({
      title: book.title,
      author: book.author,
      publication_year: book.publication_year,
      isbn: book.isbn || '',
      copies_count: book.copies_count,
      description: book.description || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.author) {
      toast.error('Заполните обязательные поля');
      return;
    }

    setSaving(true);
    try {
      const data: CreateBookRequest | UpdateBookRequest = {
        title: form.title,
        author: form.author,
        publication_year: form.publication_year || undefined,
        isbn: form.isbn || undefined,
        copies_count: form.copies_count,
        description: form.description || undefined,
      };

      if (editingBook) {
        await booksApi.update(editingBook.id, data);
        toast.success('Книга обновлена');
      } else {
        await booksApi.create(data as CreateBookRequest);
        toast.success('Книга создана');
      }
      setModalOpen(false);
      fetchBooks();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await booksApi.delete(id);
      toast.success('Книга удалена');
      setDeleteConfirm(null);
      fetchBooks();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message || 'Ошибка удаления');
    }
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loading text="Загрузка книг..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Каталог книг</h1>
          <p className="text-gray-600">Всего книг: {books.length}</p>
        </div>
        {isAuthenticated && (
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Добавить книгу
          </Button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Поиск по названию или автору..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredBooks.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title="Книги не найдены"
          description={search ? 'Попробуйте изменить поисковый запрос' : 'В каталоге пока нет книг'}
          action={
            isAuthenticated && !search ? (
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                Добавить первую книгу
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBooks.map((book) => (
            <div key={book.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary-100 rounded-lg shrink-0">
                  <BookIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{book.title}</h3>
                  <p className="text-sm text-gray-600">{book.author}</p>
                  {book.publication_year && (
                    <p className="text-xs text-gray-500 mt-1">{book.publication_year} г.</p>
                  )}
                </div>
              </div>

              {book.description && (
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">{book.description}</p>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`badge ${
                    book.copies_count > 0 ? 'badge-success' : 'badge-danger'
                  }`}
                >
                  {book.copies_count > 0 ? `${book.copies_count} экз.` : 'Нет в наличии'}
                </span>

                {isAuthenticated && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(book)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(book.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBook ? 'Редактировать книгу' : 'Добавить книгу'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Название *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Война и мир"
          />
          <Input
            label="Автор *"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
            placeholder="Лев Толстой"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Год издания"
              type="number"
              value={form.publication_year || ''}
              onChange={(e) =>
                setForm({ ...form, publication_year: e.target.value ? parseInt(e.target.value) : undefined })
              }
              placeholder="1869"
            />
            <Input
              label="Кол-во экземпляров"
              type="number"
              min="0"
              value={form.copies_count}
              onChange={(e) => setForm({ ...form, copies_count: parseInt(e.target.value) || 0 })}
            />
          </div>
          <Input
            label="ISBN"
            value={form.isbn || ''}
            onChange={(e) => setForm({ ...form, isbn: e.target.value })}
            placeholder="978-5-389-07960-1"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Описание</label>
            <textarea
              className="input min-h-[80px] resize-none"
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Краткое описание книги..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Отмена
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              {editingBook ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Удалить книгу?" size="sm">
        <p className="text-gray-600 mb-6">Это действие нельзя отменить. Книга будет удалена из каталога.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">
            Отмена
          </Button>
          <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="flex-1">
            Удалить
          </Button>
        </div>
      </Modal>
    </div>
  );
}
