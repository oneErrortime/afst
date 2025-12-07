import { useEffect, useMemo, useState } from 'react';
import { createSampleFromSchema, inferInputType } from '../../utils/schemaTools';

interface AutoFormBuilderProps {
  schema: any;
  schemas: Record<string, any>;
  onChange: (value: string) => void;
}

type Field = {
  key: string;
  type: string;
  required: boolean;
};

const resolveObjectSchema = (schema: any, schemas: Record<string, any>) => {
  if (!schema) return undefined;
  if (schema.$ref) {
    const ref = schema.$ref.replace('#/components/schemas/', '').replace('#/definitions/', '');
    return schemas[ref];
  }
  return schema;
};

function AutoFormBuilder({ schema, schemas, onChange }: AutoFormBuilderProps) {
  const resolved = useMemo(() => resolveObjectSchema(schema, schemas), [schema, schemas]);
  const fields = useMemo(() => {
    if (!resolved?.properties) return [];
    return Object.entries(resolved.properties).map(([key, value]: [string, any]) => ({
      key,
      type: inferInputType(value),
      required: resolved.required?.includes(key)
    }));
  }, [resolved]);

  const [formState, setFormState] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!resolved) return;
    const sample = createSampleFromSchema(schema, schemas);
    setFormState(sample && typeof sample === 'object' ? sample : {});
  }, [schema, schemas, resolved]);

  useEffect(() => {
    onChange(JSON.stringify(formState, null, 2));
  }, [formState, onChange]);

  if (!resolved || fields.length === 0) {
    return <p style={{ opacity: 0.7 }}>Форма недоступна для данной схемы</p>;
  }

  const updateField = (key: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="form-grid">
      {fields.map((field) => (
        <label key={field.key}>
          {field.key}
          <input
            type={field.type}
            required={field.required}
            value={formState[field.key] ?? ''}
            onChange={(e) => updateField(field.key, e.target.value)}
          />
        </label>
      ))}
    </div>
  );
}

export default AutoFormBuilder;
