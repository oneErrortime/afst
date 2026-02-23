import { CheckCircle2, XCircle, Clock, Loader2, AlertTriangle, Info, ArrowRight } from 'lucide-react';

export type StateStatus = 'idle' | 'pending' | 'loading' | 'success' | 'error' | 'warning' | 'info';

interface StateIndicatorProps {
  status: StateStatus;
  label?: string;
  message?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const statusConfig: Record<StateStatus, { 
  icon: typeof CheckCircle2; 
  color: string; 
  bgColor: string; 
  borderColor: string;
  pulseColor?: string;
}> = {
  idle: {
    icon: Clock,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
  pending: {
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    pulseColor: 'bg-amber-400',
  },
  loading: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    pulseColor: 'bg-blue-400',
  },
  success: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  error: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  info: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
};

const sizeConfig = {
  sm: { icon: 'h-4 w-4', text: 'text-sm', padding: 'px-2 py-1', gap: 'gap-1.5' },
  md: { icon: 'h-5 w-5', text: 'text-base', padding: 'px-3 py-2', gap: 'gap-2' },
  lg: { icon: 'h-6 w-6', text: 'text-lg', padding: 'px-4 py-3', gap: 'gap-3' },
};

export function StateIndicator({
  status,
  label,
  message,
  showIcon = true,
  size = 'md',
  animate = true,
}: StateIndicatorProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div
      className={`
        inline-flex items-center ${sizes.gap} ${sizes.padding} rounded-lg
        ${config.bgColor} ${config.borderColor} border
        transition-all duration-300
      `}
    >
      {showIcon && (
        <div className="relative">
          <Icon
            className={`${sizes.icon} ${config.color} ${
              status === 'loading' && animate ? 'animate-spin' : ''
            }`}
          />
          {config.pulseColor && animate && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className={`animate-ping absolute h-full w-full rounded-full ${config.pulseColor} opacity-20`} />
            </span>
          )}
        </div>
      )}
      <div className="flex flex-col">
        {label && <span className={`font-medium ${config.color} ${sizes.text}`}>{label}</span>}
        {message && <span className={`text-gray-600 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>{message}</span>}
      </div>
    </div>
  );
}

interface StateBadgeProps {
  status: StateStatus;
  label?: string;
  size?: 'sm' | 'md';
}

export function StateBadge({ status, label, size = 'sm' }: StateBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isSmall = size === 'sm';

  const defaultLabels: Record<StateStatus, string> = {
    idle: 'Ожидание',
    pending: 'В очереди',
    loading: 'Загрузка',
    success: 'Готово',
    error: 'Ошибка',
    warning: 'Внимание',
    info: 'Информация',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full
        ${config.bgColor} ${config.color}
        ${isSmall ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
        font-medium
      `}
    >
      <Icon className={isSmall ? 'h-3 w-3' : 'h-4 w-4'} />
      {label || defaultLabels[status]}
    </span>
  );
}

interface StateProgressProps {
  steps: Array<{ id: string; label: string; status: StateStatus }>;
  currentStep: string;
  size?: 'sm' | 'md';
}

export function StateProgress({ steps, currentStep, size = 'md' }: StateProgressProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isPast = index < currentIndex;
          const isFuture = index > currentIndex;
          const config = statusConfig[step.status];

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex items-center justify-center rounded-full border-2 transition-all
                    ${size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'}
                    ${isActive ? `${config.borderColor} ${config.bgColor}` : ''}
                    ${isPast ? 'border-green-500 bg-green-500' : ''}
                    ${isFuture ? 'border-gray-300 bg-gray-100' : ''}
                  `}
                >
                  {isPast ? (
                    <CheckCircle2 className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} text-white`} />
                  ) : (
                    <span
                      className={`font-semibold ${size === 'sm' ? 'text-sm' : 'text-base'} ${
                        isActive ? config.color : isFuture ? 'text-gray-400' : ''
                      }`}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>
                <span
                  className={`mt-2 text-center ${size === 'sm' ? 'text-xs' : 'text-sm'} ${
                    isActive ? 'font-medium text-gray-900' : isPast ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div className="flex-1 mx-2 mt-[-1.5rem]">
                  <div className={`h-0.5 ${isPast ? 'bg-green-500' : 'bg-gray-300'}`}>
                    {isActive && (
                      <div className="h-full bg-blue-500 animate-pulse" style={{ width: '50%' }} />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface StateTimelineProps {
  events: Array<{
    id: string;
    label: string;
    status: StateStatus;
    timestamp?: Date;
    description?: string;
  }>;
}

export function StateTimeline({ events }: StateTimelineProps) {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {events.map((event, idx) => {
          const config = statusConfig[event.status];
          const Icon = config.icon;
          const isLast = idx === events.length - 1;

          return (
            <li key={event.id}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={`
                        h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white
                        ${config.bgColor}
                      `}
                    >
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.label}</p>
                      {event.description && (
                        <p className="mt-0.5 text-sm text-gray-500">{event.description}</p>
                      )}
                    </div>
                    {event.timestamp && (
                      <div className="whitespace-nowrap text-right text-sm text-gray-500">
                        {event.timestamp.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
