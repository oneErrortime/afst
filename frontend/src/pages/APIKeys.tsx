import { useState, useEffect, useCallback } from 'react';
import { Button, Input, Modal, toast } from '@/components/ui';
import { Key, Plus, Trash2, Copy, BarChart2, RefreshCw, AlertTriangle, Clock, Zap, CheckCircle } from 'lucide-react';
import api from '@/api/client';
import type { AxiosError } from 'axios';

interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  token_balance: number;
  tokens_used: number;
  is_active: boolean;
  expires_at?: string;
  last_used_at?: string;
  created_at: string;
}

interface APIKeyCreated extends APIKey {
  key: string; // сырой ключ — показывается один раз
}

interface UsageStat {
  endpoint: string;
  method: string;
  calls: number;
  tokens: number;
}

interface Stats {
  api_key_id: string;
  total_calls: number;
  total_tokens_spent: number;
  token_balance: number;
  top_endpoints: UsageStat[];
  recent_logs: {
    id: number;
    endpoint: string;
    method: string;
    status_code: number;
    tokens_cost: number;
    ip_address: string;
    created_at: string;
  }[];
}

const TOKEN_COSTS: Record<string, number> = {
  'GET': 1,
  'POST': 2,
  'PUT': 2,
  'DELETE': 1,
};

export function APIKeys() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<APIKeyCreated | null>(null);
  const [statsKey, setStatsKey] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await api.get('/api-keys');
      setKeys(res.data || []);
    } catch {
      toast.error('Ошибка загрузки ключей');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) { toast.error('Введите имя ключа'); return; }
    setCreating(true);
    try {
      const res = await api.post('/api-keys', { name: newKeyName.trim() });
      setCreatedKey(res.data);
      setCreateModalOpen(false);
      setNewKeyName('');
      fetchKeys();
    } catch (err) {
      const e = err as AxiosError<{ message?: string }>;
      toast.error(e.response?.data?.message || 'Ошибка создания ключа');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string, name: string) => {
    if (!confirm(`Отозвать ключ "${name}"? Все приложения, использующие его, перестанут работать.`)) return;
    try {
      await api.delete(`/api-keys/${id}`);
      toast.success('Ключ отозван');
      fetchKeys();
    } catch {
      toast.error('Ошибка отзыва ключа');
    }
  };

  const loadStats = async (id: string) => {
    setStatsKey(id);
    setStatsLoading(true);
    setStats(null);
    try {
      const res = await api.get(`/api-keys/${id}/stats`);
      setStats(res.data);
    } catch {
      toast.error('Ошибка загрузки статистики');
    } finally {
      setStatsLoading(false);
    }
  };

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (d?: string) => d ? new Date(d).toLocaleString('ru-RU') : '—';
  const balanceColor = (b: number) => b > 500 ? 'text-green-600' : b > 100 ? 'text-yellow-600' : 'text-red-600';

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1,2].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl"/>)}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Key className="h-6 w-6 text-primary-600"/> API-ключи
          </h1>
          <p className="text-gray-500 mt-1">
            Управляйте ключами для внешнего API. Каждый запрос списывает токены с баланса.
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2"/> Создать ключ
        </Button>
      </div>

      {/* Pricing card */}
      <div className="bg-gradient-to-br from-primary-50 to-indigo-50 rounded-2xl border border-primary-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary-600"/> Стоимость операций
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Чтение данных', method: 'GET', cost: 1, example: 'GET /books, /library' },
            { label: 'Создание', method: 'POST', cost: 2, example: 'POST /reviews, /bookmarks' },
            { label: 'Обновление', method: 'PUT', cost: 2, example: 'PUT /collections/:id' },
            { label: 'Файлы', method: 'FILE', cost: 10, example: 'GET /files/:id' },
          ].map(item => (
            <div key={item.method} className="bg-white rounded-xl p-3 border border-white shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                  item.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                  item.method === 'FILE' ? 'bg-orange-100 text-orange-700' :
                  'bg-green-100 text-green-700'
                }`}>{item.method}</span>
                <span className="text-lg font-bold text-gray-900">{item.cost} <span className="text-xs font-normal text-gray-400">ток.</span></span>
              </div>
              <p className="text-xs font-medium text-gray-700">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.example}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Новый ключ получает <strong>1000 токенов</strong> бесплатно. Администратор может пополнить баланс.
        </p>
      </div>

      {/* Keys list */}
      {keys.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <Key className="h-12 w-12 mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-500 mb-4">У вас пока нет API-ключей</p>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2"/> Создать первый ключ
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map(key => (
            <div key={key.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{key.name}</span>
                    {key.is_active
                      ? <span className="badge badge-success text-xs">активен</span>
                      : <span className="badge badge-danger text-xs">отозван</span>
                    }
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-mono">
                    <Key className="h-3 w-3 shrink-0"/>
                    <span>{key.key_prefix}••••••••••••••••••••••••••••••••••••••••••••••••••••••••</span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-primary-500"/>
                      Баланс: <strong className={balanceColor(key.token_balance)}>{key.token_balance.toLocaleString()} ток.</strong>
                    </span>
                    <span className="flex items-center gap-1 text-gray-400">
                      Потрачено: {key.tokens_used.toLocaleString()}
                    </span>
                    {key.last_used_at && (
                      <span className="flex items-center gap-1 text-gray-400">
                        <Clock className="h-3 w-3"/> {formatDate(key.last_used_at)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 ml-4 shrink-0">
                  <button
                    onClick={() => loadStats(key.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                    title="Статистика"
                  >
                    <BarChart2 className="h-4 w-4"/>
                  </button>
                  <button
                    onClick={() => handleRevoke(key.id, key.name)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Отозвать"
                  >
                    <Trash2 className="h-4 w-4"/>
                  </button>
                </div>
              </div>

              {/* Inline stats */}
              {statsKey === key.id && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  {statsLoading ? (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <RefreshCw className="h-4 w-4 animate-spin"/> Загрузка статистики…
                    </div>
                  ) : stats ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-gray-900">{stats.total_calls.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Всего вызовов</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-gray-900">{stats.total_tokens_spent.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Токенов потрачено</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className={`text-2xl font-bold ${balanceColor(stats.token_balance)}`}>{stats.token_balance.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Остаток</p>
                        </div>
                      </div>
                      {stats.top_endpoints?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">ТОП ЭНДПОИНТОВ</p>
                          <div className="space-y-1">
                            {stats.top_endpoints.slice(0, 5).map((ep, i) => (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <span className="font-mono text-gray-600">
                                  <span className={`font-bold mr-1 ${TOKEN_COSTS[ep.method] === 1 ? 'text-blue-600' : 'text-green-600'}`}>{ep.method}</span>
                                  {ep.endpoint}
                                </span>
                                <span className="text-gray-400">{ep.calls} вызовов · {ep.tokens} ток.</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* External API docs hint */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-2">Как использовать</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>Передавайте ключ в заголовке запроса:</p>
          <pre className="bg-gray-900 text-green-400 rounded-lg p-3 text-xs overflow-x-auto">
{`# Заголовок X-API-Key
curl -H "X-API-Key: lk_ваш_ключ" \\
     https://afst-4.onrender.com/ext/v1/books

# Или через Authorization Bearer
curl -H "Authorization: Bearer lk_ваш_ключ" \\
     https://afst-4.onrender.com/ext/v1/access/library`}
          </pre>
          <p className="text-xs text-gray-400">
            Базовый URL внешнего API: <code className="bg-gray-100 px-1 rounded">https://afst-4.onrender.com/ext/v1</code>
          </p>
        </div>
      </div>

      {/* Create modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Создать API-ключ">
        <div className="space-y-4">
          <Input
            label="Название ключа"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            placeholder="Моё приложение"
          />
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex gap-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5"/>
            <span>Сырой ключ будет показан <strong>один раз</strong> — сохраните его сразу.</span>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)} className="flex-1">Отмена</Button>
            <Button onClick={handleCreate} loading={creating} className="flex-1">Создать</Button>
          </div>
        </div>
      </Modal>

      {/* Reveal created key modal */}
      <Modal
        isOpen={!!createdKey}
        onClose={() => setCreatedKey(null)}
        title="✅ Ключ создан — сохраните его сейчас"
      >
        {createdKey && (
          <div className="space-y-4">
            <div className="p-3 bg-red-50 rounded-lg border border-red-200 flex gap-2 text-sm text-red-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5"/>
              <span>Этот ключ больше <strong>не будет показан</strong>. Скопируйте и сохраните в безопасном месте.</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Ваш API-ключ</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-900 text-green-400 rounded-lg px-3 py-2 text-sm font-mono overflow-x-auto whitespace-nowrap">
                  {createdKey.key}
                </code>
                <button
                  onClick={() => copyKey(createdKey.key)}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shrink-0"
                  title="Скопировать"
                >
                  {copied ? <CheckCircle className="h-4 w-4 text-green-600"/> : <Copy className="h-4 w-4 text-gray-500"/>}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Стартовый баланс</p>
                <p className="font-bold text-gray-900">{createdKey.token_balance.toLocaleString()} токенов</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">ID ключа</p>
                <p className="font-mono text-xs text-gray-600 truncate">{createdKey.id}</p>
              </div>
            </div>
            <Button onClick={() => setCreatedKey(null)} className="w-full">
              Я сохранил ключ
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
