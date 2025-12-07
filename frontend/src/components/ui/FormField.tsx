import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

type FieldStatus = 'idle' | 'valid' | 'invalid' | 'warning';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  status?: FieldStatus;
  touched?: boolean;
  showStatusIcon?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      error,
      hint,
      status = 'idle',
      touched = false,
      showStatusIcon = true,
      leftIcon,
      rightIcon,
      containerClassName = '',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const fieldId = id || props.name;
    const showError = touched && error;
    const showValid = touched && !error && status === 'valid';

    const statusStyles: Record<FieldStatus, string> = {
      idle: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
      valid: 'border-green-500 focus:border-green-500 focus:ring-green-500',
      invalid: 'border-red-500 focus:border-red-500 focus:ring-red-500',
      warning: 'border-amber-500 focus:border-amber-500 focus:ring-amber-500',
    };

    const computedStatus: FieldStatus = showError ? 'invalid' : showValid ? 'valid' : status;

    return (
      <div className={containerClassName}>
        {label && (
          <label
            htmlFor={fieldId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={fieldId}
            className={`
              w-full rounded-lg border px-3 py-2 text-gray-900
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${statusStyles[computedStatus]}
              ${leftIcon ? 'pl-10' : ''}
              ${(rightIcon || showStatusIcon) ? 'pr-10' : ''}
              ${className}
            `}
            aria-invalid={computedStatus === 'invalid'}
            aria-describedby={
              showError ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
            }
            {...props}
          />
          
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {showStatusIcon && showError && (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            {showStatusIcon && showValid && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            {!showStatusIcon && rightIcon}
          </div>
        </div>

        {showError && (
          <p
            id={`${fieldId}-error`}
            className="mt-1 text-sm text-red-600 flex items-center gap-1"
          >
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            {error}
          </p>
        )}
        
        {hint && !showError && (
          <p
            id={`${fieldId}-hint`}
            className="mt-1 text-sm text-gray-500 flex items-center gap-1"
          >
            <Info className="h-3.5 w-3.5 flex-shrink-0" />
            {hint}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  hint?: string;
  touched?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  containerClassName?: string;
}

export function FormSelect({
  label,
  error,
  hint,
  touched = false,
  options,
  placeholder,
  containerClassName = '',
  className = '',
  id,
  ...props
}: FormSelectProps) {
  const fieldId = id || props.name;
  const showError = touched && error;

  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        id={fieldId}
        className={`
          w-full rounded-lg border px-3 py-2 text-gray-900
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${showError
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
          }
          ${className}
        `}
        aria-invalid={!!showError}
        aria-describedby={showError ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {showError && (
        <p id={`${fieldId}-error`} className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
      
      {hint && !showError && (
        <p id={`${fieldId}-hint`} className="mt-1 text-sm text-gray-500 flex items-center gap-1">
          <Info className="h-3.5 w-3.5 flex-shrink-0" />
          {hint}
        </p>
      )}
    </div>
  );
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  touched?: boolean;
  containerClassName?: string;
}

export function FormTextarea({
  label,
  error,
  hint,
  touched = false,
  containerClassName = '',
  className = '',
  id,
  ...props
}: FormTextareaProps) {
  const fieldId = id || props.name;
  const showError = touched && error;

  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        id={fieldId}
        className={`
          w-full rounded-lg border px-3 py-2 text-gray-900
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:bg-gray-100 disabled:cursor-not-allowed
          resize-y min-h-[80px]
          ${showError
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
          }
          ${className}
        `}
        aria-invalid={!!showError}
        aria-describedby={showError ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        {...props}
      />

      {showError && (
        <p id={`${fieldId}-error`} className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
      
      {hint && !showError && (
        <p id={`${fieldId}-hint`} className="mt-1 text-sm text-gray-500 flex items-center gap-1">
          <Info className="h-3.5 w-3.5 flex-shrink-0" />
          {hint}
        </p>
      )}
    </div>
  );
}

interface FormCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
  error?: string;
  containerClassName?: string;
}

export function FormCheckbox({
  label,
  description,
  error,
  containerClassName = '',
  className = '',
  id,
  ...props
}: FormCheckboxProps) {
  const fieldId = id || props.name;

  return (
    <div className={containerClassName}>
      <label htmlFor={fieldId} className="flex items-start gap-3 cursor-pointer group">
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            id={fieldId}
            className={`
              h-4 w-4 rounded border-gray-300
              text-primary-600 focus:ring-primary-500
              transition-colors
              ${className}
            `}
            {...props}
          />
        </div>
        <div className="flex-1">
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
            {label}
          </span>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      </label>
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1 ml-7">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
