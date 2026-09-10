/** Processing status enum */
export type ProcessingStatus =
  | 'uploading'
  | 'separating'
  | 'separation-failed'
  | 'transcribing'
  | 'transcription-failed'
  | 'converting'
  | 'conversion-failed'
  | 'complete';

/** Root entity representing an uploaded audio file */
export interface Song {
  id: string;
  fileName: string;
  fileType: 'mp3' | 'wav';
  fileSize: number;
  duration: number;
  uploadedAt: Date;
  status: ProcessingStatus;
}

/** Stem separation result for a song */
export interface StemResult {
  songId: string;
  vocalBlob: Blob;
  instrumentalBlob: Blob;
  processedAt: Date;
}
