import { useState, useEffect } from 'react';
import { booksApi, filesApi, categoriesApi } from '@/api';
import type { Book, BookFile, Category, CreateBookRequest } from '@/types';
import { Button, Input, Loading, Modal, DropZone, toast } from '@/components/ui';

import { Upload, Trash2, FileText, Plus, Search, Eye, Edit, X, Check, BookOpen, BarChart3 } from 'lucide-react';

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

interface BookFilesPanelProps {
  book: Book;
  onClose: () => void;
  onFilesUpdated: () => void;
}

function BookFilesPanel({ book, onClose, onFilesUpdated }: BookFilesPanelProps) {
  const [files, setFiles] = useState<BookFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [, setUploadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await booksApi.getFiles(book.id);
      setFiles(data);
    } catch (error) {
      console.error('Failed to load files:', error);
      toast.error('Не удалось загрузить файлы');
    } finally {
      setLoading(false);
    }
  };

  const handleFilesSelected = async (selectedFiles: File[]) => {
    setUploading(true);
    const results: { success: boolean; name: string; error?: string }[] = [];

    for (const file of selectedFiles) {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        await booksApi.uploadFile(book.id, file);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        results.push({ success: true, name: file.name });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        results.push({ success: false, name: file.name, error: errorMessage });
        setUploadProgress(prev => ({ ...prev, [file.name]: -1 }));
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    if (successful > 0) {
      toast.success(`Загружено файлов: ${successful}`);
    }
    if (failed > 0) {
      toast.error(`Не удалось загрузить: ${failed}`);
    }

    await loadFiles();
    onFilesUpdated();
    setUploading(false);
    setUploadProgress({});
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Удалить этот файл?')) return;

    try {
      await filesApi.delete(fileId);
      await loadFiles();
      onFilesUpdated();
      toast.success('Файл удалён');
    } catch (error) {
      console.error('Failed to delete file:', error);
      toast.error('Не удалось удалить файл');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-xl text-gray-900">{book.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{book.author}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg -mr-2 -mt-2">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Загрузить файлы</h4>
            <DropZone
              onFilesSelected={handleFilesSelected}
              accept=".pdf,.epub,.mobi"
              multiple={true}
              maxSize={100 * 1024 * 1024}
              maxFiles={5}
              disabled={uploading}
              uploading={uploading}
            />
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Загруженные файлы ({files.length})
            </h4>
            
            {loading ? (
              <Loading />
            ) : files.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Файлы не загружены</p>
                <p className="text-sm mt-1">Перетащите PDF, EPUB или MOBI файлы выше</p>
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="p-4 bg-gray-50 rounded-xl flex items-center justify-between group hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`p-3 rounded-lg ${
                        file.file_type === 'pdf' ? 'bg-red-100 text-red-600' :
                        file.file_type === 'epub' ? 'bg-blue-100 text-blue-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{file.original_name}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="font-medium uppercase">{file.file_type}</span>
                          <span>•</span>
                          <span>{formatFileSize(file.file_size)}</span>
                          {file.page_count > 0 && (
                            <>
                              <span>•</span>
                              <span>{file.page_count} стр.</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface QuickUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
}

function QuickUploadModal({ isOpen, onClose, onSuccess, categories }: QuickUploadModalProps) {
  const [step, setStep] = useState<'upload' | 'details'>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [bookData, setBookData] = useState<CreateBookRequest>({
    title: '',
    author: '',
    copies_count: 1,
  });
  const [creating, setCreating] = useState(false);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    if (selectedFiles.length > 0) {
      const fileName = selectedFiles[0].name.replace(/\.(pdf|epub|mobi)$/i, '');
      const parts = fileName.split(' - ');
      if (parts.length >= 2) {
        setBookData(prev => ({
          ...prev,
          author: parts[0].trim(),
          title: parts.slice(1).join(' - ').trim(),
        }));
      } else {
        setBookData(prev => ({ ...prev, title: fileName }));
      }
      setStep('details');
    }
  };

  const handleCreate = async () => {
    if (!bookData.title || !bookData.author) {
      toast.error('Заполните название и автора');
      return;
    }

    try {
      setCreating(true);
      const book = await booksApi.create(bookData);
      
      if (book?.id) {
        for (const file of files) {
          await booksApi.uploadFile(book.id, file);
        }
      }

      toast.success('Книга создана и файлы загружены');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Failed to create book:', error);
      toast.error('Не удалось создать книгу');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setFiles([]);
    setBookData({ title: '', author: '', copies_count: 1 });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Быстрая загрузка книги">
      {step === 'upload' ? (
        <div>
          <p className="text-gray-600 mb-4">
            Загрузите файл книги, и мы автоматически заполним информацию
          </p>
          <DropZone
            onFilesSelected={handleFilesSelected}
            accept=".pdf,.epub,.mobi"
            multiple={false}
            maxSize={100 * 1024 * 1024}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
            <Check className="h-5 w-5" />
            <span>Файл выбран: {files[0]?.name}</span>
          </div>

          <Input
            label="Название книги"
            value={bookData.title}
            onChange={(e) => setBookData({ ...bookData, title: e.target.value })}
            placeholder="Введите название"
            required
          />
          
          <Input
            label="Автор"
            value={bookData.author}
            onChange={(e) => setBookData({ ...bookData, author: e.target.value })}
            placeholder="Введите имя автора"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="ISBN"
              value={bookData.isbn || ''}
              onChange={(e) => setBookData({ ...bookData, isbn: e.target.value })}
              placeholder="978-3-16-148410-0"
            />
            <Input
              label="Год публикации"
              type="number"
              value={bookData.publication_year || ''}
              onChange={(e) => setBookData({ ...bookData, publication_year: parseInt(e.target.value) || undefined })}
              placeholder="2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
            <select
              value={bookData.category_ids?.[0] || ''}
              onChange={(e) => setBookData({ ...bookData, category_ids: e.target.value ? [e.target.value] : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Без категории</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="quick_premium"
              checked={bookData.is_premium || false}
              onChange={(e) => setBookData({ ...bookData, is_premium: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="quick_premium" className="text-sm text-gray-700">
              Premium контент (требует подписку)
            </label>
          </div>

          <textarea
            value={bookData.description || ''}
            onChange={(e) => setBookData({ ...bookData, description: e.target.value })}
            placeholder="Описание книги (опционально)..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setStep('upload')} className="flex-1">
              Назад
            </Button>
            <Button onClick={handleCreate} loading={creating} className="flex-1">
              Создать книгу
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function AdminBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showQuickUpload, setShowQuickUpload] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

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
      setBooks(booksData as Book[]);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newBook.title || !newBook.author) {
      toast.error('Заполните название и автора');
      return;
    }

    try {
      setCreating(true);
      await booksApi.create(newBook);
      await loadData();
      setShowCreateModal(false);
      setNewBook({ title: '', author: '', copies_count: 1 });
      toast.success('Книга создана');
    } catch (error) {
      console.error('Failed to create book:', error);
      toast.error('Не удалось создать книгу');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingBook) return;

    try {
      await booksApi.update(editingBook.id, {
        title: editingBook.title,
        author: editingBook.author,
        isbn: editingBook.isbn,
        publication_year: editingBook.publication_year,
        copies_count: editingBook.copies_count,
        description: editingBook.description,
        cover_url: editingBook.cover_url,
        is_premium: editingBook.is_premium,
        status: editingBook.status as any,
      });
      await loadData();
      setEditingBook(null);
      toast.success('Книга обновлена');
    } catch (error) {
      console.error('Failed to update book:', error);
      toast.error('Не удалось обновить книгу');
    }
  };

  const handleDelete = async (bookId: string) => {
    if (!confirm('Удалить эту книгу и все связанные файлы?')) return;

    try {
      await booksApi.delete(bookId);
      await loadData();
      toast.success('Книга удалена');
    } catch (error) {
      console.error('Failed to delete book:', error);
      toast.error('Не удалось удалить книгу');
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(search.toLowerCase()) ||
                         book.author.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || book.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: books.length,
    published: books.filter(b => b.status === 'published').length,
    draft: books.filter(b => b.status === 'draft').length,
    premium: books.filter(b => b.is_premium).length,
  };

  if (loading) return <Loading />;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Управление книгами</h1>
            <p className="text-gray-500">Загрузка файлов и редактирование каталога</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Создать книгу
            </Button>
            <Button onClick={() => setShowQuickUpload(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Быстрая загрузка
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Всего книг</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
                <p className="text-sm text-gray-500">Опубликовано</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                <Edit className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
                <p className="text-sm text-gray-500">Черновики</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.premium}</p>
                <p className="text-sm text-gray-500">Premium</p>
              </div>
            </div>
          </div>
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">Все статусы</option>
            <option value="published">Опубликовано</option>
            <option value="draft">Черновики</option>
            <option value="archived">В архиве</option>
          </select>
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
                      <div className="w-10 h-14 bg-gray-100 rounded flex items-center justify-center shrink-0 overflow-hidden">
                        {book.cover_url ? (
                          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{book.title}</p>
                        <p className="text-sm text-gray-500 truncate">{book.author}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {book.is_premium && (
                            <span className="inline-block px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                              Premium
                            </span>
                          )}
                          {book.copies_count > 0 && (
                            <span className="text-xs text-gray-400">
                              {book.copies_count} экз.
                            </span>
                          )}
                        </div>
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
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      {book.files?.length || 0} файл(ов)
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {book.view_count}
                    </div>
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
                        onClick={() => setEditingBook(book)}
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
              {search || statusFilter !== 'all' ? 'Книги не найдены' : 'Нет книг в каталоге'}
            </div>
          )}
        </div>
      </div>

      {selectedBook && (
        <BookFilesPanel
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onFilesUpdated={loadData}
        />
      )}

      <QuickUploadModal
        isOpen={showQuickUpload}
        onClose={() => setShowQuickUpload(false)}
        onSuccess={loadData}
        categories={categories}
      />

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Создать книгу"
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
          <div className="grid grid-cols-2 gap-4">
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
          </div>
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

      <Modal
        isOpen={!!editingBook}
        onClose={() => setEditingBook(null)}
        title="Редактировать книгу"
      >
        {editingBook && (
          <div className="space-y-4">
            <Input
              label="Название"
              value={editingBook.title}
              onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
              required
            />
            <Input
              label="Автор"
              value={editingBook.author}
              onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="ISBN"
                value={editingBook.isbn || ''}
                onChange={(e) => setEditingBook({ ...editingBook, isbn: e.target.value })}
              />
              <Input
                label="Год публикации"
                type="number"
                value={editingBook.publication_year || ''}
                onChange={(e) => setEditingBook({ ...editingBook, publication_year: parseInt(e.target.value) || undefined })}
              />
            </div>
            <Input
              label="Количество копий"
              type="number"
              value={editingBook.copies_count}
              onChange={(e) => setEditingBook({ ...editingBook, copies_count: parseInt(e.target.value) || 1 })}
              min={1}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
              <select
                value={editingBook.status}
                onChange={(e) => setEditingBook({ ...editingBook, status: e.target.value as 'draft' | 'published' | 'archived' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="draft">Черновик</option>
                <option value="published">Опубликовано</option>
                <option value="archived">В архиве</option>
              </select>
            </div>
            <Input
              label="URL обложки"
              value={editingBook.cover_url || ''}
              onChange={(e) => setEditingBook({ ...editingBook, cover_url: e.target.value })}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit_premium"
                checked={editingBook.is_premium || false}
                onChange={(e) => setEditingBook({ ...editingBook, is_premium: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="edit_premium" className="text-sm text-gray-700">
                Premium контент
              </label>
            </div>
            <textarea
              value={editingBook.description || ''}
              onChange={(e) => setEditingBook({ ...editingBook, description: e.target.value })}
              placeholder="Описание книги..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={() => setEditingBook(null)} className="flex-1">
                Отмена
              </Button>
              <Button onClick={handleUpdate} className="flex-1">
                Сохранить
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
