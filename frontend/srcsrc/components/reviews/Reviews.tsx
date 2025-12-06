import React, { useEffect, useState } from 'react';
import { ReviewService, Review, CreateReviewDTO, UpdateReviewDTO, OpenAPI } from '@/shared/api';
import { Loading, EmptyState, Button, Modal, Input, ConfirmDialog, toast } from '@/components/ui';
import { Plus, Star } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Link } from 'react-router-dom';

interface ReviewsProps {
  bookId: string;
}

OpenAPI.BASE = 'http://localhost:8080/api/v1';

export function Reviews({ bookId }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const [form, setForm] = useState<Omit<CreateReviewDTO, 'book_id'>>({ rating: 1, title: '', body: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (token) {
      OpenAPI.HEADERS = {
        Authorization: `Bearer ${token}`,
      };
    }
  }, [token]);


  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await ReviewService.getReviewsBook({ bookId });
      setReviews(data || []);
    } catch (err) {
      toast.error('Failed to fetch reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [bookId]);

  const openCreateModal = () => {
    setEditingReview(null);
    setForm({ rating: 1, title: '', body: '' });
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
      const requestBody: CreateReviewDTO | UpdateReviewDTO = {
        ...form,
        book_id: bookId,
      };

      if (editingReview) {
        await ReviewService.putReviews({ id: editingReview.id, requestBody: form as UpdateReviewDTO });
        toast.success('Review updated');
      } else {
        await ReviewService.postReviews({ requestBody: requestBody as CreateReviewDTO });
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
      await ReviewService.deleteReviews({ id: deletingReview.id });
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Отзывы</h2>
        {user && (
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Написать отзыв
          </Button>
        )}
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          title="Отзывов пока нет"
          description="Станьте первым, кто поделится своим мнением об этой книге."
        />
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{review.title}</h3>
                  <p className="text-sm text-gray-600">
                    от{' '}
                    <Link to={`/profile/${review.user_id}`} className="font-medium text-primary-600 hover:underline">
                      {review.user?.name || 'Аноним'}
                    </Link>
                  </p>
                </div>
                <div className="flex items-center gap-1 text-yellow-500 text-lg">
                  <Star className="h-5 w-5 fill-current" />
                  <b>{review.rating}</b>
                </div>
              </div>

              <p className="mt-2 text-gray-700">{review.body}</p>

              {user && (user.id === review.user_id || user.role === 'admin') && (
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(review)}>Редактировать</Button>
                  <Button variant="danger" size="sm" onClick={() => setDeletingReview(review)}>Удалить</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingReview ? 'Редактировать отзыв' : 'Новый отзыв'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Рейтинг (1-5)</label>
            <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <Star
                        key={star}
                        className={`h-6 w-6 cursor-pointer ${form.rating >= star ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        onClick={() => setForm({ ...form, rating: star })}
                    />
                ))}
            </div>
          </div>
          <Input
            label="Заголовок"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="Ваше общее впечатление"
            required
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Текст отзыва</label>
            <textarea
              className="input min-h-[100px]"
              value={form.body}
              onChange={e => setForm({ ...form, body: e.target.value })}
              placeholder="Расскажите подробнее..."
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" loading={saving}>
              {editingReview ? 'Сохранить' : 'Опубликовать'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingReview}
        onClose={() => setDeletingReview(null)}
        onConfirm={handleDelete}
        title="Удалить отзыв?"
        message="Вы уверены, что хотите удалить этот отзыв?"
        loading={deleting}
      />
    </div>
  );
}
