import { useProcessingState, useProcessingDispatch } from '../context/ProcessingContext.tsx';
import type { ProcessingProgress } from '../types/playback.ts';
import type { ProcessingStatus } from '../types/song.ts';

/**
 * Hook to subscribe to processing state and expose stage/progress/error.
 */
export function useProcessing() {
  const state = useProcessingState();
  const dispatch = useProcessingDispatch();

  const startProcessing = (songId: string) => {
    dispatch({ type: 'START_PROCESSING', songId });
  };

  const updateProgress = (progress: ProcessingProgress) => {
    dispatch({ type: 'UPDATE_PROGRESS', progress });
  };

  const updateStatus = (status: ProcessingStatus) => {
    dispatch({ type: 'UPDATE_STATUS', status });
  };

  const setError = (error: string) => {
    dispatch({ type: 'PROCESSING_ERROR', error });
  };

  const complete = () => {
    dispatch({ type: 'PROCESSING_COMPLETE' });
  };

  const reset = () => {
    dispatch({ type: 'RESET' });
  };

  return {
    songId: state.songId,
    status: state.status,
    progress: state.progress,
    error: state.error,
    isProcessing: state.status !== null && state.status !== 'complete' && !state.error,
    isComplete: state.status === 'complete',
    startProcessing,
    updateProgress,
    updateStatus,
    setError,
    complete,
    reset,
  };
}
