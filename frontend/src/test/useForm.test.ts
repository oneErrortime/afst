/**
 * Tests for useForm hook
 * Covers: initial values, validation, submit state machine, reset
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useForm, validators } from '@/hooks/useForm';

const config = {
  email: { initialValue: '', rules: [validators.required(), validators.email()] },
  password: { initialValue: '', rules: [validators.minLength(6)] },
};

describe('useForm — initialisation', () => {
  it('initialises with empty values from config', () => {
    const { result } = renderHook(() => useForm(config, vi.fn()));
    const [state] = result.current;
    expect(state.values.email).toBe('');
    expect(state.values.password).toBe('');
  });

  it('initial state is not dirty', () => {
    const { result } = renderHook(() => useForm(config, vi.fn()));
    expect(result.current[0].isDirty).toBe(false);
  });

  it('initial state is not submitting', () => {
    const { result } = renderHook(() => useForm(config, vi.fn()));
    expect(result.current[0].isSubmitting).toBe(false);
  });
});

describe('useForm — setValue', () => {
  it('updates field value', () => {
    const { result } = renderHook(() => useForm(config, vi.fn()));
    act(() => { result.current[1].setValue('email', 'hello@test.com'); });
    expect(result.current[0].values.email).toBe('hello@test.com');
  });

  it('marks form as dirty after change', () => {
    const { result } = renderHook(() => useForm(config, vi.fn()));
    act(() => { result.current[1].setValue('email', 'x@y.com'); });
    expect(result.current[0].isDirty).toBe(true);
  });
});

describe('useForm — validation', () => {
  it('validate() returns false with empty required field', () => {
    const { result } = renderHook(() => useForm(config, vi.fn()));
    let valid = false;
    act(() => { valid = result.current[1].validate(); });
    expect(valid).toBe(false);
    expect(result.current[0].errors.email).toBeTruthy();
  });

  it('validate() returns false with invalid email', () => {
    const { result } = renderHook(() => useForm(config, vi.fn()));
    act(() => { result.current[1].setValue('email', 'not-an-email'); });
    let valid = false;
    act(() => { valid = result.current[1].validate(); });
    expect(valid).toBe(false);
    expect(result.current[0].errors.email).toMatch(/email/i);
  });

  it('validate() returns true with valid values', () => {
    const { result } = renderHook(() => useForm(config, vi.fn()));
    act(() => {
      result.current[1].setValue('email', 'user@example.com');
      result.current[1].setValue('password', 'secret123');
    });
    let valid = false;
    act(() => { valid = result.current[1].validate(); });
    expect(valid).toBe(true);
    expect(Object.keys(result.current[0].errors)).toHaveLength(0);
  });

  it('minLength rule rejects short password', () => {
    const { result } = renderHook(() => useForm(config, vi.fn()));
    act(() => {
      result.current[1].setValue('email', 'a@b.com');
      result.current[1].setValue('password', 'abc');
    });
    act(() => { result.current[1].validate(); });
    expect(result.current[0].errors.password).toBeTruthy();
  });
});

describe('useForm — submit', () => {
  it('calls onSubmit with form values when valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useForm(config, onSubmit));
    act(() => {
      result.current[1].setValue('email', 'user@example.com');
      result.current[1].setValue('password', 'password123');
    });
    await act(async () => { await result.current[1].submit(); });
    expect(onSubmit).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' });
  });

  it('does NOT call onSubmit when validation fails', async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useForm(config, onSubmit));
    await act(async () => { await result.current[1].submit(); });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('form isSubmitted=true after successful submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useForm(config, onSubmit));
    act(() => {
      result.current[1].setValue('email', 'u@x.com');
      result.current[1].setValue('password', 'pass1234');
    });
    await act(async () => { await result.current[1].submit(); });
    expect(result.current[0].isSubmitted).toBe(true);
  });
});

describe('useForm — reset', () => {
  it('resets to initial values', () => {
    const { result } = renderHook(() => useForm(config, vi.fn()));
    act(() => { result.current[1].setValue('email', 'changed@x.com'); });
    act(() => { result.current[1].reset(); });
    expect(result.current[0].values.email).toBe('');
    expect(result.current[0].isDirty).toBe(false);
    expect(result.current[0].errors).toEqual({});
  });
});

describe('validators', () => {
  it('required: rejects empty string', () => {
    expect(validators.required().validate('', {})).toBe(false);
  });
  it('required: rejects whitespace-only', () => {
    expect(validators.required().validate('   ', {})).toBe(false);
  });
  it('required: accepts non-empty string', () => {
    expect(validators.required().validate('hello', {})).toBe(true);
  });
  it('email: accepts valid format', () => {
    expect(validators.email().validate('a@b.com', {})).toBe(true);
  });
  it('email: rejects invalid format', () => {
    expect(validators.email().validate('not-email', {})).toBe(false);
  });
  it('isbn: accepts valid ISBN-13', () => {
    expect(validators.isbn().validate('9785389079601', {})).toBe(true);
  });
  it('isbn: accepts empty (optional field)', () => {
    expect(validators.isbn().validate('', {})).toBe(true);
  });
  it('year: rejects year 999', () => {
    expect(validators.year().validate(999, {})).toBe(false);
  });
  it('year: accepts 2024', () => {
    expect(validators.year().validate(2024, {})).toBe(true);
  });
});
