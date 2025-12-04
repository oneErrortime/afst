import { useState, useEffect } from 'react';
import { groupsApi } from '@/api';
import type { UserGroup, CreateUserGroupRequest, UserGroupType } from '@/types';
import { Button, Input, Modal, Loading } from '@/components/ui';
import { Layout } from '@/components/layout';

const GROUP_TYPES: { value: UserGroupType; label: string }[] = [
  { value: 'free', label: 'Свободные читатели' },
  { value: 'student', label: 'Студенты' },
  { value: 'subscriber', label: 'Подписчики' },
];

const GROUP_COLORS = [
  '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B', '#EC4899', '#06B6D4',
];

export default function Groups() {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [formData, setFormData] = useState<CreateUserGroupRequest>({
    name: '',
    type: 'free',
    description: '',
    color: '#3B82F6',
    max_books: 3,
    loan_days: 14,
    can_download: false,
  });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await groupsApi.getAll();
      setGroups(data);
    } catch (error) {
      console.error('Failed to load groups:', error);
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
    });
    setIsModalOpen(true);
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
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await groupsApi.update(editingGroup.id, formData);
      } else {
        await groupsApi.create(formData);
      }
      setIsModalOpen(false);
      loadGroups();
    } catch (error) {
      console.error('Failed to save group:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить группу?')) return;
    try {
      await groupsApi.delete(id);
      loadGroups();
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Группы пользователей</h1>
          <Button onClick={openCreateModal}>Создать группу</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: group.color || '#3B82F6' }}
                  >
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{group.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {GROUP_TYPES.find(t => t.value === group.type)?.label || group.type}
                    </span>
                  </div>
                </div>
              </div>

              {group.description && (
                <p className="text-sm text-gray-600 mb-4">{group.description}</p>
              )}

              <div className="grid grid-cols-3 gap-2 text-center text-sm mb-4">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="font-semibold text-gray-900">{group.max_books}</div>
                  <div className="text-xs text-gray-500">Макс. книг</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="font-semibold text-gray-900">{group.loan_days}</div>
                  <div className="text-xs text-gray-500">Дней</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="font-semibold text-gray-900">{group.can_download ? '✓' : '✗'}</div>
                  <div className="text-xs text-gray-500">Скачивание</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEditModal(group)} className="flex-1">
                  Редактировать
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(group.id)}>
                  Удалить
                </Button>
              </div>
            </div>
          ))}
        </div>

        {groups.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Группы не найдены. Создайте первую группу.
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingGroup ? 'Редактировать группу' : 'Создать группу'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Название"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип группы</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as UserGroupType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {GROUP_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <Input
              label="Описание"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Цвет</label>
              <div className="flex gap-2">
                {GROUP_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${formData.color === color ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Макс. книг"
                type="number"
                value={formData.max_books}
                onChange={(e) => setFormData({ ...formData, max_books: parseInt(e.target.value) || 0 })}
                min={1}
              />
              <Input
                label="Дней на книгу"
                type="number"
                value={formData.loan_days}
                onChange={(e) => setFormData({ ...formData, loan_days: parseInt(e.target.value) || 0 })}
                min={1}
              />
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.can_download}
                onChange={(e) => setFormData({ ...formData, can_download: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Разрешить скачивание</span>
            </label>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
                Отмена
              </Button>
              <Button type="submit" className="flex-1">
                {editingGroup ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
