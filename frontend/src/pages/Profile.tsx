import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { socialApi, type User, type Collection, type Review } from '@/api';
import { Loading, Button } from '@/components/ui';
import { UserPlus, UserMinus, BookOpen, FolderOpen, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';

export function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const profileData = await socialApi.getUserProfile(id);
      setProfile(profileData as any);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const toggleFollow = async () => {
    if (!id || !isAuthenticated) {
      toast.info('Нужно войти в аккаунт');
      return;
    }
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await socialApi.unfollowUser(id);
        toast.success('Вы отписались');
        setIsFollowing(false);
      } else {
        await socialApi.followUser(id);
        toast.success('Вы подписались');
        setIsFollowing(true);
      }
      fetchProfile();
    } catch {
      toast.error('Действие не удалось');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <Loading text="Загрузка профиля..." />;
  if (!profile) return <div className="text-center py-8">Профиль не найден</div>;

  const isOwnProfile = user?.id === profile.id;
  const collections = (profile as any).collections || [];
  const reviews = (profile as any).reviews || [];

  return (
    <div className="space-y-8">
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="p-4 bg-gradient-to-br from-primary-100 to-primary-50 rounded-full">
            <BookOpen className="h-12 w-12 text-primary-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{profile.name || profile.email}</h1>
            <p className="text-gray-600 mt-1">{profile.email}</p>
          </div>
          {!isOwnProfile && isAuthenticated && (
            <Button onClick={toggleFollow} loading={followLoading} variant={isFollowing ? 'secondary' : 'primary'}>
              {isFollowing ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {isFollowing ? 'Отписаться' : 'Подписаться'}
            </Button>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Коллекции ({collections.length})
        </h2>
        {collections.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection: Collection) => (
              <div key={collection.id} className="card p-4">
                <h3 className="font-semibold">{collection.name}</h3>
                {collection.description && (
                  <p className="text-sm text-gray-600 mt-1">{collection.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">У пользователя пока нет публичных коллекций.</p>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Отзывы ({reviews.length})
        </h2>
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review: Review) => (
              <div key={review.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Отзыв на книгу</h3>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <span>⭐</span>
                    <b>{review.rating}</b>
                  </div>
                </div>
                {review.body && (
                  <p className="text-sm text-gray-600 mt-2">{review.body}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Пользователь пока не оставлял отзывов.</p>
        )}
      </div>
    </div>
  );
}
