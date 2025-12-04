import { useState, useEffect, useRef } from 'react';
import { booksApi, filesApi, categoriesApi } from '@/api';
import type { Book, BookFile, Category, CreateBookRequest } from '@/types';
import { Button, Input, Loading, Modal } from '@/components/ui';
import { Layout } from '@/components/layout';
import { Upload, Trash2, FileText, Plus, Search, Filter, Eye, Edit, X } from 'lucide-react';

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function BookFilesPanel({ book, onClose }: { book: Book; onClose: () => void }) {
  const [files, setFiles] = useState<BookFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, [book.id]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await booksApi.getFiles(book.id);
      setFiles(data);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/epub+zip', 'application/x-mobipocket-ebook'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|epub|mobi)$/i)) {
      alert('Поддерживаются только PDF, EPUB и MOBI файлы');
      return;
    }

    try {
      setUploading(true);
      await booksApi.uploadFile(book.id, file);
      await loadFiles();
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Не удалось загрузить файл');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Удалить этот файл?')) return;

    try {
      await filesApi.delete(fileId);
      await loadFiles();
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Не удалось удалить файл');
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{book.title}</h3>
          <p className="text-sm text-gray-500">Управление файлами</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <Loading />
        ) : (
          <div className="space-y-3">
            {files.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Файлы не загружены</p>
              </div>
            ) : (
              files.map((file) => (
                <div
                  key={file.id}
                  className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg ${
                      file.file_type === 'pdf' ? 'bg-red-100 text-red-600' :
                      file.file_type === 'epub' ? 'bg-blue-100 text-blue-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{file.original_name}</p>
                      <p className="text-xs text-gray-500">
                        {file.file_type.toUpperCase()} • {formatFileSize(file.file_size)}
                        {file.page_count > 0 && ` • ${file.page_count} стр.`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.epub,.mobi"
          onChange={handleUpload}
          className="hidden"
        />
        <Button
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
          loading={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Загрузить файл
        </Button>
      </div>
    </div>
  );
}

export default function AdminBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newBook, setNewBook] = useState<CreateBookRequest>({
    title: '',
    author: '',
    copies_count: 1,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [booksData, categoriesData] = await Promise.all([
        booksApi.getAll(),
        categoriesApi.getAll(),
      ]);
      setBooks(booksData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newBook.title || !newBook.author) {
      alert('Заполните название и автора');
      return;
    }

    try {
      setCreating(true);
      await booksApi.create(newBook);
      await loadData();
      setShowCreateModal(false);
      setNewBook({ title: '', author: '', copies_count: 1 });
    } catch (error) {
      console.error('Failed to create book:', error);
      alert('Не удалось создать книгу');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (bookId: string) => {
    if (!confirm('Удалить эту книгу?')) return;

    try {
      await booksApi.delete(bookId);
      await loadData();
    } catch (error) {
      console.error('Failed to delete book:', error);
      alert('Не удалось удалить книгу');
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(search.toLowerCase()) ||
    book.author.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Управление книгами</h1>
            <p className="text-gray-500">Загрузка файлов и редактирование каталога</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить книгу
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию или автору..."
              className="pl-10"
            />
          </div>
          <Button variant="secondary">
            <Filter className="h-4 w-4 mr-2" />
            Фильтры
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Книга</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Статус</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Файлы</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Просмотры</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBooks.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-14 bg-gray-100 rounded flex items-center justify-center shrink-0">
                        {book.cover_url ? (
                          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover rounded" />
                        ) : (
                          <FileText className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{book.title}</p>
                        <p className="text-sm text-gray-500 truncate">{book.author}</p>
                        {book.is_premium && (
                          <span className="inline-block px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded mt-1">
                            Premium
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      book.status === 'published' ? 'bg-green-100 text-green-700' :
                      book.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {book.status === 'published' ? 'Опубликовано' :
                       book.status === 'draft' ? 'Черновик' : 'В архиве'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedBook(book)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {book.files?.length || 0} файл(ов)
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {book.view_count}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedBook(book)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Файлы"
                      >
                        <Upload className="h-4 w-4" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Редактировать"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(book.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBooks.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {search ? 'Книги не найдены' : 'Нет книг в каталоге'}
            </div>
          )}
        </div>
      </div>

      {selectedBook && (
        <BookFilesPanel book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Добавить книгу"
      >
        <div className="space-y-4">
          <Input
            label="Название"
            value={newBook.title}
            onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
            placeholder="Введите название книги"
            required
          />
          <Input
            label="Автор"
            value={newBook.author}
            onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
            placeholder="Введите имя автора"
            required
          />
          <Input
            label="ISBN"
            value={newBook.isbn || ''}
            onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
            placeholder="978-3-16-148410-0"
          />
          <Input
            label="Год публикации"
            type="number"
            value={newBook.publication_year || ''}
            onChange={(e) => setNewBook({ ...newBook, publication_year: parseInt(e.target.value) || undefined })}
            placeholder="2024"
          />
          <Input
            label="Количество копий"
            type="number"
            value={newBook.copies_count}
            onChange={(e) => setNewBook({ ...newBook, copies_count: parseInt(e.target.value) || 1 })}
            min={1}
          />
          <Input
            label="URL обложки"
            value={newBook.cover_url || ''}
            onChange={(e) => setNewBook({ ...newBook, cover_url: e.target.value })}
            placeholder="https://example.com/cover.jpg"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_premium"
              checked={newBook.is_premium || false}
              onChange={(e) => setNewBook({ ...newBook, is_premium: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="is_premium" className="text-sm text-gray-700">
              Premium контент
            </label>
          </div>
          <textarea
            value={newBook.description || ''}
            onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
            placeholder="Описание книги..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
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
    </Layout>
  );
}
