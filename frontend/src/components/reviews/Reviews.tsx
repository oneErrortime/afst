import { useEffect, useState, useCallback } from 'react';
import { reviewsApi } from '@/api';
import { Button } from '@/components/ui';
import { Star } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

import type { models_Review } from '@/shared/api';
type Review = models_Review;

export function Reviews({ bookId }: { bookId: string }) {
  const { isAuthenticated } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    try {
      const data = await reviewsApi.getByBook(bookId);
      setReviews(data || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Напишите текст отзыва');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await reviewsApi.create({ book_id: bookId, rating, body: comment, title: '' });
      setComment('');
      setRating(5);
      await loadReviews();
    } catch {
      setError('Не удалось отправить отзыв. Попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">Отзывы</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">
        Отзывы {reviews.length > 0 && <span className="text-gray-400 font-normal text-base">({reviews.length})</span>}
      </h2>

      {/* Form — only for authenticated users */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="space-y-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm font-medium text-gray-700">Оставить отзыв</p>

          {/* Star rating */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Оценка</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 self-center text-sm text-gray-500">
                {['', 'Ужасно', 'Плохо', 'Нормально', 'Хорошо', 'Отлично'][hoverRating || rating]}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm text-gray-600">Текст отзыва *</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none text-sm"
              rows={3}
              value={comment}
              onChange={(e) => { setComment(e.target.value); setError(null); }}
              placeholder="Поделитесь впечатлениями о книге..."
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" loading={submitting} size="sm">
            Опубликовать отзыв
          </Button>
        </form>
      ) : (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center text-sm text-gray-500">
          <a href="/login" className="text-primary-600 hover:underline font-medium">Войдите</a>, чтобы оставить отзыв
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">Отзывов пока нет. Будьте первым!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < (review.rating || 0)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400">
                  {review.created_at ? new Date(review.created_at).toLocaleDateString('ru-RU') : ''}
                </span>
              </div>
              {review.title && <p className="font-medium text-gray-800 text-sm mb-1">{review.title}</p>}
              <p className="text-gray-600 text-sm">{review.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
