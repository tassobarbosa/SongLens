/** A single note positioned on the guitar fretboard */
export interface TabNote {
  /** Guitar string (1–6, where 1 = high E) */
  string: number;
  /** Fret number (0–24) */
  fret: number;
  /** Note onset time in seconds */
  startTime: number;
  /** Note duration in seconds */
  duration: number;
  /** Original MIDI note number */
  pitchMidi: number;
}

/** Complete guitar tablature for a song */
export interface GuitarTab {
  songId: string;
  notes: TabNote[];
  /** Guitar tuning, default: ["E2", "A2", "D3", "G3", "B3", "E4"] */
  tuning: string[];
  /** Time signature, default: [4, 4] */
  timeSignature: [number, number];
  /** Tempo in BPM */
  tempo: number;
  /** Generated AlphaTex markup for alphaTab rendering */
  alphaTex: string;
  processedAt: Date;
}
