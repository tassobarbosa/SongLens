import { useCallback, useRef } from 'react';
import { usePlaybackState, usePlaybackDispatch } from '../context/PlaybackContext.tsx';
import type { PlaybackState, ListeningMode } from '../types/playback.ts';
import { getInstrumentalBlob } from '../services/storage/songRepository.ts';

export interface UsePlaybackReturn {
  state: PlaybackState;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setMode: (mode: ListeningMode) => void;
  setAlphaTabApi: (api: unknown) => void;
  loadInstrumental: (songId: string) => Promise<void>;
  setDuration: (duration: number) => void;
  updatePosition: (currentTime: number) => void;
  setPlayingState: (isPlaying: boolean) => void;
}

/**
 * Hook for controlling MIDI playback via alphaTab's built-in player,
 * with optional synchronized instrumental audio via Web Audio API.
 */
export function usePlayback(): UsePlaybackReturn {
  const state = usePlaybackState();
  const dispatch = usePlaybackDispatch();
  const apiRef = useRef<unknown>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const instrumentalBufferRef = useRef<AudioBuffer | null>(null);
  const instrumentalSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const instrumentalStartTimeRef = useRef<number>(0);

  const setAlphaTabApi = useCallback((api: unknown) => {
    apiRef.current = api;
  }, []);

  /** Load instrumental audio into a Web Audio buffer for synchronized playback */
  const loadInstrumental = useCallback(async (songId: string) => {
    const blob = await getInstrumentalBlob(songId);
    if (!blob) return;

    const ctx = new AudioContext();
    audioContextRef.current = ctx;
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    instrumentalBufferRef.current = audioBuffer;
    dispatch({ type: 'SET_DURATION', duration: audioBuffer.duration });
  }, [dispatch]);

  /** Start or resume instrumental audio playback at the given offset */
  const startInstrumental = useCallback((offset: number) => {
    const ctx = audioContextRef.current;
    const buffer = instrumentalBufferRef.current;
    if (!ctx || !buffer) return;

    // Stop any existing source
    try {
      instrumentalSourceRef.current?.stop();
    } catch {
      // ignore
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0, offset);
    instrumentalSourceRef.current = source;
    instrumentalStartTimeRef.current = ctx.currentTime - offset;
  }, []);

  /** Stop instrumental audio */
  const stopInstrumental = useCallback(() => {
    try {
      instrumentalSourceRef.current?.stop();
    } catch {
      // ignore
    }
    instrumentalSourceRef.current = null;
  }, []);

  const play = useCallback(() => {
    const api = apiRef.current as { playPause?: () => void } | null;
    if (api?.playPause) {
      api.playPause();
    }

    // Start instrumental if in combined mode
    if (state.listeningMode === 'instrumental-midi' && instrumentalBufferRef.current) {
      startInstrumental(state.currentTime);
    }

    dispatch({ type: 'PLAY' });
  }, [dispatch, state.listeningMode, state.currentTime, startInstrumental]);

  const pause = useCallback(() => {
    const api = apiRef.current as { playPause?: () => void } | null;
    if (api?.playPause) {
      api.playPause();
    }

    stopInstrumental();
    dispatch({ type: 'PAUSE' });
  }, [dispatch, stopInstrumental]);

  const seek = useCallback(
    (time: number) => {
      const api = apiRef.current as { tickPosition?: number } | null;
      if (api) {
        api.tickPosition = Math.floor(time * 960);
      }

      // Re-sync instrumental if playing in combined mode
      if (state.isPlaying && state.listeningMode === 'instrumental-midi') {
        stopInstrumental();
        startInstrumental(time);
      }

      dispatch({ type: 'SEEK', time });
    },
    [dispatch, state.isPlaying, state.listeningMode, stopInstrumental, startInstrumental],
  );

  const setMode = useCallback(
    (mode: ListeningMode) => {
      // Handle mode switch during playback
      if (state.isPlaying) {
        if (mode === 'instrumental-midi' && instrumentalBufferRef.current) {
          startInstrumental(state.currentTime);
        } else {
          stopInstrumental();
        }
      }
      dispatch({ type: 'SET_MODE', mode });
    },
    [dispatch, state.isPlaying, state.currentTime, startInstrumental, stopInstrumental],
  );

  const setDuration = useCallback(
    (duration: number) => {
      dispatch({ type: 'SET_DURATION', duration: Math.max(0, duration) });
    },
    [dispatch],
  );

  const updatePosition = useCallback(
    (currentTime: number) => {
      dispatch({
        type: 'UPDATE_POSITION',
        currentTime: Math.max(0, currentTime),
        currentMeasure: 1,
        currentBeat: 1,
      });
    },
    [dispatch],
  );

  const setPlayingState = useCallback(
    (isPlaying: boolean) => {
      dispatch({ type: isPlaying ? 'PLAY' : 'PAUSE' });
    },
    [dispatch],
  );

  return {
    state,
    play,
    pause,
    seek,
    setMode,
    setAlphaTabApi,
    loadInstrumental,
    setDuration,
    updatePosition,
    setPlayingState,
  };
}
