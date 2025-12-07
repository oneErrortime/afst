import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAdmin } from '@/api/client';
import { Button, Input, toast } from '@/components/ui';
import { UserPlus, Mail, Lock, User } from 'lucide-react';
import { AxiosError } from 'axios';

export function Setup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast.error('Все поля обязательны для заполнения');
      return;
    }
    setLoading(true);
    try {
      await createAdmin({ email, password, name });
      toast.success('Аккаунт администратора успешно создан!');
      navigate('/login');
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message = axiosError.response?.data?.message || 'Ошибка создания администратора';
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="card p-8 shadow-xl border-0">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-2xl">
                <UserPlus className="h-10 w-10 text-blue-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Первоначальная настройка</h1>
            <p className="mt-2 text-gray-500">Создайте аккаунт первого администратора</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
              <User className="absolute left-4 top-[38px] h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                label="Имя"
                type="text"
                placeholder="Admin"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-12"
              />
            </div>
            <div className="relative group">
              <Mail className="absolute left-4 top-[38px] h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                label="Email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-[38px] h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                label="Пароль"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12"
              />
            </div>

            <Button
              type="submit"
              className="w-full !bg-gradient-to-r !from-blue-600 !to-indigo-500 hover:!from-blue-700 hover:!to-indigo-600"
              size="lg"
              loading={loading}
            >
              Создать администратора
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
