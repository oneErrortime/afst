import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui';
import { BookOpen, Users, ArrowRight, Shield, Zap, Database } from 'lucide-react';

export function Home() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="space-y-16">
      <section className="text-center py-12">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-primary-100 rounded-2xl">
            <BookOpen className="h-16 w-16 text-primary-600" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Library<span className="text-primary-600">API</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Современная система управления библиотекой с REST API, JWT аутентификацией и полным CRUD функционалом.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/books">
            <Button size="lg">
              Каталог книг
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          {!isAuthenticated && (
            <Link to="/register">
              <Button variant="secondary" size="lg">
                Регистрация
              </Button>
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-8 md:grid-cols-3">
        <div className="card p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Database className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">REST API</h3>
          <p className="text-gray-600">
            Полноценный RESTful API для управления книгами, читателями и выдачей.
          </p>
        </div>

        <div className="card p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">JWT Аутентификация</h3>
          <p className="text-gray-600">
            Безопасная аутентификация с использованием JSON Web Tokens.
          </p>
        </div>

        <div className="card p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Бизнес-логика</h3>
          <p className="text-gray-600">
            Лимит книг на читателя, контроль наличия и учёт выдачи.
          </p>
        </div>
      </section>

      <section className="card p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Возможности системы</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <BookOpen className="h-5 w-5 text-primary-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Управление книгами</h4>
              <p className="text-sm text-gray-600">Добавление, редактирование, удаление книг</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <Users className="h-5 w-5 text-primary-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Управление читателями</h4>
              <p className="text-sm text-gray-600">Регистрация и учёт читателей библиотеки</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <ArrowRight className="h-5 w-5 text-primary-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Выдача книг</h4>
              <p className="text-sm text-gray-600">Выдача и возврат с контролем лимитов</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <Shield className="h-5 w-5 text-primary-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Защита данных</h4>
              <p className="text-sm text-gray-600">JWT токены и хеширование паролей</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
