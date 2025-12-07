import { useState } from 'react';
import {
  useQuery,
  useMutation,
  usePaginatedQuery,
  useInfiniteQuery,
  useDebounce,
  booksApi,
  authApi,
  collectionsApi,
  reviewsApi,
  type Book,
  type Collection,
  type CreateBookDTO,
  type CreateReviewDTO,
} from '@/api';

export function BasicQueryExample() {
  const { data: books, loading, error, refetch } = useQuery<Book[]>(
    () => booksApi.getAll({ limit: 20 }),
    []
  );

  if (loading) return <div>Loading books...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Books</h2>
      <button onClick={refetch}>Refresh</button>
      <ul>
        {books?.map(book => (
          <li key={book.id}>
            {book.title} by {book.author}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MutationExample() {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
  });

  const { mutate: createBook, loading, error } = useMutation<Book | undefined, CreateBookDTO>(
    (data) => booksApi.create(data),
    {
      onSuccess: (book) => {
        console.log('Book created successfully:', book);
        alert(`Book "${book.title}" created!`);
        setFormData({ title: '', author: '', isbn: '', description: '' });
      },
      onError: (error) => {
        console.error('Failed to create book:', error);
        alert('Failed to create book');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBook(formData as CreateBookDTO);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create New Book</h2>
      
      <input
        type="text"
        placeholder="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
      />
      
      <input
        type="text"
        placeholder="Author"
        value={formData.author}
        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
        required
      />
      
      <input
        type="text"
        placeholder="ISBN"
        value={formData.isbn}
        onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
        required
      />
      
      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Book'}
      </button>
      
      {error && <div className="error">{error.message}</div>}
    </form>
  );
}

export function PaginatedExample() {
  const {
    data: books,
    loading,
    hasMore,
    loadMore,
    reset,
  } = usePaginatedQuery<Book>(
    (page, limit) => booksApi.getAll({ offset: (page - 1) * limit, limit }),
    1,
    10
  );

  return (
    <div>
      <h2>Paginated Books</h2>
      <button onClick={reset}>Reset</button>
      
      <ul>
        {books.map(book => (
          <li key={book.id}>{book.title}</li>
        ))}
      </ul>
      
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}

export function InfiniteScrollExample() {
  const {
    data: books,
    loading,
    hasMore,
    loadMore,
  } = useInfiniteQuery<Book>(
    (offset, limit) => booksApi.getAll({ offset, limit }),
    20
  );

  return (
    <div>
      <h2>Infinite Scroll Books</h2>
      
      <div
        style={{ height: '400px', overflowY: 'auto' }}
        onScroll={(e) => {
          const target = e.currentTarget;
          if (
            target.scrollHeight - target.scrollTop === target.clientHeight &&
            hasMore &&
            !loading
          ) {
            loadMore();
          }
        }}
      >
        {books.map(book => (
          <div key={book.id} style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
            <h3>{book.title}</h3>
            <p>by {book.author}</p>
          </div>
        ))}
        
        {loading && <div>Loading more...</div>}
        {!hasMore && <div>No more books</div>}
      </div>
    </div>
  );
}

export function SearchWithDebounceExample() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { data: books, loading } = useQuery<Book[]>(
    () => booksApi.getAll({ search: debouncedSearch }),
    [debouncedSearch],
    { enabled: debouncedSearch.length > 2 }
  );

  return (
    <div>
      <h2>Search Books</h2>
      
      <input
        type="text"
        placeholder="Search by title, author, ISBN..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', padding: '10px' }}
      />
      
      {loading && <div>Searching...</div>}
      
      {books && books.length > 0 && (
        <ul>
          {books.map(book => (
            <li key={book.id}>
              {book.title} by {book.author}
            </li>
          ))}
        </ul>
      )}
      
      {books && books.length === 0 && debouncedSearch && (
        <div>No books found</div>
      )}
    </div>
  );
}

export function ConditionalQueryExample() {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const { data: books } = useQuery<Book[]>(
    () => booksApi.getAll({ limit: 10 }),
    []
  );

  const { data: bookDetails, loading } = useQuery<Book>(
    () => booksApi.getById(selectedBookId!),
    [selectedBookId],
    { enabled: !!selectedBookId }
  );

  return (
    <div>
      <h2>Book Details (Conditional Query)</h2>
      
      <select
        value={selectedBookId || ''}
        onChange={(e) => setSelectedBookId(e.target.value || null)}
      >
        <option value="">Select a book...</option>
        {books?.map(book => (
          <option key={book.id} value={book.id}>
            {book.title}
          </option>
        ))}
      </select>
      
      {loading && <div>Loading book details...</div>}
      
      {bookDetails && (
        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc' }}>
          <h3>{bookDetails.title}</h3>
          <p><strong>Author:</strong> {bookDetails.author}</p>
          <p><strong>ISBN:</strong> {bookDetails.isbn}</p>
          <p><strong>Description:</strong> {bookDetails.description}</p>
        </div>
      )}
    </div>
  );
}

export function MultipleQueriesExample() {
  const { data: books, loading: booksLoading } = useQuery<Book[]>(
    () => booksApi.getAll({ limit: 5 }),
    []
  );

  const { data: collections, loading: collectionsLoading } = useQuery<Collection[]>(
    () => collectionsApi.getMyCollections(),
    []
  );

  const { data: user, loading: userLoading } = useQuery(
    () => authApi.getMe(),
    []
  );

  const loading = booksLoading || collectionsLoading || userLoading;

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Dashboard</h2>
      
      <section>
        <h3>Welcome, {user?.name || user?.email}</h3>
      </section>
      
      <section>
        <h3>Recent Books</h3>
        <ul>
          {books?.slice(0, 5).map(book => (
            <li key={book.id}>{book.title}</li>
          ))}
        </ul>
      </section>
      
      <section>
        <h3>My Collections</h3>
        <ul>
          {collections?.map(collection => (
            <li key={collection.id}>
              {collection.name} ({collection.books?.length || 0} books)
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function OptimisticUpdateExample() {
  const [localReviews, setLocalReviews] = useState<any[]>([]);
  const bookId = 'example-book-id';

  const { data: reviews } = useQuery(
    () => reviewsApi.getByBook(bookId),
    [bookId]
  );

  const { mutate: createReview } = useMutation<any, CreateReviewDTO>(
    (data) => reviewsApi.create(data),
    {
      onSuccess: (newReview) => {
        setLocalReviews(prev => [...prev, newReview]);
      },
    }
  );

  const handleSubmit = (rating: number, comment: string) => {
    const optimisticReview = {
      id: `temp-${Date.now()}`,
      book_id: bookId,
      rating,
      comment,
      created_at: new Date().toISOString(),
    };
    
    setLocalReviews(prev => [...prev, optimisticReview]);
    
    createReview({
      book_id: bookId,
      rating,
      comment,
    } as CreateReviewDTO);
  };

  const allReviews = [...(reviews || []), ...localReviews];

  return (
    <div>
      <h2>Book Reviews (Optimistic Updates)</h2>
      
      <div>
        {allReviews.map(review => (
          <div key={review.id}>
            <p>Rating: {review.rating}/5</p>
            <p>{review.comment}</p>
          </div>
        ))}
      </div>
      
      <button onClick={() => handleSubmit(5, 'Great book!')}>
        Add Review
      </button>
    </div>
  );
}

export function RefetchIntervalExample() {
  const { data: stats, loading } = useQuery(
    () => booksApi.getStats('example-book-id'),
    [],
    { refetchInterval: 5000 }
  );

  return (
    <div>
      <h2>Live Book Stats</h2>
      <p>Auto-refreshes every 5 seconds</p>
      
      {loading && <div>Updating...</div>}
      
      {stats && (
        <div>
          <p>Views: {stats.views}</p>
          <p>Downloads: {stats.downloads}</p>
          <p>Average Rating: {stats.averageRating}</p>
        </div>
      )}
    </div>
  );
}

export function ErrorHandlingExample() {
  const [bookId, setBookId] = useState('');

  const { data, loading, error, refetch } = useQuery<Book>(
    () => booksApi.getById(bookId),
    [bookId],
    {
      enabled: !!bookId,
      onError: (error) => {
        console.error('Failed to fetch book:', error);
        alert(`Error: ${error.message}`);
      },
    }
  );

  return (
    <div>
      <h2>Error Handling Example</h2>
      
      <input
        type="text"
        placeholder="Enter book ID"
        value={bookId}
        onChange={(e) => setBookId(e.target.value)}
      />
      
      {loading && <div>Loading...</div>}
      
      {error && (
        <div style={{ color: 'red' }}>
          <p>Error: {error.message}</p>
          <button onClick={refetch}>Retry</button>
        </div>
      )}
      
      {data && (
        <div>
          <h3>{data.title}</h3>
          <p>by {data.author}</p>
        </div>
      )}
    </div>
  );
}

export function FileUploadExample() {
  const bookId = 'example-book-id';

  const { mutate: uploadFile, loading, error } = useMutation<any, File>(
    (file) => booksApi.uploadFile(bookId, file),
    {
      onSuccess: (file) => {
        alert(`File uploaded: ${file.filename}`);
      },
      onError: (error) => {
        alert(`Upload failed: ${error.message}`);
      },
    }
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  return (
    <div>
      <h2>File Upload Example</h2>
      
      <input
        type="file"
        onChange={handleFileChange}
        disabled={loading}
        accept=".pdf,.epub"
      />
      
      {loading && <div>Uploading...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error.message}</div>}
    </div>
  );
}
