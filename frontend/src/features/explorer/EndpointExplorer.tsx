import { useEffect, useMemo, useState } from 'react';
import { ParsedEndpoint } from '../../store/types';
import EndpointRunner from './EndpointRunner';

interface EndpointExplorerProps {
  endpoints: ParsedEndpoint[];
  baseUrl: string;
  schemas: Record<string, any>;
  tags: { name: string; description?: string }[];
}

function EndpointExplorer({ endpoints, baseUrl, schemas, tags }: EndpointExplorerProps) {
  const [activeTag, setActiveTag] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>();

  const filtered = useMemo(() => {
    return endpoints.filter((endpoint) => {
      const matchTag = activeTag === 'all' || endpoint.tag === activeTag;
      const term = search.toLowerCase();
      const matchSearch = !term || endpoint.summary.toLowerCase().includes(term) || endpoint.path.toLowerCase().includes(term);
      return matchTag && matchSearch;
    });
  }, [endpoints, activeTag, search]);

  useEffect(() => {
    if (!filtered.find((endpoint) => endpoint.id === selectedId)) {
      setSelectedId(filtered[0]?.id);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((endpoint) => endpoint.id === selectedId);

  return (
    <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'minmax(280px, 360px) 1fr' }}>
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Поиск по summary или path" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="tabs" style={{ flexWrap: 'wrap' }}>
          <button className={activeTag === 'all' ? 'active' : ''} onClick={() => setActiveTag('all')}>
            Все
          </button>
          {tags.map((tag) => (
            <button key={tag.name} className={activeTag === tag.name ? 'active' : ''} onClick={() => setActiveTag(tag.name)}>
              {tag.name}
            </button>
          ))}
        </div>
        <div className="endpoint-list" style={{ maxHeight: '70vh', overflow: 'auto' }}>
          {filtered.map((endpoint) => (
            <div
              key={endpoint.id}
              className={`endpoint-item ${endpoint.id === selectedId ? 'active' : ''}`}
              onClick={() => setSelectedId(endpoint.id)}
            >
              <div>
                <strong>{endpoint.summary}</strong>
                <p style={{ opacity: 0.7, fontSize: '0.8rem' }}>{endpoint.path}</p>
              </div>
              <span className="badge">{endpoint.method}</span>
            </div>
          ))}
          {filtered.length === 0 && <p style={{ opacity: 0.7 }}>Эндпоинты не найдены</p>}
        </div>
      </div>
      {selected ? (
        <EndpointRunner endpoint={selected} baseUrl={baseUrl} schemas={schemas} />
      ) : (
        <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Выберите endpoint</p>
        </div>
      )}
    </div>
  );
}

export default EndpointExplorer;
