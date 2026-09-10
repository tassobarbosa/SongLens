/** Human-readable stage names for the processing pipeline */
export const STAGE_NAMES = {
  uploading: 'Uploading',
  separating: 'Separating vocals',
  transcribing: 'Transcribing pitch',
  converting: 'Generating tablature',
} as const;

/** Timeout for separation service call in milliseconds (5 minutes) */
export const SEPARATION_TIMEOUT = 5 * 60 * 1000;

/** Timeout for transcription in milliseconds (3 minutes) */
export const TRANSCRIPTION_TIMEOUT = 3 * 60 * 1000;

/** Timeout for tab conversion in milliseconds (30 seconds) */
export const CONVERSION_TIMEOUT = 30 * 1000;

/** Default tempo in BPM when detection fails */
export const DEFAULT_TEMPO = 120;

/** Default time signature */
export const DEFAULT_TIME_SIGNATURE: [number, number] = [4, 4];
