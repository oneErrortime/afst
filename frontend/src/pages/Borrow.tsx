import { useState, useEffect } from 'react';
import { booksApi, readersApi, borrowApi } from '@/api';
import { useAuthStore } from '@/store/authStore';
import { Button, Modal, Loading, toast, ConfirmDialog } from '@/components/ui';
import { BookOpen, RotateCcw, ArrowRightLeft, User, Book as BookIcon, Check, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
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
  const [confirmBorrow, setConfirmBorrow] = useState(false);
  const [confirmReturn, setConfirmReturn] = useState(false);

  const { isAuthenticated } = useAuthStore();

  const fetchData = async () => {
    try {
      const [booksRes, readersRes] = await Promise.all([
        booksApi.getAll({ limit: 100 }),
        readersApi.getAll({ limit: 100 }),
      ]);
      setBooks((booksRes || []) as Book[]);
      setReaders(readersRes || []);
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
      setReaderBooks((response || []).filter((b: BorrowedBook) => !b.return_date));
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
      toast.success('Книга успешно выдана!');
      setBorrowModalOpen(false);
      setConfirmBorrow(false);
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
      toast.success('Книга успешно возвращена!');
      setReturnModalOpen(false);
      setConfirmReturn(false);
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

  const getSelectedBookInfo = () => books.find((b) => b.id === selectedBook);
  const getSelectedReaderInfo = () => readers.find((r) => r.id === selectedReader);
  const getSelectedBorrowInfo = () => readerBooks.find((b) => b.book_id === selectedBook);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (loading) return <Loading text="Загрузка данных..." />;

  const availableBooks = books.filter((b) => b.copies_count > 0);
  const borrowedCount = books.reduce((acc, b) => acc + (b.copies_count === 0 ? 1 : 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Выдача и возврат книг</h1>
        <p className="text-gray-500">Управление выдачей книг читателям</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-6 hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-green-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-50 rounded-2xl">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Выдать книгу</h2>
              <p className="text-sm text-gray-500">Выдать книгу читателю</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-xl">
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-gray-700">Доступно книг: <strong>{availableBooks.length}</strong></span>
            </div>
            <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-xl">
              <User className="h-5 w-5 text-blue-500" />
              <span className="text-gray-700">Читателей: <strong>{readers.length}</strong></span>
            </div>
            <div className="flex items-center gap-3 text-sm p-3 bg-amber-50 rounded-xl">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="text-gray-700">Максимум <strong>3 книги</strong> на читателя</span>
            </div>
          </div>

          <Button 
            onClick={openBorrowModal} 
            className="w-full" 
            size="lg"
            variant="success"
            disabled={availableBooks.length === 0 || readers.length === 0}
          >
            <ArrowRightLeft className="h-5 w-5" />
            Выдать книгу
          </Button>
        </div>

        <div className="card p-6 hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-blue-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-sky-50 rounded-2xl">
              <TrendingDown className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Вернуть книгу</h2>
              <p className="text-sm text-gray-500">Принять книгу от читателя</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-xl">
              <BookIcon className="h-5 w-5 text-gray-500" />
              <span className="text-gray-700">Выберите читателя и книгу для возврата</span>
            </div>
          </div>

          <Button 
            onClick={openReturnModal} 
            variant="secondary" 
            className="w-full" 
            size="lg"
            disabled={readers.length === 0}
          >
            <RotateCcw className="h-5 w-5" />
            Вернуть книгу
          </Button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-semibold text-gray-900">Статистика библиотеки</h2>
        </div>
        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100">
              <p className="text-3xl font-bold text-gray-900">{books.length}</p>
              <p className="text-sm text-gray-500 mt-1">Всего книг</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-white rounded-2xl border border-green-100">
              <p className="text-3xl font-bold text-green-600">{availableBooks.length}</p>
              <p className="text-sm text-gray-500 mt-1">Доступно</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-white rounded-2xl border border-amber-100">
              <p className="text-3xl font-bold text-amber-600">{borrowedCount}</p>
              <p className="text-sm text-gray-500 mt-1">Выдано</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100">
              <p className="text-3xl font-bold text-blue-600">{readers.length}</p>
              <p className="text-sm text-gray-500 mt-1">Читателей</p>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={borrowModalOpen} onClose={() => setBorrowModalOpen(false)} title="Выдать книгу" size="lg">
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Выберите книгу</label>
            <select
              className="input"
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
            >
              <option value="">— Выберите книгу —</option>
              {availableBooks.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title} — {book.author} ({book.copies_count} экз.)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Выберите читателя</label>
            <select
              className="input"
              value={selectedReader}
              onChange={(e) => setSelectedReader(e.target.value)}
            >
              <option value="">— Выберите читателя —</option>
              {readers.map((reader) => (
                <option key={reader.id} value={reader.id}>
                  {reader.name} ({reader.email})
                </option>
              ))}
            </select>
          </div>

          {selectedBook && selectedReader && (
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">Подтверждение выдачи</h4>
              <p className="text-sm text-green-700">
                Книга <strong>"{getSelectedBookInfo()?.title}"</strong> будет выдана читателю <strong>{getSelectedReaderInfo()?.name}</strong>
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setBorrowModalOpen(false)} className="flex-1">
              Отмена
            </Button>
            <Button 
              variant="success"
              onClick={() => setConfirmBorrow(true)} 
              className="flex-1"
              disabled={!selectedBook || !selectedReader}
            >
              Выдать
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={returnModalOpen} onClose={() => setReturnModalOpen(false)} title="Вернуть книгу" size="lg">
        <div className="space-y-5">
          <div className="space-y-2">
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
              <option value="">— Выберите читателя —</option>
              {readers.map((reader) => (
                <option key={reader.id} value={reader.id}>
                  {reader.name} ({reader.email})
                </option>
              ))}
            </select>
          </div>

          {selectedReader && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Книги на руках</label>
              {loadingReaderBooks ? (
                <Loading size="sm" />
              ) : readerBooks.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">У читателя нет книг на руках</p>
                </div>
              ) : (
                <select
                  className="input"
                  value={selectedBook}
                  onChange={(e) => setSelectedBook(e.target.value)}
                >
                  <option value="">— Выберите книгу для возврата —</option>
                  {readerBooks.map((borrow) => (
                    <option key={borrow.id} value={borrow.book_id}>
                      {borrow.book?.title || 'Книга'} (взята: {new Date(borrow.borrow_date).toLocaleDateString('ru')})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {selectedBook && selectedReader && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Подтверждение возврата</h4>
              <p className="text-sm text-blue-700">
                Книга <strong>"{getSelectedBorrowInfo()?.book?.title}"</strong> будет возвращена от читателя <strong>{getSelectedReaderInfo()?.name}</strong>
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setReturnModalOpen(false)} className="flex-1">
              Отмена
            </Button>
            <Button
              onClick={() => setConfirmReturn(true)}
              className="flex-1"
              disabled={!selectedBook || !selectedReader}
            >
              Вернуть
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmBorrow}
        onClose={() => setConfirmBorrow(false)}
        onConfirm={handleBorrow}
        title="Подтвердите выдачу книги"
        message={`Вы уверены, что хотите выдать книгу "${getSelectedBookInfo()?.title}" читателю ${getSelectedReaderInfo()?.name}?`}
        confirmText="Выдать"
        cancelText="Отмена"
        type="success"
        loading={processing}
      />

      <ConfirmDialog
        isOpen={confirmReturn}
        onClose={() => setConfirmReturn(false)}
        onConfirm={handleReturn}
        title="Подтвердите возврат книги"
        message={`Вы уверены, что хотите принять книгу "${getSelectedBorrowInfo()?.book?.title}" от читателя ${getSelectedReaderInfo()?.name}?`}
        confirmText="Вернуть"
        cancelText="Отмена"
        type="info"
        loading={processing}
      />
    </div>
  );
}
