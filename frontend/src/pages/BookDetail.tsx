import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { booksApi, accessApi, collectionsApi, bookmarksApi, filesApi } from '@/api';
import { Book, Collection, BookAccess } from '@/types';
import { Loading, Button, Modal } from '@/components/ui';
import { Reviews } from '@/components/reviews/Reviews';
import { RecommendedBooks } from '@/components/books/RecommendedBooks';
import { useAuthStore } from '@/store/authStore';
import { 
  BookOpen, 
  Calendar, 
  FileText, 
  Download, 
  Heart, 
  ListPlus, 
  Clock, 
  Star
} from 'lucide-react';
import { toast } from '@/components/ui';

export function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<BookAccess | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookData, libraryData] = await Promise.all([
        booksApi.getById(id!),
        isAuthenticated ? accessApi.getLibrary() : Promise.resolve(null),
      ]);
      
      setBook(bookData as Book);

      if (libraryData) {
        // Check if book is currently borrowed
        const activeLoan = libraryData.active_books?.find((a: any) => a.book_id === id);
        setAccess(activeLoan || null);

        // Check bookmarks - requires separate call or iterating all bookmarks?
        // API doesn't give "isBookmarked" on book. 
        // We'll check bookmarks if authenticated.
        checkBookmarkStatus();
      }
    } catch {
      console.error('Failed to load book data');
      toast.error('Не удалось загрузить информацию о книге');
    } finally {
      setLoading(false);
    }
  };

  const checkBookmarkStatus = async () => {
    if (!isAuthenticated || !id) return;
    try {
      const bookmarks = await bookmarksApi.getByBook(id);
      setIsBookmarked(bookmarks.length > 0);
    } catch {
      // Ignore error
    }
  };

  const handleBorrow = async () => {
    if (!isAuthenticated) return navigate('/login');
    try {
      setProcessing(true);
      await accessApi.borrowBook(id!);
      toast.success('Книга успешно взята!');
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Не удалось взять книгу. Возможно, лимит исчерпан.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRead = () => {
    navigate(`/books/${id}/read${access ? `?access=${access.id}` : ''}`);
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    if (!isAuthenticated) return navigate('/login');
    try {
        // Since the API requires downloading via specific endpoint or just URL
        // Assuming filesApi has download method or we construct URL
        // Looking at swagger, there is no direct file download endpoint documented in the snippet I saw?
        // Ah, likely handled by backend serving static files or specific endpoint.
        // Let's assume we can just open the file URL if it's there, or use a download helper.
        // If filesApi doesn't have download, we'll just check what the BookFile model has.
        // Usually file_url or similar? The swagger says "metadata", "file_name".
        // Let's assume there's a download endpoint or we just show a toast for now.
        toast.info('Скачивание началось...');
        // The API returns the file content directly for GET /api/v1/files/:id
        // However, we need to handle authentication (Bearer token).
        // window.open won't send the header.
        // We probably need to fetch blob and save it, or the API might allow cookie/query param auth (unlikely).
        // Let's try direct fetch and blob.
        
        try {
            // Check if file API has direct download or we need to use blob
            const blob = await filesApi.getFile(fileId);
            const downloadUrl = window.URL.createObjectURL(blob as Blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = fileName || 'download';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
        } catch {
             toast.error('Ошибка скачивания');
        }
    } catch {
        toast.error('Ошибка скачивания');
    }
  };

  const toggleBookmark = async () => {
    if (!isAuthenticated) return navigate('/login');
    try {
      if (isBookmarked) {
        // We need bookmark ID to delete. 
        // This is tricky if we don't have it.
        // We might need to fetch bookmarks first.
        const bookmarks = await bookmarksApi.getByBook(id!);
        if (bookmarks.length > 0 && bookmarks[0].id) {
            await bookmarksApi.delete(bookmarks[0].id);
            setIsBookmarked(false);
            toast.success('Закладка удалена');
        }
      } else {
        await bookmarksApi.create({
            book_id: id!,
            label: 'Избранное',
            location: '0'
        });
        setIsBookmarked(true);
        toast.success('Добавлено в закладки');
      }
    } catch {
        toast.error('Ошибка работы с закладками');
    }
  };

  const openCollectionModal = async () => {
    if (!isAuthenticated) return navigate('/login');
    try {
        const cols = await collectionsApi.getMyCollections();
        setCollections(cols as Collection[]);
        setShowCollectionModal(true);
    } catch (error) {
        console.error(error);
    }
  };

  const addToCollection = async (collectionId: string) => {
    try {
        await collectionsApi.addBook(collectionId, id!);
        toast.success('Книга добавлена в коллекцию');
        setShowCollectionModal(false);
    } catch {
        toast.error('Ошибка добавления. Возможно книга уже там.');
    }
  };

  if (loading) return <Loading />;
  if (!book) return <div className="text-center py-10">Книга не найдена</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="md:flex">
          {/* Cover Image Section */}
          <div className="md:w-1/3 lg:w-1/4 bg-gray-50 border-r border-gray-100 p-8 flex flex-col items-center">
            <div className="w-full aspect-[2/3] bg-white rounded-lg shadow-md overflow-hidden mb-6 relative group">
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                  <BookOpen className="h-20 w-20" />
                </div>
              )}
            </div>

            <div className="w-full space-y-3">
              {access ? (
                <Button onClick={handleRead} className="w-full bg-green-600 hover:bg-green-700">
                   <BookOpen className="h-4 w-4 mr-2" />
                   Читать сейчас
                </Button>
              ) : (
                <Button onClick={handleBorrow} disabled={processing} className="w-full">
                  <Clock className="h-4 w-4 mr-2" />
                  Взять читать
                </Button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={toggleBookmark} className={isBookmarked ? "text-red-500 border-red-200 bg-red-50" : ""}>
                  <Heart className={`h-4 w-4 mr-2 ${isBookmarked ? "fill-current" : ""}`} />
                  {isBookmarked ? 'В избранном' : 'В избранное'}
                </Button>
                <Button variant="outline" onClick={openCollectionModal}>
                  <ListPlus className="h-4 w-4 mr-2" />
                  В коллекцию
                </Button>
              </div>

              {book.files && book.files.length > 0 && (
                 <div className="pt-4 w-full border-t border-gray-200 mt-4">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Файлы для скачивания</p>
                    <div className="space-y-2">
                        {book.files.map(file => (
                            <Button key={file.id} variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={() => handleDownload(file.id, file.file_name)}>
                                <Download className="h-3 w-3 mr-2" />
                                {file.file_type?.toUpperCase() || 'FILE'} ({Math.round(file.file_size / 1024)} KB)
                            </Button>
                        ))}
                    </div>
                 </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="md:w-2/3 lg:w-3/4 p-8">
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    {book.categories?.map(cat => (
                        <span key={cat.id} className="px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700">
                            {cat.name}
                        </span>
                    ))}
                    {book.is_premium && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">Premium</span>
                    )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
                <p className="text-xl text-gray-600 font-medium mb-4">{book.author}</p>
                
                <div className="flex items-center gap-6 text-sm text-gray-500 border-b border-gray-100 pb-6 mb-6">
                    {book.rating > 0 && (
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                            <Star className="h-4 w-4 fill-current" />
                            <span>{book.rating.toFixed(1)}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{book.publication_year}</span>
                    </div>
                    {(book.page_count || 0) > 0 && (
                        <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>{book.page_count} стр.</span>
                        </div>
                    )}
                    {book.language && (
                        <div className="flex items-center gap-1 uppercase">
                            <span>{book.language}</span>
                        </div>
                    )}
                </div>

                <div className="prose prose-gray max-w-none mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">О книге</h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {book.description || 'Описание отсутствует.'}
                    </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 mb-8">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Подробная информация</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500 mb-1">ISBN</p>
                            <p className="font-medium">{book.isbn || '—'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 mb-1">Издательство</p>
                            <p className="font-medium">{book.publisher || '—'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 mb-1">Добавлено</p>
                            <p className="font-medium">{new Date(book.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 mb-1">Скачиваний</p>
                            <p className="font-medium">{book.download_count}</p>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2">
            <Reviews bookId={book.id} />
        </div>
        <div className="lg:col-span-1">
            <RecommendedBooks bookId={book.id} />
        </div>
      </div>

      {showCollectionModal && (
        <Modal isOpen={true} onClose={() => setShowCollectionModal(false)} title="Добавить в коллекцию">
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {collections.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">У вас нет коллекций</p>
                ) : (
                    collections.map(col => (
                        <button
                            key={col.id}
                            onClick={() => addToCollection(col.id)}
                            className="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center justify-between border border-transparent hover:border-gray-200 transition-all"
                        >
                            <span className="font-medium text-gray-900">{col.name}</span>
                            <span className="text-xs text-gray-500">{col.books?.length || 0} книг</span>
                        </button>
                    ))
                )}
                <div className="pt-4 mt-4 border-t border-gray-100">
                    <Link to="/collections">
                        <Button variant="outline" className="w-full">Управление коллекциями</Button>
                    </Link>
                </div>
            </div>
        </Modal>
      )}
    </div>
  );
}