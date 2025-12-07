import { useCallback, useEffect, useState } from 'react';
import { ApiConnector, SetupState } from '../store/types';

export const useSetupStatus = (connector?: ApiConnector) => {
  const [state, setState] = useState<SetupState>('checking');
  const [error, setError] = useState<string>();
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => {
    if (!connector) return;
    setState('checking');
    setError(undefined);
    setNonce((value) => value + 1);
  }, [connector]);

  useEffect(() => {
    if (!connector) return;
    let cancelled = false;
    const controller = new AbortController();
    const run = async () => {
      try {
        const url = `${connector.baseUrl.replace(/\/$/, '')}/setup/status`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Статус ${response.status}`);
        }
        const data = await response.json();
        if (cancelled) return;
        setState(data.setup_needed ? 'needs-admin' : 'ready');
      } catch (err) {
        if (cancelled) return;
        setState('error');
        setError(err instanceof Error ? err.message : 'Ошибка подключения');
      }
    };
    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [connector, nonce]);

  return { state, refresh, error };
};
