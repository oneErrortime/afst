import { useState, useEffect } from 'react';
import { parseSwaggerSpec, APIResource } from '@/lib/swagger-parser';
import { AutoForm } from '@/components/auto/AutoForm';
import { AutoTable } from '@/components/auto/AutoTable';
import { Button, Modal } from '@/components/ui';
import { Plus } from 'lucide-react';

interface ResourceManagerProps {
  resourceName: string;
  api: {
    getAll: () => Promise<any[]>;
    create?: (data: any) => Promise<any>;
    update?: (id: string, data: any) => Promise<any>;
    delete?: (id: string) => Promise<void>;
  };
}

export function ResourceManager({ resourceName, api }: ResourceManagerProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resource, setResource] = useState<APIResource | null>(null);

  useEffect(() => {
    const resources = parseSwaggerSpec();
    const found = resources.find(r => r.name.toLowerCase() === resourceName.toLowerCase());
    setResource(found || null);
    loadData();
  }, [resourceName]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await api.getAll();
      setData(result);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData: any) => {
    if (!api.create) return;
    await api.create(formData);
    setShowCreateModal(false);
    loadData();
  };

  const handleDelete = async (item: any) => {
    if (!api.delete) return;
    if (confirm('Are you sure?')) {
      await api.delete(item.id);
      loadData();
    }
  };

  const getFormFields = () => {
    if (!resource?.schema?.properties) return [];
    return Object.entries(resource.schema.properties).map(([name, prop]: [string, any]) => ({
      name,
      type: prop.type,
      required: resource.schema.required?.includes(name),
      description: prop.description,
      enum: prop.enum
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{resourceName}</h1>
        {api.create && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        )}
      </div>

      <AutoTable
        data={data}
        loading={loading}
        onDelete={api.delete ? handleDelete : undefined}
      />

      {showCreateModal && (
        <Modal isOpen={true} onClose={() => setShowCreateModal(false)} title={`Create ${resourceName}`}>
          <AutoForm
            fields={getFormFields()}
            onSubmit={handleCreate}
            submitLabel="Create"
          />
        </Modal>
      )}
    </div>
  );
}
