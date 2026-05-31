# UI Contracts: Audio-to-Tab MVP

**Feature**: specs/001-audio-to-tab-mvp
**Date**: 2026-05-31

## Page Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Upload | Song upload with drag-and-drop or file picker |
| `/song/:id` | Viewer | Tab viewer with playback controls for a processed song |
| `/songs` | Library | List of previously processed songs |

## Component Contracts

### UploadPage

**Inputs**: None
**Outputs**: Navigates to `/song/:id` after upload begins

**Behavior**:
- Accepts drag-and-drop or file picker for MP3/WAV files
- Validates file type and size before processing
- Shows file size limit prominently
- Shows upload progress, then redirects to Viewer page where processing continues

### SongViewerPage

**Inputs**: Song ID from URL parameter
**Outputs**: Renders tab viewer, playback controls, download button

**Behavior**:
- If song is still processing: show processing pipeline progress (separation → transcription → conversion)
- If processing failed: show which step failed with a retry option
- If complete: render full tab viewer with playback controls

**Sub-components**:
- `TabViewer` — renders alphaTab instance with the generated AlphaTex
- `PlaybackControls` — play/pause/seek, listening mode selector
- `ConfidenceDisplay` — shows confidence score and warnings
- `DownloadButton` — downloads instrumental track

### TabViewer

**Inputs**: `alphaTex: string`, `playbackState: PlaybackState`
**Outputs**: Visual tablature with animated cursor

**Behavior**:
- Renders guitar tablature using alphaTab
- Highlights current note during playback
- Auto-scrolls to keep playhead visible
- Supports click-to-seek on measures
- Responsive: adapts layout to container width

### PlaybackControls

**Inputs**: `playbackState: PlaybackState`, `listeningModes: ListeningMode[]`
**Outputs**: User actions (play, pause, seek, mode change)

**Behavior**:
- Play/Pause toggle button
- Seek bar showing current position / total duration
- Listening mode selector: "MIDI Only" | "Instrumental + MIDI"
- Current measure and beat indicator

### ConfidenceDisplay

**Inputs**: `report: ConfidenceReport`
**Outputs**: Visual confidence badge and warnings

**Behavior**:
- Shows confidence level as a colored badge (High = green, Medium = amber, Low = red)
- Lists any warnings with icons and descriptions
- Collapsible: shows summary by default, expandable for details

### SongLibraryPage

**Inputs**: None
**Outputs**: List of songs, navigation to individual songs

**Behavior**:
- Lists all previously processed songs from IndexedDB
- Shows song name, upload date, status, confidence level
- Click to navigate to `/song/:id`
- Delete option to remove songs and free storage

## Type Contracts

### PlaybackState

```typescript
interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;  // seconds
  duration: number;     // seconds
  currentMeasure: number;
  currentBeat: number;
  listeningMode: ListeningMode;
}
```

### ListeningMode

```typescript
type ListeningMode = "midi" | "instrumental-midi";
```

### ProcessingProgress

```typescript
interface ProcessingProgress {
  stage: "uploading" | "separating" | "transcribing" | "converting";
  progress: number;  // 0.0 to 1.0
  message: string;
}
```
