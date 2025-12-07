import { useEffect } from 'react';
import ConnectorSelector from './features/connectors/ConnectorSelector';
import SetupWizard from './features/setup/SetupWizard';
import AuthGate from './features/auth/AuthGate';
import Dashboard from './features/dashboard/Dashboard';
import { useApiConfigStore } from './store/apiConfigStore';
import { useSpecStore } from './store/specStore';
import { useSetupStatus } from './hooks/useSetupStatus';
import { useSessionStore } from './store/sessionStore';
import LoadingScreen from './components/common/LoadingScreen';
import ErrorScreen from './components/common/ErrorScreen';

function App() {
  const activeConnector = useApiConfigStore((state) => state.activeConnector);
  const loadSpec = useSpecStore((state) => state.loadSpec);
  const specStatus = useSpecStore((state) => state.status);
  const specError = useSpecStore((state) => state.error);
  const { state: setupState, refresh: refreshSetup, error: setupError } = useSetupStatus(activeConnector);
  const token = useSessionStore((state) => state.token);

  useEffect(() => {
    if (activeConnector) {
      loadSpec(activeConnector);
    }
  }, [activeConnector?.id, loadSpec]);

  if (!activeConnector) {
    return <ConnectorSelector />;
  }

  if (specStatus === 'idle' || specStatus === 'loading') {
    return <LoadingScreen message="Синхронизируемся с API" />;
  }

  if (specStatus === 'error') {
    return (
      <ErrorScreen
        title="Не удалось обработать спецификацию"
        message={specError || 'Проверьте подключение или формат Swagger файла'}
        actionLabel="Повторить"
        onAction={() => loadSpec(activeConnector)}
      />
    );
  }

  if (setupState === 'checking') {
    return <LoadingScreen message="Проверяем готовность сервера" />;
  }

  if (setupState === 'error') {
    return (
      <ErrorScreen
        title="Ошибка настройки"
        message={setupError || 'Не удалось получить статус установки'}
        actionLabel="Повторить"
        onAction={refreshSetup}
      />
    );
  }

  if (setupState === 'needs-admin') {
    return <SetupWizard connector={activeConnector} onCompleted={refreshSetup} />;
  }

  if (!token) {
    return <AuthGate connector={activeConnector} />;
  }

  return <Dashboard />;
}

export default App;
