import { useState, useEffect } from 'react';
import { useApiConfigStore, ApiEndpoint } from '@/store/apiConfigStore';
import { checkApiConnection } from '@/api/client';
import { Button, Input, Modal, toast } from '@/components/ui';
import { 
  Settings as SettingsIcon, 
  Server, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  RefreshCw,
  Wifi,
  WifiOff,
  AlertCircle,
  Loader2,
  Globe,
  Zap
} from 'lucide-react';

export function Settings() {
  const {
    endpoints,
    activeEndpointId,
    connectionStatus,
    lastChecked,
    setActiveEndpoint,
    addEndpoint,
    updateEndpoint,
    removeEndpoint,
    resetToDefaults,
  } = useApiConfigStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<ApiEndpoint | null>(null);
  const [checking, setChecking] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', url: '', description: '' });

  useEffect(() => {
    handleCheckConnection();
  }, [activeEndpointId]);

  const handleCheckConnection = async () => {
    setChecking(true);
    const result = await checkApiConnection();
    setLatency(result.latency || null);
    setChecking(false);

    if (result.success) {
      toast.success(`Подключено! Задержка: ${result.latency}ms`);
    } else {
      toast.error(`Ошибка: ${result.error}`);
    }
  };

  const openCreateModal = () => {
    setEditingEndpoint(null);
    setForm({ name: '', url: '', description: '' });
    setModalOpen(true);
  };

  const openEditModal = (endpoint: ApiEndpoint) => {
    setEditingEndpoint(endpoint);
    setForm({
      name: endpoint.name,
      url: endpoint.url,
      description: endpoint.description || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.url) {
      toast.error('Заполните обязательные поля');
      return;
    }

    try {
      new URL(form.url);
    } catch {
      toast.error('Некорректный URL');
      return;
    }

    if (editingEndpoint) {
      updateEndpoint(editingEndpoint.id, form);
      toast.success('Эндпоинт обновлен');
    } else {
      addEndpoint(form);
      toast.success('Эндпоинт добавлен');
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    removeEndpoint(id);
    toast.success('Эндпоинт удален');
  };

  const handleSelectEndpoint = (id: string) => {
    setActiveEndpoint(id);
    toast.info('Эндпоинт изменен');
  };

  const getStatusIcon = () => {
    if (checking) return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-5 w-5 text-green-500" />;
      case 'error':
        return <WifiOff className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    if (checking) return 'Проверка подключения...';
    
    switch (connectionStatus) {
      case 'connected':
        return `Подключено${latency ? ` (${latency}ms)` : ''}`;
      case 'error':
        return 'Ошибка подключения';
      default:
        return 'Не проверено';
    }
  };

  const getStatusColor = () => {
    if (checking) return 'bg-blue-50 border-blue-200';
    
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  const activeEndpoint = endpoints.find((e) => e.id === activeEndpointId);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gray-100 rounded-xl">
          <SettingsIcon className="h-8 w-8 text-gray-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
          <p className="text-gray-600">Управление подключением к API</p>
        </div>
      </div>

      <div className={`card p-6 border-2 ${getStatusColor()} transition-colors duration-300`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getStatusIcon()}
            <div>
              <h3 className="font-semibold text-gray-900">Статус подключения</h3>
              <p className="text-sm text-gray-600">{getStatusText()}</p>
              {lastChecked && (
                <p className="text-xs text-gray-400 mt-1">
                  Последняя проверка: {new Date(lastChecked).toLocaleString('ru')}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={handleCheckConnection}
            loading={checking}
            className="shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
            Проверить
          </Button>
        </div>

        {activeEndpoint && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Активный эндпоинт:</span>
              <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                {activeEndpoint.url}
              </code>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Server className="h-5 w-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">API Эндпоинты</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={resetToDefaults}>
              Сбросить
            </Button>
            <Button size="sm" onClick={openCreateModal}>
              <Plus className="h-4 w-4" />
              Добавить
            </Button>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {endpoints.map((endpoint) => (
            <div
              key={endpoint.id}
              className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
                endpoint.id === activeEndpointId ? 'bg-primary-50' : ''
              }`}
              onClick={() => handleSelectEndpoint(endpoint.id)}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-3 h-3 rounded-full transition-colors ${
                    endpoint.id === activeEndpointId
                      ? 'bg-green-500 ring-4 ring-green-100'
                      : 'bg-gray-300'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{endpoint.name}</h3>
                    {endpoint.isDefault && (
                      <span className="badge badge-info text-xs">По умолчанию</span>
                    )}
                    {endpoint.id === activeEndpointId && (
                      <span className="badge badge-success text-xs flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Активный
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 font-mono">{endpoint.url}</p>
                  {endpoint.description && (
                    <p className="text-xs text-gray-400 mt-1">{endpoint.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => openEditModal(endpoint)}
                  className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                {!endpoint.isDefault && (
                  <button
                    onClick={() => handleDelete(endpoint.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Информация</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            <strong>API Коннектор</strong> позволяет переключаться между различными бэкенд-серверами.
          </p>
          <p>
            По умолчанию используется Production сервер на Render.com. 
            Для локальной разработки выберите Local Development или добавьте собственный эндпоинт.
          </p>
          <p className="text-gray-400 text-xs">
            Настройки сохраняются в localStorage браузера.
          </p>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEndpoint ? 'Редактировать эндпоинт' : 'Добавить эндпоинт'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Название *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="My Custom Server"
          />
          <Input
            label="URL *"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://api.example.com/api/v1"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Описание</label>
            <textarea
              className="input min-h-[60px] resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Опциональное описание..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Отмена
            </Button>
            <Button type="submit" className="flex-1">
              {editingEndpoint ? 'Сохранить' : 'Добавить'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
