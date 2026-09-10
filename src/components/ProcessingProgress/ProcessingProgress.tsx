import { Progress } from '../ui/progress.tsx';
import type { ProcessingProgress } from '../../types/playback.ts';
import { STAGE_NAMES } from '../../constants/processing.ts';

interface ProcessingProgressProps {
  progress: ProcessingProgress | null;
  error: string | null;
}

const STAGES = ['uploading', 'separating', 'transcribing', 'converting'] as const;

export function ProcessingProgressDisplay({ progress, error }: ProcessingProgressProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="rounded-full bg-destructive/10 p-4">
          <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-center text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!progress) return null;

  const currentStageIdx = STAGES.indexOf(progress.stage);

  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="flex flex-col items-center gap-2">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm font-medium text-foreground">
          {STAGE_NAMES[progress.stage]}
        </p>
        <p className="text-xs text-muted-foreground">{progress.message}</p>
      </div>

      <Progress value={progress.progress * 100} />

      <div className="flex justify-between">
        {STAGES.map((stage, idx) => (
          <div
            key={stage}
            className={`flex flex-col items-center gap-1 ${
              idx <= currentStageIdx ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <div
              className={`h-3 w-3 rounded-full ${
                idx < currentStageIdx
                  ? 'bg-primary'
                  : idx === currentStageIdx
                    ? 'bg-primary animate-pulse'
                    : 'bg-muted'
              }`}
            />
            <span className="text-xs">{STAGE_NAMES[stage]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
