import { useCallback, useEffect, useRef } from 'react';
import { accessApi, sessionsApi } from '@/api/wrapper';
import { useAuthStore } from '@/store/authStore';

interface UseReadingProgressOptions {
  accessId: string | null;
  bookId: string | null;
  totalPages: number;
  debounceMs?: number;
}

export function useReadingProgress({
  accessId,
  bookId,
  totalPages,
  debounceMs = 3000,
}: UseReadingProgressOptions) {
  const { isAuthenticated } = useAuthStore();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSavedPage = useRef(-1);

  const saveProgress = useCallback(
    (currentPage: number) => {
      if (!isAuthenticated || !accessId || totalPages <= 0) return;
      if (currentPage === lastSavedPage.current) return;

      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(async () => {
        try {
          await accessApi.updateProgress(accessId, {
            current_page: currentPage,
            progress_percent: totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0,
          });
          lastSavedPage.current = currentPage;
        } catch {
          // silent — never interrupt reading
        }
      }, debounceMs);
    },
    [isAuthenticated, accessId, totalPages, debounceMs]
  );

  const startSession = useCallback(async (): Promise<string | null> => {
    if (!isAuthenticated || !bookId) return null;
    try {
      const session = await sessionsApi.start({ book_id: bookId });
      return session?.id ?? null;
    } catch {
      return null;
    }
  }, [isAuthenticated, bookId]);

  const endSession = useCallback(async (sessionId: string, endPage: number) => {
    if (!isAuthenticated) return;
    try {
      await sessionsApi.end(sessionId, endPage);
    } catch {
      // silent
    }
  }, [isAuthenticated]);

  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  return { saveProgress, startSession, endSession };
}
