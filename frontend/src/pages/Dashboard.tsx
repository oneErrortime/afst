import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Loading, toast } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { statsApi } from '@/api';
import { 
  BookOpen, 
  Users, 
  FolderOpen, 
  Users2, 
  Clock, 
  CreditCard, 
  TrendingUp,
  Activity,
  BarChart3,
  BookMarked,
  UserCheck
} from 'lucide-react';

interface DashboardStats {
  total_users: number;
  total_books: number;
  published_books: number;
  total_categories: number;
  total_groups: number;
  active_loans: number;
  active_subscriptions: number;
  total_reading_sessions: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  change?: number;
}

function StatCard({ title, value, icon: Icon, color, bgColor, change }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
          {change !== undefined && (
            <p className={`text-sm mt-1 flex items-center gap-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`h-4 w-4 ${change < 0 ? 'rotate-180' : ''}`} />
              {change >= 0 ? '+' : ''}{change}% за неделю
            </p>
          )}
        </div>
        <div className={`p-4 rounded-2xl ${bgColor}`}>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </div>
    </div>
  );
}

interface ActivityItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  time: string;
  color: string;
}

function ActivityItem({ icon: Icon, title, description, time, color }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500 truncate">{description}</p>
      </div>
      <span className="text-xs text-gray-400">{time}</span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'librarian') {
      navigate('/');
      return;
    }
    loadStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await statsApi.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      toast.error('Не удалось загрузить статистику');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  const statCards = [
    {
      title: 'Всего книг',
      value: stats?.total_books || 0,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Опубликовано',
      value: stats?.published_books || 0,
      icon: BookMarked,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Пользователей',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Категорий',
      value: stats?.total_categories || 0,
      icon: FolderOpen,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Групп',
      value: stats?.total_groups || 0,
      icon: Users2,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Активных займов',
      value: stats?.active_loans || 0,
      icon: Clock,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
    },
    {
      title: 'Активных подписок',
      value: stats?.active_subscriptions || 0,
      icon: CreditCard,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
    {
      title: 'Сессий чтения',
      value: stats?.total_reading_sessions || 0,
      icon: Activity,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
  ];

  const recentActivities = [
    { icon: BookOpen, title: 'Новая книга добавлена', description: 'Программирование на Go', time: '2 мин', color: 'bg-blue-500' },
    { icon: UserCheck, title: 'Новая регистрация', description: 'user@gmail.com', time: '15 мин', color: 'bg-green-500' },
    { icon: Clock, title: 'Книга выдана', description: 'Clean Code - Иван Петров', time: '1 час', color: 'bg-purple-500' },
    { icon: CreditCard, title: 'Новая подписка', description: 'Premium план активирован', time: '3 часа', color: 'bg-pink-500' },
  ];

  return (
    <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Панель управления</h1>
          <p className="text-gray-500">Обзор библиотечной системы</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <StatCard key={index} {...card} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Статистика активности</h2>
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option>За неделю</option>
                <option>За месяц</option>
                <option>За год</option>
              </select>
            </div>
            
            <div className="h-64 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Графики активности</p>
                <p className="text-xs mt-1">Данные за выбранный период</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats?.total_books || 0}</p>
                <p className="text-sm text-gray-500">Книг в каталоге</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats?.active_loans || 0}</p>
                <p className="text-sm text-gray-500">Активных выдач</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats?.total_reading_sessions || 0}</p>
                <p className="text-sm text-gray-500">Сессий чтения</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Последняя активность</h2>
            <div className="space-y-2">
              {recentActivities.map((activity, index) => (
                <ActivityItem key={index} {...activity} />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h2>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/admin/books')}
                className="p-4 text-left rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
              >
                <BookOpen className="h-8 w-8 text-gray-400 group-hover:text-primary-600 mb-2" />
                <p className="font-medium text-gray-900">Добавить книгу</p>
                <p className="text-sm text-gray-500">Загрузить новую книгу</p>
              </button>
              <button 
                onClick={() => navigate('/admin/users')}
                className="p-4 text-left rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
              >
                <Users className="h-8 w-8 text-gray-400 group-hover:text-primary-600 mb-2" />
                <p className="font-medium text-gray-900">Пользователи</p>
                <p className="text-sm text-gray-500">Управление аккаунтами</p>
              </button>
              <button 
                onClick={() => navigate('/groups')}
                className="p-4 text-left rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
              >
                <Users2 className="h-8 w-8 text-gray-400 group-hover:text-primary-600 mb-2" />
                <p className="font-medium text-gray-900">Группы</p>
                <p className="text-sm text-gray-500">Настройка групп доступа</p>
              </button>
              <button 
                onClick={() => navigate('/categories')}
                className="p-4 text-left rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
              >
                <FolderOpen className="h-8 w-8 text-gray-400 group-hover:text-primary-600 mb-2" />
                <p className="font-medium text-gray-900">Категории</p>
                <p className="text-sm text-gray-500">Управление категориями</p>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Распределение контента</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Опубликованные книги</span>
                  <span className="font-medium text-gray-900">
                    {stats?.total_books ? Math.round((stats?.published_books || 0) / stats.total_books * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${stats?.total_books ? ((stats?.published_books || 0) / stats.total_books * 100) : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Активные подписки</span>
                  <span className="font-medium text-gray-900">{stats?.active_subscriptions || 0}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (stats?.active_subscriptions || 0) * 10)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Книги на руках</span>
                  <span className="font-medium text-gray-900">{stats?.active_loans || 0}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (stats?.active_loans || 0) * 5)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Групп пользователей</span>
                  <span className="font-medium text-gray-900">{stats?.total_groups || 0}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (stats?.total_groups || 0) * 20)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
