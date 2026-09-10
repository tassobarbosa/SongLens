import { SEPARATION_SERVICE_URL } from '../../constants/audio.ts';

export interface SeparationResult {
  /** Base64-encoded WAV audio of the vocal track */
  vocals: string;
  /** Base64-encoded WAV audio of the instrumental track */
  instrumental: string;
  /** Duration in seconds */
  duration: number;
  /** Sample rate in Hz */
  sampleRate: number;
}

/** Convert base64 string to Blob */
function base64ToBlob(base64: string, mimeType = 'audio/wav'): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export interface SeparatedStems {
  vocalBlob: Blob;
  instrumentalBlob: Blob;
  duration: number;
  sampleRate: number;
}

/**
 * Send audio file to the separation service and return separated stems.
 * @throws Error on network failure, invalid response, or service error.
 */
export async function separateAudio(file: File): Promise<SeparatedStems> {
  // Pre-check: is the service available?
  if (!navigator.onLine) {
    throw new Error(
      'You appear to be offline. The separation service requires an internet connection. ' +
        'Previously processed songs are still available in your library.',
    );
  }

  const isHealthy = await checkSeparationHealth();
  if (!isHealthy) {
    throw new Error(
      'The separation service is not available. Please ensure it is running at ' +
        SEPARATION_SERVICE_URL +
        '. See the quickstart guide for setup instructions.',
    );
  }

  const formData = new FormData();
  formData.append('file', file);

  let response: Response;
  try {
    response = await fetch(`${SEPARATION_SERVICE_URL}/separate`, {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    throw new Error(
      'Cannot connect to the separation service. Make sure it is running at ' +
        SEPARATION_SERVICE_URL,
    );
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(body.detail ?? body.error ?? `Separation failed (${response.status})`);
  }

  const data: SeparationResult = await response.json();

  return {
    vocalBlob: base64ToBlob(data.vocals),
    instrumentalBlob: base64ToBlob(data.instrumental),
    duration: data.duration,
    sampleRate: data.sampleRate,
  };
}

/** Check if the separation service is available */
export async function checkSeparationHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${SEPARATION_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
