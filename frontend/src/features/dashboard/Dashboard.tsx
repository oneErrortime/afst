import EndpointExplorer from '../explorer/EndpointExplorer';
import { useApiConfigStore } from '../../store/apiConfigStore';
import { useSpecStore } from '../../store/specStore';
import { useSessionStore } from '../../store/sessionStore';
import { formatDateTime } from '../../utils/format';

function Dashboard() {
  const connectors = useApiConfigStore((state) => state.connectors);
  const activeConnector = useApiConfigStore((state) => state.activeConnector);
  const setActiveConnector = useApiConfigStore((state) => state.setActiveConnector);
  const loadSpec = useSpecStore((state) => state.loadSpec);
  const meta = useSpecStore((state) => state.meta);
  const endpoints = useSpecStore((state) => state.endpoints);
  const tags = useSpecStore((state) => state.tags);
  const logout = useSessionStore((state) => state.logout);
  const user = useSessionStore((state) => state.user);

  if (!activeConnector || !meta) return null;

  const handleRefresh = () => loadSpec(activeConnector);

  return (
    <main className="page">
      <section className="panel highlight" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <p style={{ opacity: 0.7 }}>Подключение</p>
            <h1>{meta.title}</h1>
            <p>{activeConnector.baseUrl}</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="secondary" onClick={handleRefresh}>
              Обновить спецификацию
            </button>
            <button className="secondary" onClick={logout}>
              Выйти
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <p style={{ opacity: 0.6, fontSize: '0.8rem' }}>Версия</p>
            <strong>{meta.version}</strong>
          </div>
          <div>
            <p style={{ opacity: 0.6, fontSize: '0.8rem' }}>Эндпоинтов</p>
            <strong>{endpoints.length}</strong>
          </div>
          <div>
            <p style={{ opacity: 0.6, fontSize: '0.8rem' }}>Тегов</p>
            <strong>{tags.length}</strong>
          </div>
          <div>
            <p style={{ opacity: 0.6, fontSize: '0.8rem' }}>Последняя синхронизация</p>
            <strong>{activeConnector.lastSyncedAt ? formatDateTime(activeConnector.lastSyncedAt) : '—'}</strong>
          </div>
          <div>
            <p style={{ opacity: 0.6, fontSize: '0.8rem' }}>Пользователь</p>
            <strong>{user?.name || '—'}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Коннекторы</h2>
        <div className="endpoint-list">
          {connectors.map((connector) => (
            <div
              key={connector.id}
              className={`endpoint-item ${connector.id === activeConnector.id ? 'active' : ''}`}
              onClick={() => setActiveConnector(connector.id)}
            >
              <div>
                <strong>{connector.name}</strong>
                <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>{connector.baseUrl}</p>
              </div>
              <span className="badge">{connector.mode}</span>
            </div>
          ))}
        </div>
      </section>

      <EndpointExplorer endpoints={endpoints} baseUrl={activeConnector.baseUrl} schemas={meta.schemas || {}} tags={tags} />
    </main>
  );
}

export default Dashboard;
