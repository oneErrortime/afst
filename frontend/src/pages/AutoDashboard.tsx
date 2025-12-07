import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { parseSwaggerSpec } from '@/lib/swagger-parser';
import { BookOpen, Users, FolderOpen, Star, Bookmark, Settings } from 'lucide-react';

const iconMap: Record<string, any> = {
  Books: BookOpen,
  Users: Users,
  Collections: FolderOpen,
  Reviews: Star,
  Bookmarks: Bookmark,
  Auth: Settings,
};

export function AutoDashboard() {
  const [resources, setResources] = useState<any[]>([]);

  useEffect(() => {
    const parsed = parseSwaggerSpec();
    setResources(parsed.filter(r => !['Auth'].includes(r.name)));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">API Resources</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map(resource => {
          const Icon = iconMap[resource.name] || BookOpen;
          const path = `/auto/${resource.name.toLowerCase()}`;
          
          return (
            <Link
              key={resource.name}
              to={path}
              className="p-6 bg-white rounded-lg border hover:shadow-lg transition group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{resource.name}</h3>
                  <p className="text-sm text-gray-600">
                    {resource.endpoints.length} endpoints available
                  </p>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {Array.from(new Set(resource.endpoints.map((e: any) => e.method))).map((method: any) => (
                      <span
                        key={method}
                        className="text-xs px-2 py-1 bg-gray-100 rounded"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
