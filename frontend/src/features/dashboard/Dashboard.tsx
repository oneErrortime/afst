import EndpointExplorer from '../explorer/EndpointExplorer';
import { useApiConfigStore } from '../../store/apiConfigStore';
import { useSpecStore } from '../../store/specStore';
import { useSessionStore } from '../../store/sessionStore';
import { formatDateTime } from '../../utils/format';
import AppShell from '../../components/layout/AppShell';
import ConnectorManager from '../connectors/ConnectorManager';

function Dashboard() {
  const activeConnector = useApiConfigStore((state) => state.activeConnector);
  const loadSpec = useSpecStore((state) => state.loadSpec);
  const meta = useSpecStore((state) => state.meta);
  const endpoints = useSpecStore((state) => state.endpoints);
  const tags = useSpecStore((state) => state.tags);
  const logout = useSessionStore((state) => state.logout);

  if (!activeConnector || !meta) return null;

  const handleRefresh = () => loadSpec(activeConnector);

  const stats = [
    { label: 'Версия', value: meta.version },
    { label: 'Эндпоинтов', value: endpoints.length },
    { label: 'Тегов', value: tags.length },
    { label: 'Синхронизация', value: activeConnector.lastSyncedAt ? formatDateTime(activeConnector.lastSyncedAt) : '—' }
  ];

  return (
    <main className="page">
      <AppShell
        title={meta.title}
        subtitle={activeConnector.baseUrl}
        actions={
          <>
            <button className="secondary" onClick={handleRefresh}>
              Обновить спецификацию
            </button>
            <button className="secondary" onClick={logout}>
              Выйти
            </button>
          </>
        }
      >
        <section className="panel">
          <div className="card-grid">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <p>{stat.label}</p>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <ConnectorManager />

        <EndpointExplorer endpoints={endpoints} baseUrl={activeConnector.baseUrl} schemas={meta.schemas || {}} tags={tags} />
      </AppShell>
    </main>
  );
}

export default Dashboard;
