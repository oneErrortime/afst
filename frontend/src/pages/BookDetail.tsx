import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { booksApi } from '@/api';
import { Book } from '@/types';
import { Loading } from '@/components/ui';
import { Reviews } from '@/components/reviews/Reviews';
import { RecommendedBooks } from '@/components/books/RecommendedBooks';

export function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBook = async () => {
      if (!id) return;
      try {
        const data = await booksApi.getById(id);
        setBook(data as Book);
      } catch {
        setError('Failed to fetch book details.');
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  if (loading) {
    return <Loading text="Loading book details..." />;
  }

  if (error || !book) {
    return <div>{error || 'Book not found.'}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{book.title}</h1>
      <p className="text-xl text-gray-600">{book.author}</p>

      <div className="pt-8">
        <Reviews bookId={book.id} />
      </div>

      <div className="pt-8">
        <RecommendedBooks bookId={book.id} />
      </div>
    </div>
  );
}
