import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { booksApi } from '@/api';

export function RecommendedBooks({ bookId }: { bookId: string }) {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const data = await booksApi.getRecommendations(bookId, 6);
        setBooks(data || []);
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      } finally {
        setLoading(false);
      }
    };
    loadRecommendations();
  }, [bookId]);

  if (loading) return <div>Loading recommendations...</div>;
  if (books.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Recommended Books</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {books.map((book) => (
          <Link
            key={book.id}
            to={`/books/${book.id}`}
            className="p-4 bg-white rounded-lg border hover:shadow-lg transition"
          >
            <h3 className="font-semibold">{book.title}</h3>
            <p className="text-sm text-gray-600">{book.author}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
