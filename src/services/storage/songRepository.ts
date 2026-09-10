import { getDB } from './database.ts';
import type { Song, ProcessingStatus, StemResult } from '../../types/song.ts';
import type { Transcription } from '../../types/transcription.ts';
import type { GuitarTab } from '../../types/tab.ts';
import type { ConfidenceReport } from '../../types/confidence.ts';

/** Save a new song and its audio blob */
export async function saveSong(song: Song, audioBlob: Blob): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['songs', 'audio-blobs'], 'readwrite');
  await tx.objectStore('songs').put(song);
  await tx.objectStore('audio-blobs').put({ songId: song.id, blob: audioBlob });
  await tx.done;
}

/** Get a song by ID */
export async function getSongById(id: string): Promise<Song | undefined> {
  const db = await getDB();
  return db.get('songs', id);
}

/** Get all songs, sorted by upload date descending */
export async function getAllSongs(): Promise<Song[]> {
  const db = await getDB();
  const songs = await db.getAll('songs');
  return songs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

/** Update song processing status */
export async function updateSongStatus(id: string, status: ProcessingStatus): Promise<void> {
  const db = await getDB();
  const song = await db.get('songs', id);
  if (!song) throw new Error(`Song not found: ${id}`);
  song.status = status;
  await db.put('songs', song);
}

/** Delete a song and all associated data */
export async function deleteSong(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(
    ['songs', 'audio-blobs', 'stems', 'transcriptions', 'tabs', 'confidence'],
    'readwrite',
  );
  await Promise.all([
    tx.objectStore('songs').delete(id),
    tx.objectStore('audio-blobs').delete(id),
    tx.objectStore('stems').delete(id),
    tx.objectStore('transcriptions').delete(id),
    tx.objectStore('tabs').delete(id),
    tx.objectStore('confidence').delete(id),
  ]);
  await tx.done;
}

/** Get audio blob for a song */
export async function getAudioBlob(songId: string): Promise<Blob | undefined> {
  const db = await getDB();
  const record = await db.get('audio-blobs', songId);
  return record?.blob;
}

/** Save stem separation results */
export async function saveStems(stems: StemResult): Promise<void> {
  const db = await getDB();
  await db.put('stems', stems);
}

/** Get stems for a song */
export async function getStems(songId: string): Promise<StemResult | undefined> {
  const db = await getDB();
  return db.get('stems', songId);
}

/** Get instrumental blob for a song (for download) */
export async function getInstrumentalBlob(songId: string): Promise<Blob | undefined> {
  const stems = await getStems(songId);
  return stems?.instrumentalBlob;
}

/** Save transcription results */
export async function saveTranscription(transcription: Transcription): Promise<void> {
  const db = await getDB();
  await db.put('transcriptions', transcription);
}

/** Get transcription for a song */
export async function getTranscription(songId: string): Promise<Transcription | undefined> {
  const db = await getDB();
  return db.get('transcriptions', songId);
}

/** Save guitar tab */
export async function saveTab(tab: GuitarTab): Promise<void> {
  const db = await getDB();
  await db.put('tabs', tab);
}

/** Get guitar tab for a song */
export async function getTab(songId: string): Promise<GuitarTab | undefined> {
  const db = await getDB();
  return db.get('tabs', songId);
}

/** Save confidence report */
export async function saveConfidenceReport(report: ConfidenceReport): Promise<void> {
  const db = await getDB();
  await db.put('confidence', report);
}

/** Get confidence report for a song */
export async function getConfidenceReport(songId: string): Promise<ConfidenceReport | undefined> {
  const db = await getDB();
  return db.get('confidence', songId);
}
