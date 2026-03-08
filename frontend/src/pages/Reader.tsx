import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
// pdfjs-dist v4 ships only .mjs workers — Vite ?url import bundles it correctly
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import ePub, { Rendition, Book as EpubBook } from 'epubjs';
import type { NavItem } from 'epubjs';
import { booksApi, bookmarksApi, filesApi, accessApi } from '@/api/wrapper';
import type { Bookmark, BookFile } from '@/api/wrapper';
import { Button, toast, Loading } from '@/components/ui';
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
  ArrowLeft,
  Lock,
  Crown,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useReadingProgress } from '@/hooks/useReadingProgress';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

interface TocItem { label: string; href: string; subitems?: TocItem[]; }
type Theme = 'light' | 'dark' | 'sepia';

const themes = {
  light: { bg: 'bg-white', text: 'text-gray-900', toolbarBg: 'bg-white border-gray-200', viewerBg: '#ffffff', viewerText: '#1a1a1a' },
  dark:  { bg: 'bg-gray-950', text: 'text-gray-100', toolbarBg: 'bg-gray-900 border-gray-700', viewerBg: '#0f0f0f', viewerText: '#e5e5e5' },
  sepia: { bg: 'bg-amber-50', text: 'text-amber-900', toolbarBg: 'bg-amber-50 border-amber-200', viewerBg: '#f5f0e1', viewerText: '#5c4b37' },
};

// ──────────────────────────────────────────────────────────────
//  PDF renderer — renders ONE page to a canvas
// ──────────────────────────────────────────────────────────────
interface PDFPageProps {
  pdf: pdfjsLib.PDFDocumentProxy;
  pageNum: number;
  scale: number;
}

const PDFPage = React.memo(function PDFPage({ pdf, pageNum, scale }: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      // Cancel any in-progress render for this canvas
      renderTaskRef.current?.cancel();

      const page = await pdf.getPage(pageNum);
      if (cancelled) return;

      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const task = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = task;

      try {
        await task.promise;
      } catch (e: any) {
        if (e?.name !== 'RenderingCancelledException') console.warn('[pdf]', e);
      }
    };

    render();
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [pdf, pageNum, scale]);

  return <canvas ref={canvasRef} className="shadow-2xl rounded-lg max-w-full" />;
});

// ──────────────────────────────────────────────────────────────
//  Main Reader
// ──────────────────────────────────────────────────────────────
export function Reader() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // ── Book / file state ──
  const [bookTitle, setBookTitle] = useState('');
  const [files, setFiles] = useState<BookFile[]>([]);
  const [, setSelectedFile] = useState<BookFile | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'epub' | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  // ── Access state ──
  const [hasAccess, setHasAccess] = useState(false);
  const [accessId, setAccessId] = useState<string | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // ── PDF state ──
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfScale, setPdfScale] = useState(1.4);
  // Pre-render adjacent pages
  const [prefetchPages, setPrefetchPages] = useState<number[]>([]);

  // ── EPUB state ──
  const epubViewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const bookRef = useRef<EpubBook | null>(null);
  const [epubToc, setEpubToc] = useState<TocItem[]>([]);
  const [epubLocation, setEpubLocation] = useState('');

  // ── UI state ──
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
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Session tracking ──
  const [, setSessionId] = useState<string | null>(null);
  const { saveProgress, startSession, endSession } = useReadingProgress({
    accessId,
    bookId: bookId ?? null,
    totalPages,
    debounceMs: 3000,
  });

  // ──────────────────────────────────────────────────────────────
  //  Load book + check access
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!bookId) return;
    loadBook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, isAuthenticated]);

  const loadBook = async () => {
    setLoading(true);
    setError(null);
    setAccessLoading(true);

    try {
      const [bookData, filesData] = await Promise.all([
        booksApi.getById(bookId!),
        // Files are gated server-side; we still fetch the list to show them
        booksApi.getFiles(bookId!).catch(() => []),
      ]);

      setBookTitle((bookData as any)?.title || 'Книга');
      setIsPremium(!!(bookData as any)?.is_premium);
      setFiles(filesData || []);

      // Check access
      if (isAuthenticated) {
        const [accessResult, bmData, libraryData] = await Promise.all([
          accessApi.checkAccess(bookId!).catch(() => false),
          bookmarksApi.getByBook(bookId!).catch(() => []),
          accessApi.getLibrary().catch(() => null),
        ]);

        setHasAccess(accessResult === true);
        setBookmarks(bmData || []);

        if (libraryData) {
          const activeAccess = libraryData.active_books?.find((a: any) => a.book_id === bookId);
          if (activeAccess) setAccessId(activeAccess.id);
        }
      } else {
        // Non-authenticated: only allow non-premium books (server will still enforce)
        setHasAccess(!(bookData as any)?.is_premium);
      }

      setAccessLoading(false);

      if (!filesData || filesData.length === 0) {
        throw new Error('Для этой книги ещё не загружены файлы.');
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
      setAccessLoading(false);
    }
  };

  const selectFile = (file: BookFile) => {
    setSelectedFile(file);
    setShowFileSelector(false);

    const mime = file.mime_type || '';
    if (mime === 'application/pdf') {
      setFileType('pdf');
    } else if (mime === 'application/epub+zip') {
      setFileType('epub');
    } else {
      setError('Формат файла не поддерживается в браузере (PDF / EPUB).');
      setLoading(false);
      return;
    }

    const token = useAuthStore.getState().token;
    // Append token to URL as query param so the browser can stream it
    const base = filesApi.getFileUrl(file.id!);
    setFileUrl(token ? `${base}?token=${token}` : base);
    setLoading(false);
  };

  // ──────────────────────────────────────────────────────────────
  //  PDF loading — fetch bytes via axiosInstance (handles auth),
  //  then hand off to pdfjsLib so no cross-origin header issues
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (fileType !== 'pdf' || !fileUrl) return;

    let destroyed = false;
    let currentDoc: pdfjsLib.PDFDocumentProxy | null = null;

    const load = async () => {
      try {
        // Fetch raw bytes via our axios client (Authorization header injected automatically)
        const resp = await fetch(fileUrl, {
          headers: useAuthStore.getState().token
            ? { Authorization: `Bearer ${useAuthStore.getState().token}` }
            : {},
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const buffer = await resp.arrayBuffer();
        if (destroyed) return;

        const task = pdfjsLib.getDocument({ data: buffer });
        const doc = await task.promise;
        if (destroyed) { doc.destroy(); return; }

        currentDoc = doc;
        setPdf(doc);
        setTotalPages(doc.numPages);
        setPdfPage(1);
      } catch {
        if (!destroyed) setError('Ошибка загрузки PDF. Проверьте доступ к книге.');
      }
    };

    load();
    return () => {
      destroyed = true;
      currentDoc?.destroy();
    };
  }, [fileType, fileUrl]);

  // Update prefetch list whenever page changes
  useEffect(() => {
    if (!pdf) return;
    const next = [];
    if (pdfPage + 1 <= totalPages) next.push(pdfPage + 1);
    if (pdfPage + 2 <= totalPages) next.push(pdfPage + 2);
    if (pdfPage - 1 >= 1) next.push(pdfPage - 1);
    setPrefetchPages(next);

    // Save reading progress
    saveProgress(pdfPage);
  }, [pdfPage, pdf, totalPages, saveProgress]);

  // ──────────────────────────────────────────────────────────────
  //  EPUB loading
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (fileType !== 'epub' || !fileUrl || !epubViewerRef.current) return;

    const book = ePub(fileUrl);
    bookRef.current = book;

    const rendition = book.renderTo(epubViewerRef.current, {
      width: '100%',
      height: '100%',
      flow: 'paginated',
      spread: 'none',
    });
    renditionRef.current = rendition;
    rendition.display();

    book.loaded.navigation.then(nav => {
      setEpubToc(nav.toc.map((item: NavItem) => ({
        label: item.label,
        href: item.href,
        subitems: item.subitems?.map((s: NavItem) => ({ label: s.label, href: s.href })),
      })));
    });

    rendition.on('relocated', (location: any) => {
      if (location?.start?.cfi) {
        setEpubLocation(location.start.cfi);
        // EPUB doesn't give us page numbers easily — use cfi as location
        saveProgress(location?.start?.displayed?.page || 1);
      }
    });

    applyEpubTheme(rendition, theme, fontSize);

    return () => { book.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileType, fileUrl]);

  const applyEpubTheme = useCallback((r: Rendition, t: Theme, size: number) => {
    const cfg = themes[t];
    r.themes.default({
      body: {
        'background-color': `${cfg.viewerBg} !important`,
        'color': `${cfg.viewerText} !important`,
        'font-size': `${size}% !important`,
        'line-height': '1.7 !important',
        'padding': '24px 32px !important',
        'max-width': '680px !important',
        'margin': '0 auto !important',
      },
      'p, div, span, h1, h2, h3': {
        'color': `${cfg.viewerText} !important`,
      },
    });
    r.themes.select('default');
  }, []);

  useEffect(() => {
    if (renditionRef.current) applyEpubTheme(renditionRef.current, theme, fontSize);
  }, [theme, fontSize, applyEpubTheme]);

  // ──────────────────────────────────────────────────────────────
  //  Session lifecycle
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasAccess || !accessId) return;

    let sid: string | null = null;
    startSession().then(id => { sid = id; setSessionId(id); });

    return () => {
      if (sid) endSession(sid, pdfPage).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess, accessId]);

  // ──────────────────────────────────────────────────────────────
  //  Navigation
  // ──────────────────────────────────────────────────────────────
  const goToPrevPage = useCallback(() => {
    if (fileType === 'pdf') setPdfPage(p => Math.max(1, p - 1));
    else renditionRef.current?.prev();
  }, [fileType]);

  const goToNextPage = useCallback(() => {
    if (fileType === 'pdf') setPdfPage(p => Math.min(totalPages, p + 1));
    else renditionRef.current?.next();
  }, [fileType, totalPages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowLeft')  goToPrevPage();
      if (e.key === 'ArrowRight') goToNextPage();
      if (e.key === 'Escape' && isFullscreen) toggleFullscreen();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goToPrevPage, goToNextPage, isFullscreen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleBookmark = async () => {
    if (!bookId || !isAuthenticated) {
      toast.info('Войдите, чтобы добавить закладку');
      return;
    }
    try {
      const location = fileType === 'pdf' ? String(pdfPage) : epubLocation;
      const label = fileType === 'pdf' ? `Стр. ${pdfPage}` : 'EPUB позиция';
      await bookmarksApi.create({ book_id: bookId, location, label });
      const updated = await bookmarksApi.getByBook(bookId);
      setBookmarks(updated || []);
      toast.success('Закладка добавлена');
    } catch {
      toast.error('Ошибка добавления закладки');
    }
  };

  const deleteBookmark = async (id: string) => {
    await bookmarksApi.delete(id);
    setBookmarks(prev => prev.filter(b => b.id !== id));
    toast.success('Закладка удалена');
  };

  const zoomIn  = () => fileType === 'pdf' ? setPdfScale(p => Math.min(3, p + 0.2)) : setFontSize(p => Math.min(200, p + 10));
  const zoomOut = () => fileType === 'pdf' ? setPdfScale(p => Math.max(0.5, p - 0.2)) : setFontSize(p => Math.max(60, p - 10));

  // ──────────────────────────────────────────────────────────────
  //  Render guards
  // ──────────────────────────────────────────────────────────────
  if (loading || accessLoading) return <Loading text="Загрузка книги..." />;

  // Access gate
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Закрытый доступ</h2>
          {isPremium ? (
            <>
              <p className="text-gray-500 mb-6">Эта книга доступна только по <strong>Premium-подписке</strong>.</p>
              <Link to="/subscriptions">
                <Button className="w-full">
                  <Crown className="h-4 w-4 mr-2" />
                  Оформить подписку
                </Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-gray-500 mb-6">
                {!isAuthenticated
                  ? 'Войдите в аккаунт, чтобы читать эту книгу.'
                  : 'Возьмите книгу, чтобы получить доступ к чтению.'}
              </p>
              {!isAuthenticated ? (
                <Link to="/login"><Button className="w-full">Войти</Button></Link>
              ) : (
                <Button className="w-full" onClick={() => navigate(`/books/${bookId}`)}>
                  Перейти к книге
                </Button>
              )}
            </>
          )}
          <Button variant="ghost" className="w-full mt-3" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
        </div>
      </div>
    );
  }

  if (showFileSelector && files.length > 1) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />Назад
        </Button>
        <h1 className="text-2xl font-bold mb-6">{bookTitle}</h1>
        <h2 className="text-lg font-semibold mb-4">Выберите файл для чтения:</h2>
        <div className="space-y-3">
          {files.map(file => (
            <button
              key={file.id}
              onClick={() => selectFile(file)}
              className="w-full p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all flex items-center gap-4 text-left"
            >
              <div className={`p-3 rounded-lg ${file.file_type === 'pdf' ? 'bg-red-100' : 'bg-blue-100'}`}>
                <FileText className={`h-6 w-6 ${file.file_type === 'pdf' ? 'text-red-600' : 'text-blue-600'}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{file.original_name || file.file_name}</p>
                <p className="text-sm text-gray-500">
                  {file.file_type?.toUpperCase()} · {Math.round((file.file_size || 0) / 1024)} KB
                  {file.page_count ? ` · ${file.page_count} стр.` : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />Назад
        </Button>
        <div className="bg-red-50 rounded-xl p-8 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={loadBook}>Повторить</Button>
        </div>
      </div>
    );
  }

  const currentTheme = themes[theme];

  // ──────────────────────────────────────────────────────────────
  //  Main reader UI
  // ──────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className={`min-h-screen ${currentTheme.bg} ${currentTheme.text} transition-colors duration-300`}>

      {/* ── Toolbar ── */}
      <div className={`sticky top-0 z-20 border-b ${currentTheme.toolbarBg} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">

          {/* Left: back + title */}
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="font-semibold truncate hidden sm:block max-w-xs">{bookTitle}</h1>
          </div>

          {/* Center: page navigation */}
          <div className="flex items-center gap-1">
            <Button onClick={goToPrevPage} variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {fileType === 'pdf' && (
              <input
                type="number"
                min={1}
                max={totalPages}
                value={pdfPage}
                onChange={e => {
                  const p = parseInt(e.target.value);
                  if (p >= 1 && p <= totalPages) setPdfPage(p);
                }}
                className={`w-14 text-center text-sm rounded-lg border px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary-400 ${currentTheme.toolbarBg}`}
              />
            )}
            {fileType === 'pdf' && (
              <span className="text-sm text-gray-500 shrink-0">/ {totalPages}</span>
            )}
            <Button onClick={goToNextPage} variant="ghost" size="sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Right: tools */}
          <div className="flex items-center gap-0.5">
            {fileType === 'epub' && epubToc.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setShowToc(!showToc)} title="Содержание">
                <List className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowBookmarks(!showBookmarks)} title="Закладки">
              <BookmarkIcon className="h-4 w-4" />
              {bookmarks.length > 0 && (
                <span className="ml-0.5 text-xs bg-primary-500 text-white rounded-full px-1.5 py-0.5 leading-none">{bookmarks.length}</span>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleBookmark} title="Добавить закладку">
              <BookmarkIcon className="h-4 w-4 fill-current" />
            </Button>
            <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
            <Button variant="ghost" size="sm" onClick={zoomOut}><ZoomOut className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={zoomIn}><ZoomIn className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Table of Contents panel ── */}
      {showToc && (
        <div className={`fixed left-0 top-[57px] bottom-0 w-72 z-30 ${currentTheme.bg} border-r border-gray-200 dark:border-gray-700 shadow-xl overflow-y-auto`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Содержание</h3>
              <button onClick={() => setShowToc(false)}>
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            {epubToc.map((item, i) => (
              <div key={i}>
                <button
                  onClick={() => { renditionRef.current?.display(item.href); setShowToc(false); }}
                  className="w-full text-left px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
                >
                  {item.label}
                </button>
                {item.subitems?.map((sub, j) => (
                  <button
                    key={j}
                    onClick={() => { renditionRef.current?.display(sub.href); setShowToc(false); }}
                    className="w-full text-left pl-6 pr-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm text-gray-500 transition-colors"
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bookmarks panel ── */}
      {showBookmarks && (
        <div className={`fixed right-0 top-[57px] bottom-0 w-72 z-30 ${currentTheme.bg} border-l border-gray-200 dark:border-gray-700 shadow-xl overflow-y-auto`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Закладки</h3>
              <button onClick={() => setShowBookmarks(false)}>
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            {bookmarks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Нет закладок</p>
            ) : (
              <div className="space-y-2">
                {bookmarks.map(bm => (
                  <div key={bm.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <button className="flex-1 text-left" onClick={() => {
                      if (fileType === 'pdf') {
                        const p = parseInt(bm.location || '1');
                        if (!isNaN(p)) setPdfPage(p);
                      } else {
                        renditionRef.current?.display(bm.location);
                      }
                      setShowBookmarks(false);
                    }}>
                      <p className="text-sm font-medium">{bm.label || 'Закладка'}</p>
                      <p className="text-xs text-gray-500">{fileType === 'pdf' ? `Стр. ${bm.location}` : 'EPUB'}</p>
                    </button>
                    <button onClick={() => deleteBookmark(bm.id!)} className="p-1 text-gray-300 hover:text-red-500">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Settings panel ── */}
      {showSettings && (
        <div className={`fixed right-0 top-[57px] bottom-0 w-72 z-30 ${currentTheme.bg} border-l border-gray-200 dark:border-gray-700 shadow-xl overflow-y-auto`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Настройки чтения</h3>
              <button onClick={() => setShowSettings(false)}>
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Тема</label>
              <div className="grid grid-cols-3 gap-2">
                {(['light', 'sepia', 'dark'] as Theme[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                      theme === t ? 'border-primary-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ background: themes[t].viewerBg, color: themes[t].viewerText }}
                  >
                    {t === 'light' ? <Sun className="h-4 w-4" /> : t === 'dark' ? <Moon className="h-4 w-4" /> : <span className="h-4 w-4">☕</span>}
                    <span className="text-xs">{t === 'light' ? 'Светлая' : t === 'sepia' ? 'Сепия' : 'Темная'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {fileType === 'pdf' ? `Масштаб: ${Math.round(pdfScale * 100)}%` : `Размер шрифта: ${fontSize}%`}
              </label>
              <input
                type="range"
                min={fileType === 'pdf' ? 50 : 60}
                max={fileType === 'pdf' ? 300 : 200}
                value={fileType === 'pdf' ? pdfScale * 100 : fontSize}
                onChange={e => {
                  const v = parseInt(e.target.value);
                  if (fileType === 'pdf') setPdfScale(v / 100);
                  else setFontSize(v);
                }}
                className="w-full accent-primary-500"
              />
            </div>

            {files.length > 1 && (
              <Button
                variant="secondary"
                className="w-full mt-6"
                onClick={() => { setShowSettings(false); setShowFileSelector(true); setFileType(null); }}
              >
                <FileText className="h-4 w-4 mr-2" />Другой файл
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex justify-center py-6 px-4 min-h-[calc(100vh-57px)]">
        {fileType === 'pdf' && pdf ? (
          <div className="flex flex-col items-center gap-4">
            {/* Current page */}
            <PDFPage pdf={pdf} pageNum={pdfPage} scale={pdfScale} />
            {/* Hidden pre-renders for adjacent pages */}
            <div className="hidden" aria-hidden="true">
              {prefetchPages.map(p => (
                <PDFPage key={`pre-${p}`} pdf={pdf} pageNum={p} scale={pdfScale} />
              ))}
            </div>
            {/* Progress bar */}
            <div className="w-full max-w-md">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Прогресс</span>
                <span>{Math.round((pdfPage / totalPages) * 100)}%</span>
              </div>
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-500"
                  style={{ width: `${(pdfPage / totalPages) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ) : fileType === 'epub' ? (
          <div
            ref={epubViewerRef}
            className="w-full max-w-4xl shadow-xl rounded-xl overflow-hidden"
            style={{ height: 'calc(100vh - 100px)', backgroundColor: currentTheme.viewerBg }}
          />
        ) : null}
      </div>
    </div>
  );
}
