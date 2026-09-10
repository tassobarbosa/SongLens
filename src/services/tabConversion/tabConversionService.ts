import type { Transcription } from '../../types/transcription.ts';
import type { GuitarTab } from '../../types/tab.ts';
import { STANDARD_TUNING } from '../../constants/guitar.ts';
import { DEFAULT_TEMPO, DEFAULT_TIME_SIGNATURE } from '../../constants/processing.ts';
import { mapNotesToFrets } from './noteToFretMapper.ts';
import { generateAlphaTex } from './alphaTexGenerator.ts';

/**
 * Convert a Transcription into a GuitarTab.
 * Orchestrates note-to-fret mapping and AlphaTex generation.
 */
export function convertToTab(transcription: Transcription): GuitarTab {
  const tempo = transcription.estimatedTempo ?? DEFAULT_TEMPO;
  const timeSignature = DEFAULT_TIME_SIGNATURE;

  // Map MIDI notes to guitar fret positions
  const tabNotes = mapNotesToFrets(transcription.notes);

  // Generate AlphaTex markup
  const alphaTex = generateAlphaTex(tabNotes, tempo, timeSignature);

  return {
    songId: transcription.songId,
    notes: tabNotes,
    tuning: [...STANDARD_TUNING],
    timeSignature,
    tempo,
    alphaTex,
    processedAt: new Date(),
  };
}
