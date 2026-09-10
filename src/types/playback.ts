/** Listening mode for playback */
export type ListeningMode = 'midi' | 'instrumental-midi';

/** Current playback state */
export interface PlaybackState {
  isPlaying: boolean;
  /** Current time in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  currentMeasure: number;
  currentBeat: number;
  listeningMode: ListeningMode;
}

/** Processing progress for the current pipeline stage */
export interface ProcessingProgress {
  stage: 'uploading' | 'separating' | 'transcribing' | 'converting';
  /** Progress 0.0 to 1.0 */
  progress: number;
  message: string;
}
