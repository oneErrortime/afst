import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { subscriptionsApi } from '@/api';
import type { Subscription, SubscriptionPlanConfig, SubscriptionPlan } from '@/types';
import { Button, Loading, toast } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useSSE } from '@/hooks/useSSE';
import {
  Check, Crown, Star, Sparkles, BookOpen, Zap, Download,
  Shield, RefreshCcw, AlertTriangle, Clock, ArrowRight, X,
} from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function daysRemaining(endDate: string) {
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000);
  return diff;
}

// ─── Plan visual config ────────────────────────────────────────
const planConfig: Record<SubscriptionPlan, {
  label: string;
  icon: React.ReactNode;
  gradient: string;
  badge?: string;
}> = {
  free:    { label: 'Бесплатный', icon: <BookOpen className="h-6 w-6" />, gradient: 'from-gray-400 to-gray-500' },
  basic:   { label: 'Базовый',    icon: <Star className="h-6 w-6" />,     gradient: 'from-blue-500 to-blue-600' },
  premium: { label: 'Премиум',    icon: <Crown className="h-6 w-6" />,    gradient: 'from-amber-500 to-orange-500', badge: 'Популярный' },
  student: { label: 'Студент',    icon: <Sparkles className="h-6 w-6" />, gradient: 'from-emerald-500 to-teal-500' },
};

const planFeatureIcons: Record<string, React.ReactNode> = {
  books:     <BookOpen className="h-4 w-4 text-primary-500" />,
  downloads: <Download className="h-4 w-4 text-green-500" />,
  premium:   <Crown className="h-4 w-4 text-amber-500" />,
  speed:     <Zap className="h-4 w-4 text-purple-500" />,
};

function featureIcon(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes('книг') || lower.includes('читать')) return planFeatureIcons.books;
  if (lower.includes('загруз') || lower.includes('скачив')) return planFeatureIcons.downloads;
  if (lower.includes('премиум') || lower.includes('exclusive')) return planFeatureIcons.premium;
  return planFeatureIcons.speed;
}

// ─── Status banner ─────────────────────────────────────────────
function SubscriptionBanner({ sub, days, onCancel, onRenew, loading }: {
  sub: Subscription;
  days: number;
  onCancel: () => void;
  onRenew: () => void;
  loading: boolean;
}) {
  const cfg = planConfig[sub.plan] ?? planConfig.free;
  const isExpired = sub.status !== 'active' || days <= 0;
  const expiringSoon = days <= 7 && days > 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 shadow-xl">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${cfg.gradient}`} />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={`p-2 rounded-xl bg-gradient-to-br ${cfg.gradient}`}>
              {cfg.icon}
            </div>
            <div>
              <p className="text-sm text-gray-400">Текущая подписка</p>
              <h2 className="text-xl font-bold">{cfg.label}</h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4 text-sm">
            <span className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              До {sub.max_books} книг
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5">
              <Download className="h-3.5 w-3.5" />
              {sub.max_downloads} загрузок
            </span>
            {sub.can_access_premium && (
              <span className="flex items-center gap-1.5 bg-amber-500/30 rounded-lg px-3 py-1.5 text-amber-300">
                <Crown className="h-3.5 w-3.5" />
                Премиум книги
              </span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          {isExpired ? (
            <span className="inline-flex items-center gap-1.5 text-sm bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg">
              <X className="h-3.5 w-3.5" />Истекла
            </span>
          ) : expiringSoon ? (
            <span className="inline-flex items-center gap-1.5 text-sm bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg">
              <AlertTriangle className="h-3.5 w-3.5" />{days} дн.
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg">
              <Shield className="h-3.5 w-3.5" />{days} дн.
            </span>
          )}
          <p className="text-xs text-gray-500 mt-1">до {formatDate(sub.end_date)}</p>
        </div>
      </div>

      {expiringSoon && (
        <div className="mt-4 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-300">
          <Clock className="h-4 w-4 shrink-0" />
          Подписка истекает через {days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'} — не забудьте продлить.
        </div>
      )}

      <div className="mt-5 flex gap-3 flex-wrap">
        {(isExpired || expiringSoon) && (
          <Button size="sm" loading={loading} onClick={onRenew}>
            <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
            Продлить
          </Button>
        )}
        {!isExpired && (
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" loading={loading} onClick={onCancel}>
            Отменить подписку
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Plan card ─────────────────────────────────────────────────
function PlanCard({
  plan,
  isCurrent,
  onSubscribe,
  subscribing,
  isAuthenticated,
}: {
  plan: SubscriptionPlanConfig;
  isCurrent: boolean;
  onSubscribe: (p: SubscriptionPlan) => void;
  subscribing: SubscriptionPlan | null;
  isAuthenticated: boolean;
}) {
  const cfg = planConfig[plan.plan] ?? planConfig.free;
  const isPremium = plan.plan === 'premium';

  return (
    <div className={`relative flex flex-col rounded-2xl border-2 transition-all hover:shadow-lg ${
      isPremium
        ? 'border-amber-300 shadow-amber-100/50 shadow-lg scale-[1.02]'
        : isCurrent
        ? 'border-primary-300 bg-primary-50/30'
        : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      {cfg.badge && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${cfg.gradient} shadow-sm`}>
          {cfg.badge}
        </div>
      )}

      {isCurrent && (
        <div className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-semibold text-white bg-primary-600 shadow-sm">
          Текущий
        </div>
      )}

      <div className={`p-6 rounded-t-2xl bg-gradient-to-br ${cfg.gradient} text-white`}>
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-white/20 rounded-xl">{cfg.icon}</div>
        </div>
        <h3 className="text-xl font-bold">{cfg.label}</h3>
        <div className="mt-2">
          <span className="text-3xl font-bold">{plan.price_monthly.toLocaleString('ru')} ₽</span>
          <span className="text-sm text-white/70"> / месяц</span>
        </div>
        {plan.price_yearly > 0 && (
          <p className="text-xs text-white/70 mt-1">
            или {Math.round(plan.price_yearly / 12).toLocaleString('ru')} ₽/мес при оплате за год
          </p>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <ul className="space-y-3 flex-1 mb-6">
          {plan.features?.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
              <span className="mt-0.5 shrink-0">{featureIcon(f)}</span>
              {f}
            </li>
          )) ?? (
            <>
              <li className="flex items-center gap-2.5 text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                До {plan.max_books} книг одновременно
              </li>
              {plan.max_downloads > 0 && (
                <li className="flex items-center gap-2.5 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  {plan.max_downloads} загрузок в месяц
                </li>
              )}
              {plan.can_access_premium && (
                <li className="flex items-center gap-2.5 text-sm text-gray-700">
                  <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                  Доступ к Premium книгам
                </li>
              )}
            </>
          )}
        </ul>

        {!isAuthenticated ? (
          <Link to="/login">
            <Button variant="secondary" className="w-full">
              Войти для подписки
            </Button>
          </Link>
        ) : isCurrent ? (
          <Button variant="secondary" disabled className="w-full">
            <Check className="h-4 w-4 mr-2" />Ваш план
          </Button>
        ) : (
          <Button
            className={`w-full ${isPremium ? '' : 'btn-secondary'}`}
            variant={isPremium ? 'primary' : 'secondary'}
            loading={subscribing === plan.plan}
            onClick={() => onSubscribe(plan.plan)}
          >
            Выбрать план
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────
export default function Subscriptions() {
  const { isAuthenticated } = useAuthStore();
  const [plans, setPlans] = useState<SubscriptionPlanConfig[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<SubscriptionPlan | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const plansData = await subscriptionsApi.getPlans();
      setPlans(plansData || []);

      if (isAuthenticated) {
        try {
          const sub = await subscriptionsApi.getMy();
          setCurrentSubscription(sub);
        } catch {
          setCurrentSubscription(null);
        }
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
      toast.error('Не удалось загрузить данные о подписках');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { loadData(); }, [loadData]);

  // Real-time subscription updates via SSE
  useSSE({
    enabled: isAuthenticated,
    handlers: {
      'subscription.new': () => {
        toast.success('Подписка активирована!');
        loadData();
      },
      'subscription.expired': () => {
        toast.warning('Ваша подписка истекла');
        loadData();
      },
    },
  });

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      toast.info('Войдите для оформления подписки');
      return;
    }
    try {
      setSubscribing(plan);
      const newSub = await subscriptionsApi.subscribe(plan);
      setCurrentSubscription(newSub);
      toast.success(`Подписка «${planConfig[plan]?.label}» оформлена!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Не удалось оформить подписку');
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancel = async () => {
    if (!currentSubscription) return;
    try {
      setActionLoading(true);
      await subscriptionsApi.cancel(currentSubscription.id);
      toast.success('Подписка отменена');
      await loadData();
    } catch {
      toast.error('Не удалось отменить подписку');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!currentSubscription) return;
    try {
      setActionLoading(true);
      await subscriptionsApi.renew(currentSubscription.id);
      toast.success('Подписка продлена!');
      await loadData();
    } catch {
      toast.error('Не удалось продлить подписку');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loading />;

  const days = currentSubscription ? daysRemaining(currentSubscription.end_date) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-4">

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
          <Crown className="h-4 w-4" />
          Подписки LibraryAPI
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Выберите свой план
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Получите доступ к тысячам книг, включая эксклюзивный Premium-контент.
          Читайте онлайн, сохраняйте прогресс, скачивайте для оффлайна.
        </p>
      </div>

      {/* Current subscription banner */}
      {isAuthenticated && currentSubscription && (
        <SubscriptionBanner
          sub={currentSubscription}
          days={days}
          onCancel={handleCancel}
          onRenew={handleRenew}
          loading={actionLoading}
        />
      )}

      {/* Not logged in notice */}
      {!isAuthenticated && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
          <Shield className="h-5 w-5 shrink-0" />
          <span>
            <Link to="/login" className="font-semibold underline">Войдите</Link>, чтобы оформить подписку и получить доступ к Premium книгам.
          </span>
        </div>
      )}

      {/* Plan grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map(plan => (
          <PlanCard
            key={plan.plan}
            plan={plan}
            isCurrent={currentSubscription?.plan === plan.plan && currentSubscription?.status === 'active'}
            onSubscribe={handleSubscribe}
            subscribing={subscribing}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>

      {/* Feature highlights */}
      <div className="grid gap-4 sm:grid-cols-3 pt-4">
        {[
          { icon: <Shield className="h-6 w-6 text-primary-600" />, title: 'Отмена в любой момент', desc: 'Без обязательств — отмените или смените план когда угодно.' },
          { icon: <BookOpen className="h-6 w-6 text-green-600" />, title: 'Чтение онлайн и оффлайн', desc: 'PDF и EPUB во встроенном ридере. Скачивайте с Premium.' },
          { icon: <Crown className="h-6 w-6 text-amber-600" />, title: 'Эксклюзивный контент', desc: 'Premium книги, ранние релизы и специальные издания.' },
        ].map((f, i) => (
          <div key={i} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">{f.icon}</div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">{f.title}</h4>
              <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
