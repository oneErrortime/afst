import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BooksService, Book, OpenAPI } from '@/shared/api';
import { Loading } from '@/components/ui';
import { Book as BookIcon } from 'lucide-react';

interface RecommendedBooksProps {
  bookId: string;
}

OpenAPI.BASE = 'http://localhost:8080/api/v1';

export function RecommendedBooks({ bookId }: RecommendedBooksProps) {
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const response = await BooksService.getBooksRecommendations({ id: bookId, limit: 5 });
        if (response.Data) {
          setRecommendations(response.Data as Book[]);
        }
      } catch (error) {
        // Silently fail, recommendations are not critical
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [bookId]);

  if (loading) {
    return <Loading text="Загрузка рекомендаций..." />;
  }

  if (recommendations.length === 0) {
    return null; // Don't render anything if there are no recommendations
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Читатели этой книги также смотрят</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map(book => (
          <Link to={`/books/${book.id}`} key={book.id} className="card p-4 hover:shadow-lg transition-all">
             <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <BookIcon className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate" title={book.title}>
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-600">{book.author}</p>
                </div>
              </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
