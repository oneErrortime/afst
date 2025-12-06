import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { booksApi, bookmarksApi } from '@/api';
import { Bookmark } from '@/types';
import { Button, toast } from '@/components/ui';
import { Bookmark as BookmarkIcon } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

const Reader = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    const fetchFileIdAndRenderPdf = async () => {
      if (!bookId) return;
      setLoading(true);
      setError(null);

      try {
        const files = await booksApi.getFiles(bookId);
        if (files.length === 0) {
          setError('No files found for this book.');
          setLoading(false);
          return;
        }

        const fileId = files[0].id;
        const url = `/api/v1/files/${fileId}`;

        const loadingTask = pdfjsLib.getDocument(url);
        const loadedPdf = await loadingTask.promise;

        setPdf(loadedPdf);
        setTotalPages(loadedPdf.numPages);
      } catch (err) {
        setError('Failed to load PDF.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchBookmarks = async () => {
      if (!bookId) return;
      try {
        const data = await bookmarksApi.getBookmarksByBook(bookId);
        setBookmarks(data);
      } catch (error) {
        console.error("Failed to fetch bookmarks");
      }
    };

    fetchFileIdAndRenderPdf();
    fetchBookmarks();
  }, [bookId]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    const renderPage = async () => {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      if (canvas) {
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          await page.render(renderContext).promise;
        }
      }
    };

    renderPage();
  }, [pdf, pageNumber, canvasRef]);

  const handleAddBookmark = async () => {
    if (!bookId) return;
    try {
      const newBookmark = await bookmarksApi.createBookmark({
        book_id: bookId,
        location: String(pageNumber),
        label: `Page ${pageNumber}`,
      });
      setBookmarks([...bookmarks, newBookmark]);
      toast.success('Bookmark added!');
    } catch (error) {
      toast.error('Failed to add bookmark.');
    }
  };

  const goToPreviousPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(totalPages, prev + 1));
  };

  if (loading) {
    return <div>Loading PDF...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="flex gap-8">
      <div className="flex-grow">
        <div className="sticky top-20 bg-white p-4 border rounded-lg shadow-sm z-10 flex items-center justify-between">
          <div className="flex gap-2">
            <Button onClick={goToPreviousPage} disabled={pageNumber <= 1}>
              Previous
            </Button>
            <span className="self-center">
              Page {pageNumber} of {totalPages}
            </span>
            <Button onClick={goToNextPage} disabled={pageNumber >= totalPages}>
              Next
            </Button>
          </div>
          <Button onClick={handleAddBookmark}>
            <BookmarkIcon className="h-4 w-4 mr-2" />
            Add Bookmark
          </Button>
        </div>
        <div className="mt-4 flex justify-center">
          <canvas ref={canvasRef} className="shadow-lg" />
        </div>
      </div>
      <div className="w-64 flex-shrink-0">
        <h2 className="text-lg font-semibold mb-4">Bookmarks</h2>
        {bookmarks.length === 0 ? (
          <p className="text-sm text-gray-500">No bookmarks yet.</p>
        ) : (
          <ul className="space-y-2">
            {bookmarks.map(bookmark => (
              <li key={bookmark.id} className="text-sm">
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => setPageNumber(parseInt(bookmark.location))}
                >
                  {bookmark.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export { Reader };
