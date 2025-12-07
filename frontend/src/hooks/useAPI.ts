import { useState, useEffect, useCallback } from 'react';

export interface QueryOptions<T> {
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useQuery<T>(
  queryFn: () => Promise<T>,
  deps: any[] = [],
  options: QueryOptions<T> = {}
): QueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { enabled = true, refetchInterval, onSuccess, onError } = options;

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await queryFn();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [enabled, queryFn, onSuccess, onError]);

  useEffect(() => {
    fetchData();
    
    if (refetchInterval) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, refetchInterval, ...deps]);

  return { data, loading, error, refetch: fetchData };
}

export interface MutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | null, error: Error | null, variables: TVariables) => void;
}

export interface MutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  data: TData | null;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: MutationOptions<TData, TVariables> = {}
): MutationResult<TData, TVariables> {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { onSuccess, onError, onSettled } = options;

  const mutate = useCallback(async (variables: TVariables): Promise<TData> => {
    try {
      setLoading(true);
      setError(null);
      const result = await mutationFn(variables);
      setData(result);
      onSuccess?.(result, variables);
      onSettled?.(result, null, variables);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error, variables);
      onSettled?.(null, error, variables);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, onSuccess, onError, onSettled]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { 
    mutate, 
    mutateAsync: mutate,
    data, 
    loading, 
    error,
    reset
  };
}

export function usePaginatedQuery<T>(
  queryFn: (page: number, limit: number) => Promise<T[]>,
  initialPage: number = 1,
  limit: number = 20
) {
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);
      const result = await queryFn(pageNum, limit);
      
      if (pageNum === 1) {
        setData(result);
      } else {
        setData(prev => [...prev, ...result]);
      }
      
      setHasMore(result.length === limit);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [queryFn, limit]);

  useEffect(() => {
    fetchPage(page);
  }, [page, fetchPage]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  const reset = useCallback(() => {
    setPage(1);
    setData([]);
    setHasMore(true);
  }, []);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    refetch: () => fetchPage(1)
  };
}

export function useInfiniteQuery<T>(
  queryFn: (offset: number, limit: number) => Promise<T[]>,
  limit: number = 20
) {
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchData = useCallback(async (currentOffset: number) => {
    try {
      setLoading(true);
      setError(null);
      const result = await queryFn(currentOffset, limit);
      
      if (currentOffset === 0) {
        setData(result);
      } else {
        setData(prev => [...prev, ...result]);
      }
      
      setHasMore(result.length === limit);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [queryFn, limit]);

  useEffect(() => {
    fetchData(offset);
  }, [offset, fetchData]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setOffset(prev => prev + limit);
    }
  }, [loading, hasMore, limit]);

  const reset = useCallback(() => {
    setOffset(0);
    setData([]);
    setHasMore(true);
  }, []);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    refetch: () => fetchData(0)
  };
}

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
