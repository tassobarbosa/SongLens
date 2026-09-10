import { useCallback, useRef, useState, type DragEvent } from 'react';
import { Button } from '../ui/button.tsx';
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB, SUPPORTED_FORMATS, SUPPORTED_EXTENSIONS } from '../../constants/audio.ts';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function FileUpload({ onFileSelect, disabled = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      setError(null);

      if (!SUPPORTED_FORMATS.includes(file.type as (typeof SUPPORTED_FORMATS)[number])) {
        setError(`Unsupported format. Please upload ${SUPPORTED_EXTENSIONS.join(' or ')} files.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`File is too large (${Math.round(file.size / 1024 / 1024)} MB). Max: ${MAX_FILE_SIZE_MB} MB.`);
        return;
      }

      if (file.size === 0) {
        setError('File appears to be empty.');
        return;
      }

      onFileSelect(file);
    },
    [onFileSelect],
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect],
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Upload audio file"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <svg
          className="mb-4 h-12 w-12 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v11.25"
          />
        </svg>
        <p className="text-lg font-medium text-foreground">
          {isDragging ? 'Drop your file here' : 'Drag & drop an audio file'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          or click to browse — MP3 or WAV, up to {MAX_FILE_SIZE_MB} MB
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,audio/mpeg,audio/wav"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
        aria-hidden="true"
      />

      {error && (
        <div className="w-full rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
