import { Note, Midi } from 'tonal';
import type { NoteEvent } from '../../types/transcription.ts';
import type { TabNote } from '../../types/tab.ts';
import {
  STANDARD_TUNING_MIDI,
  MIN_FRET,
  MAX_FRET,
  MAX_FRET_SPAN,
} from '../../constants/guitar.ts';

interface FretCandidate {
  string: number;
  fret: number;
}

/**
 * Convert MIDI note numbers to guitar string/fret positions.
 * Prefers positions that minimize hand movement between consecutive notes.
 */
export function mapNotesToFrets(notes: NoteEvent[]): TabNote[] {
  let lastFret = 5; // Start at a comfortable mid-position

  return notes.map((note) => {
    const candidates = getFretCandidates(note.pitchMidi);

    if (candidates.length === 0) {
      // Note is out of guitar range — place on closest possible position
      const clampedFret = Math.max(MIN_FRET, Math.min(MAX_FRET, note.pitchMidi - STANDARD_TUNING_MIDI[0]!));
      return {
        string: 6,
        fret: clampedFret,
        startTime: note.startTime,
        duration: note.duration,
        pitchMidi: note.pitchMidi,
      };
    }

    // Pick the candidate closest to the last fret position
    const best = candidates.reduce((prev, curr) => {
      const prevDist = Math.abs(prev.fret - lastFret);
      const currDist = Math.abs(curr.fret - lastFret);
      return currDist < prevDist ? curr : prev;
    });

    lastFret = best.fret;

    return {
      string: best.string,
      fret: best.fret,
      startTime: note.startTime,
      duration: note.duration,
      pitchMidi: note.pitchMidi,
    };
  });
}

/**
 * Get all possible string/fret positions for a given MIDI note on standard tuning guitar.
 */
function getFretCandidates(pitchMidi: number): FretCandidate[] {
  const candidates: FretCandidate[] = [];

  for (let stringIdx = 0; stringIdx < STANDARD_TUNING_MIDI.length; stringIdx++) {
    const openStringMidi = STANDARD_TUNING_MIDI[stringIdx]!;
    const fret = pitchMidi - openStringMidi;

    if (fret >= MIN_FRET && fret <= MAX_FRET) {
      candidates.push({
        string: stringIdx + 1, // 1-indexed (1 = low E in our TabNote def... actually 1 = high E)
        fret,
      });
    }
  }

  // Re-map: STANDARD_TUNING_MIDI is [E2, A2, D3, G3, B3, E4] (low to high)
  // TabNote.string: 1 = high E, 6 = low E
  // So stringIdx 0 (E2) → TabNote.string 6, stringIdx 5 (E4) → TabNote.string 1
  return candidates.map((c) => ({
    string: STANDARD_TUNING_MIDI.length - c.string + 1,
    fret: c.fret,
  }));
}
