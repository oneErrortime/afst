import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useApiConfigStore } from '@/store/apiConfigStore';
import { BookOpen, LogOut, Menu, X, Settings, Wifi, WifiOff, Loader2, Crown, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { checkApiConnection } from '@/api/client';

export function Navbar() {
  const { isAuthenticated, logout } = useAuthStore();
  const { connectionStatus } = useApiConfigStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkApiConnection();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const getStatusIndicator = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-xs text-red-600">
            <WifiOff className="h-3 w-3" />
          </div>
        );
      case 'checking':
        return (
          <div className="flex items-center gap-1.5 text-xs text-blue-600">
            <Loader2 className="h-3 w-3 animate-spin" />
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-xs text-yellow-600">
            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
          </div>
        );
    }
  };

  const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <Link
      to={to}
      className={`relative px-3 py-2 rounded-lg font-medium transition-colors ${
        isActive(to)
          ? 'text-primary-600 bg-primary-50'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {children}
      {isActive(to) && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-600" />
      )}
    </Link>
  );

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 shadow-sm group-hover:shadow-md transition-shadow">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                LibraryAPI
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <NavLink to="/books">Книги</NavLink>
              <NavLink to="/categories">Категории</NavLink>
              {isAuthenticated && (
                <>
                  <NavLink to="/library">Моя библиотека</NavLink>
                  <NavLink to="/groups">Группы</NavLink>
                  <NavLink to="/readers">Читатели</NavLink>
                  <NavLink to="/borrow">Выдача</NavLink>
                  <NavLink to="/admin/books">Админ</NavLink>
                </>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/subscriptions"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                isActive('/subscriptions')
                  ? 'text-amber-600 bg-amber-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Crown className="h-4 w-4" />
              <span className="text-sm font-medium">Подписки</span>
            </Link>
            <Link
              to="/settings"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/settings')
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {getStatusIndicator()}
              <Settings className="h-4 w-4" />
            </Link>

            {isAuthenticated ? (
              <Button variant="ghost" onClick={handleLogout} size="sm">
                <LogOut className="h-4 w-4" />
                Выйти
              </Button>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Войти</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Регистрация</Button>
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <Link
              to="/settings"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              {getStatusIndicator()}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md animate-in">
          <div className="px-4 py-3 space-y-1">
            <Link
              to="/books"
              className={`block px-3 py-2.5 rounded-lg font-medium ${
                isActive('/books') ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Книги
            </Link>
            <Link
              to="/categories"
              className={`block px-3 py-2.5 rounded-lg font-medium ${
                isActive('/categories') ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Категории
            </Link>
            <Link
              to="/subscriptions"
              className={`block px-3 py-2.5 rounded-lg font-medium ${
                isActive('/subscriptions') ? 'text-amber-600 bg-amber-50' : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Подписки
              </span>
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/library"
                  className={`block px-3 py-2.5 rounded-lg font-medium ${
                    isActive('/library') ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Моя библиотека
                </Link>
                <Link
                  to="/groups"
                  className={`block px-3 py-2.5 rounded-lg font-medium ${
                    isActive('/groups') ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Группы
                </Link>
                <Link
                  to="/readers"
                  className={`block px-3 py-2.5 rounded-lg font-medium ${
                    isActive('/readers') ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Читатели
                </Link>
                <Link
                  to="/borrow"
                  className={`block px-3 py-2.5 rounded-lg font-medium ${
                    isActive('/borrow') ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Выдача
                </Link>
                <Link
                  to="/admin/books"
                  className={`block px-3 py-2.5 rounded-lg font-medium ${
                    isActive('/admin/books') ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Админ
                  </span>
                </Link>
              </>
            )}
            <Link
              to="/settings"
              className={`block px-3 py-2.5 rounded-lg font-medium ${
                isActive('/settings') ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Настройки
              </span>
            </Link>
            
            <div className="pt-3 border-t border-gray-200">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 font-medium flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Выйти
                </button>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    className="block px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 text-center font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Войти
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white text-center font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Регистрация
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
