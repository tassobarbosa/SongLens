/** Maximum upload file size in bytes (50 MB) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** Maximum upload file size in MB (for display) */
export const MAX_FILE_SIZE_MB = 50;

/** Supported audio formats */
export const SUPPORTED_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/wave', 'audio/x-wav'] as const;

/** Supported file extensions */
export const SUPPORTED_EXTENSIONS = ['.mp3', '.wav'] as const;

/** Maximum audio duration in seconds (10 minutes) */
export const MAX_DURATION = 600;

/** Minimum audio duration in seconds */
export const MIN_DURATION = 5;

/** Separation service base URL */
export const SEPARATION_SERVICE_URL =
  import.meta.env.VITE_SEPARATION_URL ?? 'http://localhost:8000';

/** Basic Pitch TensorFlow.js model URL */
export const BASIC_PITCH_MODEL_URL =
  import.meta.env.VITE_BASIC_PITCH_MODEL_URL ??
  'https://cdn.jsdelivr.net/npm/@spotify/basic-pitch@1.0.1/model/model.json';
