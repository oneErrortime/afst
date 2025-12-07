import { useEffect, useState } from 'react';
import { reviewsApi } from '@/api';
import { Button, Input } from '@/components/ui';
import { Star } from 'lucide-react';

export function Reviews({ bookId }: { bookId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadReviews();
  }, [bookId]);

  const loadReviews = async () => {
    try {
      const data = await reviewsApi.getByBook(bookId);
      setReviews(data || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await reviewsApi.create({ book_id: bookId, rating, comment });
      setComment('');
      setRating(5);
      loadReviews();
    } catch (err) {
      console.error('Failed to create review:', err);
    }
  };

  if (loading) return <div>Loading reviews...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Reviews</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium mb-2">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={star <= rating ? 'text-yellow-500' : 'text-gray-300'}
              >
                <Star className="h-6 w-6 fill-current" />
              </button>
            ))}
          </div>
        </div>
        
        <Input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Your review..."
          required
        />
        
        <Button type="submit">Submit Review</Button>
      </form>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="p-4 bg-white rounded-lg border">
            <div className="flex gap-1 mb-2">
              {Array.from({ length: review.rating }).map((_, i) => (
                <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
              ))}
            </div>
            <p className="text-gray-700">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
