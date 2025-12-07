import { Fragment, useState, useEffect } from 'react';
import { AlertTriangle, Trash2, Check, X, Info, AlertCircle } from 'lucide-react';
import { Button } from './Button';

type DialogType = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: DialogType;
  loading?: boolean;
  requireTyping?: string;
}

const iconMap = {
  danger: Trash2,
  warning: AlertTriangle,
  info: Info,
  success: Check,
};

const colorMap = {
  danger: {
    bg: 'bg-red-100',
    icon: 'text-red-600',
    ring: 'ring-red-600/20',
    button: 'danger' as const,
  },
  warning: {
    bg: 'bg-amber-100',
    icon: 'text-amber-600',
    ring: 'ring-amber-600/20',
    button: 'warning' as const,
  },
  info: {
    bg: 'bg-blue-100',
    icon: 'text-blue-600',
    ring: 'ring-blue-600/20',
    button: 'primary' as const,
  },
  success: {
    bg: 'bg-green-100',
    icon: 'text-green-600',
    ring: 'ring-green-600/20',
    button: 'success' as const,
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  type = 'danger',
  loading = false,
  requireTyping,
}: ConfirmDialogProps) {
  const [typedText, setTypedText] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setTypedText('');
        setIsConfirming(false);
        setShowSuccess(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const Icon = iconMap[type];
  const colors = colorMap[type];

  const canConfirm = !requireTyping || typedText === requireTyping;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    
    setIsConfirming(true);
    try {
      await onConfirm();
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch {
      setIsConfirming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Fragment>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in transform"
          onClick={(e) => e.stopPropagation()}
          style={{
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${colors.bg} ring-8 ${colors.ring}`}>
                {showSuccess ? (
                  <Check className="h-6 w-6 text-green-600 animate-bounce" />
                ) : (
                  <Icon className={`h-6 w-6 ${colors.icon}`} />
                )}
              </div>
              
              <div className="flex-1 pt-1">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{message}</p>
              </div>
              
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {requireTyping && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Введите <code className="px-1.5 py-0.5 bg-gray-100 rounded text-red-600 font-mono">{requireTyping}</code> для подтверждения:
                </label>
                <input
                  type="text"
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  className={`input ${
                    typedText && typedText !== requireTyping
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : typedText === requireTyping
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20'
                      : ''
                  }`}
                  placeholder={requireTyping}
                  autoFocus
                />
                {typedText && typedText !== requireTyping && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Текст не совпадает
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={isConfirming || loading}
            >
              {cancelText}
            </Button>
            <Button
              variant={colors.button}
              onClick={handleConfirm}
              loading={isConfirming || loading}
              success={showSuccess}
              className="flex-1"
              disabled={!canConfirm}
            >
              {showSuccess ? 'Готово!' : confirmText}
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </Fragment>
  );
}

export function useConfirmDialog() {
  const [state, setState] = useState<{
    isOpen: boolean;
    config: Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>;
    resolver: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    config: { title: '', message: '' },
    resolver: null,
  });

  const confirm = (config: Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>) => {
    return new Promise<boolean>((resolve) => {
      setState({
        isOpen: true,
        config,
        resolver: resolve,
      });
    });
  };

  const handleClose = () => {
    state.resolver?.(false);
    setState((prev) => ({ ...prev, isOpen: false, resolver: null }));
  };

  const handleConfirm = () => {
    state.resolver?.(true);
    setState((prev) => ({ ...prev, isOpen: false, resolver: null }));
  };

  const DialogComponent = (
    <ConfirmDialog
      isOpen={state.isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      {...state.config}
    />
  );

  return { confirm, DialogComponent };
}
