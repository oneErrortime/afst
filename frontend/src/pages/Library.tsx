import { useState, useEffect } from 'react';
import { accessApi, booksApi, bookmarksApi } from '@/api';
import type { UserLibrary, BookAccess, Book, Bookmark } from '@/types';
import { Button, Loading } from '@/components/ui';
import { Layout } from '@/components/layout';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Bookmark as BookmarkIcon, History, Clock } from 'lucide-react';

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

function BookCard({ book, access, onRead }: { book: Book; access?: BookAccess; onRead?: () => void }) {
  const days = access ? daysRemaining(access.end_date) : 0;
  const isExpiringSoon = days <= 3 && days > 0;
  const isExpired = days <= 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative group">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-6xl opacity-30">📖</div>
        )}
        
        {access && access.read_progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div
              className="h-full bg-primary-500 transition-all"
              style={{ width: `${Math.min(access.read_progress, 100)}%` }}
            />
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
           <Link to={`/books/${book.id}`}>
             <Button variant="secondary" size="sm" className="shadow-lg">Подробнее</Button>
           </Link>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 min-h-[2.5rem]">{book.title}</h3>
        <p className="text-sm text-gray-500 mb-3">{book.author}</p>

        <div className="mt-auto">
            {access && (
                <div className="flex items-center justify-between text-xs mb-3">
                    <span className={`px-2 py-1 rounded-full ${isExpired ? 'bg-red-100 text-red-700' : isExpiringSoon ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {isExpired ? 'Срок истёк' : `${days} дн.`}
                    </span>
                    {access.read_progress > 0 && (
                        <span className="text-gray-500">{access.read_progress}%</span>
                    )}
                </div>
            )}

            {onRead && access && (
                <Button size="sm" onClick={onRead} disabled={isExpired} className="w-full">
                    {isExpired ? 'Недоступно' : 'Читать'}
                </Button>
            )}
        </div>
      </div>
    </div>
  );
}

export default function Library() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'active' | 'bookmarks' | 'history'>('active');
  
  const [library, setLibrary] = useState<UserLibrary | null>(null);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [libraryData, booksData, bookmarksData] = await Promise.all([
        accessApi.getLibrary(),
        booksApi.getAll(),
        bookmarksApi.getAll()
      ]);
      setLibrary(libraryData);
      setAllBooks(booksData as Book[]);
      setBookmarks(bookmarksData as Bookmark[]);
    } catch (error) {
      console.error('Failed to load library:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRead = (access: BookAccess) => {
    navigate(`/books/${access.book_id}/read${access ? `?access=${access.id}` : ''}`);
  };

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Моя библиотека</h1>
          <p className="text-gray-500">Управляйте вашим чтением</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
            <button
                onClick={() => setActiveTab('active')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition-colors ${
                    activeTab === 'active' 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
                <BookOpen className="h-4 w-4" />
                Читаю сейчас
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {library?.active_books?.length || 0}
                </span>
            </button>
            <button
                onClick={() => setActiveTab('bookmarks')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition-colors ${
                    activeTab === 'bookmarks'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
                <BookmarkIcon className="h-4 w-4" />
                Закладки
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {bookmarks.length}
                </span>
            </button>
            <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition-colors ${
                    activeTab === 'history' 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
                <History className="h-4 w-4" />
                История
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {library?.expired_books?.length || 0}
                </span>
            </button>
        </div>

        <div>
            {activeTab === 'active' && (
                <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {library?.active_books?.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">У вас нет активных книг</p>
                            <Link to="/books">
                                <Button variant="secondary" className="mt-4">Выбрать книгу</Button>
                            </Link>
                        </div>
                    ) : (
                        library?.active_books?.map((access) => (
                            <BookCard 
                                key={access.id} 
                                book={access.book!} 
                                access={access} 
                                onRead={() => handleRead(access)} 
                            />
                        ))
                    )}
                </div>
            )}

            {activeTab === 'bookmarks' && (
                <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {bookmarks.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            <BookmarkIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>У вас нет закладок</p>
                            <Link to="/books">
                                <Button variant="secondary" className="mt-4">Найти книгу</Button>
                            </Link>
                        </div>
                    ) : (
                            bookmarks.map((bookmark) => {
                                const book = allBooks.find(b => b.id === bookmark.book_id);
                                if (!book) return null;
                                return (
                                    <BookCard
                                        key={bookmark.id}
                                        book={book}
                                    />
                                );
                            })
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {library?.expired_books?.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>История пуста</p>
                        </div>
                    ) : (
                        library?.expired_books?.map((access) => (
                            <BookCard 
                                key={access.id} 
                                book={access.book!} 
                                access={access} 
                            />
                        ))
                    )}
                </div>
            )}
        </div>
      </div>
    </Layout>
  );
}