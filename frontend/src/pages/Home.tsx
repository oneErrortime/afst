import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useApiConfigStore } from '@/store/apiConfigStore';
import { Button } from '@/components/ui';
import {
  BookOpen,
  Users,
  ArrowRight,
  Shield,
  Zap,
  Database,
  Server,
  Wifi,
  WifiOff,
  Settings,
  Github,
  ExternalLink,
  Star,
  Clock,
  TrendingUp,
  Library,
  Heart,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { checkApiConnection } from '@/api/client';
import { booksApi, type Book } from '@/api/wrapper';

export function Home() {
  const { isAuthenticated } = useAuthStore();
  const { connectionStatus, getActiveEndpoint } = useApiConfigStore();
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [popularBooks, setPopularBooks] = useState<Book[]>([]);
  const [, setLoading] = useState(true);

  const activeEndpoint = getActiveEndpoint();

  useEffect(() => {
    checkApiConnection();
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const books = await booksApi.getAll({ limit: 12 });
      setRecentBooks((books || []).slice(0, 6));
      setPopularBooks((books || []).slice(0, 4).sort(() => Math.random() - 0.5));
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative py-14 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.02]" />
        </div>

        <div className="relative text-center max-w-3xl mx-auto">
          <div className="flex justify-center mb-7">
            <div className="p-4 bg-white/10 backdrop-blur rounded-2xl shadow-xl ring-1 ring-white/20">
              <BookOpen className="h-12 w-12 text-white" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 tracking-tight leading-tight">
            Library<span className="text-primary-200">API</span>
          </h1>
          <p className="text-lg text-primary-100 max-w-xl mx-auto mb-8 leading-relaxed">
            Современная система управления библиотекой с REST API, JWT аутентификацией и полным CRUD функционалом.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/books">
              <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50 border-0 shadow-lg font-semibold">
                Каталог книг
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {!isAuthenticated ? (
              <Link to="/register">
                <Button variant="ghost" size="lg" className="text-white hover:bg-white/10 border border-white/30">
                  Регистрация
                </Button>
              </Link>
            ) : (
              <Link to="/library">
                <Button variant="ghost" size="lg" className="text-white hover:bg-white/10 border border-white/30">
                  <Library className="h-4 w-4" />
                  Моя библиотека
                </Button>
              </Link>
            )}
          </div>

          <div className="mt-8 flex items-center justify-center gap-5 text-sm">
            <a
              href="https://github.com/oneErrortime/afst"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary-200 hover:text-white transition-colors"
            >
              <Github className="h-4 w-4" />
              GitHub
              <ExternalLink className="h-3 w-3" />
            </a>
            <span className="text-primary-400">·</span>
            <Link
              to="/settings"
              className={`flex items-center gap-1.5 transition-colors ${
                connectionStatus === 'connected' ? 'text-green-300 hover:text-green-200' : 'text-yellow-300 hover:text-yellow-200'
              }`}
            >
              {connectionStatus === 'connected' ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {connectionStatus === 'connected' ? 'API подключен' : 'Проверить подключение'}
            </Link>
          </div>
        </div>
      </section>

      {/* Recent books */}
      {recentBooks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Clock className="h-4 w-4 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Новые книги</h2>
            </div>
            <Link
              to="/books"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 group"
            >
              Все книги
              <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {recentBooks.map((book) => (
              <Link key={book.id} to={`/books/${book.id}`} className="group">
                <div className="aspect-[2/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden mb-2.5 relative shadow-sm group-hover:shadow-md transition-all">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                    <span className="text-white text-xs font-medium">Подробнее</span>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                  {book.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-1">{book.author}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Popular books */}
      {popularBooks.length > 0 && (
        <section className="card p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100/60">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Популярное</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {popularBooks.map((book, index) => (
              <Link
                key={book.id}
                to={`/books/${book.id}`}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex gap-3 group"
              >
                <div className="text-2xl font-bold text-amber-200 group-hover:text-amber-300 transition-colors leading-tight pt-0.5">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-primary-600 transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{book.author}</p>
                  {(book.rating || 0) > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="text-xs font-medium">{(book.rating || 0).toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: Database,
            title: 'REST API',
            description: 'Полноценный RESTful API для управления книгами, читателями и выдачей.',
            color: 'blue',
          },
          {
            icon: Shield,
            title: 'JWT Аутентификация',
            description: 'Безопасная аутентификация с использованием JSON Web Tokens.',
            color: 'green',
          },
          {
            icon: Zap,
            title: 'Бизнес-логика',
            description: 'Лимит книг на читателя, контроль наличия и учёт выдачи.',
            color: 'purple',
          },
        ].map((feature, index) => (
          <div
            key={index}
            className="card p-6 hover:shadow-md transition-all duration-200 group"
          >
            <div className={`inline-flex p-3 rounded-xl bg-${feature.color}-50 mb-4 group-hover:scale-105 transition-transform`}>
              <feature.icon className={`h-6 w-6 text-${feature.color}-600`} />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1.5">{feature.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </section>

      {/* Social features (auth only) */}
      {isAuthenticated && (
        <section className="card p-6 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-100/60">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="h-4 w-4 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Социальные возможности</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Link to="/collections" className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all group">
              <Library className="h-7 w-7 text-primary-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Коллекции</h3>
              <p className="text-xs text-gray-500">Создавайте списки любимых книг</p>
            </Link>

            <Link to="/profile/me" className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all group">
              <Heart className="h-7 w-7 text-red-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Подписки</h3>
              <p className="text-xs text-gray-500">Следите за другими читателями</p>
            </Link>

            <Link to="/books" className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all group">
              <MessageSquare className="h-7 w-7 text-amber-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Отзывы</h3>
              <p className="text-xs text-gray-500">Делитесь мнением о прочитанном</p>
            </Link>
          </div>
        </section>
      )}

      {/* System capabilities */}
      <section className="card overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Возможности системы</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { icon: BookOpen, title: 'Управление книгами', desc: 'Добавление, редактирование, удаление книг' },
              { icon: Users, title: 'Управление читателями', desc: 'Регистрация и учёт читателей библиотеки' },
              { icon: ArrowRight, title: 'Выдача книг', desc: 'Выдача и возврат с контролем лимитов' },
              { icon: Shield, title: 'Защита данных', desc: 'JWT токены и хеширование паролей' },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all"
              >
                <div className="p-2 bg-primary-50 rounded-lg shrink-0">
                  <item.icon className="h-4 w-4 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API server status */}
      <section className="card p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <Server className="h-5 w-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Текущий API сервер</h2>
        </div>

        <div className={`p-4 rounded-xl border-2 ${
          connectionStatus === 'connected'
            ? 'bg-green-50 border-green-200'
            : connectionStatus === 'error'
            ? 'bg-red-50 border-red-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{activeEndpoint?.name || 'Не выбран'}</h3>
              <code className="text-xs text-gray-500 font-mono">{activeEndpoint?.url || '—'}</code>
            </div>
            <Link to="/settings">
              <Button variant="secondary" size="sm">
                <Settings className="h-4 w-4" />
                Настройки
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
