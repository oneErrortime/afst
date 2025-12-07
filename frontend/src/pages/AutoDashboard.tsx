import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { parseSwaggerSpec, APIResource } from '@/lib/swagger-parser';
import { BookOpen, Users, FolderOpen, Star, Bookmark, Settings, FileText, Key, UserPlus, Zap, Clock, Files } from 'lucide-react';

const iconMap: Record<string, any> = {
  Books: BookOpen,
  Users: Users,
  Collections: FolderOpen,
  Reviews: Star,
  Bookmarks: Bookmark,
  Auth: Key,
  Categories: FileText,
  Groups: UserPlus,
  Social: Users,
  Access: Zap,
  Sessions: Clock,
  Files: Files,
};

export function AutoDashboard() {
  const [resources, setResources] = useState<APIResource[]>([]);
  const [selectedResource, setSelectedResource] = useState<APIResource | null>(null);

  useEffect(() => {
    const parsed = parseSwaggerSpec();
    setResources(parsed);
  }, []);

  const allEndpoints = resources.flatMap(r => 
    r.endpoints.map(e => ({ ...e, resource: r.name }))
  );

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <Key className="h-6 w-6 text-amber-600" />
          <div>
            <h3 className="font-semibold text-amber-900">Инструменты разработчика</h3>
            <p className="text-amber-700 text-sm">
              Эта панель автоматически генерируется из Swagger спецификации для отладки API. 
              Используйте основную панель администрирования для управления библиотекой.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">API Explorer</h1>
        <p className="text-gray-600 mt-2">
          Все доступные API эндпоинты ({allEndpoints.length} total)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Ресурсы ({resources.length})</h2>
          <div className="grid grid-cols-1 gap-3">
            {resources.map(resource => {
              const Icon = iconMap[resource.name] || BookOpen;
              const path = `/auto/${resource.name.toLowerCase()}`;
              
              return (
                <div
                  key={resource.name}
                  className="p-4 bg-white rounded-lg border hover:shadow-md transition cursor-pointer"
                  onClick={() => setSelectedResource(resource)}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary-50 rounded-lg">
                      <Icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{resource.name}</h3>
                        <Link 
                          to={path}
                          className="text-sm text-primary-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Управление →
                        </Link>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {resource.endpoints.length} endpoints
                      </p>
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {Array.from(new Set(resource.endpoints.map(e => e.method))).map(method => (
                          <span
                            key={method}
                            className={`text-xs px-2 py-0.5 rounded font-mono ${
                              method === 'GET' ? 'bg-blue-100 text-blue-700' :
                              method === 'POST' ? 'bg-green-100 text-green-700' :
                              method === 'PUT' ? 'bg-amber-100 text-amber-700' :
                              method === 'DELETE' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            {selectedResource ? `${selectedResource.name} Endpoints` : 'Все эндпоинты'}
          </h2>
          <div className="bg-white rounded-lg border max-h-[600px] overflow-y-auto">
            {(selectedResource ? selectedResource.endpoints : allEndpoints).map((endpoint, idx) => {
              const resource = 'resource' in endpoint ? endpoint.resource : selectedResource?.name;
              return (
                <div key={idx} className="p-4 border-b last:border-b-0 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <span className={`text-xs px-2 py-1 rounded font-mono font-semibold ${
                      endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                      endpoint.method === 'POST' ? 'bg-green-100 text-green-700' :
                      endpoint.method === 'PUT' ? 'bg-amber-100 text-amber-700' :
                      endpoint.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {endpoint.method}
                    </span>
                    <div className="flex-1 min-w-0">
                      <code className="text-sm font-mono text-gray-900 block">{endpoint.path}</code>
                      {endpoint.summary ? (
                        <p className="text-sm text-gray-600 mt-1">{endpoint.summary}</p>
                      ) : null}
                      {('resource' in endpoint) ? (
                        <span className="inline-block mt-2 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          {String((endpoint as any).resource)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6 border border-primary-100">
        <h3 className="font-semibold text-gray-900 mb-2">Автогенерация клиента</h3>
        <p className="text-sm text-gray-600 mb-3">
          API клиент автоматически генерируется из Swagger спецификации при каждом билде.
          Все новые эндпоинты автоматически доступны после запуска <code className="px-1.5 py-0.5 bg-white rounded">bun run api:generate:local</code>
        </p>
        <div className="flex gap-4 text-sm">
          <div>
            <span className="font-medium">Ресурсов:</span> <span className="text-gray-700">{resources.length}</span>
          </div>
          <div>
            <span className="font-medium">Эндпоинтов:</span> <span className="text-gray-700">{allEndpoints.length}</span>
          </div>
          <div>
            <span className="font-medium">Статус:</span> <span className="text-green-600 font-medium">✓ Синхронизировано</span>
          </div>
        </div>
      </div>
    </div>
  );
}
