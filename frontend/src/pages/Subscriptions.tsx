import { useState, useEffect } from 'react';
import { subscriptionsApi } from '@/api';
import type { Subscription, SubscriptionPlanConfig, SubscriptionPlan } from '@/types';
import { Button, Loading } from '@/components/ui';
import { Layout } from '@/components/layout';
import { useAuthStore } from '@/store/authStore';
import { Check, Crown, Star, Sparkles, BookOpen } from 'lucide-react';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function daysRemaining(endDate: string) {
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

const planIcons: Record<SubscriptionPlan, React.ReactNode> = {
  free: <BookOpen className="h-8 w-8" />,
  basic: <Star className="h-8 w-8" />,
  premium: <Crown className="h-8 w-8" />,
  student: <Sparkles className="h-8 w-8" />,
};

const planColors: Record<SubscriptionPlan, string> = {
  free: 'from-gray-500 to-gray-600',
  basic: 'from-blue-500 to-blue-600',
  premium: 'from-amber-500 to-orange-500',
  student: 'from-emerald-500 to-teal-500',
};

export default function Subscriptions() {
  const { isAuthenticated } = useAuthStore();
  const [plans, setPlans] = useState<SubscriptionPlanConfig[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<SubscriptionPlan | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      const plansData = await subscriptionsApi.getPlans();
      setPlans(plansData);

      if (isAuthenticated) {
        try {
          const subData = await subscriptionsApi.getMy();
          setCurrentSubscription(subData);
        } catch {
          setCurrentSubscription(null);
        }
      }
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      alert('Войдите в аккаунт для оформления подписки');
      return;
    }

    try {
      setSubscribing(plan);
      const newSub = await subscriptionsApi.subscribe(plan);
      setCurrentSubscription(newSub);
    } catch (error) {
      console.error('Failed to subscribe:', error);
      alert('Не удалось оформить подписку');
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancel = async () => {
    if (!currentSubscription) return;
    if (!confirm('Вы уверены, что хотите отменить подписку?')) return;

    try {
      setActionLoading(true);
      await subscriptionsApi.cancel(currentSubscription.id);
      await loadData();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Не удалось отменить подписку');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!currentSubscription) return;

    try {
      setActionLoading(true);
      await subscriptionsApi.renew(currentSubscription.id);
      await loadData();
    } catch (error) {
      console.error('Failed to renew subscription:', error);
      alert('Не удалось продлить подписку');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Layout><Loading /></Layout>;

  const days = currentSubscription ? daysRemaining(currentSubscription.end_date) : 0;
  const isExpiringSoon = days <= 7 && days > 0;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Подписки</h1>
          <p className="text-gray-500">Выберите план, который подходит вам</p>
        </div>

        {currentSubscription && (
          <div className={`rounded-2xl p-6 bg-gradient-to-r ${planColors[currentSubscription.plan]} text-white`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  {planIcons[currentSubscription.plan]}
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    Текущая подписка: {plans.find(p => p.plan === currentSubscription.plan)?.name || currentSubscription.plan}
                  </h2>
                  <p className="text-white/80">
                    {currentSubscription.status === 'active' ? (
                      <>Активна до {formatDate(currentSubscription.end_date)}</>
                    ) : currentSubscription.status === 'cancelled' ? (
                      <>Отменена</>
                    ) : (
                      <>Статус: {currentSubscription.status}</>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {isExpiringSoon && currentSubscription.status === 'active' && (
                  <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm mb-2">
                    Осталось {days} дн.
                  </span>
                )}
                <div className="flex gap-2">
                  {currentSubscription.status === 'active' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        loading={actionLoading}
                        className="text-white border-white/30 hover:bg-white/10"
                      >
                        Отменить
                      </Button>
                      {isExpiringSoon && (
                        <Button
                          size="sm"
                          onClick={handleRenew}
                          loading={actionLoading}
                          className="bg-white text-gray-900 hover:bg-white/90"
                        >
                          Продлить
                        </Button>
                      )}
                    </>
                  )}
                  {currentSubscription.status === 'cancelled' && (
                    <Button
                      size="sm"
                      onClick={handleRenew}
                      loading={actionLoading}
                      className="bg-white text-gray-900 hover:bg-white/90"
                    >
                      Возобновить
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">{currentSubscription.max_books}</div>
                <div className="text-sm text-white/70">Книг одновременно</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">{currentSubscription.max_downloads}</div>
                <div className="text-sm text-white/70">Скачиваний/мес</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">{currentSubscription.can_access_premium ? 'Да' : 'Нет'}</div>
                <div className="text-sm text-white/70">Premium контент</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = currentSubscription?.plan === plan.plan && currentSubscription.status === 'active';

            return (
              <div
                key={plan.plan}
                className={`relative rounded-2xl border-2 bg-white overflow-hidden transition-all ${
                  isCurrent
                    ? 'border-primary-500 shadow-lg shadow-primary-100'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {plan.plan === 'premium' && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    Популярный
                  </div>
                )}

                <div className={`p-6 bg-gradient-to-br ${planColors[plan.plan]} text-white`}>
                  <div className="flex items-center gap-3 mb-3">
                    {planIcons[plan.plan]}
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                  </div>
                  <p className="text-white/80 text-sm">{plan.description}</p>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price_monthly === 0 ? 'Бесплатно' : `${plan.price_monthly}₽`}
                    </span>
                    {plan.price_monthly > 0 && <span className="text-gray-500">/мес</span>}
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">До {plan.max_books} книг одновременно</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{plan.max_downloads > 0 ? `${plan.max_downloads} скачиваний/мес` : 'Только онлайн чтение'}</span>
                    </li>
                    {plan.can_access_premium && (
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">Premium контент</span>
                      </li>
                    )}
                    {plan.price_yearly > 0 && (
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">Годовая подписка: {plan.price_yearly}₽</span>
                      </li>
                    )}
                  </ul>

                  <Button
                    className="w-full"
                    variant={isCurrent ? 'secondary' : 'primary'}
                    onClick={() => handleSubscribe(plan.plan)}
                    loading={subscribing === plan.plan}
                    disabled={isCurrent || !isAuthenticated}
                  >
                    {isCurrent ? 'Текущий план' : plan.price_monthly === 0 ? 'Выбрать' : 'Подписаться'}
                  </Button>

                  {!isAuthenticated && (
                    <p className="text-xs text-gray-400 text-center mt-2">
                      Войдите для оформления
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gray-50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Часто задаваемые вопросы</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Как работает подписка?</h3>
              <p className="text-sm text-gray-600 mt-1">
                После оформления подписки вы получаете доступ к чтению книг онлайн. Количество книг, которые можно
                читать одновременно, зависит от выбранного плана.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Могу ли я отменить подписку?</h3>
              <p className="text-sm text-gray-600 mt-1">
                Да, вы можете отменить подписку в любое время. Доступ сохранится до конца оплаченного периода.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Что такое Premium контент?</h3>
              <p className="text-sm text-gray-600 mt-1">
                Premium книги — это эксклюзивные издания, доступные только для подписчиков Premium и Student планов.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
