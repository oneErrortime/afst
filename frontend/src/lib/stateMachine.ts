import { useCallback, useMemo, useReducer } from 'react';

export type StateValue = string;
export type EventType = string;

export interface StateConfig<TContext = unknown> {
  on?: Record<EventType, StateValue | { target: StateValue; actions?: Array<(ctx: TContext) => TContext> }>;
  entry?: Array<(ctx: TContext) => TContext>;
  exit?: Array<(ctx: TContext) => TContext>;
}

export interface MachineConfig<TContext = unknown> {
  id: string;
  initial: StateValue;
  context: TContext;
  states: Record<StateValue, StateConfig<TContext>>;
}

export interface MachineState<TContext = unknown> {
  value: StateValue;
  context: TContext;
  history: StateValue[];
}

export interface MachineActions {
  send: (event: EventType) => void;
  can: (event: EventType) => boolean;
  reset: () => void;
  matches: (state: StateValue) => boolean;
}

export function createMachine<TContext>(config: MachineConfig<TContext>) {
  return config;
}

type MachineReducerAction<TContext> =
  | { type: 'SEND'; event: EventType; config: MachineConfig<TContext> }
  | { type: 'RESET'; config: MachineConfig<TContext> };

function machineReducer<TContext>(
  state: MachineState<TContext>,
  action: MachineReducerAction<TContext>
): MachineState<TContext> {
  switch (action.type) {
    case 'SEND': {
      const { event, config } = action;
      const currentStateConfig = config.states[state.value];
      if (!currentStateConfig?.on?.[event]) return state;

      const transition = currentStateConfig.on[event];
      const targetState = typeof transition === 'string' ? transition : transition.target;
      const transitionActions = typeof transition === 'object' ? transition.actions : undefined;

      let newContext = state.context;

      if (currentStateConfig.exit) {
        for (const exitAction of currentStateConfig.exit) {
          newContext = exitAction(newContext);
        }
      }

      if (transitionActions) {
        for (const transitionAction of transitionActions) {
          newContext = transitionAction(newContext);
        }
      }

      const newStateConfig = config.states[targetState];
      if (newStateConfig?.entry) {
        for (const entryAction of newStateConfig.entry) {
          newContext = entryAction(newContext);
        }
      }

      return {
        value: targetState,
        context: newContext,
        history: [...state.history, state.value],
      };
    }
    case 'RESET': {
      const { config } = action;
      let context = config.context;
      const initialStateConfig = config.states[config.initial];
      if (initialStateConfig?.entry) {
        for (const entryAction of initialStateConfig.entry) {
          context = entryAction(context);
        }
      }
      return {
        value: config.initial,
        context,
        history: [],
      };
    }
    default:
      return state;
  }
}

export function useMachine<TContext>(
  config: MachineConfig<TContext>
): [MachineState<TContext>, MachineActions] {
  const initialState = useMemo<MachineState<TContext>>(() => {
    let context = config.context;
    const initialStateConfig = config.states[config.initial];
    if (initialStateConfig?.entry) {
      for (const entryAction of initialStateConfig.entry) {
        context = entryAction(context);
      }
    }
    return {
      value: config.initial,
      context,
      history: [],
    };
  }, []);

  const [state, dispatch] = useReducer(machineReducer<TContext>, initialState);

  const send = useCallback(
    (event: EventType) => {
      dispatch({ type: 'SEND', event, config });
    },
    [config]
  );

  const can = useCallback(
    (event: EventType): boolean => {
      const currentStateConfig = config.states[state.value];
      return !!currentStateConfig?.on?.[event];
    },
    [config, state.value]
  );

  const reset = useCallback(() => {
    dispatch({ type: 'RESET', config });
  }, [config]);

  const matches = useCallback(
    (stateValue: StateValue): boolean => state.value === stateValue,
    [state.value]
  );

  const actions = useMemo<MachineActions>(
    () => ({ send, can, reset, matches }),
    [send, can, reset, matches]
  );

  return [state, actions];
}

export const borrowingMachine = createMachine({
  id: 'borrowing',
  initial: 'idle',
  context: {
    bookId: null as string | null,
    readerId: null as string | null,
    error: null as string | null,
    loanId: null as string | null,
  },
  states: {
    idle: {
      on: {
        START: 'selecting_book',
      },
    },
    selecting_book: {
      on: {
        SELECT_BOOK: {
          target: 'selecting_reader',
          actions: [(ctx) => ({ ...ctx, error: null })],
        },
        CANCEL: 'idle',
      },
    },
    selecting_reader: {
      on: {
        SELECT_READER: 'confirming',
        BACK: 'selecting_book',
        CANCEL: 'idle',
      },
    },
    confirming: {
      on: {
        CONFIRM: 'processing',
        BACK: 'selecting_reader',
        CANCEL: 'idle',
      },
    },
    processing: {
      on: {
        SUCCESS: 'success',
        ERROR: {
          target: 'error',
          actions: [(ctx) => ({ ...ctx })],
        },
      },
    },
    success: {
      on: {
        RESET: 'idle',
        BORROW_ANOTHER: 'selecting_book',
      },
    },
    error: {
      on: {
        RETRY: 'confirming',
        RESET: 'idle',
      },
    },
  },
});

export const readingSessionMachine = createMachine({
  id: 'reading',
  initial: 'idle',
  context: {
    bookId: null as string | null,
    fileId: null as string | null,
    currentPage: 0,
    totalPages: 0,
    startTime: null as number | null,
    elapsedTime: 0,
    error: null as string | null,
  },
  states: {
    idle: {
      on: {
        OPEN_BOOK: 'loading',
      },
    },
    loading: {
      on: {
        LOADED: 'reading',
        ERROR: 'error',
      },
      entry: [(ctx) => ({ ...ctx, error: null })],
    },
    reading: {
      on: {
        PAUSE: 'paused',
        CLOSE: 'closing',
        PAGE_CHANGE: 'reading',
        ERROR: 'error',
      },
      entry: [(ctx) => ({ ...ctx, startTime: Date.now() })],
    },
    paused: {
      on: {
        RESUME: 'reading',
        CLOSE: 'closing',
      },
      entry: [(ctx) => ({
        ...ctx,
        elapsedTime: ctx.elapsedTime + (ctx.startTime ? Date.now() - ctx.startTime : 0),
      })],
    },
    closing: {
      on: {
        CLOSED: 'idle',
        ERROR: 'error',
      },
    },
    error: {
      on: {
        RETRY: 'loading',
        CLOSE: 'idle',
      },
    },
  },
});

export const formMachine = createMachine({
  id: 'form',
  initial: 'idle',
  context: {
    errors: {} as Record<string, string>,
    touched: {} as Record<string, boolean>,
    isValid: false,
    submitCount: 0,
  },
  states: {
    idle: {
      on: {
        CHANGE: 'editing',
        SUBMIT: 'validating',
      },
    },
    editing: {
      on: {
        CHANGE: 'editing',
        BLUR: 'editing',
        SUBMIT: 'validating',
      },
    },
    validating: {
      on: {
        VALID: 'submitting',
        INVALID: 'editing',
      },
    },
    submitting: {
      on: {
        SUCCESS: 'success',
        ERROR: 'error',
      },
      entry: [(ctx) => ({ ...ctx, submitCount: ctx.submitCount + 1 })],
    },
    success: {
      on: {
        RESET: 'idle',
        EDIT: 'editing',
      },
    },
    error: {
      on: {
        RETRY: 'submitting',
        EDIT: 'editing',
        RESET: 'idle',
      },
    },
  },
});

export const subscriptionMachine = createMachine({
  id: 'subscription',
  initial: 'idle',
  context: {
    planId: null as string | null,
    currentPlan: null as string | null,
    error: null as string | null,
  },
  states: {
    idle: {
      on: {
        SELECT_PLAN: 'selected',
      },
    },
    selected: {
      on: {
        CHANGE_PLAN: 'selected',
        CONFIRM: 'processing',
        CANCEL: 'idle',
      },
    },
    processing: {
      on: {
        SUCCESS: 'active',
        ERROR: 'error',
      },
    },
    active: {
      on: {
        UPGRADE: 'selected',
        DOWNGRADE: 'selected',
        CANCEL_SUB: 'cancelling',
      },
    },
    cancelling: {
      on: {
        CONFIRM_CANCEL: 'processing_cancel',
        ABORT: 'active',
      },
    },
    processing_cancel: {
      on: {
        SUCCESS: 'idle',
        ERROR: 'error',
      },
    },
    error: {
      on: {
        RETRY: 'processing',
        RESET: 'idle',
      },
    },
  },
});
