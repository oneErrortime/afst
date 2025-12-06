import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { booksApi } from '@/api';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

const Reader = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    fetchFileIdAndRenderPdf();
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
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={goToPreviousPage} disabled={pageNumber <= 1}>
          Previous
        </button>
        <span style={{ margin: '0 1rem' }}>
          Page {pageNumber} of {totalPages}
        </span>
        <button onClick={goToNextPage} disabled={pageNumber >= totalPages}>
          Next
        </button>
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
};

export { Reader };
