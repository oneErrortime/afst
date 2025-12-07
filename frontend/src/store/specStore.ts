import { create } from 'zustand';
import YAML from 'yaml';
import { ApiConnector, SpecStatus } from './types';
import { parseOpenAPIDocument } from '../utils/specParser';
import { useApiConfigStore } from './apiConfigStore';

interface SpecState {
  status: SpecStatus;
  document?: any;
  endpoints: ReturnType<typeof parseOpenAPIDocument>['endpoints'];
  tags: ReturnType<typeof parseOpenAPIDocument>['tags'];
  meta?: ReturnType<typeof parseOpenAPIDocument>['meta'];
  error?: string;
  loadSpec: (connector: ApiConnector) => Promise<void>;
}

const fetchSpecString = async (connector: ApiConnector) => {
  if (connector.mode === 'local' && connector.specPayload) {
    return connector.specPayload;
  }
  const url = (() => {
    if (connector.mode === 'remote' && connector.specUrl) return connector.specUrl;
    const base = connector.baseUrl.replace(/\/$/, '');
    const path = connector.swaggerPath || '/swagger/doc.json';
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  })();
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Не удалось загрузить спецификацию (${response.status})`);
  }
  return response.text();
};

export const useSpecStore = create<SpecState>((set) => ({
  status: 'idle',
  endpoints: [],
  tags: [],
  loadSpec: async (connector) => {
    set({ status: 'loading', error: undefined });
    try {
      const raw = await fetchSpecString(connector);
      let document: any;
      try {
        document = JSON.parse(raw);
      } catch (jsonError) {
        document = YAML.parse(raw);
      }
      if (!document) {
        throw new Error('Пустая спецификация');
      }
      const parsed = parseOpenAPIDocument(document);
      set({
        status: 'ready',
        document,
        endpoints: parsed.endpoints,
        tags: parsed.tags,
        meta: parsed.meta,
        error: undefined
      });
      useApiConfigStore.getState().updateConnector(connector.id, {
        baseUrl: parsed.meta.serverUrl || connector.baseUrl,
        lastSyncedAt: Date.now(),
        specPayload: connector.mode === 'local' ? connector.specPayload : raw
      });
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Не удалось обработать Swagger'
      });
    }
  }
}));
