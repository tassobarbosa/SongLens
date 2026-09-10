import { useCallback, useEffect, useState } from 'react';
import type { Song } from '../types/song.ts';
import { getAllSongs, deleteSong } from '../services/storage/songRepository.ts';

export function useSongLibrary() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSongs = useCallback(async () => {
    setLoading(true);
    try {
      const allSongs = await getAllSongs();
      setSongs(allSongs);
    } catch (error) {
      console.error('Failed to load songs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  const removeSong = useCallback(
    async (id: string) => {
      await deleteSong(id);
      setSongs((prev) => prev.filter((s) => s.id !== id));
    },
    [],
  );

  return {
    songs,
    loading,
    removeSong,
    refresh: loadSongs,
  };
}
