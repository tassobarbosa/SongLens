import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUpload } from '../../components/FileUpload/index.ts';
import { ProcessingProgressDisplay } from '../../components/ProcessingProgress/index.ts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card.tsx';
import { useProcessing } from '../../hooks/useProcessing.ts';
import { runProcessingPipeline } from '../../services/processing/processingPipeline.ts';

export function UploadPage() {
  const navigate = useNavigate();
  const processing = useProcessing();

  const handleFileSelect = useCallback(
    async (file: File) => {
      const songId = crypto.randomUUID();
      processing.startProcessing(songId);

      // Navigate to the viewer page immediately
      navigate(`/song/${songId}`);

      // Start the processing pipeline in the background
      await runProcessingPipeline(file, songId, {
        onProgress: processing.updateProgress,
        onStatusChange: processing.updateStatus,
        onError: processing.setError,
        onComplete: processing.complete,
      });
    },
    [navigate, processing],
  );

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Upload a Song</h1>
        <p className="mt-2 text-muted-foreground">
          Upload an MP3 or WAV file to generate interactive guitar tablature
        </p>
      </div>

      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          {processing.isProcessing ? (
            <ProcessingProgressDisplay
              progress={processing.progress}
              error={processing.error}
            />
          ) : (
            <FileUpload onFileSelect={handleFileSelect} disabled={processing.isProcessing} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
