import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import ePub from 'epubjs';
import { OpenAPI } from '@/shared/api';
import { Bookmark } from '@/api/wrapper';
import { booksApi, bookmarksApi } from '@/api/wrapper';
import { Button, toast, Loading, EmptyState } from '@/components/ui';
import { Bookmark as BookmarkIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';


pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

OpenAPI.BASE = 'http://localhost:8080/api/v1';

export function Reader() {
  const { bookId } = useParams<{ bookId: string }>();
  const [fileType, setFileType] = useState<'pdf' | 'epub' | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  // PDF state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // EPUB state
  const epubViewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<any>(null);


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) {
      OpenAPI.HEADERS = {
        Authorization: `Bearer ${token}`,
      };
    }
  }, [token]);

  useEffect(() => {
    const fetchBookFile = async () => {
      if (!bookId) return;
      setLoading(true);
      setError(null);

      try {
        const files = await booksApi.getFiles(bookId);
        if (!files || files.length === 0) {
          throw new Error('Для этой книги не найдено файлов.');
        }

        const primaryFile = files[0]; // Берем первый файл

        if (primaryFile.mime_type === 'application/pdf') {
          setFileType('pdf');
        } else if (primaryFile.mime_type === 'application/epub+zip') {
          setFileType('epub');
        } else {
          throw new Error('Формат файла не поддерживается.');
        }
        setFileUrl(`/api/v1/files/${primaryFile.id}`);

      } catch (err: any) {
        setError(err.message || 'Не удалось загрузить книгу.');
      } finally {
        setLoading(false);
      }
    };
    fetchBookFile();
  }, [bookId]);

  // PDF Loading Effect
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


  // PDF Rendering Effect
  useEffect(() => {
    if (!pdf || !canvasRef.current || fileType !== 'pdf') return;

    const renderPage = async () => {
      const page = await pdf.getPage(pdfPage);
      const viewport = page.getViewport({ scale: 1.5 });
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
  }, [pdf, pdfPage, canvasRef, fileType]);

  // EPUB Rendering Effect
  useEffect(() => {
    if (fileType !== 'epub' || !fileUrl || !epubViewerRef.current) return;
    const book = ePub(fileUrl);
    const rendition = book.renderTo(epubViewerRef.current, {
      width: '100%',
      height: '100%',
      flow: 'paginated',
    });
    renditionRef.current = rendition;
    rendition.display();

    return () => {
      book.destroy();
    };
  }, [fileType, fileUrl, epubViewerRef]);


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

  const handleBookmark = async () => {
    if (!bookId) return;
    try {
        let location = '0';
        let label = 'Закладка';
        
        if (fileType === 'pdf') {
            location = String(pdfPage);
            label = `Стр. ${pdfPage}`;
        } else if (renditionRef.current) {
             // Try to get CFI
             try {
                const currentLoc = renditionRef.current.location.start;
                if (currentLoc) location = currentLoc.cfi;
             } catch (e) {
                 console.log('Error getting epub location', e);
             }
        }

        await bookmarksApi.create({
            book_id: bookId,
            location: location,
            label: label
        });
        toast.success('Закладка добавлена');
    } catch (e) {
        console.error(e);
        toast.error('Ошибка добавления закладки');
    }
  };

  if (loading) {
    return <Loading text="Загрузка книги..." />;
  }

  if (error) {
    return <EmptyState title="Ошибка" description={error} />;
  }

  const renderReader = () => {
    switch (fileType) {
      case 'pdf':
        return <canvas ref={canvasRef} className="shadow-lg" />;
      case 'epub':
        return (
          <div ref={epubViewerRef} style={{ height: 'calc(100vh - 150px)', width: '800px' }} />
        );
      default:
        return <EmptyState title="Нет файла" description="Не удалось определить формат файла." />;
    }
  }

  return (
    <div className="space-y-4">
       <div className="sticky top-20 bg-white p-4 border rounded-lg shadow-sm z-10 flex items-center justify-center gap-4">
          <Button onClick={goToPrevPage} variant="secondary">
            <ChevronLeft className="h-4 w-4" />
            Назад
          </Button>
          {fileType === 'pdf' && (
            <span className="text-sm font-medium">
              Страница {pdfPage} из {totalPages}
            </span>
          )}
           {fileType === 'epub' && (
            <span className="text-sm font-medium">
              E-Book
            </span>
          )}
          <Button onClick={goToNextPage} variant="secondary">
            Вперед
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <Button onClick={handleBookmark} variant="outline" size="sm">
            <BookmarkIcon className="h-4 w-4 mr-2" />
            В закладки
          </Button>
        </div>
      <div className="flex justify-center">
        {renderReader()}
      </div>
    </div>
  );
}
