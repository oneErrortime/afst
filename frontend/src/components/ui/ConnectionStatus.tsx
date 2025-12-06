import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useApiConfigStore } from '@/store/apiConfigStore';

interface ConnectionStatusProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ConnectionStatus({ showText = false, size = 'md' }: ConnectionStatusProps) {
  const { connectionStatus } = useApiConfigStore();

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const iconSize = sizeClasses[size];

  const getStatusContent = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <div className="flex items-center gap-1.5 text-green-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            {showText && <span className="text-xs">Подключено</span>}
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-red-600">
            <WifiOff className={iconSize} />
            {showText && <span className="text-xs">Ошибка</span>}
          </div>
        );
      case 'checking':
        return (
          <div className="flex items-center gap-1.5 text-blue-600">
            <Loader2 className={`${iconSize} animate-spin`} />
            {showText && <span className="text-xs">Проверка...</span>}
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-yellow-600">
            <Wifi className={iconSize} />
            {showText && <span className="text-xs">Неизвестно</span>}
          </div>
        );
    }
  };

  return getStatusContent();
}
