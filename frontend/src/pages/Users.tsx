import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsApi, subscriptionsApi } from '@/api';
import type { User, UserGroup } from '@/types';
import { Button, Input, Modal, Loading, toast } from '@/components/ui';

import { useAuthStore } from '@/store/authStore';
import { Search, Edit, UserPlus, Shield, BookOpen, Users as UsersIcon } from 'lucide-react';
import apiClient from '@/api/client';

const ROLES = [
  { value: 'reader', label: 'Читатель', color: 'bg-gray-100 text-gray-700' },
  { value: 'librarian', label: 'Библиотекарь', color: 'bg-blue-100 text-blue-700' },
  { value: 'admin', label: 'Администратор', color: 'bg-red-100 text-red-700' },
];

export default function Users() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [saving, setSaving] = useState(false);

  const [adminForm, setAdminForm] = useState({
    email: '',
    password: '',
    name: '',
  });

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, groupsData] = await Promise.all([
        apiClient.get('/users'),
        groupsApi.getAll(),
      ]);
      setUsers(usersRes.data.data || []);
      setGroups(groupsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setSaving(true);
      await apiClient.put(`/users/${editingUser.id}`, {
        name: editingUser.name,
        role: editingUser.role,
        group_id: editingUser.group_id,
        is_active: editingUser.is_active,
      });
      await loadData();
      setEditingUser(null);
      toast.success('Пользователь обновлён');
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Не удалось обновить пользователя');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!adminForm.email || !adminForm.password || !adminForm.name) {
      toast.error('Заполните все поля');
      return;
    }

    try {
      setSaving(true);
      await apiClient.post('/users/admin', adminForm);
      await loadData();
      setShowCreateAdmin(false);
      setAdminForm({ email: '', password: '', name: '' });
      toast.success('Администратор создан');
    } catch (error) {
      console.error('Failed to create admin:', error);
      toast.error('Не удалось создать администратора');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(search.toLowerCase()) ||
                         (user.name && user.name.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    librarians: users.filter(u => u.role === 'librarian').length,
    readers: users.filter(u => u.role === 'reader').length,
  };

  if (loading) return <Loading;

  return (
    
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Управление пользователями</h1>
            <p className="text-gray-500">Администрирование аккаунтов и ролей</p>
          </div>
          <Button onClick={() => setShowCreateAdmin(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Создать администратора
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                <UsersIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Всего</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
                <p className="text-sm text-gray-500">Админы</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.librarians}</p>
                <p className="text-sm text-gray-500">Библиотекари</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <UsersIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.readers}</p>
                <p className="text-sm text-gray-500">Читатели</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по email или имени..."
              className="pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">Все роли</option>
            {ROLES.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Пользователь</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Роль</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Группа</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Статус</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const roleInfo = ROLES.find(r => r.value === user.role);
                const userGroup = groups.find(g => g.id === user.group_id);
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-lg font-medium text-gray-600">
                            {user.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name || 'Без имени'}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleInfo?.color}`}>
                        {roleInfo?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {userGroup ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full text-white"
                          style={{ backgroundColor: userGroup.color || '#6B7280' }}
                        >
                          {userGroup.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Нет группы</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Пользователи не найдены
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Редактировать пользователя"
      >
        {editingUser && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{editingUser.email}</p>
            </div>

            <Input
              label="Имя"
              value={editingUser.name || ''}
              onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
              placeholder="Введите имя"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as User['role'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {ROLES.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Группа</label>
              <select
                value={editingUser.group_id || ''}
                onChange={(e) => setEditingUser({ ...editingUser, group_id: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Без группы</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={editingUser.is_active}
                onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                Аккаунт активен
              </label>
            </div>

          <div className="space-y-4">
            <div className="pt-4 border-t border-gray-200">
               <h4 className="font-medium text-gray-900 mb-2">Подписка</h4>
               <div className="flex gap-2">
                 <select
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    onChange={() => {
                       // We'll handle this with a specific state or just separate button
                       // Let's use a local state for the plan selection
                    }}
                    id="subscription-plan-select"
                 >
                   <option value="free">Free</option>
                   <option value="basic">Basic</option>
                   <option value="premium">Premium</option>
                   <option value="student">Student</option>
                 </select>
                 <Button 
                    type="button" 
                    variant="secondary"
                    onClick={async () => {
                        const select = document.getElementById('subscription-plan-select') as HTMLSelectElement;
                        const plan = select.value;
                        try {
                            setSaving(true);
                            await subscriptionsApi.createAdmin(editingUser.id, plan);
                            toast.success('Подписка обновлена');
                        } catch (e) {
                            console.error(e);
                            toast.error('Ошибка обновления подписки');
                        } finally {
                            setSaving(false);
                        }
                    }}
                 >
                    Назначить план
                 </Button>
               </div>
               <p className="text-xs text-gray-500 mt-1">Осторожно: это действие немедленно изменит текущий план пользователя.</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={() => setEditingUser(null)} className="flex-1">
                Отмена
              </Button>
              <Button onClick={handleUpdateUser} loading={saving} className="flex-1">
                Сохранить
              </Button>
            </div>
          </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showCreateAdmin}
        onClose={() => setShowCreateAdmin(false)}
        title="Создать администратора"
      >
        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={adminForm.email}
            onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
            placeholder="admin@gmail.com"
            required
          />
          <Input
            label="Имя"
            value={adminForm.name}
            onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
            placeholder="Имя администратора"
            required
          />
          <Input
            label="Пароль"
            type="password"
            value={adminForm.password}
            onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
            placeholder="Минимум 6 символов"
            required
          />
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateAdmin(false)} className="flex-1">
              Отмена
            </Button>
            <Button onClick={handleCreateAdmin} loading={saving} className="flex-1">
              Создать
            </Button>
          </div>
        </div>
      </Modal>
    
  );
}
