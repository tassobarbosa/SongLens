import { useNavigate } from 'react-router-dom';
import { Badge } from '../ui/badge.tsx';
import { Card, CardContent } from '../ui/card.tsx';
import type { Song } from '../../types/song.ts';

interface SongCardProps {
  song: Song;
  onDelete?: (id: string) => void;
}

const statusLabels: Record<string, string> = {
  uploading: 'Uploading',
  separating: 'Separating',
  transcribing: 'Transcribing',
  converting: 'Converting',
  complete: 'Complete',
  'separation-failed': 'Failed',
  'transcription-failed': 'Failed',
  'conversion-failed': 'Failed',
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SongCard({ song, onDelete }: SongCardProps) {
  const navigate = useNavigate();
  const isFailed = song.status.includes('failed');

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => navigate(`/song/${song.id}`)}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-medium text-foreground">{song.fileName}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatDate(song.uploadedAt)}</span>
            <span>·</span>
            <span>{formatFileSize(song.fileSize)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isFailed ? 'destructive' : song.status === 'complete' ? 'success' : 'secondary'}>
            {statusLabels[song.status] ?? song.status}
          </Badge>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(song.id);
              }}
              className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Delete ${song.fileName}`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
