import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { booksApi, accessApi, collectionsApi, bookmarksApi, filesApi } from '@/api';
import type { Book, Collection, BookAccess, BookFile } from '@/types';
import { Loading, Button, Modal, toast } from '@/components/ui';
import { Reviews } from '@/components/reviews/Reviews';
import { RecommendedBooks } from '@/components/books/RecommendedBooks';
import { useAuthStore } from '@/store/authStore';
import { useSSE } from '@/hooks/useSSE';
import {
  BookOpen, Calendar, FileText, Download, Heart, ListPlus,
  Clock, Star, Crown, Lock, Upload, CheckCircle, Loader2,
  X, AlertTriangle, Play,
} from 'lucide-react';

// ─── File status badge ────────────────────────────────────────
function FileStatusBadge({ file }: { file: BookFile }) {
  if (!file.is_processed) {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
        <Loader2 className="h-3 w-3 animate-spin" />
        Обработка…
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
      <CheckCircle className="h-3 w-3" />
      Готово
    </span>
  );
}

// ─── Upload zone ──────────────────────────────────────────────
interface UploadZoneProps {
  bookId: string;
  onUploaded: (file: BookFile) => void;
}

function UploadZone({ bookId, onUploaded }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const upload = async (file: File) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'epub', 'mobi'].includes(ext || '')) {
      toast.error('Поддерживаются только PDF, EPUB, MOBI');
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const result = await booksApi.uploadFile(bookId, file, setProgress);
      if (result) {
        onUploaded(result as BookFile);
        toast.success('Файл загружен — идёт обработка…');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Ошибка загрузки');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all text-center
        ${dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50'}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.epub,.mobi"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }}
      />

      {uploading ? (
        <div className="space-y-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500 mx-auto" />
          <p className="text-sm font-medium text-primary-700">Загрузка {progress}%</p>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <Upload className="h-6 w-6 text-gray-400 mx-auto" />
          <p className="text-xs text-gray-500">
            Перетащите PDF / EPUB / MOBI или <span className="text-primary-600 font-medium">выберите файл</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Access gate component ─────────────────────────────────────
function AccessGate({ book, onBorrow, loading }: { book: Book; onBorrow: () => void; loading: boolean }) {
  if (book.is_premium) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
        <div className="flex items-center gap-2 text-amber-700">
          <Crown className="h-4 w-4" />
          <span className="text-sm font-semibold">Premium книга</span>
        </div>
        <p className="text-xs text-amber-600">Для чтения нужна Premium-подписка.</p>
        <Link to="/subscriptions">
          <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600">
            <Crown className="h-3.5 w-3.5 mr-1.5" />Оформить подписку
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <Button onClick={onBorrow} loading={loading} className="w-full">
      <Clock className="h-4 w-4 mr-2" />
      Взять читать
    </Button>
  );
}

// ─── Main page ─────────────────────────────────────────────────
export function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const isStaff = user?.role === 'admin' || user?.role === 'librarian';

  const [book, setBook] = useState<Book | null>(null);
  const [files, setFiles] = useState<BookFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<BookAccess | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [bookData, filesData] = await Promise.all([
        booksApi.getById(id),
        booksApi.getFiles(id).catch(() => []),
      ]);
      setBook(bookData as Book);
      setFiles((filesData as BookFile[]) || []);

      if (isAuthenticated) {
        const [libraryData, bmData, accessResult] = await Promise.all([
          accessApi.getLibrary().catch(() => null),
          bookmarksApi.getByBook(id).catch(() => []),
          accessApi.checkAccess(id).catch(() => false),
        ]);

        if (libraryData) {
          const active = libraryData.active_books?.find((a: any) => a.book_id === id);
          setAccess(active || null);
        }
        setIsBookmarked((bmData as any[])?.length > 0);
        setHasAccess(accessResult === true);
      }
    } catch {
      toast.error('Не удалось загрузить книгу');
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── SSE: update file status when backend finishes processing ──
  useSSE({
    enabled: isAuthenticated && isStaff,
    handlers: {
      'book.processed': (data: any) => {
        if (data?.book_id !== id) return;
        setFiles(prev => prev.map(f =>
          f.id === data.file_id
            ? { ...f, is_processed: data.success, page_count: data.page_count ?? f.page_count }
            : f
        ));
        if (data.success) toast.success('Файл обработан и готов к чтению');
        else toast.error(`Ошибка обработки файла: ${data.error}`);
      },
    },
  });

  const handleBorrow = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setBorrowLoading(true);
    try {
      const result = await accessApi.borrowBook(id!);
      if (result) {
        toast.success('Книга успешно взята!');
        await loadData();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Не удалось взять книгу';
      toast.error(msg);
    } finally {
      setBorrowLoading(false);
    }
  };

  const handleRead = () => {
    navigate(`/books/${id}/read`);
  };

  const handleDownload = async (file: BookFile) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setDownloadingId(file.id);
    try {
      const blob = await filesApi.getFile(file.id);
      const url = window.URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name || file.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch {
      toast.error('Ошибка скачивания');
    } finally {
      setDownloadingId(null);
    }
  };

  const toggleBookmark = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      if (isBookmarked) {
        const bms = await bookmarksApi.getByBook(id!);
        if ((bms as any[]).length > 0) {
          await bookmarksApi.delete((bms as any[])[0].id);
          setIsBookmarked(false);
          toast.success('Убрано из избранного');
        }
      } else {
        await bookmarksApi.create({ book_id: id!, label: 'Избранное', location: '0' });
        setIsBookmarked(true);
        toast.success('Добавлено в избранное');
      }
    } catch { toast.error('Ошибка работы с закладками'); }
  };

  const openCollectionModal = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const cols = await collectionsApi.getMyCollections().catch(() => []);
    setCollections(cols as Collection[]);
    setShowCollectionModal(true);
  };

  const addToCollection = async (collectionId: string) => {
    await collectionsApi.addBook(collectionId, id!).catch(() => {});
    toast.success('Книга добавлена в коллекцию');
    setShowCollectionModal(false);
  };

  if (loading) return <Loading />;
  if (!book) return <div className="text-center py-20 text-gray-500">Книга не найдена</div>;

  const readyFiles = files.filter(f => f.is_processed);
  const processingFiles = files.filter(f => !f.is_processed);
  const canRead = hasAccess && readyFiles.length > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="md:flex">

          {/* ── Left: cover + actions ── */}
          <div className="md:w-72 lg:w-80 shrink-0 bg-gray-50 border-r border-gray-100 p-6 flex flex-col gap-5">

            {/* Cover */}
            <div className="w-full aspect-[2/3] bg-white rounded-xl shadow-md overflow-hidden relative">
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <BookOpen className="h-16 w-16 text-gray-300" />
                </div>
              )}
              {book.is_premium && (
                <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Crown className="h-3 w-3" />PREMIUM
                </div>
              )}
            </div>

            {/* Primary action */}
            {canRead ? (
              <Button onClick={handleRead} className="w-full bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4 mr-2" />
                Читать сейчас
              </Button>
            ) : hasAccess && processingFiles.length > 0 ? (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                Файл обрабатывается…
              </div>
            ) : hasAccess && files.length === 0 ? (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Файлы ещё не загружены
              </div>
            ) : isAuthenticated ? (
              <AccessGate book={book} onBorrow={handleBorrow} loading={borrowLoading} />
            ) : (
              <Link to="/login">
                <Button className="w-full">
                  <Lock className="h-4 w-4 mr-2" />
                  Войти для чтения
                </Button>
              </Link>
            )}

            {/* Secondary actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline" size="sm"
                onClick={toggleBookmark}
                className={isBookmarked ? 'text-red-500 border-red-200 bg-red-50' : ''}
              >
                <Heart className={`h-3.5 w-3.5 mr-1.5 ${isBookmarked ? 'fill-current' : ''}`} />
                {isBookmarked ? 'В избранном' : 'Избранное'}
              </Button>
              <Button variant="outline" size="sm" onClick={openCollectionModal}>
                <ListPlus className="h-3.5 w-3.5 mr-1.5" />
                Коллекция
              </Button>
            </div>

            {/* Files list */}
            {files.length > 0 && (
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Файлы</p>
                {files.map(file => (
                  <div key={file.id} className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-1.5 rounded-lg shrink-0 ${file.file_type === 'pdf' ? 'bg-red-100' : 'bg-blue-100'}`}>
                        <FileText className={`h-3.5 w-3.5 ${file.file_type === 'pdf' ? 'text-red-500' : 'text-blue-500'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{file.file_type?.toUpperCase()}</p>
                        <p className="text-xs text-gray-400">
                          {Math.round((file.file_size || 0) / 1024)} KB
                          {file.page_count ? ` · ${file.page_count} стр.` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <FileStatusBadge file={file} />
                      {hasAccess && file.is_processed && (
                        <button
                          onClick={() => handleDownload(file)}
                          disabled={downloadingId === file.id}
                          className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors"
                          title="Скачать"
                        >
                          {downloadingId === file.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Download className="h-3.5 w-3.5" />
                          }
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload zone — staff only */}
            {isStaff && (
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Загрузить файл</p>
                <UploadZone
                  bookId={id!}
                  onUploaded={(file) => {
                    setFiles(prev => [...prev, file]);
                  }}
                />
              </div>
            )}
          </div>

          {/* ── Right: book info ── */}
          <div className="flex-1 p-6 sm:p-8">

            {/* Categories & badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {book.categories?.map(cat => (
                <span key={cat.id} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-100">
                  {cat.name}
                </span>
              ))}
              {book.is_premium && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <Crown className="h-3 w-3" />Premium
                </span>
              )}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                book.status === 'published'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}>
                {book.status === 'published' ? 'Опубликована' : book.status}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-1">{book.title}</h1>
            <p className="text-xl text-gray-500 font-medium mb-5">{book.author}</p>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pb-5 mb-5 border-b border-gray-100">
              {book.rating > 0 && (
                <div className="flex items-center gap-1 text-amber-500 font-semibold">
                  <Star className="h-4 w-4 fill-current" />{book.rating.toFixed(1)}
                </div>
              )}
              {book.publication_year && (
                <div className="flex items-center gap-1"><Calendar className="h-4 w-4" />{book.publication_year}</div>
              )}
              {book.page_count ? (
                <div className="flex items-center gap-1"><FileText className="h-4 w-4" />{book.page_count} стр.</div>
              ) : null}
              {book.language && (
                <div className="uppercase font-medium bg-gray-100 px-2 py-0.5 rounded">{book.language}</div>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-900 mb-2">О книге</h3>
              <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">
                {book.description || 'Описание отсутствует.'}
              </p>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 rounded-xl p-5 border border-gray-100 text-sm mb-6">
              {[
                { label: 'ISBN',          val: book.isbn || '—' },
                { label: 'Издательство',  val: book.publisher || '—' },
                { label: 'Добавлена',     val: new Date(book.created_at).toLocaleDateString('ru-RU') },
                { label: 'Скачиваний',    val: String(book.download_count) },
              ].map(({ label, val }) => (
                <div key={label}>
                  <p className="text-gray-400 text-xs mb-0.5">{label}</p>
                  <p className="font-medium text-gray-900">{val}</p>
                </div>
              ))}
            </div>

            {/* Access info */}
            {access && (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>У вас есть доступ к этой книге</span>
                </div>
                <span className="text-xs text-green-600">
                  до {new Date((access as any).end_date).toLocaleDateString('ru-RU')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2"><Reviews bookId={book.id} /></div>
        <div className="lg:col-span-1"><RecommendedBooks bookId={book.id} /></div>
      </div>

      {/* Collection modal */}
      {showCollectionModal && (
        <Modal isOpen onClose={() => setShowCollectionModal(false)} title="Добавить в коллекцию">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {collections.length === 0 ? (
              <p className="text-center text-gray-500 py-6">У вас нет коллекций</p>
            ) : collections.map(col => (
              <button
                key={col.id}
                onClick={() => addToCollection(col.id)}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 flex items-center justify-between transition-all"
              >
                <span className="font-medium text-gray-900">{col.name}</span>
                <span className="text-xs text-gray-400">{(col.books?.length || 0)} книг</span>
              </button>
            ))}
            <div className="pt-3 border-t border-gray-100">
              <Link to="/collections">
                <Button variant="outline" size="sm" className="w-full" onClick={() => setShowCollectionModal(false)}>
                  <X className="h-3.5 w-3.5 mr-1.5" />Управление коллекциями
                </Button>
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
