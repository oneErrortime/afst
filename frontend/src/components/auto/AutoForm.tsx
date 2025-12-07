import { useState } from 'react';
import { Input, Button } from '@/components/ui';
import { inferFieldType } from '@/lib/swagger-parser';

interface FormField {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  enum?: string[];
}

interface AutoFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => Promise<void>;
  submitLabel?: string;
}

export function AutoForm({ fields, onSubmit, submitLabel = 'Submit' }: AutoFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await onSubmit(formData);
      setFormData({});
    } catch (err: any) {
      setError(err.message || 'Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: FormField) => {
    const fieldType = inferFieldType({ type: field.type, enum: field.enum });
    
    switch (fieldType) {
      case 'select':
        return (
          <select
            value={formData[field.name] || ''}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            required={field.required}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Select...</option>
            {field.enum?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={formData[field.name] || false}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
            className="h-4 w-4"
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={formData[field.name] || ''}
            onChange={(e) => setFormData({ ...formData, [field.name]: Number(e.target.value) })}
            required={field.required}
          />
        );
      
      default:
        return (
          <Input
            type={fieldType === 'email' ? 'email' : fieldType === 'datetime' ? 'datetime-local' : 'text'}
            value={formData[field.name] || ''}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            required={field.required}
            placeholder={field.description}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(field => (
        <div key={field.name}>
          <label className="block text-sm font-medium mb-1">
            {field.name}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          {renderField(field)}
          {field.description && (
            <p className="text-xs text-gray-500 mt-1">{field.description}</p>
          )}
        </div>
      ))}
      
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <Button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : submitLabel}
      </Button>
    </form>
  );
}
