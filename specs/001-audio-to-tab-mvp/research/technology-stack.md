# Technology Stack Research: SongLens Audio-to-Tab MVP

**Date**: 2026-05-31  
**Context**: Browser-based React/TypeScript/Vite music practice application  
**Scope**: Audio separation, pitch detection, tab rendering, MIDI playback, music theory

---

## 1. Audio Source Separation (Vocals ↔ Instrumental)

### Summary Decision

**Architecture: Python microservice with Demucs** (no mature client-side solution exists)

### Libraries Evaluated

| Library | Client-Side? | Quality (SDR) | Status | Notes |
|---------|-------------|--------------|--------|-------|
| **Demucs v4** (Meta) | No — Python/PyTorch | 9.0 dB (SOTA) | Archived at `facebookresearch/demucs`, forked to `adefossez/demucs` | Hybrid Transformer model. Separates drums, bass, vocals, other (+ experimental guitar/piano). Requires 3-7 GB GPU RAM. |
| **Spleeter** (Deezer) | No — Python/TensorFlow | 5.9 dB | Maintenance mode | Older, lower quality. Faster but significantly worse results than Demucs v4. |
| **Open-Unmix** | No — Python/PyTorch | 5.3 dB | Active | Open reference model. Quality is substantially below Demucs. |
| **ONNX Runtime Web** | Theoretically possible | N/A | N/A | Could run a converted model in-browser, but Demucs models are ~80-300 MB, and inference for a 4-min song takes minutes even on GPU. Impractical for real-time browser use. |

### Why No Client-Side Solution Exists

- **Model size**: Demucs `htdemucs` models are 80+ MB (quantized: ~27 MB). Loading into WASM is feasible but slow.
- **Compute cost**: Separation of a 4-minute track requires ~1.5x realtime on CPU. In WASM, this would be 5-10x slower (~20-60 min), making it completely impractical.
- **Memory**: Processing requires 3+ GB RAM for GPU, and WASM has practical memory limits around 4 GB.
- No WASM port of Demucs exists. The 404'd `demucs-wasm` repos confirm nobody has shipped one.

### Recommended Architecture

```
┌──────────────┐         ┌──────────────────────┐
│  Browser     │  upload  │  Python Microservice  │
│  (React/TS)  │ ──────> │  FastAPI + Demucs     │
│              │ <────── │  htdemucs_ft model    │
│              │  stems   │  GPU recommended      │
└──────────────┘         └──────────────────────┘
```

- **Model**: `htdemucs_ft` (fine-tuned, best quality) or `htdemucs` (4x faster, slightly lower quality)
- **API**: POST audio file → returns vocal + instrumental stems as WAV/MP3
- **`--two-stems=vocals`** flag for karaoke-style output (vocals + accompaniment)
- **Runtime**: ~6s for a 4-min track on GPU, ~6 min on CPU
- **Deployment**: Docker container with PyTorch + Demucs. Lightweight FastAPI wrapper.

### Alternative: Pre-computed ONNX via `onnxruntime-web`

Not recommended for MVP. A quantized ONNX model could theoretically run in-browser but would take 20+ minutes for a single song. Could be explored for a "local-only" premium feature in the future.

---

## 2. Pitch Detection / Audio-to-MIDI Transcription

### Summary Decision

**Primary: `@spotify/basic-pitch` (polyphonic AMT in browser)**  
**Fallback for real-time: `pitchy` (monophonic, ultra-lightweight)**

### Libraries Evaluated

| Library | Type | Client-Side? | Bundle Size | Polyphonic? | Status |
|---------|------|-------------|-------------|------------|--------|
| **@spotify/basic-pitch** (`basic-pitch-ts`) | Neural AMT | Yes (TensorFlow.js) | ~5 MB (model included) | Yes | Last release v1.0.1 (2022). 335★. Maintained by Spotify. TypeScript. Uses `AudioBuffer` input. |
| **pitchy** | Autocorrelation (McLeod) | Yes | 7.8 kB min / 2.8 kB gzip | No (mono) | v4.1.0 (2024). 127★. Pure JS, zero-dep except fft.js. ESM-only. |
| **essentia.js** | WASM (C++ compiled) | Yes | ~1.5 MB (WASM) | Yes (PitchMelodia) | Active, MTG/UPF. Massive feature set: PitchYin, PitchYinFFT, PitchMelodia, MultiPitchKlapuri, BeatTrackerDegara, KeyExtractor, ChordsDetection, etc. |
| **aubio.js** | WASM (C compiled) | Yes | ~200 KB | No (mono) | Thin wrapper. Less maintained. |
| **CREPE** (TF-based) | Neural CNN | Yes (TF.js) | ~10 MB | No (mono) | Research model. High accuracy for monophonic. Heavy. |

### Recommended Approach

**For the MVP pipeline (offline transcription after separation):**

1. **`@spotify/basic-pitch`** — Best fit. Designed exactly for this use case (audio → MIDI notes with pitch bends). Works in browser via TensorFlow.js. Handles polyphonic audio. Instrument-agnostic. Spotify uses it in production (basicpitch.io demo runs entirely in-browser).

   ```typescript
   import { BasicPitch } from "@spotify/basic-pitch";
   
   const basicPitch = new BasicPitch(model);
   await basicPitch.evaluateModel(audioBuffer, (frames, onsets, contours) => {
     // Process frame-level predictions
   });
   const notes = noteFramesToTime(
     addPitchBendsToNoteEvents(contours, outputToNotesPoly(frames, onsets))
   );
   ```

2. **`pitchy`** — Use as a lightweight supplement for real-time pitch display (e.g., tuner mode, live pitch overlay). At 2.8 kB gzipped, it adds no meaningful bundle cost.

**For future enrichment (BPM, key detection, etc.):**

3. **`essentia.js`** — Powerful WASM-based audio analysis toolkit. Has `PitchMelodia`, `PitchYin`, `KeyExtractor`, `BeatTrackerDegara`, `ChordsDetection`, `RhythmExtractor`, and many more algorithms. The WASM bundle is ~1.5 MB, so load it lazily. Great for advanced features like:
   - Auto-detecting song key
   - BPM / tempo estimation
   - Chord progression detection
   - Onset detection for better note segmentation

### Why `@spotify/basic-pitch` over alternatives

- **Polyphonic**: Unlike pitchy/aubio (monophonic only), it handles chords and overlapping notes
- **Note events**: Outputs structured note events with onset/offset/pitch/velocity — exactly what we need for tab generation
- **Pitch bends**: Detects micro-pitch variations (slides, bends)
- **Browser-native**: Uses Web Audio API `AudioBuffer` as input, no server needed
- **Proven**: Powers basicpitch.io which processes audio entirely client-side

### Caveat

`basic-pitch-ts` hasn't had a release since 2022 (v1.0.1). The Python sibling is actively maintained (v0.4.0, 2024). The TS version works but may need a fork if issues arise. The TensorFlow.js dependency adds ~3 MB to bundle (load lazily).

---

## 3. Guitar Tablature Rendering

### Summary Decision

**Primary: `@coderline/alphatab`** — Purpose-built for Guitar Pro-style interactive tablature

### Libraries Evaluated

| Library | Tab Support | GP File Support | MIDI Playback | Bundle Size | Status |
|---------|-----------|-----------------|--------------|-------------|--------|
| **@coderline/alphaTab** | Full guitar tab + standard notation | GP3-7, MusicXML, AlphaTex, CapXML | Built-in SoundFont2 synth | 1.2 MB min / 282 kB gzip | v1.8.3 (2026). 1.7k★. Actively maintained. MPL-2.0. |
| **VexFlow** | Basic tab staves | No file importers | No | ~400 kB | v5.0.0 (2025). 3.8k★. Low-level notation primitives. MIT. |
| **abcjs** | Limited tab (since v6.0-beta.36) | ABC notation only | Built-in synth | ~200 kB | v6.6.3 (2026). Active. MIT. |
| **flat.io embed** | Full | Guitar Pro | Yes | N/A (iframe) | Commercial SaaS. Not self-hosted. |

### Why alphaTab

alphaTab is the **clear winner** for this use case:

- **Purpose-built for Guitar Pro-style tablature**: Renders full guitar tabs with all notation symbols (bends, slides, hammer-ons, pull-offs, palm mutes, harmonics, etc.)
- **Loads GP3-7 files natively**: Can import any Guitar Pro file format
- **Built-in MIDI synthesizer**: Uses TinySoundFont + SoundFont2 for playback — this eliminates the need for a separate MIDI playback solution
- **Interactive cursor/playhead**: Built-in animated cursor that follows playback
- **Responsive layout**: Adapts to container width automatically
- **AlphaTex markup**: Text-based format for programmatic tab generation — we can convert our detected notes to AlphaTex and render them
- **Zero dependencies**: Self-contained, no external libraries needed
- **React integration**: Official React support with sample projects
- **NPM package**: `npm install @coderline/alphatab`
- **Web Workers**: Rendering runs in a background worker for smooth UI

### Bundle Size Consideration

At 1.2 MB minified (282 kB gzipped), alphaTab is large but justified — it replaces what would otherwise require VexFlow + Tone.js + soundfont-player + custom cursor logic. The SoundFont2 file (for playback) is an additional ~2-4 MB loaded on demand.

### VexFlow as Alternative

VexFlow is a lower-level SVG music notation library. It supports tab staves but requires manually constructing every note, measure, and voice. No file importers, no playback, no cursor. It would require 10x the development effort to match alphaTab's features. Better suited for custom notation editors or music theory visualization tools.

### Integration Pattern

```typescript
import { AlphaTabApi } from "@coderline/alphatab";

const api = new AlphaTabApi(element, {
  tex: true,
  player: { enablePlayer: true, soundFont: "/sonivox.sf2" }
});

// Load generated tab from our transcription pipeline
api.tex("\\title 'My Song'\n:4 0.6 1.6 3.6 0.5 2.5 ...");

// Or load a .gp file
api.load(gpFileArrayBuffer);
```

---

## 4. MIDI Playback & Audio Synthesis

### Summary Decision

**Use alphaTab's built-in synthesizer** for tab playback.  
**Keep `Tone.js` as a reference** for custom audio needs beyond tab playback.

### Libraries Evaluated

| Library | Type | Bundle Size | Status | Notes |
|---------|------|-------------|--------|-------|
| **alphaTab (built-in)** | SoundFont2 synth | Included in alphaTab | v1.8.3 | Based on TinySoundFont. Synchronized with tab cursor. |
| **Tone.js** | Full Web Audio framework | ~150 kB | 14.6k★. Active (`tone@next`). MIT. | DAW-like features: Transport, synths, effects, scheduling. |
| **soundfont-player** | SoundFont loader | ~30 kB | **Archived** (2023). 475★. | Author recommends `smplr` instead. Loads pre-rendered soundfonts from CDN. |
| **@tonejs/midi** | MIDI file parser | ~20 kB | Companion to Tone.js | Parses MIDI files to JSON. |
| **MIDI.js** | Full MIDI stack | ~300 kB | Outdated, largely abandoned | Heavy, old API. Not recommended. |
| **WebMidi API** | Hardware MIDI I/O | Native (0 kB) | Browser standard | For connecting MIDI keyboards. Not for synthesis. |

### Rationale

Since **alphaTab already includes a MIDI synthesizer** (based on TinySoundFont + SoundFont2), adding Tone.js for tab playback would be redundant. alphaTab handles:
- MIDI synthesis from the rendered score
- Synchronized cursor/playhead movement
- Play/pause/seek controls
- Tempo adjustment

**Tone.js** would only be needed if we want:
- Custom synth sounds beyond SoundFont2
- Audio effects (reverb, delay, EQ) on playback
- Complex scheduling independent of the tab
- Metronome click track with custom sounds

For the MVP, alphaTab's built-in player is sufficient. Tone.js can be added later for advanced features.

### `@tonejs/midi` for MIDI Export

If we need to export the transcription as a standard MIDI file, `@tonejs/midi` (20 kB) provides a clean API for constructing and serializing MIDI:

```typescript
import { Midi } from "@tonejs/midi";

const midi = new Midi();
const track = midi.addTrack();
track.addNote({ midi: 60, time: 0, duration: 0.5 });
const blob = new Blob([midi.toArray()], { type: "audio/midi" });
```

---

## 5. Music Theory (Note-to-Fret Mapping)

### Summary Decision

**`tonal`** — Comprehensive music theory library, well-suited for note/interval/scale operations

### Library Details

| Property | Value |
|----------|-------|
| **Package** | `tonal` (or individual `@tonaljs/*` packages) |
| **Bundle** | 41 kB min / 14 kB gzip (full). Individual packages much smaller. |
| **Stars** | 4.2k ★ |
| **Status** | Active (commits 2 weeks ago). 69 contributors. |
| **License** | MIT |
| **TypeScript** | Yes, written in TypeScript |

### Key Capabilities for SongLens

```typescript
import { Note, Interval, Scale, Chord } from "tonal";

Note.midi("C4");           // => 60
Note.freq("A4");           // => 440
Note.fromMidi(60);         // => "C4"
Note.transpose("C4", "5P"); // => "G4"
Interval.semitones("5P");  // => 7

// For note-to-fret mapping:
Note.midi("E2");  // => 40 (open 6th string)
Note.midi("B2");  // => 47 (open 5th string)
// Fret = targetMidi - openStringMidi
```

### Note-to-Fret Mapping Strategy

tonal provides the MIDI↔note conversions. The fret mapping logic is domain-specific:

```typescript
const STANDARD_TUNING = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 E4

function noteToFretOptions(midiNote: number): { string: number; fret: number }[] {
  return STANDARD_TUNING
    .map((open, i) => ({ string: i + 1, fret: midiNote - open }))
    .filter(({ fret }) => fret >= 0 && fret <= 24);
}
```

This is custom logic, but tonal provides the foundational note/MIDI/frequency conversions and music theory operations needed for features like:
- Transposition (capo support)
- Scale-aware fret selection (prefer positions within a scale pattern)
- Chord detection from simultaneous notes
- Key signature display

---

## 6. Audio Decoding & Processing

### Summary Decision

**Use native Web Audio API** — no additional libraries needed

### Approach

```typescript
const audioContext = new AudioContext();
const response = await fetch(audioUrl);
const arrayBuffer = await response.arrayBuffer();
const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
// audioBuffer.getChannelData(0) → Float32Array of samples
```

- **`AudioContext.decodeAudioData()`** handles MP3, WAV, OGG, FLAC, AAC natively in all modern browsers
- **No npm package needed** for decoding
- **`audiobuffer-to-wav`** (2 kB) can be used if we need to convert AudioBuffer back to WAV for download, but this is trivial to implement manually

### For the separation microservice

Audio files are uploaded as-is (MP3/WAV). Demucs handles its own decoding via torchaudio/ffmpeg. Stems are returned as WAV or MP3.

---

## 7. Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (React/TS/Vite)               │
│                                                          │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────┐ │
│  │ Upload   │   │ @spotify/    │   │ @coderline/     │ │
│  │ Component│──>│ basic-pitch  │──>│ alphatab        │ │
│  │          │   │ (pitch det.) │   │ (tab render +   │ │
│  │          │   └──────────────┘   │  MIDI playback) │ │
│  │          │          │           └─────────────────┘ │
│  │          │   ┌──────┴───────┐   ┌─────────────────┐ │
│  │          │   │ tonal        │   │ pitchy          │ │
│  │          │   │ (music       │   │ (real-time      │ │
│  │          │   │  theory)     │   │  tuner, opt.)   │ │
│  │          │   └──────────────┘   └─────────────────┘ │
│  └────┬─────┘                                           │
│       │ upload audio                                     │
│       ▼                                                  │
│  ┌──────────────────────────────────────┐               │
│  │ Web Audio API (decodeAudioData)      │               │
│  └──────────────────────────────────────┘               │
└───────────────────────┬─────────────────────────────────┘
                        │ POST /separate
                        ▼
              ┌──────────────────────┐
              │  Python Microservice │
              │  FastAPI + Demucs    │
              │  htdemucs_ft model   │
              └──────────────────────┘
```

### Bundle Budget

| Package | Gzipped Size | Load Strategy |
|---------|-------------|---------------|
| `@coderline/alphatab` | ~282 kB | Lazy (route-level) |
| `@spotify/basic-pitch` + TF.js | ~3-5 MB | Lazy (on first transcription) |
| `tonal` | ~14 kB | Eager (tiny) |
| `pitchy` | ~3 kB | Eager (tiny) |
| `@tonejs/midi` | ~8 kB | Lazy (on MIDI export) |
| SoundFont2 file | ~2-4 MB | Lazy (on first playback) |
| **Total eager** | **~17 kB** | |
| **Total lazy (worst case)** | **~5.6 MB** | Loaded on demand |

### Technology Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Audio Separation** | Python microservice + Demucs `htdemucs_ft` | No viable client-side option. Demucs is SOTA (9.0 dB SDR). |
| **Pitch Detection** | `@spotify/basic-pitch` (browser) | Polyphonic AMT, outputs structured note events, proven at basicpitch.io. |
| **Tab Rendering** | `@coderline/alphatab` | Purpose-built for Guitar Pro-style tabs. Built-in synth + cursor. Zero deps. |
| **MIDI Playback** | alphaTab built-in (TinySoundFont) | Already included with tab rendering. No extra dependency. |
| **Music Theory** | `tonal` | Comprehensive note/scale/chord/interval operations. 14 kB gzipped. |
| **Audio Decoding** | Web Audio API native | Built into browsers. No library needed. |
| **Real-time Pitch** | `pitchy` (optional) | 3 kB, for tuner/live features in future. |

### Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `basic-pitch-ts` unmaintained (last release 2022) | Medium | Fork if needed. Python sibling is active. Core model is stable. |
| alphaTab bundle size (282 kB gzip) | Low | Lazy load. It replaces 3+ libraries worth of functionality. |
| Demucs requires server + GPU | High | Start with CPU inference (~6 min/song). Add GPU when scaling. Consider queue-based processing. |
| TensorFlow.js model loading time | Medium | Cache model in IndexedDB after first load. Show progress indicator. |
| alphaTab MPL-2.0 license | Low | MPL-2.0 allows use in proprietary apps. Only modifications to alphaTab's own files must be shared. |

---

## Appendix: Libraries Not Recommended

| Library | Reason |
|---------|--------|
| **Spleeter** | Much lower quality than Demucs (5.9 vs 9.0 SDR). Older TF1 dependency. |
| **Open-Unmix** | Even lower quality (5.3 SDR). Only useful as a baseline. |
| **MIDI.js** | Abandoned, heavy, old API. |
| **soundfont-player** | Archived by author. Successor is `smplr`. |
| **VexFlow** (for tabs) | Too low-level. No file importers, no playback, no cursor. |
| **abcjs** (for tabs) | Tab support is limited/basic. ABC format is not natural for guitar tabs. |
| **flat.io** | Commercial SaaS, not self-hosted. Iframe-based. |
| **CREPE** | Monophonic only. Heavy TF.js model (~10 MB). Superseded by basic-pitch for our use case. |
| **aubio.js** | Monophonic only. Less maintained than pitchy. |
