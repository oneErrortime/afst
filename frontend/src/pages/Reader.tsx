import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { booksApi, filesApi, sessionsApi, accessApi } from '@/api';
import type { Book, BookFile, ReadingSession } from '@/types';
import { Button, Loading } from '@/components/ui';

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

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (bookId) {
      loadBookData();
    }
  }, [bookId]);

  useEffect(() => {
    return () => {
      if (session && currentPage > 0) {
        sessionsApi.end(session.id, currentPage).catch(console.error);
      }
    };
  }, [session, currentPage]);

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

      if (filesData.length > 0) {
        const pdfFile = filesData.find(f => f.file_type === 'pdf') || filesData[0];
        setSelectedFile(pdfFile);
        loadFile(pdfFile.id);
      }

      if (accessId) {
        try {
          const sessionData = await sessionsApi.start({
            book_id: bookId,
            access_id: accessId,
          });
          setSession(sessionData);
        } catch (error) {
          console.error('Failed to start reading session:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load book:', error);
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
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (accessId && page > 0) {
      accessApi.updateProgress(accessId, { current_page: page, total_pages: totalPages }).catch(console.error);
    }
  };

  const handleClose = async () => {
    if (session) {
      try {
        await sessionsApi.end(session.id, currentPage);
      } catch (error) {
        console.error('Failed to end session:', error);
      }
    }
    navigate('/library');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Книга не найдена</h1>
          <Button onClick={() => navigate('/library')}>Вернуться в библиотеку</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div>
            <h1 className="text-white font-semibold truncate max-w-md">{book.title}</h1>
            <p className="text-gray-400 text-sm">{book.author}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {files.length > 1 && (
            <select
              value={selectedFile?.id || ''}
              onChange={(e) => {
                const file = files.find(f => f.id === e.target.value);
                if (file) {
                  setSelectedFile(file);
                  loadFile(file.id);
                }
              }}
              className="bg-gray-700 text-white text-sm rounded px-3 py-1.5 border border-gray-600"
            >
              {files.map((file) => (
                <option key={file.id} value={file.id}>
                  {file.original_name} ({file.file_type.toUpperCase()})
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2 text-gray-400">
            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              className="p-1 hover:text-white"
              title="Уменьшить"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>
            <span className="text-sm min-w-[3rem] text-center">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale(s => Math.min(2, s + 0.1))}
              className="p-1 hover:text-white"
              title="Увеличить"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2 text-white text-sm">
            <input
              type="number"
              value={currentPage}
              onChange={(e) => handlePageChange(parseInt(e.target.value) || 1)}
              className="w-16 bg-gray-700 text-center rounded px-2 py-1 border border-gray-600"
              min={1}
              max={totalPages}
            />
            <span className="text-gray-400">/ {totalPages}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 overflow-auto">
        {pdfUrl ? (
          <iframe
            ref={iframeRef}
            src={`${pdfUrl}#page=${currentPage}&zoom=${scale * 100}`}
            className="w-full h-full max-w-4xl bg-white rounded-lg shadow-2xl"
            style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
            title={book.title}
          />
        ) : files.length === 0 ? (
          <div className="text-center text-gray-400">
            <div className="text-6xl mb-4">📄</div>
            <p>Файлы для этой книги не загружены</p>
          </div>
        ) : (
          <Loading />
        )}
      </main>

      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-3">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Назад
          </button>

          <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all"
              style={{ width: `${(currentPage / Math.max(totalPages, 1)) * 100}%` }}
            />
          </div>

          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Вперёд →
          </button>
        </div>
      </footer>
    </div>
  );
}
