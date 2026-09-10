import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TabViewer } from '../../components/TabViewer/index.ts';
import { ProcessingProgressDisplay } from '../../components/ProcessingProgress/index.ts';
import { DownloadButton } from '../../components/DownloadButton/index.ts';
import { PlaybackControls } from '../../components/PlaybackControls/index.ts';
import { ConfidenceDisplay } from '../../components/ConfidenceDisplay/index.ts';
import { Button } from '../../components/ui/button.tsx';
import { Card, CardContent } from '../../components/ui/card.tsx';
import { useProcessing } from '../../hooks/useProcessing.ts';
import { usePlayback } from '../../hooks/usePlayback.ts';
import { getSongById, getTab, getStems, getConfidenceReport } from '../../services/storage/songRepository.ts';
import type { Song } from '../../types/song.ts';
import type { GuitarTab } from '../../types/tab.ts';
import type { ConfidenceReport } from '../../types/confidence.ts';

export function SongViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const processing = useProcessing();
  const playback = usePlayback();

  const [song, setSong] = useState<Song | null>(null);
  const [tab, setTab] = useState<GuitarTab | null>(null);
  const [confidenceReport, setConfidenceReport] = useState<ConfidenceReport | null>(null);
  const [hasInstrumental, setHasInstrumental] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load song and tab from IndexedDB
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        const songData = await getSongById(id);
        if (!songData) {
          // Song might be currently processing (not yet persisted or still uploading)
          if (processing.songId === id) {
            setLoading(false);
            return;
          }
          setError('Song not found');
          setLoading(false);
          return;
        }

        setSong(songData);

        if (songData.status === 'complete') {
          const tabData = await getTab(id);
          if (tabData) setTab(tabData);
          const stemsData = await getStems(id);
          setHasInstrumental(!!stemsData?.instrumentalBlob);
          const confData = await getConfidenceReport(id);
          if (confData) setConfidenceReport(confData);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load song');
      }
      setLoading(false);
    };

    load();
  }, [id, processing.songId, processing.isComplete]);

  // Reload tab when processing completes
  useEffect(() => {
    if (processing.isComplete && id) {
      const loadTab = async () => {
        const songData = await getSongById(id);
        if (songData) setSong(songData);
        const tabData = await getTab(id);
        if (tabData) setTab(tabData);
      };
      loadTab();
    }
  }, [processing.isComplete, id]);

  useEffect(() => {
    if (!song?.id || !hasInstrumental) return;
    playback.loadInstrumental(song.id).catch(() => {
      // Ignore instrumental load failures, MIDI-only playback still works.
    });
  }, [song?.id, hasInstrumental, playback.loadInstrumental]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => navigate('/')}>
          Back to Upload
        </Button>
      </div>
    );
  }

  // Currently processing
  const isCurrentlyProcessing = processing.songId === id && processing.isProcessing;
  if (isCurrentlyProcessing) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <h1 className="mb-6 text-2xl font-bold">{song?.fileName ?? 'Processing...'}</h1>
        <Card>
          <CardContent className="p-6">
            <ProcessingProgressDisplay
              progress={processing.progress}
              error={processing.error}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Processing error
  if (processing.songId === id && processing.error) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <h1 className="mb-6 text-2xl font-bold">{song?.fileName ?? 'Error'}</h1>
        <Card>
          <CardContent className="p-6">
            <ProcessingProgressDisplay progress={null} error={processing.error} />
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => navigate('/')}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tab ready
  if (tab) {
    return (
      <div className="py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{song?.fileName ?? 'Song'}</h1>
          <div className="flex gap-2">
            {hasInstrumental && song && (
              <DownloadButton songId={song.id} fileName={song.fileName} />
            )}
            <Button variant="outline" onClick={() => navigate('/songs')}>
              Library
            </Button>
          </div>
        </div>
        {confidenceReport && (
          <div className="mb-4">
            <ConfidenceDisplay report={confidenceReport} />
          </div>
        )}
        <TabViewer
          alphaTex={tab.alphaTex}
          onApiReady={playback.setAlphaTabApi}
          onDurationChange={playback.setDuration}
          onPositionChange={playback.updatePosition}
          onPlayingStateChange={playback.setPlayingState}
        />
        <div className="mt-4">
          <PlaybackControls
            state={playback.state}
            onPlay={playback.play}
            onPause={playback.pause}
            onSeek={playback.seek}
            onModeChange={playback.setMode}
            showModeSelector={hasInstrumental}
          />
        </div>
      </div>
    );
  }

  // Song exists but no tab (maybe failed)
  return (
    <div className="flex flex-col items-center gap-4 py-20">
      <p className="text-muted-foreground">
        {song?.status?.includes('failed')
          ? `Processing failed at: ${song.status}`
          : 'No tablature available for this song.'}
      </p>
      <Button variant="outline" onClick={() => navigate('/')}>
        Upload New Song
      </Button>
    </div>
  );
}
