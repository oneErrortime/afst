import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApiConnector, ApiConnectorInput } from './types';

interface ApiConfigState {
  connectors: ApiConnector[];
  activeConnectorId?: string;
  activeConnector?: ApiConnector;
  addConnector: (input: ApiConnectorInput) => string;
  setActiveConnector: (id: string) => void;
  updateConnector: (id: string, patch: Partial<ApiConnector>) => void;
  removeConnector: (id: string) => void;
}

const withActiveConnector = (connectors: ApiConnector[], id?: string) => ({
  connectors,
  activeConnectorId: id,
  activeConnector: id ? connectors.find((c) => c.id === id) : undefined
});

export const useApiConfigStore = create<ApiConfigState>()(
  persist(
    (set, get) => ({
      connectors: [],
      activeConnectorId: undefined,
      activeConnector: undefined,
      addConnector: (input) => {
        const id = crypto.randomUUID();
        const connector: ApiConnector = {
          id,
          name: input.name,
          mode: input.mode,
          baseUrl: input.baseUrl,
          specPayload: input.specPayload,
          specUrl: input.specUrl,
          swaggerPath: input.swaggerPath,
          createdAt: Date.now()
        };
        const connectors = [...get().connectors, connector];
        set(withActiveConnector(connectors, id));
        return id;
      },
      setActiveConnector: (id) => {
        const connectors = get().connectors;
        if (!connectors.find((c) => c.id === id)) return;
        set(withActiveConnector(connectors, id));
      },
      updateConnector: (id, patch) => {
        const connectors = get().connectors.map((connector) =>
          connector.id === id ? { ...connector, ...patch } : connector
        );
        const targetId = get().activeConnectorId && connectors.some((c) => c.id === get().activeConnectorId)
          ? get().activeConnectorId
          : id;
        set(withActiveConnector(connectors, targetId));
      },
      removeConnector: (id) => {
        const connectors = get().connectors.filter((connector) => connector.id !== id);
        const activeId = get().activeConnectorId === id ? connectors[0]?.id : get().activeConnectorId;
        set(withActiveConnector(connectors, activeId));
      }
    }),
    {
      name: 'api-config'
    }
  )
);
