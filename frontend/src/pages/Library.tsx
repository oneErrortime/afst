import { useState, useEffect } from 'react';
import { accessApi, booksApi } from '@/api';
import type { UserLibrary, BookAccess, Book } from '@/types';
import { Button, Loading } from '@/components/ui';
import { Layout } from '@/components/layout';
import { useNavigate } from 'react-router-dom';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function daysRemaining(endDate: string) {
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function BookCard({ access, onRead }: { access: BookAccess; onRead: () => void }) {
  const book = access.book;
  const days = daysRemaining(access.end_date);
  const isExpiringSoon = days <= 3 && days > 0;
  const isExpired = days <= 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-[3/4] bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center relative">
        {book?.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-6xl opacity-50">📖</div>
        )}
        {access.read_progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div
              className="h-full bg-primary-500 transition-all"
              style={{ width: `${Math.min(access.read_progress, 100)}%` }}
            />
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{book?.title || 'Без названия'}</h3>
        <p className="text-sm text-gray-500 mb-3">{book?.author}</p>

        <div className="flex items-center justify-between text-xs mb-3">
          <span className={`px-2 py-1 rounded-full ${isExpired ? 'bg-red-100 text-red-700' : isExpiringSoon ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
            {isExpired ? 'Срок истёк' : `${days} дн.`}
          </span>
          {access.read_progress > 0 && (
            <span className="text-gray-500">{access.read_progress}% прочитано</span>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={onRead} disabled={isExpired} className="flex-1">
            {isExpired ? 'Недоступно' : 'Читать'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Library() {
  const navigate = useNavigate();
  const [library, setLibrary] = useState<UserLibrary | null>(null);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [libraryData, booksData] = await Promise.all([
        accessApi.getLibrary(),
        booksApi.getAll(),
      ]);
      setLibrary(libraryData);
      setAllBooks(booksData as Book[]);
    } catch (error) {
      console.error('Failed to load library:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async (bookId: string) => {
    try {
      setBorrowing(bookId);
      await accessApi.borrowBook(bookId);
      await loadData();
    } catch (error) {
      console.error('Failed to borrow book:', error);
      alert('Не удалось взять книгу');
    } finally {
      setBorrowing(null);
    }
  };

  const handleRead = (access: BookAccess) => {
    navigate(`/reader/${access.book_id}?access=${access.id}`);
  };

  if (loading) return <Layout><Loading /></Layout>;

  const borrowedBookIds = new Set([
    ...(library?.active_books || []).map(a => a.book_id),
    ...(library?.expired_books || []).map(a => a.book_id),
  ]);

  const availableBooks = allBooks.filter(book => !borrowedBookIds.has(book.id));

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Моя библиотека</h1>
          <p className="text-gray-500">Ваши книги и доступ к чтению</p>
        </div>

        {library?.active_books && library.active_books.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Активные книги ({library.active_books.length})
            </h2>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {library.active_books.map((access) => (
                <BookCard key={access.id} access={access} onRead={() => handleRead(access)} />
              ))}
            </div>
          </section>
        )}

        {library?.expired_books && library.expired_books.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Истёкшие ({library.expired_books.length})
            </h2>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {library.expired_books.map((access) => (
                <BookCard key={access.id} access={access} onRead={() => handleRead(access)} />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Доступные книги</h2>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {availableBooks.map((book) => (
              <div key={book.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-6xl opacity-30">📖</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{book.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{book.author}</p>
                  {book.is_premium && (
                    <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 mb-2">
                      Premium
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleBorrow(book.id)}
                    loading={borrowing === book.id}
                    className="w-full"
                  >
                    Взять на 14 дней
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {availableBooks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Все книги уже в вашей библиотеке
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
