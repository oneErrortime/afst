import { useParams } from 'react-router-dom';
import { ResourceManager } from '@/components/auto/ResourceManager';
import { 
  booksApi, 
  collectionsApi, 
  reviewsApi, 
  usersApi,
  categoriesApi,
  groupsApi
} from '@/api';

const apiMap: Record<string, any> = {
  books: booksApi,
  collections: collectionsApi,
  reviews: reviewsApi,
  users: usersApi,
  categories: categoriesApi,
  groups: groupsApi,
};

export function AutoResource() {
  const { resource } = useParams<{ resource: string }>();
  
  if (!resource || !apiMap[resource]) {
    return <div className="text-center py-8">Resource not found</div>;
  }

  return (
    <ResourceManager
      resourceName={resource}
      api={apiMap[resource]}
    />
  );
}
