/** A single detected note from pitch transcription (Basic Pitch output) */
export interface NoteEvent {
  /** MIDI note number (0–127) */
  pitchMidi: number;
  /** Note onset time in seconds */
  startTime: number;
  /** Note duration in seconds */
  duration: number;
  /** Detection confidence (0.0–1.0) */
  confidence: number;
  /** Pitch bend in semitones, if detected */
  pitchBend: number | null;
}

/** Complete vocal transcription for a song */
export interface Transcription {
  songId: string;
  notes: NoteEvent[];
  /** Detected tempo in BPM, if determinable */
  estimatedTempo: number | null;
  processedAt: Date;
}
