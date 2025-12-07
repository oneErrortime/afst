import swaggerSpec from '@/../../docs/swagger.json';

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  tag: string;
  summary: string;
  description?: string;
  parameters?: any[];
  requestBody?: any;
  responses?: any;
}

export interface APIResource {
  name: string;
  endpoints: APIEndpoint[];
  schema?: any;
}

export function parseSwaggerSpec(): APIResource[] {
  const resources = new Map<string, APIResource>();

  Object.entries(swaggerSpec.paths).forEach(([path, methods]: [string, any]) => {
    Object.entries(methods).forEach(([method, details]: [string, any]) => {
      const tag = details.tags?.[0] || 'Other';
      
      if (!resources.has(tag)) {
        resources.set(tag, {
          name: tag,
          endpoints: [],
          schema: swaggerSpec.definitions?.[`models.${tag}`]
        });
      }

      resources.get(tag)!.endpoints.push({
        path,
        method: method.toUpperCase() as any,
        tag,
        summary: details.summary || '',
        description: details.description || '',
        parameters: details.parameters || [],
        requestBody: details.requestBody,
        responses: details.responses
      });
    });
  });

  return Array.from(resources.values());
}

export function getResourceEndpoints(resource: string): APIEndpoint[] {
  const resources = parseSwaggerSpec();
  return resources.find(r => r.name === resource)?.endpoints || [];
}

export function getAllResources(): string[] {
  return parseSwaggerSpec().map(r => r.name);
}

export function getEndpointsByMethod(method: string): APIEndpoint[] {
  const resources = parseSwaggerSpec();
  return resources.flatMap(r => r.endpoints.filter(e => e.method === method));
}

export function extractSchemaProperties(schemaRef: string): Record<string, any> {
  const schemaName = schemaRef.replace('#/definitions/', '');
  const schema = (swaggerSpec as any).definitions?.[schemaName];
  return schema?.properties || {};
}

export function inferFieldType(property: any): string {
  if (property.type === 'string') {
    if (property.format === 'date-time') return 'datetime';
    if (property.format === 'email') return 'email';
    if (property.enum) return 'select';
    return 'text';
  }
  if (property.type === 'integer' || property.type === 'number') return 'number';
  if (property.type === 'boolean') return 'checkbox';
  if (property.type === 'array') return 'array';
  return 'text';
}
