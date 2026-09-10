import type { TabNote } from '../../types/tab.ts';
import { DEFAULT_TEMPO, DEFAULT_TIME_SIGNATURE } from '../../constants/processing.ts';

/**
 * Convert TabNote[] to AlphaTex markup string for alphaTab rendering.
 *
 * AlphaTex format reference: https://alphatab.net/docs/alphatex/introduction
 */
export function generateAlphaTex(
  notes: TabNote[],
  tempo: number = DEFAULT_TEMPO,
  timeSignature: [number, number] = DEFAULT_TIME_SIGNATURE,
): string {
  if (notes.length === 0) {
    return `\\title("Transcription")
\\tempo(${tempo})
\\ts(${timeSignature[0]} ${timeSignature[1]})
\\instrument(25)
\\tuning E2 A2 D3 G3 B3 E4
.
r.1 |`;
  }

  const lines: string[] = [];

  // Header
  lines.push(`\\title("Transcription")`);
  lines.push(`\\tempo(${tempo})`);
  lines.push(`\\ts(${timeSignature[0]} ${timeSignature[1]})`);
  lines.push(`\\instrument(25)`); // Acoustic Guitar (steel)
  lines.push(`\\tuning E2 A2 D3 G3 B3 E4`);
  lines.push('.');

  // Calculate beat duration in seconds
  const beatDuration = 60 / tempo;
  const beatsPerMeasure = timeSignature[0];
  const measureDuration = beatDuration * beatsPerMeasure;

  // Group notes into measures
  let currentMeasureStart = 0;
  let currentBeatNotes: string[] = [];
  let beatCount = 0;

  for (const note of notes) {
    // Determine which measure/beat this note belongs to
    const measureIndex = Math.floor(note.startTime / measureDuration);
    const newMeasureStart = measureIndex * measureDuration;

    // If we've moved to a new measure, output the current one
    while (currentMeasureStart < newMeasureStart) {
      // Fill remaining beats with rests
      while (beatCount < beatsPerMeasure) {
        currentBeatNotes.push('r.4');
        beatCount++;
      }
      lines.push(currentBeatNotes.join(' ') + ' |');
      currentBeatNotes = [];
      beatCount = 0;
      currentMeasureStart += measureDuration;
    }

    // Calculate note duration as a fraction of a whole note
    const durationValue = getDurationValue(note.duration, beatDuration);

    // AlphaTex fretted note syntax: fret.string.duration
    const noteString = Math.max(1, Math.min(6, Math.round(note.string)));
    const noteFret = Math.max(0, Math.round(note.fret));
    currentBeatNotes.push(`${noteFret}.${noteString}.${durationValue}`);
    beatCount++;
  }

  // Output the last measure
  if (currentBeatNotes.length > 0) {
    while (beatCount < beatsPerMeasure) {
      currentBeatNotes.push('r.4');
      beatCount++;
    }
    lines.push(currentBeatNotes.join(' ') + ' |');
  }

  return lines.join('\n');
}

/** Map a note duration in seconds to the nearest AlphaTex duration value */
function getDurationValue(durationSec: number, beatDuration: number): number {
  const beats = durationSec / beatDuration;

  // Standard note durations: 1=whole, 2=half, 4=quarter, 8=eighth, 16=sixteenth
  if (beats >= 3) return 1;
  if (beats >= 1.5) return 2;
  if (beats >= 0.75) return 4;
  if (beats >= 0.375) return 8;
  return 16;
}
