import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { type UserPublicProfileDTO, type Collection, type Review, socialApi } from '@/api';
import { Loading, Button, toast } from '@/components/ui';
import { UserPlus, UserMinus, FolderOpen, MessageSquare, Users, Star, Quote } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const [profile, setProfile] = useState<UserPublicProfileDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const profileData = await socialApi.getUserProfile(id);
      setProfile(profileData);
      // Determine if following logic should be here, usually backend tells us or we check list?
      // API doesn't seem to return "is_followed_by_me". 
      // We will assume default false unless we track it or if the button is just a toggle.
      // Ideally we should know.
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
  if (!profile) return <div className="text-center py-20 text-gray-500">Профиль не найден</div>;

  const isOwnProfile = user?.id === profile.id;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-primary-400 to-blue-500"></div>
        <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
                <div className="p-1 bg-white rounded-full">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-4xl shadow-inner text-gray-400 select-none">
                        {(profile.name?.[0] || 'U').toUpperCase()}
                    </div>
                </div>
                {!isOwnProfile && isAuthenticated && (
                    <Button onClick={toggleFollow} loading={followLoading} variant={isFollowing ? 'secondary' : 'primary'} className="mb-2 shadow-sm">
                        {isFollowing ? <UserMinus className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                        {isFollowing ? 'Отписаться' : 'Подписаться'}
                    </Button>
                )}
            </div>

            <div>
                <h1 className="text-3xl font-bold text-gray-900">{profile.name || 'Пользователь'}</h1>
                <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="font-semibold text-gray-900">{profile.follower_count || 0}</span> подписчиков
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{profile.following_count || 0}</span> подписок
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Collections */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-primary-500" />
                    Коллекции
                    <span className="ml-2 py-0.5 px-2 bg-gray-100 rounded-full text-xs text-gray-600 font-normal">
                        {profile.collections?.length || 0}
                    </span>
                </h2>
            </div>

            <div className="grid gap-3">
                {profile.collections && profile.collections.length > 0 ? (
                    profile.collections.map((collection: Collection) => (
                        <div key={collection.id} className="bg-white p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all group">
                            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                                {collection.name}
                            </h3>
                            {collection.description && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{collection.description}</p>
                            )}
                            <div className="mt-3 flex items-center text-xs text-gray-400">
                                {new Date(collection.created_at || Date.now()).toLocaleDateString()}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-gray-500 italic p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-sm">
                        Нет публичных коллекций
                    </div>
                )}
            </div>
        </div>

        {/* Reviews */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-amber-500" />
                    Отзывы
                    <span className="ml-2 py-0.5 px-2 bg-gray-100 rounded-full text-xs text-gray-600 font-normal">
                        {profile.reviews?.length || 0}
                    </span>
                </h2>
            </div>

            <div className="space-y-3">
                {profile.reviews && profile.reviews.length > 0 ? (
                    profile.reviews.map((review: Review) => (
                        <div key={review.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <Link to={`/books/${review.book_id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600 hover:underline">
                                    К книге...
                                </Link>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} className={`h-3 w-3 ${s <= (review.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                                    ))}
                                </div>
                            </div>
                            <div className="relative pl-6">
                                <Quote className="absolute left-0 top-0 h-4 w-4 text-gray-300 transform -scale-x-100" />
                                <p className="text-sm text-gray-600 italic">
                                    {review.body || 'Без текста'}
                                </p>
                            </div>
                            <div className="mt-2 text-right text-xs text-gray-400">
                                {new Date(review.created_at || Date.now()).toLocaleDateString()}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-gray-500 italic p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-sm">
                        Нет отзывов
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}