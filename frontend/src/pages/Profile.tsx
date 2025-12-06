import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SocialService, UserPublicProfileDTO, OpenAPI } from '@/shared/api';
import { useAuthStore } from '@/store/authStore';
import { Button, Loading, EmptyState, toast } from '@/components/ui';
import { User, Users, Book, Star, Plus, Minus } from 'lucide-react';

// Configure the base path for the generated API client
OpenAPI.BASE = 'http://localhost:8080/api/v1';

export function Profile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<UserPublicProfileDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const { user, token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (token) {
      OpenAPI.HEADERS = {
        Authorization: `Bearer ${token}`,
      };
    }
  }, [token]);

  const fetchProfile = async () => {
    if (!id) return;
    try {
      const profileData = await SocialService.getUsers({ id });
      setProfile(profileData);
      // Here you would ideally have an endpoint to check if the current user is following this profile
      // For now, we'll just keep it as false. We'll add this logic later.
    } catch (error) {
      toast.error('Не удалось загрузить профиль');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleFollow = async () => {
    if (!id || !isAuthenticated) {
      toast.info('Нужно войти в аккаунт, чтобы подписаться');
      return;
    }
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await SocialService.deleteUsersFollow({ id });
        toast.success(`Вы отписались от ${profile?.name}`);
        setIsFollowing(false);
      } else {
        await SocialService.postUsersFollow({ id });
        toast.success(`Вы подписались на ${profile?.name}`);
        setIsFollowing(true);
      }
      // Re-fetch profile to update follower count
      fetchProfile();
    } catch (error) {
      toast.error('Действие не удалось');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <Loading text="Загрузка профиля..." />;
  if (!profile) return <EmptyState title="Профиль не найден" />;

  const isOwnProfile = user?.id === profile.id;

  return (
    <div className="space-y-8">
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="p-4 bg-gradient-to-br from-primary-100 to-primary-50 rounded-full">
            <User className="h-12 w-12 text-primary-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
            <div className="flex items-center gap-6 mt-2 text-gray-500">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <b>{profile.follower_count}</b> подписчиков
              </span>
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <b>{profile.following_count}</b> подписок
              </span>
            </div>
          </div>
          {!isOwnProfile && isAuthenticated && (
            <Button onClick={handleFollow} loading={followLoading} variant={isFollowing ? 'secondary' : 'primary'}>
              {isFollowing ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isFollowing ? 'Отписаться' : 'Подписаться'}
            </Button>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Коллекции ({profile.collections?.length || 0})</h2>
        {profile.collections && profile.collections.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.collections.map(collection => (
              <div key={collection.id} className="card p-4">
                <h3 className="font-semibold">{collection.name}</h3>
                <p className="text-sm text-gray-600">{collection.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">У пользователя пока нет публичных коллекций.</p>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Отзывы ({profile.reviews?.length || 0})</h2>
        {profile.reviews && profile.reviews.length > 0 ? (
          <div className="space-y-4">
            {profile.reviews.map(review => (
              <div key={review.id} className="card p-4">
                 <div className="flex items-center justify-between">
                    <Link to={`/books/${review.book_id}`} className="font-semibold hover:underline">
                      {review.book?.title || 'Книга'}
                    </Link>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <b>{review.rating}</b>
                    </div>
                </div>
                <h4 className="font-medium mt-1">{review.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{review.body}</p>
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
