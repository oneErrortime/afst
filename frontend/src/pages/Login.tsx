import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useApiConfigStore } from '@/store/apiConfigStore';
import { authApi } from '@/api';
import { Button, Input, toast } from '@/components/ui';
import { BookOpen, Mail, Lock, Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react';
import { AxiosError } from 'axios';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const { login: storeLogin } = useAuthStore();
  const { connectionStatus, getActiveEndpoint } = useApiConfigStore();
  const navigate = useNavigate();

  const activeEndpoint = getActiveEndpoint();

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'Email обязателен';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Некорректный email';
    if (!password) newErrors.password = 'Пароль обязателен';
    else if (password.length < 6) newErrors.password = 'Минимум 6 символов';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await storeLogin(email, password);
      setShowSuccess(true);
      toast.success('Вход выполнен успешно!');
      setTimeout(() => navigate('/books'), 800);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message = axiosError.response?.data?.message || 'Ошибка входа';
      toast.error(message);
      setLoading(false);
    }
  };

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <div className="flex items-center gap-2 text-green-600 text-xs bg-green-50 px-3 py-1.5 rounded-full">
            <Wifi className="h-3 w-3" />
            <span>Подключено</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 px-3 py-1.5 rounded-full">
            <WifiOff className="h-3 w-3" />
            <span>Нет связи</span>
          </div>
        );
      case 'checking':
        return (
          <div className="flex items-center gap-2 text-blue-600 text-xs bg-blue-50 px-3 py-1.5 rounded-full">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Проверка...</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-yellow-600 text-xs bg-yellow-50 px-3 py-1.5 rounded-full">
            <AlertCircle className="h-3 w-3" />
            <span>Не проверено</span>
          </div>
        );
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="card p-8 shadow-xl border-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500" />
          
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className={`p-4 rounded-2xl transition-all duration-500 ${
                showSuccess 
                  ? 'bg-green-100 scale-110' 
                  : 'bg-gradient-to-br from-primary-100 to-primary-50'
              }`}>
                <BookOpen className={`h-10 w-10 transition-colors duration-500 ${
                  showSuccess ? 'text-green-600' : 'text-primary-600'
                }`} />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Вход в систему</h1>
            <p className="mt-2 text-gray-500">Войдите в свой аккаунт библиотекаря</p>
          </div>

          <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-xl">
            <div className="text-xs text-gray-500 truncate flex-1 mr-2">
              {activeEndpoint?.name || 'Не выбран'}
            </div>
            {getConnectionStatusBadge()}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
              <Mail className="absolute left-4 top-[38px] h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <Input
                label="Email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                className="pl-12"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-[38px] h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <Input
                label="Пароль"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                className="pl-12"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              loading={loading}
              success={showSuccess}
              disabled={connectionStatus === 'error'}
            >
              {showSuccess ? 'Добро пожаловать!' : 'Войти'}
            </Button>

            {connectionStatus === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  Нет связи с сервером. <Link to="/settings" className="underline font-medium">Проверьте настройки</Link>
                </span>
              </div>
            )}
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500">
              Нет аккаунта?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          <Link to="/settings" className="hover:text-gray-600">
            Настройки подключения
          </Link>
        </p>
      </div>
    </div>
  );
}
