import { useParams } from 'react-router-dom';
import { ResourceManager } from '@/components/auto/ResourceManager';
import { 
  booksApi, 
  collectionsApi, 
  reviewsApi, 
  usersApi,
  categoriesApi,
  groupsApi,
  bookmarksApi,
  readersApi,
  borrowApi,
  socialApi,
  subscriptionsApi,
  accessApi,
  sessionsApi,
  filesApi,
} from '@/api';

// Normalize APIs to ensure they have getAll where possible
const apiMap: Record<string, any> = {
  books: booksApi,
  collections: {
      ...collectionsApi,
      getAll: collectionsApi.getMyCollections // Best approximation for now
  },
  reviews: reviewsApi, // No getAll
  users: usersApi,
  categories: categoriesApi,
  groups: groupsApi,
  bookmarks:bookmarksApi,
  readers: readersApi,
  borrow: {
      ...borrowApi,
      getAll: async () => [] // Not supported globally yet for admin in wrapper
  },
  social: socialApi, // No getAll
  subscriptions: {
      ...subscriptionsApi,
      getAll: subscriptionsApi.getPlans // List plans as "all subscriptions" view? Or implement get all in backend.
  },
  access: accessApi,
  sessions: {
      ...sessionsApi,
      getAll: sessionsApi.getMy // For demo
  },
  files: {
      ...filesApi,
      getAll: async () => [] // No global file list in wrapper
  }
};

export function AutoResource() {
  const { resource } = useParams<{ resource: string }>();
  
  // Case insensitive match
  const normalizedResource = Object.keys(apiMap).find(k => k.toLowerCase() === resource?.toLowerCase());
  
  if (!normalizedResource) {
    return <div className="text-center py-12 text-gray-500">Resource "{resource}" not found or not supported in Auto Admin.</div>;
  }

  return (
    <ResourceManager
      resourceName={normalizedResource}
      api={apiMap[normalizedResource]}
    />
  );
}
