import type { Song, ProcessingStatus } from '../../types/song.ts';
import type { ProcessingProgress } from '../../types/playback.ts';
import { separateAudio } from '../separation/separationService.ts';
import { transcribeAudio } from '../transcription/transcriptionService.ts';
import { convertToTab } from '../tabConversion/tabConversionService.ts';
import { analyzeConfidence } from '../confidence/confidenceAnalyzer.ts';
import {
  saveSong,
  updateSongStatus,
  saveStems,
  saveTranscription,
  saveTab,
  saveConfidenceReport,
} from '../storage/songRepository.ts';
import { MAX_FILE_SIZE, SUPPORTED_FORMATS } from '../../constants/audio.ts';

export interface PipelineCallbacks {
  onProgress: (progress: ProcessingProgress) => void;
  onStatusChange: (status: ProcessingStatus) => void;
  onError: (error: string) => void;
  onComplete: () => void;
}

/**
 * Orchestrate the full processing pipeline:
 * validate → separate → transcribe → convert → persist
 */
export async function runProcessingPipeline(
  file: File,
  songId: string,
  callbacks: PipelineCallbacks,
): Promise<void> {
  const { onProgress, onStatusChange, onError, onComplete } = callbacks;

  try {
    // 1. Validate
    validateFile(file);

    // 2. Create song record
    onProgress({ stage: 'uploading', progress: 0.5, message: 'Saving audio...' });
    onStatusChange('uploading');

    const song: Song = {
      id: songId,
      fileName: file.name,
      fileType: file.name.endsWith('.wav') ? 'wav' : 'mp3',
      fileSize: file.size,
      duration: 0, // Will be updated after separation
      uploadedAt: new Date(),
      status: 'uploading',
    };

    await saveSong(song, file);
    onProgress({ stage: 'uploading', progress: 1.0, message: 'Audio saved' });

    // 3. Separate vocals/instrumental
    onStatusChange('separating');
    onProgress({ stage: 'separating', progress: 0.1, message: 'Separating vocals from instruments (this may take several minutes on CPU)...' });

    const stems = await separateAudio(file);

    onProgress({ stage: 'separating', progress: 0.9, message: 'Saving stems...' });

    await saveStems({
      songId,
      vocalBlob: stems.vocalBlob,
      instrumentalBlob: stems.instrumentalBlob,
      processedAt: new Date(),
    });

    // Update song duration
    await updateSongStatus(songId, 'separating');
    onProgress({ stage: 'separating', progress: 1.0, message: 'Separation complete' });

    // 4. Transcribe vocals
    onStatusChange('transcribing');
    onProgress({ stage: 'transcribing', progress: 0.1, message: 'Loading transcription model...' });

    // Decode vocal audio to AudioBuffer
    const audioContext = new AudioContext({ sampleRate: stems.sampleRate });
    const vocalArrayBuffer = await stems.vocalBlob.arrayBuffer();
    const vocalAudioBuffer = await audioContext.decodeAudioData(vocalArrayBuffer);
    await audioContext.close();

    onProgress({ stage: 'transcribing', progress: 0.3, message: 'Transcribing pitch...' });
    const transcription = await transcribeAudio(vocalAudioBuffer, songId);

    onProgress({ stage: 'transcribing', progress: 0.9, message: 'Saving transcription...' });
    await saveTranscription(transcription);

    // 4b. Analyze confidence
    const confidenceReport = analyzeConfidence(songId, transcription.notes, vocalAudioBuffer);
    await saveConfidenceReport(confidenceReport);

    onProgress({ stage: 'transcribing', progress: 1.0, message: 'Transcription complete' });

    // 5. Convert to guitar tab
    onStatusChange('converting');
    onProgress({ stage: 'converting', progress: 0.3, message: 'Mapping notes to frets...' });

    const tab = convertToTab(transcription);

    onProgress({ stage: 'converting', progress: 0.8, message: 'Saving tab...' });
    await saveTab(tab);

    // 6. Mark complete
    await updateSongStatus(songId, 'complete');
    onProgress({ stage: 'converting', progress: 1.0, message: 'Tab generation complete' });
    onStatusChange('complete');
    onComplete();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    onError(message);

    // Try to update status to reflect which stage failed
    try {
      const failedStatus = getFailedStatus(callbacks);
      if (failedStatus) {
        await updateSongStatus(songId, failedStatus);
      }
    } catch {
      // Ignore status update failure
    }
  }
}

function validateFile(file: File): void {
  if (!SUPPORTED_FORMATS.includes(file.type as (typeof SUPPORTED_FORMATS)[number])) {
    throw new Error(`Unsupported file format: ${file.type}. Please upload an MP3 or WAV file.`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File is too large (${Math.round(file.size / 1024 / 1024)} MB). Maximum size is 50 MB.`);
  }

  if (file.size === 0) {
    throw new Error('File is empty.');
  }
}

function getFailedStatus(_callbacks: PipelineCallbacks): ProcessingStatus | null {
  // Simple heuristic: we can't easily tell which stage was active
  // The caller should handle this based on the last status change
  return null;
}
