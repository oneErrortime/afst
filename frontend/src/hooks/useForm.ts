import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMachine, formMachine } from '@/lib/stateMachine';

export type ValidationRule<T> = {
  validate: (value: T, formValues: Record<string, unknown>) => boolean;
  message: string;
};

export type FieldConfig<T = unknown> = {
  initialValue: T;
  rules?: ValidationRule<T>[];
  transform?: (value: T) => T;
};

export type FormConfig<T extends Record<string, unknown>> = {
  [K in keyof T]: FieldConfig<T[K]>;
};

export type FormState<T extends Record<string, unknown>> = {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
  submitCount: number;
};

export type FormActions<T extends Record<string, unknown>> = {
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  setError: <K extends keyof T>(field: K, error: string) => void;
  setTouched: <K extends keyof T>(field: K, touched?: boolean) => void;
  validate: () => boolean;
  validateField: <K extends keyof T>(field: K) => boolean;
  reset: () => void;
  submit: () => Promise<void>;
};

export function useForm<T extends Record<string, unknown>>(
  config: FormConfig<T>,
  onSubmit: (values: T) => Promise<void>
): [FormState<T>, FormActions<T>] {
  const getInitialValues = useCallback(() => {
    const values = {} as T;
    for (const key in config) {
      values[key] = config[key].initialValue;
    }
    return values;
  }, [config]);

  const [values, setValuesState] = useState<T>(getInitialValues());
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [state, actions] = useMachine(formMachine);

  useEffect(() => {
    setValuesState(getInitialValues());
  }, [getInitialValues]);

  const validateField = useCallback(
    <K extends keyof T>(field: K): boolean => {
      const fieldConfig = config[field];
      if (!fieldConfig.rules) return true;

      for (const rule of fieldConfig.rules) {
        if (!rule.validate(values[field], values as Record<string, unknown>)) {
          setErrors((prev) => ({ ...prev, [field]: rule.message }));
          return false;
        }
      }
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      return true;
    },
    [config, values]
  );

  const validate = useCallback((): boolean => {
    let isValid = true;
    const newErrors: Partial<Record<keyof T, string>> = {};

    for (const key in config) {
      const fieldConfig = config[key];
      if (fieldConfig.rules) {
        for (const rule of fieldConfig.rules) {
          if (!rule.validate(values[key], values as Record<string, unknown>)) {
            newErrors[key] = rule.message;
            isValid = false;
            break;
          }
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [config, values]);

  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      const fieldConfig = config[field];
      const transformedValue = fieldConfig.transform ? fieldConfig.transform(value) : value;
      setValuesState((prev) => ({ ...prev, [field]: transformedValue }));
      actions.send('CHANGE');
    },
    [config, actions]
  );

  const setValuesAction = useCallback((newValues: Partial<T>) => {
    setValuesState((prev) => ({ ...prev, ...newValues }));
    actions.send('CHANGE');
  }, [actions]);

  const setError = useCallback(<K extends keyof T>(field: K, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const setTouchedAction = useCallback(<K extends keyof T>(field: K, isTouched = true) => {
    setTouched((prev) => ({ ...prev, [field]: isTouched }));
    if (isTouched) {
      validateField(field);
    }
    actions.send('BLUR');
  }, [validateField, actions]);

  const reset = useCallback(() => {
    setValuesState(getInitialValues());
    setErrors({});
    setTouched({});
    actions.reset();
  }, [getInitialValues, actions]);

  const submit = useCallback(async () => {
    actions.send('SUBMIT');
    
    const isValid = validate();
    if (!isValid) {
      actions.send('INVALID');
      return;
    }

    actions.send('VALID');
    
    try {
      await onSubmit(values);
      actions.send('SUCCESS');
    } catch (error) {
      actions.send('ERROR');
      throw error;
    }
  }, [validate, values, onSubmit, actions]);

  const isDirty = useMemo(() => {
    const initialValues = getInitialValues();
    for (const key in values) {
      if (values[key] !== initialValues[key]) return true;
    }
    return false;
  }, [values, getInitialValues]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const formState: FormState<T> = {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    isSubmitting: state.value === 'submitting',
    isSubmitted: state.value === 'success',
    submitCount: state.context.submitCount,
  };

  const formActions: FormActions<T> = {
    setValue,
    setValues: setValuesAction,
    setError,
    setTouched: setTouchedAction,
    validate,
    validateField,
    reset,
    submit,
  };

  return [formState, formActions];
}

export const validators = {
  required: (message = 'Обязательное поле'): ValidationRule<unknown> => ({
    validate: (value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    },
    message,
  }),

  email: (message = 'Некорректный email'): ValidationRule<string> => ({
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value) => value.length >= min,
    message: message || `Минимум ${min} символов`,
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value) => value.length <= max,
    message: message || `Максимум ${max} символов`,
  }),

  min: (min: number, message?: string): ValidationRule<number> => ({
    validate: (value) => value >= min,
    message: message || `Минимум ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule<number> => ({
    validate: (value) => value <= max,
    message: message || `Максимум ${max}`,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule<string> => ({
    validate: (value) => regex.test(value),
    message,
  }),

  match: (fieldName: string, message = 'Поля не совпадают'): ValidationRule<string> => ({
    validate: (value, formValues) => value === formValues[fieldName],
    message,
  }),

  isbn: (message = 'Некорректный ISBN'): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return true;
      const cleaned = value.replace(/[-\s]/g, '');
      return /^(?:\d{10}|\d{13})$/.test(cleaned);
    },
    message,
  }),

  url: (message = 'Некорректный URL'): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  year: (message = 'Некорректный год'): ValidationRule<number> => ({
    validate: (value) => {
      if (!value) return true;
      const currentYear = new Date().getFullYear();
      return value >= 1000 && value <= currentYear + 1;
    },
    message,
  }),
};
