import { Button } from '../ui/button.tsx';
import { Progress } from '../ui/progress.tsx';
import type { PlaybackState, ListeningMode } from '../../types/playback.ts';

interface PlaybackControlsProps {
  state: PlaybackState;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onModeChange?: (mode: ListeningMode) => void;
  showModeSelector?: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function PlaybackControls({
  state,
  onPlay,
  onPause,
  onSeek,
  onModeChange,
  showModeSelector = false,
}: PlaybackControlsProps) {
  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-4">
        {/* Play/Pause button */}
        <Button
          variant="default"
          size="icon"
          onClick={state.isPlaying ? onPause : onPlay}
          aria-label={state.isPlaying ? 'Pause' : 'Play'}
        >
          {state.isPlaying ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </Button>

        {/* Seek bar */}
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={state.duration || 1}
            value={state.currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="w-full cursor-pointer accent-primary"
            aria-label="Seek"
          />
        </div>

        {/* Time display */}
        <span className="min-w-[80px] text-right text-sm text-muted-foreground">
          {formatTime(state.currentTime)} / {formatTime(state.duration)}
        </span>
      </div>

      {/* Measure/beat indicator */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Measure {state.currentMeasure}, Beat {state.currentBeat}
        </span>

        {/* Listening mode selector */}
        {showModeSelector && onModeChange && (
          <div className="flex gap-2">
            <button
              onClick={() => onModeChange('midi')}
              className={`rounded-md px-3 py-1 text-xs transition-colors ${
                state.listeningMode === 'midi'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              MIDI Only
            </button>
            <button
              onClick={() => onModeChange('instrumental-midi')}
              className={`rounded-md px-3 py-1 text-xs transition-colors ${
                state.listeningMode === 'instrumental-midi'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              Instrumental + MIDI
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
