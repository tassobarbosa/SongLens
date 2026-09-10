import { useEffect, useRef } from 'react';

interface TabViewerProps {
  alphaTex: string;
  className?: string;
  onApiReady?: (api: unknown) => void;
  onDurationChange?: (duration: number) => void;
  onPositionChange?: (currentTime: number) => void;
  onPlayingStateChange?: (isPlaying: boolean) => void;
}

export function TabViewer({
  alphaTex,
  className = '',
  onApiReady,
  onDurationChange,
  onPositionChange,
  onPlayingStateChange,
}: TabViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<unknown>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !alphaTex) return;

    // Clear previous content
    container.innerHTML = '';

    // Create a wrapper div for alphaTab
    const wrapper = document.createElement('div');
    container.appendChild(wrapper);

    // Initialize alphaTab using the API
    // alphaTab expects to be loaded via script tag or imported
    const loadAlphaTab = async () => {
      try {
        const alphaTabModule = await import('@coderline/alphatab');
        const settings = new alphaTabModule.Settings();
        settings.core.tex = true;
        settings.core.useWorkers = false;
        settings.core.fontDirectory = '/font/';
        settings.display.layoutMode = alphaTabModule.LayoutMode.Page;
        settings.display.staveProfile = alphaTabModule.StaveProfile.Tab;
        settings.player.enablePlayer = true;
        settings.player.enableCursor = true;
        settings.player.soundFont = '/soundfont/sonivox.sf3';

        const api = new alphaTabModule.AlphaTabApi(wrapper, settings);
        apiRef.current = api;
        onApiReady?.(api);

        const unregisterMidiLoaded = api.midiLoaded.on((event) => {
          onDurationChange?.(event.endTime / 1000);
        });
        const unregisterPositionChanged = api.playerPositionChanged.on((event) => {
          onPositionChange?.(event.currentTime / 1000);
          onDurationChange?.(event.endTime / 1000);
        });
        const unregisterPlayerState = api.playerStateChanged.on((event) => {
          if (!event) return;
          onPlayingStateChange?.(!event.stopped);
        });

        api.tex(normalizeAlphaTex(alphaTex));

        apiRef.current = {
          api,
          unregister: () => {
            unregisterMidiLoaded();
            unregisterPositionChanged();
            unregisterPlayerState();
          },
        };
      } catch (error) {
        // Fallback: render a simple text representation
        console.warn('alphaTab failed to load, showing text fallback:', error);
        wrapper.innerHTML = `<pre class="p-4 bg-muted rounded-lg text-sm font-mono overflow-x-auto whitespace-pre">${escapeHtml(alphaTex)}</pre>`;
      }
    };

    loadAlphaTab();

    return () => {
      const apiHolder = apiRef.current as {
        api?: { destroy?: () => void };
        unregister?: () => void;
      } | null;
      if (apiHolder?.unregister) {
        apiHolder.unregister();
      }
      if (apiHolder?.api && typeof apiHolder.api.destroy === 'function') {
        apiHolder.api.destroy();
        apiRef.current = null;
      }
    };
  }, [alphaTex, onApiReady, onDurationChange, onPositionChange, onPlayingStateChange]);

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-auto rounded-lg border border-border bg-white ${className}`}
      style={{ minHeight: '300px' }}
      role="img"
      aria-label="Guitar tablature"
    />
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function normalizeAlphaTex(alphaTex: string): string {
  // Backward compatibility for legacy format: fret.duration{string}
  return alphaTex.replace(/(\d+)\.(\d+)\{(\d+)\}/g, '$1.$3.$2');
}
