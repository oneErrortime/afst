import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useApiConfigStore } from '@/store/apiConfigStore';
import { Button, Loading } from '@/components/ui';
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
  MessageSquare
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { checkApiConnection } from '@/api/client';
import { booksApi, reviewsApi, type Book, type Review } from '@/api/wrapper';

interface RecentActivity {
  type: 'review' | 'new_book';
  book?: Book;
  review?: Review;
  timestamp: Date;
}

export function Home() {
  const { isAuthenticated, user } = useAuthStore();
  const { connectionStatus, getActiveEndpoint } = useApiConfigStore();
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [popularBooks, setPopularBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="space-y-16">
      <section className="text-center py-16 relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40" />
        </div>

        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 rounded-3xl blur-2xl opacity-30 scale-150" />
            <div className="relative p-5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl shadow-xl shadow-primary-500/20">
              <BookOpen className="h-16 w-16 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
          Library<span className="gradient-text">API</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Современная система управления библиотекой с REST API, JWT аутентификацией и полным CRUD функционалом.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/books">
            <Button size="lg" className="shadow-lg shadow-primary-500/20">
              Каталог книг
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          {!isAuthenticated ? (
            <Link to="/register">
              <Button variant="secondary" size="lg">
                Регистрация
              </Button>
            </Link>
          ) : (
            <Link to="/library">
              <Button variant="secondary" size="lg">
                <Library className="h-5 w-5 mr-2" />
                Моя библиотека
              </Button>
            </Link>
          )}
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 text-sm">
          <a 
            href="https://github.com/oneErrortime/afst" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Github className="h-4 w-4" />
            GitHub
            <ExternalLink className="h-3 w-3" />
          </a>
          <span className="text-gray-300">•</span>
          <Link 
            to="/settings"
            className={`flex items-center gap-2 transition-colors ${
              connectionStatus === 'connected' ? 'text-green-600' : 'text-yellow-600'
            }`}
          >
            {connectionStatus === 'connected' ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            {connectionStatus === 'connected' ? 'API подключен' : 'Проверить подключение'}
          </Link>
        </div>
      </section>

      {recentBooks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Clock className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Новые книги</h2>
            </div>
            <Link to="/books" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Все книги
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {recentBooks.map((book) => (
              <Link 
                key={book.id} 
                to={`/books/${book.id}`}
                className="group"
              >
                <div className="aspect-[2/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden mb-3 relative shadow-sm group-hover:shadow-lg transition-all">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-white text-xs font-medium">Подробнее</span>
                  </div>
                </div>
                <h3 className="font-medium text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                  {book.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-1">{book.author}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {popularBooks.length > 0 && (
        <section className="card p-8 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Популярное</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {popularBooks.map((book, index) => (
              <Link 
                key={book.id} 
                to={`/books/${book.id}`}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex gap-4 group"
              >
                <div className="text-3xl font-bold text-amber-200 group-hover:text-amber-300 transition-colors">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{book.author}</p>
                  {(book.rating || 0) > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm font-medium">{(book.rating || 0).toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-6 md:grid-cols-3">
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
            className="card p-6 text-center hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex justify-center mb-4">
              <div className={`p-4 rounded-2xl bg-${feature.color}-100 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`h-8 w-8 text-${feature.color}-600`} />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </section>

      {isAuthenticated && (
        <section className="card p-8 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Социальные возможности</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <Link to="/collections" className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all group">
              <Library className="h-8 w-8 text-primary-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 mb-1">Коллекции</h3>
              <p className="text-sm text-gray-500">Создавайте списки любимых книг</p>
            </Link>
            
            <Link to="/profile/me" className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all group">
              <Heart className="h-8 w-8 text-red-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 mb-1">Подписки</h3>
              <p className="text-sm text-gray-500">Следите за другими читателями</p>
            </Link>
            
            <Link to="/books" className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all group">
              <MessageSquare className="h-8 w-8 text-amber-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 mb-1">Отзывы</h3>
              <p className="text-sm text-gray-500">Делитесь мнением о прочитанном</p>
            </Link>
          </div>
        </section>
      )}

      <section className="card overflow-hidden">
        <div className="p-8 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Возможности системы</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { icon: BookOpen, title: 'Управление книгами', desc: 'Добавление, редактирование, удаление книг' },
              { icon: Users, title: 'Управление читателями', desc: 'Регистрация и учёт читателей библиотеки' },
              { icon: ArrowRight, title: 'Выдача книг', desc: 'Выдача и возврат с контролем лимитов' },
              { icon: Shield, title: 'Защита данных', desc: 'JWT токены и хеширование паролей' },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <item.icon className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card p-8">
        <div className="flex items-center gap-3 mb-6">
          <Server className="h-6 w-6 text-gray-600" />
          <h2 className="text-xl font-bold text-gray-900">Текущий API сервер</h2>
        </div>
        
        <div className={`p-4 rounded-xl border-2 ${
          connectionStatus === 'connected' 
            ? 'bg-green-50 border-green-200' 
            : connectionStatus === 'error'
            ? 'bg-red-50 border-red-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">{activeEndpoint?.name || 'Не выбран'}</h3>
              <code className="text-sm text-gray-600 font-mono">{activeEndpoint?.url || '—'}</code>
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
