# Research: Audio-to-Tab MVP

**Feature**: specs/001-audio-to-tab-mvp
**Date**: 2026-05-31

## Decisions

### 1. Audio Source Separation

**Decision**: Python microservice with Demucs (`htdemucs_ft` model)

**Rationale**: No viable client-side audio separation exists. Demucs is state-of-the-art (9.0 dB SDR on MDX23 benchmark) and separates into vocals, drums, bass, and other stems. The fine-tuned `htdemucs_ft` model provides the best vocal isolation quality, which directly impacts transcription accuracy — the highest-priority risk.

**Alternatives considered**:
- **Spleeter (Deezer)**: Faster but lower quality separation (5.9 dB SDR). Outdated TensorFlow 1.x dependency.
- **Open-Unmix**: Smaller model but significantly lower quality than Demucs.
- **ONNX Runtime Web**: Theoretically possible but Demucs model is 80MB+ and inference would take 20+ minutes per song in-browser. Impractical for MVP.
- **Client-side WASM**: No mature WASM ports of any separation model exist.

**Architecture**: A lightweight Python FastAPI service running Demucs. The React frontend uploads audio, the service returns separated stems. For local development, runs as a Docker container or direct Python process. This is the only server-side component.

### 2. Pitch Detection / Music Transcription

**Decision**: `@spotify/basic-pitch` (TensorFlow.js, runs entirely in-browser)

**Rationale**: Basic Pitch is a lightweight polyphonic audio-to-MIDI transcription model from Spotify's Audio Intelligence Lab. It runs entirely client-side via TensorFlow.js, produces note events with pitch, onset, duration, and pitch bends, and works across instruments. The model is instrument-agnostic, meaning it works on isolated vocal tracks. Published at ICASSP 2022 with strong academic backing.

**Alternatives considered**:
- **pitchy**: Only detects single-pitch frames, no note onset/offset detection. Would require building a full note segmentation pipeline on top.
- **aubio.js**: Pitch detection only, no note transcription. WASM port is unmaintained.
- **essentia.js**: Comprehensive audio analysis but no note-level transcription. Would need significant custom code.
- **CREPE (TensorFlow)**: Monophonic pitch tracker only. No note segmentation.

**Key details**:
- Accepts MP3, WAV, OGG, FLAC via Web Audio API `decodeAudioData`
- Downmixes stereo to mono, resamples to 22050 Hz
- Outputs note events: pitch (MIDI number), start time, duration, confidence, pitch bends
- ~5 MB model weight (lazy-loaded)

### 3. Guitar Tablature Rendering

**Decision**: `@coderline/alphatab` v1.8.3

**Rationale**: alphaTab is a purpose-built, cross-platform music notation and guitar tablature rendering library. It provides exactly the Songsterr/Guitar Pro-style tab viewer needed, with built-in features: animated playback cursor, auto-scrolling, SoundFont2 MIDI synthesis, GP3-7 file support, responsive resizing, SVG/Canvas rendering. This single library replaces what would otherwise require 3-4 separate libraries (tab renderer + MIDI synth + playback cursor + scroll sync).

**Alternatives considered**:
- **VexFlow**: General-purpose music notation renderer. Would need significant custom code for guitar-tab-specific features (string/fret layout, playback cursor, scrolling). No built-in audio.
- **abcjs**: ABC notation focused. Not designed for guitar tablature. No playback cursor.
- **flat.io embed**: Commercial SaaS product, not a library. Would create vendor dependency.
- **Custom Canvas rendering**: Maximum flexibility but enormous development effort for a feature that is not the core differentiator.

**Key details**:
- Loads AlphaTex markup (text-based notation format) or Guitar Pro files
- Built-in MIDI synthesizer using SoundFont2 — no need for Tone.js
- Animated cursor and auto-scroll during playback
- Responsive layout with dynamic resizing
- ESM module support, TypeScript declarations
- MPL-2.0 license
- ~500 KB + SoundFont file (lazy-loaded)

### 4. MIDI Playback

**Decision**: alphaTab's built-in alphaSynth (SoundFont2 synthesizer)

**Rationale**: Since alphaTab already includes a full MIDI synthesizer with SoundFont2 support, adding Tone.js or another audio library would be redundant for the MVP. The built-in synth handles guitar sounds, is synchronized with the visual cursor, and eliminates the need to manage separate playback state.

**Alternatives considered**:
- **Tone.js**: Powerful Web Audio framework. Would be needed if using VexFlow for rendering but is redundant with alphaTab.
- **soundfont-player**: Lighter weight but still redundant with alphaTab's built-in synth.
- **MIDI.js**: Outdated, last updated 2018.

### 5. Music Theory Utilities

**Decision**: `tonal` v6.4.3

**Rationale**: Tonal provides pure-function music theory operations — MIDI-to-note conversion, interval calculation, scale/chord detection. Used for the note-to-fret mapping service that converts Basic Pitch's MIDI note output into guitar fret positions. 14 kB gzipped, zero dependencies, TypeScript-native, actively maintained (10k weekly downloads).

**Alternatives considered**:
- **teoria**: Older, object-oriented API. Less TypeScript support.
- **Custom implementation**: Simple for basic MIDI-to-fret mapping but tonal provides battle-tested edge cases (enharmonic spelling, octave boundaries).

### 6. Local Storage

**Decision**: IndexedDB via `idb` wrapper library

**Rationale**: Songs and processing results must persist locally (FR-017). IndexedDB handles large binary data (audio blobs, stems) that localStorage cannot. The `idb` library provides a thin Promise-based wrapper over the verbose IndexedDB API, keeping code readable without adding significant bundle size (~1 kB).

**Alternatives considered**:
- **Raw IndexedDB API**: Verbose callback-based API reduces readability (violates Constitution Principle I).
- **localForage**: Larger abstraction layer with fallback to WebSQL/localStorage. Unnecessary since all target browsers support IndexedDB.
- **Dexie.js**: Feature-rich but heavier (~16 kB). More than needed for simple key-value blob storage.

### 7. Confidence & Quality Analysis

**Decision**: Heuristic analysis from Basic Pitch output + audio feature extraction

**Rationale**: Confidence scoring uses the note confidence values already output by Basic Pitch, combined with simple audio feature analysis (spectral flatness for noise/distortion, zero-crossing rate for speech detection, pitch variance for multiple singers). No additional ML model needed for MVP.

**Architecture**:
- Overall confidence: median confidence of detected notes from Basic Pitch
- Multiple singers: high pitch variance across overlapping time windows
- Distortion: high spectral flatness in the vocal track
- Speech/rap: low pitch periodicity + high zero-crossing rate
- Implemented as a pure analysis service consuming Basic Pitch output + raw audio features from Web Audio API AnalyserNode

### 8. Separation Service Architecture

**Decision**: Minimal Python FastAPI service with Demucs

**Rationale**: The separation service is intentionally minimal — a single endpoint that accepts audio and returns stems. It runs locally (Docker or direct Python) and does not require cloud deployment, user accounts, or persistent storage. This keeps the architecture simple while isolating the only component that cannot run in the browser.

**API contract**:
- `POST /separate` — accepts multipart audio file, returns JSON with base64-encoded or streamed audio stems (vocals, instrumental)
- `GET /health` — health check
- No authentication (local-only service for MVP)

### 9. UI Component Library

**Decision**: shadcn/ui + Radix UI primitives + Tailwind CSS

**Rationale**: Constitution Principle V requires a unified design system with an established component library. shadcn/ui provides accessible, unstyled Radix-based components that integrate natively with Tailwind CSS. Components are copied into the project (not imported from a package), giving full control over styling while maintaining accessibility (WCAG 2.1 AA via Radix).

### 10. State Management

**Decision**: React Context + `useReducer` for global state (per Constitution)

**Rationale**: Constitution explicitly permits Context + useReducer for global state, with Zustand/Jotai as escalation options. For MVP, the global state surface is small: current song, processing status, playback state. Context is sufficient without introducing additional dependencies.
