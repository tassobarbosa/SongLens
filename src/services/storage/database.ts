import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Song } from '../../types/song.ts';
import type { StemResult } from '../../types/song.ts';
import type { Transcription } from '../../types/transcription.ts';
import type { GuitarTab } from '../../types/tab.ts';
import type { ConfidenceReport } from '../../types/confidence.ts';

const DB_NAME = 'songlens-db';
const DB_VERSION = 1;

export interface SongLensDB extends DBSchema {
  songs: {
    key: string;
    value: Song;
    indexes: { 'by-uploadedAt': Date; 'by-status': string };
  };
  'audio-blobs': {
    key: string;
    value: { songId: string; blob: Blob };
  };
  stems: {
    key: string;
    value: StemResult;
  };
  transcriptions: {
    key: string;
    value: Transcription;
  };
  tabs: {
    key: string;
    value: GuitarTab;
  };
  confidence: {
    key: string;
    value: ConfidenceReport;
  };
}

let dbPromise: Promise<IDBPDatabase<SongLensDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<SongLensDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SongLensDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Songs metadata store
        const songStore = db.createObjectStore('songs', { keyPath: 'id' });
        songStore.createIndex('by-uploadedAt', 'uploadedAt');
        songStore.createIndex('by-status', 'status');

        // Raw uploaded audio blobs
        db.createObjectStore('audio-blobs', { keyPath: 'songId' });

        // Separated stems (vocal + instrumental)
        db.createObjectStore('stems', { keyPath: 'songId' });

        // Transcription data
        db.createObjectStore('transcriptions', { keyPath: 'songId' });

        // Guitar tab data
        db.createObjectStore('tabs', { keyPath: 'songId' });

        // Confidence reports
        db.createObjectStore('confidence', { keyPath: 'songId' });
      },
    });
  }
  return dbPromise;
}
