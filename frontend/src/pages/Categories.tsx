import { useState, useEffect } from 'react';
import { categoriesApi } from '@/api';
import type { Category, CreateCategoryRequest } from '@/types';
import { Button, Input, Modal, Loading } from '@/components/ui';


const CATEGORY_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
];

const CATEGORY_ICONS = ['📚', '🔬', '📖', '💻', '💼', '🎨', '🎵', '🏋️', '🌍', '🎭'];

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
    slug: '',
    description: '',
    color: '#3B82F6',
    icon: '📚',
    sort_order: 0,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[а-яё]/g, (char) => {
        const map: Record<string, string> = {
          'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
          'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
          'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
          'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
          'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        };
        return map[char] || char;
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#3B82F6',
      icon: '📚',
      sort_order: categories.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      color: category.color || '#3B82F6',
      icon: category.icon || '📚',
      sort_order: category.sort_order,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, formData);
      } else {
        await categoriesApi.create(formData);
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить категорию?')) return;
    try {
      await categoriesApi.delete(id);
      loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  if (loading) return <Loading;

  return (
    
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Категории книг</h1>
          <Button onClick={openCreateModal}>Создать категорию</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  {category.icon || '📚'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{category.name}</h3>
                  <code className="text-xs text-gray-500">{category.slug}</code>
                </div>
              </div>

              {category.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{category.description}</p>
              )}

              <div className="flex items-center justify-between">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                  title={category.color}
                />
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(category)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Категории не найдены. Создайте первую категорию.
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? 'Редактировать категорию' : 'Создать категорию'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Название"
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                setFormData({
                  ...formData,
                  name,
                  slug: editingCategory ? formData.slug : generateSlug(name),
                });
              }}
              required
            />

            <Input
              label="Slug (URL)"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              pattern="[a-z0-9-]+"
              title="Только латинские буквы, цифры и дефис"
            />

            <Input
              label="Описание"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Иконка</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`w-10 h-10 rounded-lg border-2 text-xl flex items-center justify-center transition-all ${formData.icon === icon ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Цвет</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((color) => (
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

            <Input
              label="Порядок сортировки"
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
            />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
                Отмена
              </Button>
              <Button type="submit" className="flex-1">
                {editingCategory ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    
  );
}
