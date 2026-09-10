import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import type { ProcessingProgress } from '../types/playback.ts';
import type { ProcessingStatus } from '../types/song.ts';

interface ProcessingState {
  /** Currently processing song ID */
  songId: string | null;
  status: ProcessingStatus | null;
  progress: ProcessingProgress | null;
  error: string | null;
}

type ProcessingAction =
  | { type: 'START_PROCESSING'; songId: string }
  | { type: 'UPDATE_PROGRESS'; progress: ProcessingProgress }
  | { type: 'UPDATE_STATUS'; status: ProcessingStatus }
  | { type: 'PROCESSING_ERROR'; error: string }
  | { type: 'PROCESSING_COMPLETE' }
  | { type: 'RESET' };

const initialState: ProcessingState = {
  songId: null,
  status: null,
  progress: null,
  error: null,
};

function processingReducer(state: ProcessingState, action: ProcessingAction): ProcessingState {
  switch (action.type) {
    case 'START_PROCESSING':
      return { songId: action.songId, status: 'uploading', progress: null, error: null };
    case 'UPDATE_PROGRESS':
      return { ...state, progress: action.progress };
    case 'UPDATE_STATUS':
      return { ...state, status: action.status, error: null };
    case 'PROCESSING_ERROR':
      return { ...state, error: action.error };
    case 'PROCESSING_COMPLETE':
      return { ...state, status: 'complete', progress: null };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const ProcessingStateContext = createContext<ProcessingState>(initialState);
const ProcessingDispatchContext = createContext<Dispatch<ProcessingAction>>(() => {});

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(processingReducer, initialState);

  return (
    <ProcessingStateContext.Provider value={state}>
      <ProcessingDispatchContext.Provider value={dispatch}>
        {children}
      </ProcessingDispatchContext.Provider>
    </ProcessingStateContext.Provider>
  );
}

export function useProcessingState(): ProcessingState {
  return useContext(ProcessingStateContext);
}

export function useProcessingDispatch(): Dispatch<ProcessingAction> {
  return useContext(ProcessingDispatchContext);
}
