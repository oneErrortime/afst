const extractRefKey = (ref: string) => {
  return ref.replace('#/components/schemas/', '').replace('#/definitions/', '');
};

const resolveSchema = (schema: any, schemas: Record<string, any>) => {
  if (!schema) return undefined;
  if (schema.$ref) {
    const key = extractRefKey(schema.$ref);
    return schemas[key];
  }
  return schema;
};

export const createSampleFromSchema = (schema: any, schemas: Record<string, any>, depth = 0): any => {
  if (!schema || depth > 4) return undefined;
  const resolved = resolveSchema(schema, schemas) || schema;
  if (resolved.example !== undefined) return resolved.example;
  if (resolved.default !== undefined) return resolved.default;
  if (resolved.type === 'object' || resolved.properties) {
    const result: Record<string, any> = {};
    Object.entries(resolved.properties || {}).forEach(([key, value]) => {
      result[key] = createSampleFromSchema(value, schemas, depth + 1);
    });
    return result;
  }
  if (resolved.type === 'array' && resolved.items) {
    const item = createSampleFromSchema(resolved.items, schemas, depth + 1);
    return item !== undefined ? [item] : [];
  }
  if (resolved.enum?.length) {
    return resolved.enum[0];
  }
  switch (resolved.type) {
    case 'integer':
    case 'number':
      return 0;
    case 'boolean':
      return true;
    case 'string':
    default:
      return '';
  }
};

export const inferInputType = (schema: any) => {
  const resolved = schema?.type || schema;
  if (resolved === 'integer' || resolved === 'number') return 'number';
  return 'text';
};
