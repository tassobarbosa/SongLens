import { useState, useCallback } from 'react';
import { Button } from '../ui/button.tsx';
import { getInstrumentalBlob } from '../../services/storage/songRepository.ts';

interface DownloadButtonProps {
  songId: string;
  fileName: string;
}

export function DownloadButton({ songId, fileName }: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const blob = await getInstrumentalBlob(songId);
      if (!blob) {
        console.error('No instrumental track available');
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const baseName = fileName.replace(/\.[^.]+$/, '');
      link.href = url;
      link.download = `${baseName}_instrumental.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  }, [songId, fileName]);

  return (
    <Button variant="outline" onClick={handleDownload} disabled={downloading}>
      {downloading ? 'Downloading...' : 'Download Instrumental'}
    </Button>
  );
}
