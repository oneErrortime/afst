import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { booksApi, filesApi, sessionsApi, accessApi, bookmarksApi, annotationsApi } from '@/api';
import type { Book, BookFile, ReadingSession, Bookmark, Annotation } from '@/types';
import { Button, Loading, toast } from '@/components/ui';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Minimize, 
  BookOpen, 
  Clock,
  FileText,
  Download,
  RotateCw,
  Home,
  Bookmark as BookmarkIcon,
  MessageSquare,
  Star,
  Highlighter,
  Pencil,
  Trash2,
  Plus
} from 'lucide-react';

export default function Reader() {
  const { bookId } = useParams<{ bookId: string }>();
  const [searchParams] = useSearchParams();
  const accessId = searchParams.get('access');
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [files, setFiles] = useState<BookFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<BookFile | null>(null);
  const [session, setSession] = useState<ReadingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [readingTime, setReadingTime] = useState(0);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'bookmarks' | 'annotations'>('bookmarks');
  const [addingBookmark, setAddingBookmark] = useState(false);

  useEffect(() => {
    if (bookId) {
      loadBookData();
    }
  }, [bookId]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (session) {
        setReadingTime(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [session]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePageChange(Math.max(1, currentPage - 1));
          break;
        case 'ArrowRight':
          handlePageChange(Math.min(totalPages, currentPage + 1));
          break;
        case '+':
        case '=':
          setScale(s => Math.min(2, s + 0.1));
          break;
        case '-':
          setScale(s => Math.max(0.5, s - 0.1));
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, isFullscreen]);

  useEffect(() => {
    return () => {
      if (session && currentPage > 0) {
        sessionsApi.end(session.id, currentPage).catch(console.error);
      }
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [session, currentPage, pdfUrl]);

  const loadBookData = async () => {
    if (!bookId) return;

    try {
      setLoading(true);
      const [bookData, filesData] = await Promise.all([
        booksApi.getById(bookId),
        booksApi.getFiles(bookId),
      ]);
      setBook(bookData);
      setFiles(filesData);

      if (bookData.page_count) {
        setTotalPages(bookData.page_count);
      }

      if (filesData.length > 0) {
        const pdfFile = filesData.find(f => f.file_type === 'pdf') || filesData[0];
        setSelectedFile(pdfFile);
        if (pdfFile.page_count > 0) {
          setTotalPages(pdfFile.page_count);
        }
        loadFile(pdfFile.id);
      }

      if (accessId) {
        try {
          const sessionData = await sessionsApi.start({
            book_id: bookId,
            access_id: accessId,
          });
          setSession(sessionData);
          if (sessionData.start_page > 0) {
            setCurrentPage(sessionData.start_page);
          }
        } catch (error) {
          console.error('Failed to start reading session:', error);
        }
      }

      try {
        const [bookmarksData, annotationsData] = await Promise.all([
          bookmarksApi.getByBook(bookId),
          annotationsApi.getByBook(bookId, false),
        ]);
        setBookmarks(bookmarksData);
        setAnnotations(annotationsData);
      } catch (error) {
        console.error('Failed to load bookmarks/annotations:', error);
      }
    } catch (error) {
      console.error('Failed to load book:', error);
      toast.error('Не удалось загрузить книгу');
    } finally {
      setLoading(false);
    }
  };

  const loadFile = async (fileId: string) => {
    try {
      const blob = await filesApi.getFile(fileId);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Failed to load file:', error);
      toast.error('Не удалось загрузить файл');
    }
  };

  const handlePageChange = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(validPage);
    if (accessId && validPage > 0) {
      accessApi.updateProgress(accessId, { current_page: validPage, total_pages: totalPages }).catch(console.error);
    }
  }, [accessId, totalPages]);

  const handleClose = async () => {
    if (session) {
      try {
        await sessionsApi.end(session.id, currentPage);
        toast.success('Сессия чтения завершена');
      } catch (error) {
        console.error('Failed to end session:', error);
      }
    }
    navigate('/library');
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleAddBookmark = async () => {
    if (!bookId) return;

    try {
      setAddingBookmark(true);
      await bookmarksApi.create({
        book_id: bookId,
        page_number: currentPage,
        title: `Страница ${currentPage}`,
        is_important: false,
      });
      const updatedBookmarks = await bookmarksApi.getByBook(bookId);
      setBookmarks(updatedBookmarks);
      toast.success('Закладка добавлена');
    } catch (error) {
      console.error('Failed to add bookmark:', error);
      toast.error('Не удалось добавить закладку');
    } finally {
      setAddingBookmark(false);
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    if (!bookId) return;

    try {
      await bookmarksApi.delete(id);
      const updatedBookmarks = await bookmarksApi.getByBook(bookId);
      setBookmarks(updatedBookmarks);
      toast.success('Закладка удалена');
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
      toast.error('Не удалось удалить закладку');
    }
  };

  const handleGoToBookmark = (pageNumber: number) => {
    handlePageChange(pageNumber);
    setShowSidebar(false);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loading />
          <p className="text-gray-400 mt-4">Загрузка книги...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-600" />
          <h1 className="text-2xl mb-4">Книга не найдена</h1>
          <Button onClick={() => navigate('/library')}>
            <Home className="h-4 w-4 mr-2" />
            Вернуться в библиотеку
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen bg-gray-900 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
      onMouseMove={() => setShowControls(true)}
    >
      <header className={`bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-4">
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="border-l border-gray-700 pl-4">
            <h1 className="text-white font-semibold truncate max-w-md">{book.title}</h1>
            <p className="text-gray-400 text-sm">{book.author}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {session && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Clock className="h-4 w-4" />
              <span>{formatTime(readingTime)}</span>
            </div>
          )}

          {files.length > 1 && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <select
                value={selectedFile?.id || ''}
                onChange={(e) => {
                  const file = files.find(f => f.id === e.target.value);
                  if (file) {
                    setSelectedFile(file);
                    if (file.page_count > 0) {
                      setTotalPages(file.page_count);
                    }
                    loadFile(file.id);
                  }
                }}
                className="bg-gray-700 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-600 focus:ring-2 focus:ring-primary-500"
              >
                {files.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.original_name} ({file.file_type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
              title="Уменьшить (−)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-white text-sm min-w-[4rem] text-center font-medium">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(s => Math.min(2, s + 0.1))}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
              title="Увеличить (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setScale(1)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Сбросить масштаб"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title={isFullscreen ? 'Выйти из полноэкранного режима (F)' : 'Полноэкранный режим (F)'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <div className="h-6 w-px bg-gray-700" />

          <button
            onClick={handleAddBookmark}
            disabled={addingBookmark}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Добавить закладку"
          >
            <BookmarkIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-2 rounded-lg transition-colors ${showSidebar ? 'text-white bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
            title="Закладки и заметки"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className={`h-1 bg-gray-700 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div 
          className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="flex-1 flex items-center justify-center p-4 overflow-auto relative">
        {pdfUrl ? (
          <div 
            className="bg-white rounded-lg shadow-2xl overflow-hidden"
            style={{ 
              transform: `scale(${scale})`, 
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-out'
            }}
          >
            <iframe
              src={`${pdfUrl}#page=${currentPage}&zoom=${scale * 100}`}
              className="w-[800px] h-[calc(100vh-200px)]"
              title={book.title}
            />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center text-gray-400">
            <BookOpen className="h-20 w-20 mx-auto mb-6 opacity-30" />
            <p className="text-xl mb-2">Файлы не загружены</p>
            <p className="text-sm">Для этой книги нет доступных файлов для чтения</p>
          </div>
        ) : (
          <div className="text-center">
            <Loading />
            <p className="text-gray-400 mt-4">Загрузка файла...</p>
          </div>
        )}

        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-gray-800/80 text-white rounded-full hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
          title="Предыдущая страница (←)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-gray-800/80 text-white rounded-full hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
          title="Следующая страница (→)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </main>

      <footer className={`bg-gray-800 border-t border-gray-700 px-4 py-3 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              В начало
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 10)}
              disabled={currentPage <= 10}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              −10
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => handlePageChange(parseInt(e.target.value) || 1)}
                className="w-16 bg-gray-700 text-white text-center rounded-lg px-2 py-1.5 border border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min={1}
                max={totalPages}
              />
              <span className="text-gray-400">из</span>
              <span className="text-white font-medium">{totalPages}</span>
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => handlePageChange(currentPage + 10)}
              disabled={currentPage >= totalPages - 10}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              +10
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              В конец
            </button>
          </div>
        </div>

        <div className="mt-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
            <div 
              className="flex-1 h-1.5 bg-gray-700 rounded-full cursor-pointer overflow-hidden"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                handlePageChange(Math.round(percent * totalPages));
              }}
            >
              <div 
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{totalPages - currentPage} стр. осталось</span>
          </div>
        </div>
      </footer>

      {showSidebar && (
        <div className="fixed inset-y-0 right-0 w-80 bg-gray-800 border-l border-gray-700 shadow-2xl z-50 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Заметки</h3>
              <button onClick={() => setShowSidebar(false)} className="p-1 text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSidebarTab('bookmarks')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sidebarTab === 'bookmarks' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <BookmarkIcon className="h-4 w-4 inline mr-1" />
                Закладки ({bookmarks.length})
              </button>
              <button
                onClick={() => setSidebarTab('annotations')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sidebarTab === 'annotations' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Highlighter className="h-4 w-4 inline mr-1" />
                Аннотации ({annotations.length})
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {sidebarTab === 'bookmarks' ? (
              <div className="space-y-2">
                {bookmarks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <BookmarkIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Нет закладок</p>
                    <p className="text-xs mt-1">Добавьте закладку на текущую страницу</p>
                  </div>
                ) : (
                  bookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors cursor-pointer group"
                      onClick={() => handleGoToBookmark(bookmark.page_number)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Стр. {bookmark.page_number}</span>
                            {bookmark.is_important && (
                              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            )}
                          </div>
                          {bookmark.title && (
                            <p className="text-white text-sm font-medium mt-1">{bookmark.title}</p>
                          )}
                          {bookmark.notes && (
                            <p className="text-gray-300 text-xs mt-1 line-clamp-2">{bookmark.notes}</p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBookmark(bookmark.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {annotations.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Highlighter className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Нет аннотаций</p>
                    <p className="text-xs mt-1">Выделите текст для создания заметки</p>
                  </div>
                ) : (
                  annotations.map((annotation) => (
                    <div
                      key={annotation.id}
                      className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-400">Стр. {annotation.page_number}</span>
                            <span className="text-xs px-1.5 py-0.5 bg-gray-600 text-gray-300 rounded">
                              {annotation.type}
                            </span>
                          </div>
                          {annotation.selected_text && (
                            <p className="text-gray-300 text-xs italic mb-1">"{annotation.selected_text}"</p>
                          )}
                          {annotation.content && (
                            <p className="text-white text-sm">{annotation.content}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
