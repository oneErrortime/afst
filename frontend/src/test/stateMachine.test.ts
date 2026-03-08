/**
 * Tests for useMachine / stateMachine
 * Covers: transitions, guards, context mutations, reset
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMachine, formMachine, borrowingMachine } from '@/lib/stateMachine';

describe('useMachine — formMachine', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useMachine(formMachine));
    expect(result.current[0].value).toBe('idle');
  });

  it('transitions idle → editing on CHANGE', () => {
    const { result } = renderHook(() => useMachine(formMachine));
    act(() => result.current[1].send('CHANGE'));
    expect(result.current[0].value).toBe('editing');
  });

  it('transitions editing → validating on SUBMIT', () => {
    const { result } = renderHook(() => useMachine(formMachine));
    act(() => { result.current[1].send('CHANGE'); result.current[1].send('SUBMIT'); });
    expect(result.current[0].value).toBe('validating');
  });

  it('transitions validating → submitting on VALID', () => {
    const { result } = renderHook(() => useMachine(formMachine));
    act(() => {
      result.current[1].send('CHANGE');
      result.current[1].send('SUBMIT');
      result.current[1].send('VALID');
    });
    expect(result.current[0].value).toBe('submitting');
  });

  it('increments submitCount on entering submitting', () => {
    const { result } = renderHook(() => useMachine(formMachine));
    act(() => {
      result.current[1].send('CHANGE');
      result.current[1].send('SUBMIT');
      result.current[1].send('VALID');
    });
    expect(result.current[0].context.submitCount).toBe(1);
  });

  it('transitions submitting → success on SUCCESS', () => {
    const { result } = renderHook(() => useMachine(formMachine));
    act(() => {
      result.current[1].send('CHANGE');
      result.current[1].send('SUBMIT');
      result.current[1].send('VALID');
      result.current[1].send('SUCCESS');
    });
    expect(result.current[0].value).toBe('success');
  });

  it('transitions submitting → error on ERROR', () => {
    const { result } = renderHook(() => useMachine(formMachine));
    act(() => {
      result.current[1].send('CHANGE');
      result.current[1].send('SUBMIT');
      result.current[1].send('VALID');
      result.current[1].send('ERROR');
    });
    expect(result.current[0].value).toBe('error');
  });

  it('reset() goes back to idle', () => {
    const { result } = renderHook(() => useMachine(formMachine));
    act(() => {
      result.current[1].send('CHANGE');
      result.current[1].send('SUBMIT');
      result.current[1].send('VALID');
      result.current[1].send('SUCCESS');
      result.current[1].reset();
    });
    expect(result.current[0].value).toBe('idle');
  });

  it('can() returns false for invalid event in current state', () => {
    const { result } = renderHook(() => useMachine(formMachine));
    // idle cannot do SUCCESS directly
    expect(result.current[1].can('SUCCESS')).toBe(false);
  });

  it('ignores unknown events silently', () => {
    const { result } = renderHook(() => useMachine(formMachine));
    act(() => result.current[1].send('TOTALLY_UNKNOWN_EVENT' as never));
    expect(result.current[0].value).toBe('idle'); // unchanged
  });
});

describe('useMachine — borrowingMachine', () => {
  it('starts in idle', () => {
    const { result } = renderHook(() => useMachine(borrowingMachine));
    expect(result.current[0].value).toBe('idle');
  });

  it('full happy path: idle → select_book → select_reader → confirm → process → success', () => {
    const { result } = renderHook(() => useMachine(borrowingMachine));
    act(() => {
      result.current[1].send('START');
      result.current[1].send('SELECT_BOOK');
      result.current[1].send('SELECT_READER');
      result.current[1].send('CONFIRM');
      result.current[1].send('SUCCESS');
    });
    expect(result.current[0].value).toBe('success');
  });

  it('CANCEL from any selecting state goes to idle', () => {
    const { result } = renderHook(() => useMachine(borrowingMachine));
    act(() => {
      result.current[1].send('START');
      result.current[1].send('SELECT_BOOK');
      result.current[1].send('CANCEL');
    });
    expect(result.current[0].value).toBe('idle');
  });

  it('records history', () => {
    const { result } = renderHook(() => useMachine(borrowingMachine));
    act(() => { result.current[1].send('START'); });
    expect(result.current[0].history).toContain('idle');
  });
});
