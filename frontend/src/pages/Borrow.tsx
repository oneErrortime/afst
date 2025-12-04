import { useState, useEffect } from 'react';
import { booksApi, readersApi, borrowApi } from '@/api';
import { useAuthStore } from '@/store/authStore';
import { Button, Modal, Loading, EmptyState, toast } from '@/components/ui';
import { BookOpen, RotateCcw, ArrowRightLeft, User, Book as BookIcon, Check, AlertCircle } from 'lucide-react';
import type { Book, Reader, BorrowedBook } from '@/types';
import { AxiosError } from 'axios';
import { Navigate } from 'react-router-dom';

export function Borrow() {
  const [books, setBooks] = useState<Book[]>([]);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState(true);
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedReader, setSelectedReader] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [readerBooks, setReaderBooks] = useState<BorrowedBook[]>([]);
  const [loadingReaderBooks, setLoadingReaderBooks] = useState(false);

  const { isAuthenticated } = useAuthStore();

  const fetchData = async () => {
    try {
      const [booksRes, readersRes] = await Promise.all([
        booksApi.getAll({ limit: 100 }),
        readersApi.getAll({ limit: 100 }),
      ]);
      setBooks(booksRes.data || []);
      setReaders(readersRes.data || []);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchReaderBooks = async (readerId: string) => {
    if (!readerId) {
      setReaderBooks([]);
      return;
    }
    setLoadingReaderBooks(true);
    try {
      const response = await borrowApi.getByReader(readerId);
      setReaderBooks((response.data || []).filter((b) => !b.return_date));
    } catch (error) {
      toast.error('Ошибка загрузки книг');
    } finally {
      setLoadingReaderBooks(false);
    }
  };

  const handleBorrow = async () => {
    if (!selectedBook || !selectedReader) {
      toast.error('Выберите книгу и читателя');
      return;
    }

    setProcessing(true);
    try {
      await borrowApi.borrow({
        book_id: selectedBook,
        reader_id: selectedReader,
      });
      toast.success('Книга выдана!');
      setBorrowModalOpen(false);
      setSelectedBook('');
      setSelectedReader('');
      fetchData();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message || 'Ошибка выдачи книги');
    } finally {
      setProcessing(false);
    }
  };

  const handleReturn = async () => {
    if (!selectedBook || !selectedReader) {
      toast.error('Выберите книгу и читателя');
      return;
    }

    setProcessing(true);
    try {
      await borrowApi.return({
        book_id: selectedBook,
        reader_id: selectedReader,
      });
      toast.success('Книга возвращена!');
      setReturnModalOpen(false);
      setSelectedBook('');
      setSelectedReader('');
      setReaderBooks([]);
      fetchData();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message || 'Ошибка возврата книги');
    } finally {
      setProcessing(false);
    }
  };

  const openBorrowModal = () => {
    setSelectedBook('');
    setSelectedReader('');
    setBorrowModalOpen(true);
  };

  const openReturnModal = () => {
    setSelectedBook('');
    setSelectedReader('');
    setReaderBooks([]);
    setReturnModalOpen(true);
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (loading) return <Loading text="Загрузка данных..." />;

  const availableBooks = books.filter((b) => b.copies_count > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Выдача и возврат книг</h1>
        <p className="text-gray-600">Управление выдачей книг читателям</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Выдать книгу</h2>
              <p className="text-sm text-gray-600">Выдать книгу читателю</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              <span>Доступно книг: {availableBooks.length}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-blue-500" />
              <span>Зарегистрировано читателей: {readers.length}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <AlertCircle className="h-4 w-4" />
              <span>Максимум 3 книги на читателя</span>
            </div>
          </div>

          <Button onClick={openBorrowModal} className="w-full" disabled={availableBooks.length === 0 || readers.length === 0}>
            <ArrowRightLeft className="h-4 w-4" />
            Выдать книгу
          </Button>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <RotateCcw className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Вернуть книгу</h2>
              <p className="text-sm text-gray-600">Принять книгу от читателя</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <BookIcon className="h-4 w-4" />
              <span>Выберите читателя и книгу для возврата</span>
            </div>
          </div>

          <Button onClick={openReturnModal} variant="secondary" className="w-full" disabled={readers.length === 0}>
            <RotateCcw className="h-4 w-4" />
            Вернуть книгу
          </Button>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Статистика</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-gray-900">{books.length}</p>
            <p className="text-sm text-gray-600">Всего книг</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{availableBooks.length}</p>
            <p className="text-sm text-gray-600">Доступно</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">{readers.length}</p>
            <p className="text-sm text-gray-600">Читателей</p>
          </div>
        </div>
      </div>

      <Modal isOpen={borrowModalOpen} onClose={() => setBorrowModalOpen(false)} title="Выдать книгу" size="lg">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Выберите книгу</label>
            <select
              className="input"
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
            >
              <option value="">-- Выберите книгу --</option>
              {availableBooks.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title} — {book.author} ({book.copies_count} экз.)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Выберите читателя</label>
            <select
              className="input"
              value={selectedReader}
              onChange={(e) => setSelectedReader(e.target.value)}
            >
              <option value="">-- Выберите читателя --</option>
              {readers.map((reader) => (
                <option key={reader.id} value={reader.id}>
                  {reader.name} ({reader.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setBorrowModalOpen(false)} className="flex-1">
              Отмена
            </Button>
            <Button onClick={handleBorrow} loading={processing} className="flex-1">
              Выдать
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={returnModalOpen} onClose={() => setReturnModalOpen(false)} title="Вернуть книгу" size="lg">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Выберите читателя</label>
            <select
              className="input"
              value={selectedReader}
              onChange={(e) => {
                setSelectedReader(e.target.value);
                setSelectedBook('');
                fetchReaderBooks(e.target.value);
              }}
            >
              <option value="">-- Выберите читателя --</option>
              {readers.map((reader) => (
                <option key={reader.id} value={reader.id}>
                  {reader.name} ({reader.email})
                </option>
              ))}
            </select>
          </div>

          {selectedReader && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Книги на руках</label>
              {loadingReaderBooks ? (
                <Loading size="sm" />
              ) : readerBooks.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">У читателя нет книг на руках</p>
              ) : (
                <select
                  className="input"
                  value={selectedBook}
                  onChange={(e) => setSelectedBook(e.target.value)}
                >
                  <option value="">-- Выберите книгу для возврата --</option>
                  {readerBooks.map((borrow) => (
                    <option key={borrow.id} value={borrow.book_id}>
                      {borrow.book?.title || 'Книга'} (взята: {new Date(borrow.borrow_date).toLocaleDateString('ru')})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setReturnModalOpen(false)} className="flex-1">
              Отмена
            </Button>
            <Button
              onClick={handleReturn}
              loading={processing}
              className="flex-1"
              disabled={!selectedBook || !selectedReader}
            >
              Вернуть
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
