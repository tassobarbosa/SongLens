import type { NoteEvent, Transcription } from '../../types/transcription.ts';
import { BASIC_PITCH_MODEL_URL } from '../../constants/audio.ts';

const BASIC_PITCH_SAMPLE_RATE = 22050;

/**
 * Transcribe audio using Spotify's Basic Pitch (TensorFlow.js).
 * Runs entirely in the browser.
 */
export async function transcribeAudio(
  audioBuffer: AudioBuffer,
  songId: string,
): Promise<Transcription> {
  // Dynamically import Basic Pitch to lazy-load the ~5MB model
  const { BasicPitch, addPitchBendsToNoteEvents, noteFramesToTime, outputToNotesPoly } =
    await import('@spotify/basic-pitch');

  const basicPitch = new BasicPitch(BASIC_PITCH_MODEL_URL);

  const modelInput = await toMonoSampleRate(audioBuffer, BASIC_PITCH_SAMPLE_RATE);

  const frames: number[][] = [];
  const onsets: number[][] = [];
  const contours: number[][] = [];

  // Evaluate the audio through Basic Pitch
  await basicPitch.evaluateModel(
    modelInput,
    (f: number[][], o: number[][], c: number[][]) => {
      frames.push(...f);
      onsets.push(...o);
      contours.push(...c);
    },
    () => {
      // Progress callback intentionally unused
    },
  );

  // Convert model output to note events
  const rawNotes = noteFramesToTime(
    addPitchBendsToNoteEvents(contours, outputToNotesPoly(frames, onsets)),
  );

  const notes: NoteEvent[] = rawNotes.map((note) => ({
    pitchMidi: note.pitchMidi,
    startTime: note.startTimeSeconds,
    duration: note.durationSeconds,
    confidence: note.amplitude,
    pitchBend: note.pitchBends?.[0] ?? null,
  }));

  // Sort by start time
  notes.sort((a, b) => a.startTime - b.startTime);

  // Estimate tempo from note density (simple heuristic)
  const estimatedTempo = estimateTempo(notes, audioBuffer.duration);

  return {
    songId,
    notes,
    estimatedTempo,
    processedAt: new Date(),
  };
}

async function toMonoSampleRate(input: AudioBuffer, sampleRate: number): Promise<AudioBuffer> {
  if (input.sampleRate === sampleRate && input.numberOfChannels === 1) {
    return input;
  }

  const targetLength = Math.ceil(input.duration * sampleRate);
  const offlineContext = new OfflineAudioContext(1, targetLength, sampleRate);
  const source = offlineContext.createBufferSource();
  source.buffer = input;
  source.connect(offlineContext.destination);

  source.start(0);
  return offlineContext.startRendering();
}

/** Simple tempo estimation from note density */
function estimateTempo(notes: NoteEvent[], duration: number): number | null {
  if (notes.length < 4 || duration < 5) return null;

  // Calculate average inter-onset interval
  const onsets = notes.map((n) => n.startTime);
  const intervals: number[] = [];
  for (let i = 1; i < onsets.length; i++) {
    const interval = onsets[i]! - onsets[i - 1]!;
    if (interval > 0.1 && interval < 2.0) {
      intervals.push(interval);
    }
  }

  if (intervals.length < 3) return null;

  // Median interval
  intervals.sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)]!;

  // Convert to BPM (assuming each note ≈ one beat)
  const bpm = Math.round(60 / median);

  // Clamp to reasonable range
  if (bpm < 40 || bpm > 240) return null;
  return bpm;
}
