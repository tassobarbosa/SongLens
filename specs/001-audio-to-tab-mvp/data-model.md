# Data Model: Audio-to-Tab MVP

**Feature**: specs/001-audio-to-tab-mvp
**Date**: 2026-05-31

## Entities

### Song

The root entity representing an uploaded audio file and all its derived artifacts.

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique identifier |
| fileName | string | Original uploaded file name |
| fileType | "mp3" \| "wav" | Audio format |
| fileSize | number | File size in bytes |
| duration | number | Audio duration in seconds |
| uploadedAt | Date | When the file was uploaded |
| status | ProcessingStatus | Current processing state |
| audioBlob | Blob | Raw uploaded audio binary (stored in IndexedDB) |

**Validation rules**:
- `fileType` must be "mp3" or "wav"
- `fileSize` must not exceed the configured maximum (50 MB default)
- `duration` must be > 5 seconds and < 600 seconds (10 minutes)
- `fileName` must be non-empty

### ProcessingStatus

Enum representing the current stage of audio processing.

| Value | Description |
|-------|-------------|
| `uploading` | File is being read into the application |
| `separating` | Audio separation (Demucs) is in progress |
| `separation-failed` | Separation step failed |
| `transcribing` | Pitch detection (Basic Pitch) is in progress |
| `transcription-failed` | Transcription step failed |
| `converting` | Note-to-tab conversion is in progress |
| `conversion-failed` | Tab conversion step failed |
| `complete` | All processing finished successfully |

**State transitions**:
```
uploading → separating → transcribing → converting → complete
                ↓              ↓              ↓
        separation-failed  transcription-failed  conversion-failed
```

### StemResult

The output of audio source separation for a single song.

| Field | Type | Description |
|-------|------|-------------|
| songId | string | Reference to parent Song |
| vocalBlob | Blob | Isolated vocal audio binary |
| instrumentalBlob | Blob | Isolated instrumental audio binary |
| processedAt | Date | When separation completed |

**Relationships**: One-to-one with Song (a Song has at most one StemResult).

### NoteEvent

A single detected note from the pitch transcription process. These are the raw output from Basic Pitch before guitar tab conversion.

| Field | Type | Description |
|-------|------|-------------|
| pitchMidi | number | MIDI note number (0–127) |
| startTime | number | Note onset time in seconds |
| duration | number | Note duration in seconds |
| confidence | number | Detection confidence (0.0–1.0) |
| pitchBend | number \| null | Pitch bend in semitones, if detected |

**Validation rules**:
- `pitchMidi` must be between 0 and 127
- `startTime` must be >= 0
- `duration` must be > 0
- `confidence` must be between 0.0 and 1.0

### Transcription

A collection of NoteEvents representing the full vocal transcription for a song.

| Field | Type | Description |
|-------|------|-------------|
| songId | string | Reference to parent Song |
| notes | NoteEvent[] | Ordered array of detected notes |
| estimatedTempo | number \| null | Detected tempo in BPM, if determinable |
| processedAt | Date | When transcription completed |

**Relationships**: One-to-one with Song.

### TabNote

A single note positioned on the guitar fretboard.

| Field | Type | Description |
|-------|------|-------------|
| string | number | Guitar string (1–6, where 1 = high E) |
| fret | number | Fret number (0–24) |
| startTime | number | Note onset time in seconds |
| duration | number | Note duration in seconds |
| pitchMidi | number | Original MIDI note number |

**Validation rules**:
- `string` must be between 1 and 6
- `fret` must be between 0 and 24
- Adjacent notes should not require impossible hand position jumps (fret distance > 5 within a single beat)

### GuitarTab

The complete guitar tablature for a song, ready for rendering.

| Field | Type | Description |
|-------|------|-------------|
| songId | string | Reference to parent Song |
| notes | TabNote[] | Ordered array of tab notes |
| tuning | string[] | Guitar tuning, default: ["E2", "A2", "D3", "G3", "B3", "E4"] |
| timeSignature | [number, number] | Time signature, default: [4, 4] |
| tempo | number | Tempo in BPM |
| alphaTex | string | Generated AlphaTex markup for alphaTab rendering |
| processedAt | Date | When tab generation completed |

**Relationships**: One-to-one with Song. Derived from Transcription.

### ConfidenceReport

Metadata about processing quality and detected audio characteristics.

| Field | Type | Description |
|-------|------|-------------|
| songId | string | Reference to parent Song |
| overallConfidence | "high" \| "medium" \| "low" | Aggregate confidence level |
| averageNoteConfidence | number | Mean confidence across all detected notes (0.0–1.0) |
| warnings | ConfidenceWarning[] | List of detected issues |
| processedAt | Date | When analysis completed |

### ConfidenceWarning

A specific warning about audio characteristics that may affect transcription quality.

| Field | Type | Description |
|-------|------|-------------|
| type | WarningType | Category of warning |
| message | string | User-facing description |
| severity | "info" \| "warning" \| "critical" | How much this affects accuracy |

### WarningType

Enum of detectable audio quality issues.

| Value | Description |
|-------|-------------|
| `multiple-singers` | Multiple vocal parts detected |
| `choir-harmony` | Choir or dense harmonies detected |
| `heavy-distortion` | High spectral noise or distortion |
| `spoken-word` | Rap or spoken vocals detected |
| `low-volume` | Vocal track has very low amplitude |
| `short-duration` | Song is very short (< 30 seconds) |

## IndexedDB Schema

### Database: `songlens-db`

| Store | Key | Indexes | Contents |
|-------|-----|---------|----------|
| `songs` | `id` | `uploadedAt`, `status` | Song metadata (excludes Blob fields) |
| `audio-blobs` | `songId` | — | Raw uploaded audio Blob |
| `stems` | `songId` | — | StemResult (vocal + instrumental Blobs) |
| `transcriptions` | `songId` | — | Transcription (NoteEvent arrays) |
| `tabs` | `songId` | — | GuitarTab (including alphaTex) |
| `confidence` | `songId` | — | ConfidenceReport |

**Design rationale**: Large binary data (Blobs) is stored in separate object stores from metadata to allow fast metadata queries without loading multi-MB audio into memory. All stores use `songId` as key for simple one-to-one lookups.
