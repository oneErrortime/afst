import { useState } from 'react';
import { useApiConfigStore } from '../../store/apiConfigStore';
import { useSpecStore } from '../../store/specStore';

function ConnectorManager() {
  const connectors = useApiConfigStore((state) => state.connectors);
  const activeConnector = useApiConfigStore((state) => state.activeConnector);
  const setActive = useApiConfigStore((state) => state.setActiveConnector);
  const updateConnector = useApiConfigStore((state) => state.updateConnector);
  const removeConnector = useApiConfigStore((state) => state.removeConnector);
  const loadSpec = useSpecStore((state) => state.loadSpec);
  const [editingId, setEditingId] = useState<string>();
  const [nameDraft, setNameDraft] = useState('');
  const [busyId, setBusyId] = useState<string>();
  const [error, setError] = useState<string>();

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setNameDraft(name);
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateConnector(editingId, { name: nameDraft.trim() || 'Без названия' });
    setEditingId(undefined);
  };

  const refresh = async (id: string) => {
    const connector = connectors.find((item) => item.id === id);
    if (!connector) return;
    setBusyId(id);
    setError(undefined);
    try {
      await loadSpec(connector);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления');
    } finally {
      setBusyId(undefined);
    }
  };

  if (connectors.length === 0) {
    return null;
  }

  return (
    <section className="panel">
      <div className="section-header">
        <h2>Подключения</h2>
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>}
      </div>
      <div className="connector-grid">
        {connectors.map((connector) => (
          <div key={connector.id} className={`connector-card ${activeConnector?.id === connector.id ? 'active' : ''}`}>
            {editingId === connector.id ? (
              <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} onBlur={saveEdit} onKeyDown={(e) => e.key === 'Enter' && saveEdit()} />
            ) : (
              <div className="connector-card__title" onClick={() => setActive(connector.id)}>
                <h3>{connector.name}</h3>
                <span className="badge">{connector.mode}</span>
              </div>
            )}
            <p>{connector.baseUrl}</p>
            <div className="connector-card__actions">
              <button className="chip" onClick={() => startEdit(connector.id, connector.name)}>
                Переименовать
              </button>
              <button className="chip" onClick={() => refresh(connector.id)} disabled={busyId === connector.id}>
                {busyId === connector.id ? 'Обновляем...' : 'Обновить'}
              </button>
              <button className="chip danger" onClick={() => removeConnector(connector.id)}>
                Удалить
              </button>
            </div>
            <small>Последняя синхронизация: {connector.lastSyncedAt ? new Date(connector.lastSyncedAt).toLocaleString() : '—'}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ConnectorManager;
