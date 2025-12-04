import { useState, useEffect } from 'react';
import { groupsApi, categoriesApi, authApi } from '@/api';
import type { UserGroup, Category, User } from '@/types';
import { Button, Input, Modal, Loading, toast } from '@/components/ui';
import { Layout } from '@/components/layout';
import { Plus, Edit, Trash2, Users, BookOpen, Calendar, Download, ChevronRight, Search, X } from 'lucide-react';

const GROUP_TYPES = [
  { value: 'free', label: 'Свободные читатели', color: 'bg-blue-500' },
  { value: 'student', label: 'Студенты', color: 'bg-green-500' },
  { value: 'subscriber', label: 'Подписчики', color: 'bg-purple-500' },
];

const COLORS = [
  { value: '#3B82F6', name: 'Синий' },
  { value: '#10B981', name: 'Зелёный' },
  { value: '#8B5CF6', name: 'Фиолетовый' },
  { value: '#F59E0B', name: 'Жёлтый' },
  { value: '#EF4444', name: 'Красный' },
  { value: '#EC4899', name: 'Розовый' },
  { value: '#6366F1', name: 'Индиго' },
  { value: '#14B8A6', name: 'Бирюзовый' },
];

interface GroupUsersModalProps {
  group: UserGroup;
  onClose: () => void;
}

function GroupUsersModal({ group, onClose }: GroupUsersModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, [group.id]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await groupsApi.getUsers(group.id);
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{group.name}</h3>
            <p className="text-sm text-gray-500">Пользователи группы</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-auto max-h-96">
          {loading ? (
            <Loading />
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>В группе нет пользователей</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-600">
                      {user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{user.name || user.email}</p>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === 'admin' ? 'bg-red-100 text-red-700' :
                    user.role === 'librarian' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role === 'admin' ? 'Админ' : user.role === 'librarian' ? 'Библиотекарь' : 'Читатель'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Groups() {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'free' as 'free' | 'student' | 'subscriber',
    description: '',
    color: '#3B82F6',
    max_books: 3,
    loan_days: 14,
    can_download: false,
    category_ids: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupsData, categoriesData] = await Promise.all([
        groupsApi.getAll(),
        categoriesApi.getAll(),
      ]);
      setGroups(groupsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingGroup(null);
    setFormData({
      name: '',
      type: 'free',
      description: '',
      color: '#3B82F6',
      max_books: 3,
      loan_days: 14,
      can_download: false,
      category_ids: [],
    });
    setShowModal(true);
  };

  const openEditModal = (group: UserGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      type: group.type,
      description: group.description || '',
      color: group.color || '#3B82F6',
      max_books: group.max_books,
      loan_days: group.loan_days,
      can_download: group.can_download,
      category_ids: group.allowed_categories?.map(c => c.id) || [],
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Введите название группы');
      return;
    }

    try {
      setSaving(true);
      const data = {
        name: formData.name,
        type: formData.type,
        description: formData.description || undefined,
        color: formData.color,
        max_books: formData.max_books,
        loan_days: formData.loan_days,
        can_download: formData.can_download,
        category_ids: formData.category_ids.length > 0 ? formData.category_ids : undefined,
      };

      if (editingGroup) {
        await groupsApi.update(editingGroup.id, data);
        toast.success('Группа обновлена');
      } else {
        await groupsApi.create(data);
        toast.success('Группа создана');
      }

      await loadData();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save group:', error);
      toast.error('Не удалось сохранить группу');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (group: UserGroup) => {
    if (!confirm(`Удалить группу "${group.name}"?`)) return;

    try {
      await groupsApi.delete(group.id);
      await loadData();
      toast.success('Группа удалена');
    } catch (error) {
      console.error('Failed to delete group:', error);
      toast.error('Не удалось удалить группу. Возможно, в группе есть пользователи.');
    }
  };

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId],
    }));
  };

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Группы пользователей</h1>
            <p className="text-gray-500">Управление группами и их правами доступа</p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Создать группу
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => {
            const typeInfo = GROUP_TYPES.find(t => t.value === group.type);
            return (
              <div
                key={group.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div
                  className="h-2"
                  style={{ backgroundColor: group.color || '#3B82F6' }}
                />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                        group.type === 'student' ? 'bg-green-100 text-green-700' :
                        group.type === 'subscriber' ? 'bg-purple-100 text-purple-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {typeInfo?.label || group.type}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(group)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(group)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {group.description && (
                    <p className="text-sm text-gray-600 mb-4">{group.description}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500">
                        <BookOpen className="h-4 w-4" />
                        Макс. книг
                      </span>
                      <span className="font-medium text-gray-900">{group.max_books}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500">
                        <Calendar className="h-4 w-4" />
                        Срок аренды
                      </span>
                      <span className="font-medium text-gray-900">{group.loan_days} дней</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500">
                        <Download className="h-4 w-4" />
                        Скачивание
                      </span>
                      <span className={`font-medium ${group.can_download ? 'text-green-600' : 'text-gray-400'}`}>
                        {group.can_download ? 'Разрешено' : 'Запрещено'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedGroup(group)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Users className="h-4 w-4" />
                      Пользователи
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {groups.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Нет групп пользователей</p>
            <Button className="mt-4" onClick={openCreateModal}>
              Создать первую группу
            </Button>
          </div>
        )}
      </div>

      {selectedGroup && (
        <GroupUsersModal group={selectedGroup} onClose={() => setSelectedGroup(null)} />
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingGroup ? 'Редактировать группу' : 'Создать группу'}
      >
        <div className="space-y-4">
          <Input
            label="Название"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Название группы"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип группы</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as typeof formData.type })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {GROUP_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Цвет</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color.value ? 'border-gray-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Макс. книг"
              type="number"
              value={formData.max_books}
              onChange={(e) => setFormData({ ...formData, max_books: parseInt(e.target.value) || 1 })}
              min={1}
              max={100}
            />
            <Input
              label="Срок аренды (дней)"
              type="number"
              value={formData.loan_days}
              onChange={(e) => setFormData({ ...formData, loan_days: parseInt(e.target.value) || 7 })}
              min={1}
              max={365}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="can_download"
              checked={formData.can_download}
              onChange={(e) => setFormData({ ...formData, can_download: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="can_download" className="text-sm text-gray-700">
              Разрешить скачивание файлов
            </label>
          </div>

          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Описание группы..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />

          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Разрешённые категории (пусто = все)
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-auto p-2 bg-gray-50 rounded-lg">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      formData.category_ids.includes(cat.id)
                        ? 'bg-primary-100 text-primary-700 border-primary-300'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    } border`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
              Отмена
            </Button>
            <Button onClick={handleSave} loading={saving} className="flex-1">
              {editingGroup ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
