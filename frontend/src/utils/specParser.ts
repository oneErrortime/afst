import { ParsedEndpoint, ParsedParameter, ParsedRequestBody } from '../store/types';

const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

const normalizeServerUrl = (doc: any) => {
  if (Array.isArray(doc?.servers) && doc.servers[0]?.url) {
    return doc.servers[0].url;
  }
  if (doc?.host) {
    const scheme = doc.schemes?.[0] || 'https';
    const basePath = doc.basePath || '';
    return `${scheme}://${doc.host}${basePath}`;
  }
  return '';
};

const mergeParameters = (operationParams: any[] = [], pathParams: any[] = []): ParsedParameter[] => {
  const map = new Map<string, any>();
  [...pathParams, ...operationParams].forEach((param) => {
    if (!param) return;
    const key = `${param.in}:${param.name}`;
    if (!map.has(key)) {
      map.set(key, param);
    }
  });
  return Array.from(map.values()).map((param) => ({
    name: param.name,
    in: param.in,
    required: Boolean(param.required),
    schema: param.schema || { type: param.type },
    description: param.description
  }));
};

const extractRequestBody = (operation: any, doc: any): ParsedRequestBody | undefined => {
  if (operation?.requestBody?.content) {
    const [contentType, schemaHolder] = Object.entries(operation.requestBody.content)[0] || [];
    if (contentType) {
      return {
        contentType,
        schema: schemaHolder?.schema
      };
    }
  }
  if (operation?.consumes && operation.consumes.length > 0 && operation?.parameters) {
    const bodyParam = operation.parameters.find((param: any) => param.in === 'body');
    if (bodyParam) {
      return {
        contentType: operation.consumes[0],
        schema: bodyParam.schema
      };
    }
  }
  if (doc?.consumes && operation?.parameters) {
    const bodyParam = operation.parameters.find((param: any) => param.in === 'body');
    if (bodyParam) {
      return {
        contentType: doc.consumes[0],
        schema: bodyParam.schema
      };
    }
  }
  return undefined;
};

const isProtected = (operation: any, doc: any) => {
  const localSecurity = operation?.security || doc?.security;
  if (!localSecurity) return false;
  if (Array.isArray(localSecurity) && localSecurity.length === 0) return false;
  return true;
};

export const parseOpenAPIDocument = (doc: any) => {
  const endpoints: ParsedEndpoint[] = [];
  const tagsMap = new Map<string, { name: string; description?: string }>();

  Object.entries(doc.paths || {}).forEach(([path, pathItem]: [string, any]) => {
    httpMethods.forEach((method) => {
      const operation = pathItem?.[method];
      if (!operation) return;
      const tag = operation.tags?.[0] || 'default';
      tagsMap.set(tag, { name: tag, description: doc.tags?.find((t: any) => t.name === tag)?.description });
      const parameters = mergeParameters(operation.parameters, pathItem.parameters);
      const requestBody = extractRequestBody(operation, doc);
      endpoints.push({
        id: `${method.toUpperCase()} ${path}`,
        path,
        method: method.toUpperCase(),
        tag,
        summary: operation.summary || 'Без описания',
        description: operation.description,
        parameters,
        requestBody,
        requiresAuth: isProtected(operation, doc)
      });
    });
  });

  return {
    endpoints,
    tags: Array.from(tagsMap.values()),
    meta: {
      title: doc.info?.title || 'API',
      version: doc.info?.version || '1.0.0',
      serverUrl: normalizeServerUrl(doc),
      schemas: doc.components?.schemas || doc.definitions || {}
    }
  };
};
