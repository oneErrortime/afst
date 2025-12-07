import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import ePub, { Rendition, Book as EpubBook } from 'epubjs';
import type { NavItem } from 'epubjs';
import { booksApi, bookmarksApi, filesApi, type Bookmark, type BookFile } from '@/api/wrapper';
import { Button, toast, Loading, EmptyState, Modal } from '@/components/ui';
import { 
  Bookmark as BookmarkIcon, 
  ChevronLeft, 
  ChevronRight, 
  List, 
  Settings, 
  Sun, 
  Moon, 
  Maximize, 
  Minimize,
  ZoomIn,
  ZoomOut,
  X,
  FileText,
  ArrowLeft
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

interface TocItem {
  label: string;
  href: string;
  subitems?: TocItem[];
}

type Theme = 'light' | 'dark' | 'sepia';

const themes = {
  light: { bg: 'bg-white', text: 'text-gray-900', viewerBg: '#ffffff', viewerText: '#1a1a1a' },
  dark: { bg: 'bg-gray-900', text: 'text-gray-100', viewerBg: '#1a1a1a', viewerText: '#e5e5e5' },
  sepia: { bg: 'bg-amber-50', text: 'text-amber-900', viewerBg: '#f5f0e1', viewerText: '#5c4b37' },
};

export function Reader() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const [bookTitle, setBookTitle] = useState<string>('');
  const [files, setFiles] = useState<BookFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<BookFile | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'epub' | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfScale, setPdfScale] = useState(1.5);

  const epubViewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const bookRef = useRef<EpubBook | null>(null);
  const [epubToc, setEpubToc] = useState<TocItem[]>([]);
  const [epubLocation, setEpubLocation] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const [fontSize, setFontSize] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBookData = async () => {
      if (!bookId) return;
      setLoading(true);
      setError(null);

      try {
        const [bookData, filesData, bookmarksData] = await Promise.all([
          booksApi.getById(bookId),
          booksApi.getFiles(bookId),
          isAuthenticated ? bookmarksApi.getByBook(bookId).catch(() => []) : Promise.resolve([])
        ]);
        
        setBookTitle(bookData?.title || 'Книга');
        setFiles(filesData || []);
        setBookmarks(bookmarksData || []);

        if (!filesData || filesData.length === 0) {
          throw new Error('Для этой книги не найдено файлов.');
        }

        if (filesData.length === 1) {
          selectFile(filesData[0]);
        } else {
          setShowFileSelector(true);
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'Не удалось загрузить книгу.');
        setLoading(false);
      }
    };
    fetchBookData();
  }, [bookId, isAuthenticated]);

  const selectFile = (file: BookFile) => {
    setSelectedFile(file);
    setShowFileSelector(false);
    
    if (file.mime_type === 'application/pdf') {
      setFileType('pdf');
    } else if (file.mime_type === 'application/epub+zip') {
      setFileType('epub');
    } else {
      setError('Формат файла не поддерживается.');
      return;
    }
    setFileUrl(filesApi.getFileUrl(file.id!));
    setLoading(false);
  };

  useEffect(() => {
    if (fileType !== 'pdf' || !fileUrl) return;
    const loadingTask = pdfjsLib.getDocument(fileUrl);
    loadingTask.promise.then(loadedPdf => {
      setPdf(loadedPdf);
      setTotalPages(loadedPdf.numPages);
    }).catch(err => {
      setError('Ошибка при загрузке PDF.');
      console.error(err);
    });
  }, [fileType, fileUrl]);

  useEffect(() => {
    if (!pdf || !canvasRef.current || fileType !== 'pdf') return;

    const renderPage = async () => {
      const page = await pdf.getPage(pdfPage);
      const viewport = page.getViewport({ scale: pdfScale });
      const canvas = canvasRef.current;
      if (canvas) {
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
        }
      }
    };
    renderPage();
  }, [pdf, pdfPage, pdfScale, fileType]);

  useEffect(() => {
    if (fileType !== 'epub' || !fileUrl || !epubViewerRef.current) return;
    
    const book = ePub(fileUrl);
    bookRef.current = book;
    
    const rendition = book.renderTo(epubViewerRef.current, {
      width: '100%',
      height: '100%',
      flow: 'paginated',
      spread: 'none'
    });
    
    renditionRef.current = rendition;
    rendition.display();

    book.loaded.navigation.then((nav) => {
      const toc = nav.toc.map((item: NavItem) => ({
        label: item.label,
        href: item.href,
        subitems: item.subitems?.map((sub: NavItem) => ({
          label: sub.label,
          href: sub.href
        }))
      }));
      setEpubToc(toc);
    });

    rendition.on('relocated', (location: any) => {
      if (location?.start?.cfi) {
        setEpubLocation(location.start.cfi);
      }
    });

    applyEpubTheme(rendition, theme, fontSize);

    return () => {
      book.destroy();
    };
  }, [fileType, fileUrl]);

  const applyEpubTheme = useCallback((rendition: Rendition, currentTheme: Theme, currentFontSize: number) => {
    const themeConfig = themes[currentTheme];
    rendition.themes.default({
      body: {
        'background-color': themeConfig.viewerBg + ' !important',
        'color': themeConfig.viewerText + ' !important',
        'font-size': `${currentFontSize}% !important`,
        'line-height': '1.6 !important',
        'padding': '20px !important'
      },
      'p, div, span': {
        'color': themeConfig.viewerText + ' !important',
        'font-size': 'inherit !important'
      }
    });
    rendition.themes.select('default');
  }, []);

  useEffect(() => {
    if (renditionRef.current) {
      applyEpubTheme(renditionRef.current, theme, fontSize);
    }
  }, [theme, fontSize, applyEpubTheme]);

  const goToPrevPage = () => {
    if (fileType === 'pdf') {
      setPdfPage(prev => Math.max(1, prev - 1));
    } else if (renditionRef.current) {
      renditionRef.current.prev();
    }
  };

  const goToNextPage = () => {
    if (fileType === 'pdf') {
      setPdfPage(prev => Math.min(totalPages, prev + 1));
    } else if (renditionRef.current) {
      renditionRef.current.next();
    }
  };

  const goToTocItem = (href: string) => {
    if (renditionRef.current) {
      renditionRef.current.display(href);
      setShowToc(false);
    }
  };

  const goToBookmark = (bookmark: Bookmark) => {
    if (fileType === 'pdf') {
      const page = parseInt(bookmark.location || '1');
      if (!isNaN(page)) {
        setPdfPage(page);
      }
    } else if (renditionRef.current && bookmark.location) {
      renditionRef.current.display(bookmark.location);
    }
    setShowBookmarks(false);
  };

  const handleBookmark = async () => {
    if (!bookId || !isAuthenticated) {
      toast.info('Войдите, чтобы добавить закладку');
      return;
    }
    try {
      let location = '0';
      let label = 'Закладка';
      
      if (fileType === 'pdf') {
        location = String(pdfPage);
        label = `Стр. ${pdfPage}`;
      } else if (epubLocation) {
        location = epubLocation;
        label = `Позиция в книге`;
      }

      await bookmarksApi.create({
        book_id: bookId,
        location: location,
        label: label
      });
      
      const updatedBookmarks = await bookmarksApi.getByBook(bookId);
      setBookmarks(updatedBookmarks || []);
      toast.success('Закладка добавлена');
    } catch (e) {
      console.error(e);
      toast.error('Ошибка добавления закладки');
    }
  };

  const deleteBookmark = async (bookmarkId: string) => {
    try {
      await bookmarksApi.delete(bookmarkId);
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
      toast.success('Закладка удалена');
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const zoomIn = () => {
    if (fileType === 'pdf') {
      setPdfScale(prev => Math.min(3, prev + 0.25));
    } else {
      setFontSize(prev => Math.min(200, prev + 10));
    }
  };

  const zoomOut = () => {
    if (fileType === 'pdf') {
      setPdfScale(prev => Math.max(0.5, prev - 0.25));
    } else {
      setFontSize(prev => Math.max(50, prev - 10));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevPage();
      if (e.key === 'ArrowRight') goToNextPage();
      if (e.key === 'Escape' && isFullscreen) toggleFullscreen();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, fileType, pdf, totalPages]);

  const currentTheme = themes[theme];

  if (showFileSelector && files.length > 1) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        <h1 className="text-2xl font-bold mb-6">{bookTitle}</h1>
        <h2 className="text-lg font-semibold mb-4">Выберите файл для чтения:</h2>
        <div className="space-y-3">
          {files.map((file) => (
            <button
              key={file.id}
              onClick={() => selectFile(file)}
              className="w-full p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all flex items-center gap-4 text-left"
            >
              <div className={`p-3 rounded-lg ${file.file_type === 'pdf' ? 'bg-red-100' : 'bg-blue-100'}`}>
                <FileText className={`h-6 w-6 ${file.file_type === 'pdf' ? 'text-red-600' : 'text-blue-600'}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{file.file_name}</p>
                <p className="text-sm text-gray-500">
                  {file.file_type?.toUpperCase()} • {Math.round((file.file_size || 0) / 1024)} KB
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return <Loading text="Загрузка книги..." />;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        <EmptyState title="Ошибка" description={error} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`min-h-screen ${currentTheme.bg} ${currentTheme.text} transition-colors duration-300`}>
      <div className={`sticky top-0 z-20 ${currentTheme.bg} border-b border-gray-200 dark:border-gray-700 shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="font-semibold truncate max-w-[200px] sm:max-w-md">{bookTitle}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={goToPrevPage} variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {fileType === 'pdf' && (
              <span className="text-sm font-medium min-w-[80px] text-center">
                {pdfPage} / {totalPages}
              </span>
            )}
            
            <Button onClick={goToNextPage} variant="ghost" size="sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1">
            {fileType === 'epub' && epubToc.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setShowToc(true)} title="Содержание">
                <List className="h-4 w-4" />
              </Button>
            )}
            
            <Button variant="ghost" size="sm" onClick={() => setShowBookmarks(true)} title="Закладки">
              <BookmarkIcon className="h-4 w-4" />
              {bookmarks.length > 0 && (
                <span className="ml-1 text-xs bg-primary-500 text-white rounded-full px-1.5">{bookmarks.length}</span>
              )}
            </Button>
            
            <Button variant="ghost" size="sm" onClick={handleBookmark} title="Добавить закладку">
              <BookmarkIcon className="h-4 w-4 fill-current" />
            </Button>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            <Button variant="ghost" size="sm" onClick={zoomOut} title="Уменьшить">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={zoomIn} title="Увеличить">
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)} title="Настройки">
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={toggleFullscreen} title="Полный экран">
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-center py-6 px-4 min-h-[calc(100vh-80px)]">
        {fileType === 'pdf' ? (
          <div className="overflow-auto max-w-full">
            <canvas ref={canvasRef} className="shadow-xl rounded-lg" />
          </div>
        ) : fileType === 'epub' ? (
          <div 
            ref={epubViewerRef} 
            className="w-full max-w-4xl shadow-xl rounded-lg overflow-hidden"
            style={{ 
              height: 'calc(100vh - 150px)',
              backgroundColor: currentTheme.viewerBg 
            }} 
          />
        ) : (
          <EmptyState title="Нет файла" description="Не удалось определить формат файла." />
        )}
      </div>

      <Modal isOpen={showToc} onClose={() => setShowToc(false)} title="Содержание" size="md">
        <div className="max-h-[60vh] overflow-y-auto space-y-1">
          {epubToc.map((item, idx) => (
            <div key={idx}>
              <button
                onClick={() => goToTocItem(item.href)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                {item.label}
              </button>
              {item.subitems && item.subitems.map((sub, subIdx) => (
                <button
                  key={subIdx}
                  onClick={() => goToTocItem(sub.href)}
                  className="w-full text-left px-6 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-600"
                >
                  {sub.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={showBookmarks} onClose={() => setShowBookmarks(false)} title="Закладки" size="md">
        <div className="max-h-[60vh] overflow-y-auto">
          {bookmarks.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Нет закладок</p>
          ) : (
            <div className="space-y-2">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100"
                >
                  <button
                    onClick={() => goToBookmark(bookmark)}
                    className="flex-1 text-left"
                  >
                    <p className="font-medium text-sm">{bookmark.label || 'Закладка'}</p>
                    <p className="text-xs text-gray-500">
                      {fileType === 'pdf' ? `Страница ${bookmark.location}` : 'EPUB позиция'}
                    </p>
                  </button>
                  <button
                    onClick={() => deleteBookmark(bookmark.id!)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Настройки чтения" size="sm">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3">Тема</label>
            <div className="flex gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  theme === 'light' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Sun className="h-5 w-5 mx-auto mb-1" />
                <span className="text-xs">Светлая</span>
              </button>
              <button
                onClick={() => setTheme('sepia')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  theme === 'sepia' ? 'border-primary-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="h-5 w-5 mx-auto mb-1 rounded bg-amber-200" />
                <span className="text-xs">Сепия</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  theme === 'dark' ? 'border-primary-500 bg-gray-800 text-white' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Moon className="h-5 w-5 mx-auto mb-1" />
                <span className="text-xs">Темная</span>
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-3">
              Размер {fileType === 'pdf' ? 'масштаба' : 'шрифта'}: {fileType === 'pdf' ? `${Math.round(pdfScale * 100)}%` : `${fontSize}%`}
            </label>
            <input
              type="range"
              min={fileType === 'pdf' ? 50 : 50}
              max={fileType === 'pdf' ? 300 : 200}
              value={fileType === 'pdf' ? pdfScale * 100 : fontSize}
              onChange={(e) => {
                if (fileType === 'pdf') {
                  setPdfScale(parseInt(e.target.value) / 100);
                } else {
                  setFontSize(parseInt(e.target.value));
                }
              }}
              className="w-full accent-primary-500"
            />
          </div>

          {files.length > 1 && (
            <div>
              <label className="block text-sm font-medium mb-3">Файл</label>
              <Button variant="outline" className="w-full" onClick={() => { setShowSettings(false); setShowFileSelector(true); setLoading(false); setFileType(null); }}>
                <FileText className="h-4 w-4 mr-2" />
                Выбрать другой файл
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
