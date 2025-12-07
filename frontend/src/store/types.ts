export type ConnectorMode = 'local' | 'remote' | 'direct';

export interface ApiConnector {
  id: string;
  name: string;
  mode: ConnectorMode;
  baseUrl: string;
  specPayload?: string;
  specUrl?: string;
  swaggerPath?: string;
  createdAt: number;
  lastSyncedAt?: number;
}

export type ApiConnectorInput = {
  name: string;
  baseUrl: string;
  mode: ConnectorMode;
  specPayload?: string;
  specUrl?: string;
  swaggerPath?: string;
};

export type SpecStatus = 'idle' | 'loading' | 'ready' | 'error';

export type SetupState = 'checking' | 'needs-admin' | 'ready' | 'error';

export interface ParsedEndpoint {
  id: string;
  path: string;
  method: string;
  tag: string;
  summary: string;
  description?: string;
  parameters: ParsedParameter[];
  requestBody?: ParsedRequestBody;
  requiresAuth: boolean;
}

export interface ParsedParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required: boolean;
  schema: Record<string, any>;
  description?: string;
}

export interface ParsedRequestBody {
  schema?: Record<string, any>;
  contentType: string;
}
