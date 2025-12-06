import React, { useEffect, useState } from 'react';
import { reviewsApi } from '@/api';
import { Review } from '@/types';
import { Loading, EmptyState, Button, Modal, Input, ConfirmDialog, toast } from '@/components/ui';
import { Plus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface ReviewsProps {
  bookId: string;
}

export function Reviews({ bookId }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const [form, setForm] = useState({ rating: 0, title: '', body: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuthStore();

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await reviewsApi.getReviewsByBook(bookId);
      setReviews(data);
    } catch (err) {
      setError('Failed to fetch reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [bookId]);

  const openCreateModal = () => {
    setEditingReview(null);
    setForm({ rating: 0, title: '', body: '' });
    setModalOpen(true);
  };

  const openEditModal = (review: Review) => {
    setEditingReview(review);
    setForm({ rating: review.rating, title: review.title, body: review.body });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingReview) {
        await reviewsApi.updateReview(editingReview.id, form);
        toast.success('Review updated');
      } else {
        await reviewsApi.createReview({ ...form, book_id: bookId });
        toast.success('Review created');
      }
      setModalOpen(false);
      fetchReviews();
    } catch (error) {
      toast.error('Failed to save review.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingReview) return;
    setDeleting(true);
    try {
      await reviewsApi.deleteReview(deletingReview.id);
      toast.success('Review deleted');
      setDeletingReview(null);
      fetchReviews();
    } catch (error) {
      toast.error('Failed to delete review.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <Loading text="Loading reviews..." />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reviews</h2>
        {user && (
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Add Review
          </Button>
        )}
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description="Be the first to share your thoughts on this book."
        />
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="p-4 border rounded-lg">
              <div className="flex justify-between">
                <h3 className="font-semibold">{review.title}</h3>
                {user && (user.id === review.user_id || user.role === 'admin') && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(review)}>Edit</Button>
                    <Button variant="danger" size="sm" onClick={() => setDeletingReview(review)}>Delete</Button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">Rating: {review.rating}/5</p>
              <p className="mt-2">{review.body}</p>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingReview ? 'Edit Review' : 'New Review'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Rating"
            type="number"
            min="1"
            max="5"
            value={form.rating}
            onChange={e => setForm({ ...form, rating: parseInt(e.target.value) })}
            required
          />
          <Input
            label="Title"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
          />
          <Input
            label="Body"
            value={form.body}
            onChange={e => setForm({ ...form, body: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingReview ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingReview}
        onClose={() => setDeletingReview(null)}
        onConfirm={handleDelete}
        title="Delete Review"
        message="Are you sure you want to delete this review?"
        loading={deleting}
      />
    </div>
  );
}
