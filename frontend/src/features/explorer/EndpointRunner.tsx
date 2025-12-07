import { useEffect, useMemo, useState } from 'react';
import { ParsedEndpoint } from '../../store/types';
import { formatMethod } from '../../utils/format';
import { createSampleFromSchema, inferInputType } from '../../utils/schemaTools';
import { useSessionStore } from '../../store/sessionStore';
import AutoFormBuilder from './AutoFormBuilder';

interface EndpointRunnerProps {
  endpoint: ParsedEndpoint;
  baseUrl: string;
  schemas: Record<string, any>;
}

type ResponseState = {
  status?: number;
  time?: number;
  body?: unknown;
  error?: string;
};

function EndpointRunner({ endpoint, baseUrl, schemas }: EndpointRunnerProps) {
  const token = useSessionStore((state) => state.token);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [body, setBody] = useState('');
  const [bodyMode, setBodyMode] = useState<'json' | 'form'>('json');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ResponseState>();

  useEffect(() => {
    const defaults: Record<string, string> = {};
    endpoint.parameters.forEach((param) => {
      defaults[param.name] = '';
    });
    setParamValues(defaults);
    if (endpoint.requestBody?.schema) {
      const sample = createSampleFromSchema(endpoint.requestBody.schema, schemas);
      setBody(sample ? JSON.stringify(sample, null, 2) : '');
      setBodyMode('form');
    } else {
      setBody('');
      setBodyMode('json');
    }
    setResponse(undefined);
  }, [endpoint, schemas]);

  const methodMeta = useMemo(() => formatMethod(endpoint.method), [endpoint.method]);
  const supportsForm = Boolean(endpoint.requestBody?.schema);

  const handleChange = (name: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [name]: value }));
  };

  const execute = async () => {
    setLoading(true);
    setResponse(undefined);
    try {
      let url = `${baseUrl.replace(/\/$/, '')}${endpoint.path}`;
      endpoint.parameters
        .filter((param) => param.in === 'path')
        .forEach((param) => {
          url = url.replace(`{${param.name}}`, encodeURIComponent(paramValues[param.name] || ''));
        });
      const query = new URLSearchParams();
      endpoint.parameters
        .filter((param) => param.in === 'query')
        .forEach((param) => {
          const value = paramValues[param.name];
          if (value) query.append(param.name, value);
        });
      if (Array.from(query.entries()).length > 0) {
        url += `?${query.toString()}`;
      }
      const headers: Record<string, string> = { Accept: 'application/json' };
      endpoint.parameters
        .filter((param) => param.in === 'header')
        .forEach((param) => {
          const value = paramValues[param.name];
          if (value) headers[param.name] = value;
        });
      if (endpoint.requiresAuth && token) {
        headers.Authorization = `Bearer ${token}`;
      }
      let payload: string | undefined;
      if (endpoint.requestBody) {
        headers['Content-Type'] = endpoint.requestBody.contentType || 'application/json';
        if (body.trim()) {
          JSON.parse(body);
          payload = body;
        }
      }
      const started = performance.now();
      const res = await fetch(url, {
        method: endpoint.method,
        headers,
        body: payload
      });
      const elapsed = performance.now() - started;
      const text = await res.text();
      let parsed: unknown;
      try {
        parsed = text ? JSON.parse(text) : undefined;
      } catch (jsonError) {
        parsed = text;
      }
      setResponse({ status: res.status, time: Math.round(elapsed), body: parsed });
    } catch (error) {
      setResponse({ error: error instanceof Error ? error.message : 'Неизвестная ошибка' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span className="badge" style={{ background: methodMeta.color }}>{methodMeta.label}</span>
        <strong>{endpoint.summary}</strong>
      </div>
      <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>{endpoint.description || 'Без описания'}</p>
      <code style={{ padding: '6px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.3)' }}>{endpoint.path}</code>

      {endpoint.parameters.length > 0 && (
        <div className="form-grid">
          {endpoint.parameters.map((param) => (
            <label key={param.name}>
              {param.name} ({param.in})
              <input
                type={inferInputType(param.schema)}
                value={paramValues[param.name] || ''}
                onChange={(e) => handleChange(param.name, e.target.value)}
                placeholder={param.description}
              />
            </label>
          ))}
        </div>
      )}

      {endpoint.requestBody && (
        <div>
          <div className="tabs" style={{ marginBottom: 12 }}>
            {supportsForm && (
              <button className={bodyMode === 'form' ? 'active' : ''} onClick={() => setBodyMode('form')}>
                Форма
              </button>
            )}
            <button className={bodyMode === 'json' ? 'active' : ''} onClick={() => setBodyMode('json')}>
              JSON
            </button>
          </div>
          {bodyMode === 'form' && supportsForm ? (
            <AutoFormBuilder
              schema={endpoint.requestBody.schema}
              schemas={schemas}
              onChange={(value) => setBody(value)}
            />
          ) : (
            <label>
              Тело запроса ({endpoint.requestBody.contentType})
              <textarea value={body} onChange={(e) => setBody(e.target.value)} />
            </label>
          )}
        </div>
      )}

      <button className="primary" onClick={execute} disabled={loading}>
        {loading ? 'Отправляем...' : 'Выполнить запрос'}
      </button>

      {response && (
        <div>
          {response.error ? (
            <p style={{ color: 'var(--danger)' }}>{response.error}</p>
          ) : (
            <>
              <p>
                Статус {response.status} · {response.time} мс
              </p>
              <pre style={{ maxHeight: 240, overflow: 'auto', background: 'rgba(0,0,0,0.4)', padding: 12, borderRadius: 12 }}>
                {JSON.stringify(response.body, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default EndpointRunner;
