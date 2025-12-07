import { ChangeEvent, useMemo, useState } from 'react';
import { useApiConfigStore } from '../../store/apiConfigStore';
import { ApiConnectorInput } from '../../store/types';
import { formatDateTime } from '../../utils/format';

const defaultBaseUrl = 'http://localhost:8080/api/v1';

const modes = [
  {
    id: 'local',
    title: 'Локальный Swagger',
    description: 'Загрузите swagger.json или вставьте текст. Работает офлайн и идеально подходит для dev-сборок.'
  },
  {
    id: 'remote',
    title: 'Удалённый Swagger',
    description: 'Укажите URL /swagger/doc.json запущенного сервиса. Клиент обновится сразу после изменения API.'
  },
  {
    id: 'direct',
    title: 'Прямой REST',
    description: 'Работа напрямую с API без явного Swagger. Приложение попробует подтянуть спецификацию автоматически.'
  }
] as const;

type Mode = typeof modes[number]['id'];

type ConnectorSelectorState = {
  name: string;
  baseUrl: string;
  specText: string;
  specUrl: string;
  swaggerPath: string;
};

const initialState: ConnectorSelectorState = {
  name: '',
  baseUrl: defaultBaseUrl,
  specText: '',
  specUrl: 'http://localhost:8080/swagger/doc.json',
  swaggerPath: '/swagger/doc.json'
};

function ConnectorSelector() {
  const connectors = useApiConfigStore((state) => state.connectors);
  const activeConnector = useApiConfigStore((state) => state.activeConnector);
  const setActive = useApiConfigStore((state) => state.setActiveConnector);
  const addConnector = useApiConfigStore((state) => state.addConnector);
  const [mode, setMode] = useState<Mode>('local');
  const [state, setState] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const canSubmit = useMemo(() => {
    if (mode === 'local') {
      return Boolean(state.specText.trim());
    }
    if (mode === 'remote') {
      return Boolean(state.specUrl.trim());
    }
    return Boolean(state.baseUrl.trim());
  }, [mode, state.specText, state.specUrl, state.baseUrl]);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setState((prev) => ({ ...prev, specText: text, name: prev.name || file.name }));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(undefined);
    try {
      const payload: ApiConnectorInput = {
        mode,
        name: state.name || `Коннектор ${new Date().toLocaleTimeString()}`,
        baseUrl: state.baseUrl || defaultBaseUrl,
        specPayload: mode === 'local' ? state.specText : undefined,
        specUrl: mode === 'remote' ? state.specUrl : undefined,
        swaggerPath: mode === 'direct' ? state.swaggerPath : undefined
      };
      const id = addConnector(payload);
      setActive(id);
      setState(initialState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page">
      <section className="panel highlight">
        <h1>AFST Auto UI</h1>
        <p>
          Интерфейс автоматически подстраивается под актуальную Swagger-спецификацию. Выберите способ подключения, и платформа
          сама построит формы, таблицы и сценарии для всех эндпоинтов.
        </p>
        <div className="tabs">
          {modes.map((item) => (
            <button
              key={item.id}
              className={item.id === mode ? 'active' : ''}
              onClick={() => setMode(item.id)}
            >
              {item.title}
            </button>
          ))}
        </div>
        <p style={{ opacity: 0.8 }}>{modes.find((m) => m.id === mode)?.description}</p>
      </section>

      <section className="panel">
        <div className="form-grid">
          <label>
            Название
            <input
              placeholder="Например, Dev сервер"
              value={state.name}
              onChange={(e) => setState((prev) => ({ ...prev, name: e.target.value }))}
            />
          </label>
          <label>
            Базовый API URL
            <input
              placeholder={defaultBaseUrl}
              value={state.baseUrl}
              onChange={(e) => setState((prev) => ({ ...prev, baseUrl: e.target.value }))}
            />
          </label>

          {mode === 'local' && (
            <>
              <label>
                Swagger JSON или YAML
                <textarea
                  placeholder="Вставьте содержимое swagger.json"
                  value={state.specText}
                  onChange={(e) => setState((prev) => ({ ...prev, specText: e.target.value }))}
                />
              </label>
              <label>
                Загрузить файл
                <input type="file" accept=".json,.yaml,.yml" onChange={handleFile} />
              </label>
            </>
          )}

          {mode === 'remote' && (
            <label>
              URL swagger/doc.json
              <input
                placeholder="https://example.com/swagger/doc.json"
                value={state.specUrl}
                onChange={(e) => setState((prev) => ({ ...prev, specUrl: e.target.value }))}
              />
            </label>
          )}

          {mode === 'direct' && (
            <label>
              Swagger path (опционально)
              <input
                placeholder="/swagger/doc.json"
                value={state.swaggerPath}
                onChange={(e) => setState((prev) => ({ ...prev, swaggerPath: e.target.value }))}
              />
            </label>
          )}
        </div>
        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="primary" disabled={!canSubmit || submitting} onClick={handleSubmit}>
            {submitting ? 'Сохраняем...' : 'Подключить'}
          </button>
        </div>
      </section>

      {connectors.length > 0 && (
        <section className="panel">
          <h2>Сохранённые подключения</h2>
          <div className="endpoint-list">
            {connectors.map((connector) => (
              <div
                key={connector.id}
                className={`endpoint-item ${connector.id === activeConnector?.id ? 'active' : ''}`}
                onClick={() => setActive(connector.id)}
              >
                <div>
                  <strong>{connector.name}</strong>
                  <p style={{ opacity: 0.8, fontSize: '0.85rem' }}>{connector.baseUrl}</p>
                  <p style={{ opacity: 0.6, fontSize: '0.75rem' }}>
                    Последняя синхронизация: {connector.lastSyncedAt ? formatDateTime(connector.lastSyncedAt) : '—'}
                  </p>
                </div>
                <span className="badge">{connector.mode}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default ConnectorSelector;
