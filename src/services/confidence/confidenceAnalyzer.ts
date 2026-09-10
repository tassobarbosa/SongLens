import type { NoteEvent } from '../../types/transcription.ts';
import type { ConfidenceReport, ConfidenceWarning, WarningType } from '../../types/confidence.ts';

/**
 * Analyze transcription results and audio characteristics to produce
 * a confidence report with overall score and quality warnings.
 */
export function analyzeConfidence(
  songId: string,
  notes: NoteEvent[],
  audioBuffer?: AudioBuffer,
): ConfidenceReport {
  const warnings: ConfidenceWarning[] = [];

  // 1. Average note confidence from Basic Pitch output
  const averageNoteConfidence =
    notes.length > 0
      ? notes.reduce((sum, n) => sum + n.confidence, 0) / notes.length
      : 0;

  // 2. Detect multiple singers (high pitch variance in overlapping windows)
  if (notes.length > 10) {
    const pitchVariance = computePitchVariance(notes);
    if (pitchVariance > 20) {
      warnings.push({
        type: 'multiple-singers',
        message: 'Multiple singers detected — tab may represent a blended melody.',
        severity: 'warning',
      });
    }
  }

  // 3. Detect spoken word / rap (low pitch periodicity + high note density)
  if (notes.length > 5) {
    const avgDuration = notes.reduce((s, n) => s + n.duration, 0) / notes.length;
    const avgConfidence = averageNoteConfidence;
    if (avgDuration < 0.15 && avgConfidence < 0.5) {
      warnings.push({
        type: 'spoken-word',
        message: 'Rap or spoken-word vocals detected — melodic transcription may not be meaningful.',
        severity: 'warning',
      });
    }
  }

  // 4. Detect low confidence overall
  if (averageNoteConfidence < 0.3 && notes.length > 0) {
    warnings.push({
      type: 'heavy-distortion',
      message: 'Low pitch detection confidence — audio may contain heavy distortion or noise.',
      severity: 'critical',
    });
  }

  // 5. Short duration warning
  const totalDuration = notes.length > 0
    ? Math.max(...notes.map((n) => n.startTime + n.duration))
    : 0;
  if (totalDuration < 30 && totalDuration > 0) {
    warnings.push({
      type: 'short-duration',
      message: 'Very short audio clip — transcription may be incomplete.',
      severity: 'info',
    });
  }

  // 6. Audio buffer analysis (if available)
  if (audioBuffer) {
    const spectralAnalysis = analyzeSpectralFeatures(audioBuffer);

    if (spectralAnalysis.spectralFlatness > 0.5) {
      // Already covered by low confidence, but add if not present
      if (!warnings.some((w) => w.type === 'heavy-distortion')) {
        warnings.push({
          type: 'heavy-distortion',
          message: 'High spectral flatness detected — pitch detection reliability may be reduced.',
          severity: 'warning',
        });
      }
    }

    if (spectralAnalysis.zeroCrossingRate > 0.3 && averageNoteConfidence < 0.5) {
      if (!warnings.some((w) => w.type === 'spoken-word')) {
        warnings.push({
          type: 'spoken-word',
          message: 'High zero-crossing rate suggests spoken content rather than singing.',
          severity: 'warning',
        });
      }
    }

    if (spectralAnalysis.rmsLevel < 0.01) {
      warnings.push({
        type: 'low-volume',
        message: 'Vocal track has very low amplitude — transcription accuracy may be reduced.',
        severity: 'info',
      });
    }
  }

  // Determine overall confidence
  const overallConfidence = computeOverallConfidence(averageNoteConfidence, warnings);

  return {
    songId,
    overallConfidence,
    averageNoteConfidence,
    warnings,
    processedAt: new Date(),
  };
}

/** Compute pitch variance across overlapping time windows */
function computePitchVariance(notes: NoteEvent[]): number {
  if (notes.length < 2) return 0;

  const windowSize = 2; // 2 second windows
  const maxTime = Math.max(...notes.map((n) => n.startTime));
  let totalVariance = 0;
  let windowCount = 0;

  for (let t = 0; t < maxTime; t += windowSize / 2) {
    const windowNotes = notes.filter(
      (n) => n.startTime >= t && n.startTime < t + windowSize,
    );
    if (windowNotes.length >= 2) {
      const pitches = windowNotes.map((n) => n.pitchMidi);
      const mean = pitches.reduce((s, p) => s + p, 0) / pitches.length;
      const variance = pitches.reduce((s, p) => s + (p - mean) ** 2, 0) / pitches.length;
      totalVariance += variance;
      windowCount++;
    }
  }

  return windowCount > 0 ? totalVariance / windowCount : 0;
}

/** Analyze basic spectral features from an AudioBuffer */
function analyzeSpectralFeatures(audioBuffer: AudioBuffer): {
  spectralFlatness: number;
  zeroCrossingRate: number;
  rmsLevel: number;
} {
  const data = audioBuffer.getChannelData(0);
  const length = data.length;

  // RMS level
  let sumSquares = 0;
  for (let i = 0; i < length; i++) {
    sumSquares += data[i]! * data[i]!;
  }
  const rmsLevel = Math.sqrt(sumSquares / length);

  // Zero-crossing rate
  let zeroCrossings = 0;
  for (let i = 1; i < length; i++) {
    if ((data[i]! >= 0) !== (data[i - 1]! >= 0)) {
      zeroCrossings++;
    }
  }
  const zeroCrossingRate = zeroCrossings / length;

  // Simplified spectral flatness estimate
  // (real implementation would use FFT, this is a proxy based on amplitude distribution)
  const sorted = Array.from(data).map(Math.abs).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const spectralFlatness = rmsLevel > 0 ? median / rmsLevel : 0;

  return { spectralFlatness, zeroCrossingRate, rmsLevel };
}

/** Compute overall confidence level from average note confidence and warnings */
function computeOverallConfidence(
  avgConfidence: number,
  warnings: ConfidenceWarning[],
): 'high' | 'medium' | 'low' {
  const criticalCount = warnings.filter((w) => w.severity === 'critical').length;
  const warningCount = warnings.filter((w) => w.severity === 'warning').length;

  if (criticalCount > 0 || avgConfidence < 0.3) return 'low';
  if (warningCount >= 2 || avgConfidence < 0.6) return 'medium';
  return 'high';
}
