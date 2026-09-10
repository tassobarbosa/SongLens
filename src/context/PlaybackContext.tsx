import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import type { PlaybackState, ListeningMode } from '../types/playback.ts';

type PlaybackAction =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'SEEK'; time: number }
  | { type: 'UPDATE_POSITION'; currentTime: number; currentMeasure: number; currentBeat: number }
  | { type: 'SET_DURATION'; duration: number }
  | { type: 'SET_MODE'; mode: ListeningMode }
  | { type: 'RESET' };

const initialState: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  currentMeasure: 1,
  currentBeat: 1,
  listeningMode: 'midi',
};

function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case 'PLAY':
      return { ...state, isPlaying: true };
    case 'PAUSE':
      return { ...state, isPlaying: false };
    case 'SEEK':
      return { ...state, currentTime: action.time };
    case 'UPDATE_POSITION':
      return {
        ...state,
        currentTime: action.currentTime,
        currentMeasure: action.currentMeasure,
        currentBeat: action.currentBeat,
      };
    case 'SET_DURATION':
      return { ...state, duration: action.duration };
    case 'SET_MODE':
      return { ...state, listeningMode: action.mode };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const PlaybackStateContext = createContext<PlaybackState>(initialState);
const PlaybackDispatchContext = createContext<Dispatch<PlaybackAction>>(() => {});

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(playbackReducer, initialState);

  return (
    <PlaybackStateContext.Provider value={state}>
      <PlaybackDispatchContext.Provider value={dispatch}>
        {children}
      </PlaybackDispatchContext.Provider>
    </PlaybackStateContext.Provider>
  );
}

export function usePlaybackState(): PlaybackState {
  return useContext(PlaybackStateContext);
}

export function usePlaybackDispatch(): Dispatch<PlaybackAction> {
  return useContext(PlaybackDispatchContext);
}
