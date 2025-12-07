import { useState, useEffect, useMemo } from 'react';
import { parseSwaggerSpec, APIResource } from '@/lib/swagger-parser';
import { AutoForm } from '@/components/auto/AutoForm';
import { AutoTable } from '@/components/auto/AutoTable';
import { Button, Modal, EmptyState, Loading, Tabs, Tab } from '@/components/ui';
import { Plus, Archive, Share2, Database, List, AlertCircle } from 'lucide-react'; // Added icons
import { GraphView } from '@/components/auto/GraphView'; // We'll create this

interface ResourceManagerProps {
  resourceName: string;
  api: {
    getAll?: () => Promise<any[]>;
    create?: (data: any) => Promise<any>;
    update?: (id: string, data: any) => Promise<any>;
    delete?: (id: string) => Promise<void>;
    getById?: (id: string) => Promise<any>;
    [key: string]: any;
  };
}

export function ResourceManager({ resourceName, api }: ResourceManagerProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'table' | 'graph'>('table');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resource, setResource] = useState<APIResource | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resources = parseSwaggerSpec();
    const found = resources.find(r => r.name.toLowerCase() === resourceName.toLowerCase());
    setResource(found || null);
    setData([]);
    setError(null);
    
    if (api.getAll) {
      loadData();
    }
  }, [resourceName, api]);

  const loadData = async () => {
    if (!api.getAll) return;
    setLoading(true);
    try {
      const result = await api.getAll() as any;
      if (Array.isArray(result)) {
        setData(result);
      } else if (result && Array.isArray(result.data)) {
        setData(result.data);
      } else if (result && Array.isArray(result.Data)) {
        setData(result.Data);
      } else {
        // Fallback for mapped endpoints that return object
        setData([result]); 
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData: any) => {
    if (!api.create) return;
    try {
        await api.create(formData);
        setShowCreateModal(false);
        if (api.getAll) loadData();
    } catch (err: any) {
        alert(err.message || 'Create failed');
    }
  };

  const handleDelete = async (item: any) => {
    if (!api.delete) return;
    if (confirm('Are you sure?')) {
      try {
          await api.delete(item.id);
          if (api.getAll) loadData();
      } catch (err: any) {
          alert(err.message || 'Delete failed');
      }
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
        <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold capitalize">{resourceName}</h1>
            {api.getAll && (
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setView('table')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'table' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <List className="h-4 w-4 inline-block mr-2" />
                        List
                    </button>
                    <button 
                        onClick={() => setView('graph')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'graph' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Share2 className="h-4 w-4 inline-block mr-2" />
                        Graph
                    </button>
                </div>
            )}
        </div>
        {api.create && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
        </div>
      )}

      {!api.getAll && !error && (
          <EmptyState 
            title="No List View Available" 
            description="This resource does not support listing items globally." 
            icon={<Database className="h-12 w-12 text-gray-300" />}
          />
      )}

      {api.getAll && (
          <>
            {view === 'table' ? (
                <AutoTable
                    data={data}
                    loading={loading}
                    onDelete={api.delete ? handleDelete : undefined}
                />
            ) : (
                <GraphView data={data} resourceName={resourceName} />
            )}
          </>
      )}

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
