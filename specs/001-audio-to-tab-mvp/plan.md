# Implementation Plan: Audio-to-Tab MVP

**Branch**: `001-audio-to-tab-mvp` | **Date**: 2026-05-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-audio-to-tab-mvp/spec.md`

## Summary

Build a web application that converts uploaded audio (MP3/WAV) into interactive guitar tablature. The system uses a Python microservice (Demucs) for vocal/instrumental separation, Spotify's Basic Pitch (TensorFlow.js) for in-browser pitch transcription, tonal.js for note-to-fret mapping, and alphaTab for rendering interactive Guitar Pro-style tablature with built-in MIDI playback. Songs and results are persisted locally via IndexedDB. The app ships as an installable PWA.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) — frontend; Python 3.10+ — separation service

**Primary Dependencies**: React 18+, @coderline/alphatab, @spotify/basic-pitch, tonal, idb, shadcn/ui + Radix UI, Tailwind CSS — frontend; FastAPI, Demucs (Meta) — separation service

**Storage**: IndexedDB (via `idb`) for songs, audio blobs, stems, transcriptions, tabs, confidence reports

**Testing**: Vitest + React Testing Library + MSW (frontend); pytest (separation service)

**Target Platform**: Modern browsers (latest 2 versions Chrome, Firefox, Safari, Edge; iOS Safari 15+), installable PWA

**Project Type**: Web application (SPA frontend + lightweight Python microservice)

**Build Tool**: Vite + vite-plugin-pwa

**Performance Goals**: App shell loads < 3s on broadband; MIDI playback highlighting < 200ms latency; 4-minute song processed < 3 minutes total

**Constraints**: Initial bundle < 200 KB gzipped (app shell); offline-capable for previously processed songs; all transcription runs client-side; separation requires server-side compute

**Scale/Scope**: Single-user local application; ~3 pages; ~15 components; 1 external service endpoint

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Readability-First Code ✅

- Folder-per-component structure with single-responsibility modules
- All services are isolated in dedicated folders with clear naming
- File size limit of 300 lines enforced
- Named constants for all configuration values

### II. Library-First ✅

- alphaTab for tab rendering + MIDI synth (replaces 3-4 custom solutions)
- Basic Pitch for transcription (replaces custom pitch detection pipeline)
- tonal for music theory (replaces custom MIDI-to-note math)
- idb for IndexedDB (replaces verbose raw API)
- shadcn/ui + Radix for UI components (replaces hand-rolled widgets)
- Demucs for separation (SOTA model, no custom ML)

### III. Type Safety & Clean Code ✅

- TypeScript strict mode enabled
- Shared types in `src/types/` directory
- No `any` usage — `unknown` with narrowing for external data
- All function parameters and return types explicitly typed

### IV. Unit Test Coverage ✅

- Vitest + React Testing Library for all components and services
- MSW for mocking separation service API
- Co-located test files (`.test.ts` / `.test.tsx`)
- 80% line coverage target for business logic

### V. Unified Design System ✅

- shadcn/ui as single component library
- Tailwind CSS design tokens (colors, spacing, typography) in central config
- WCAG 2.1 AA via Radix UI accessibility primitives
- Mobile-first responsive breakpoints (320px+)

### VI. Progressive Web App Standards ✅

- vite-plugin-pwa for manifest + service worker
- App shell and critical assets cached for offline
- Previously processed songs available offline via IndexedDB
- Graceful offline/error handling for separation service calls

### Post-Design Re-check ✅

All six principles satisfied. No violations to track.

## Project Structure

### Documentation (this feature)

```text
specs/001-audio-to-tab-mvp/
├── plan.md              # This file
├── research.md          # Phase 0: Technology research & decisions
├── data-model.md        # Phase 1: Entity definitions & IndexedDB schema
├── quickstart.md        # Phase 1: Setup & development guide
├── contracts/
│   ├── separation-api.md  # Separation service HTTP API contract
│   └── ui-contracts.md    # Page routes, component contracts, type contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/                # Shared UI components (folder-per-component)
│   ├── TabViewer/
│   │   ├── TabViewer.tsx
│   │   ├── TabViewer.test.tsx
│   │   └── index.ts
│   ├── PlaybackControls/
│   │   ├── PlaybackControls.tsx
│   │   ├── PlaybackControls.test.tsx
│   │   └── index.ts
│   ├── ConfidenceDisplay/
│   │   ├── ConfidenceDisplay.tsx
│   │   ├── ConfidenceDisplay.test.tsx
│   │   └── index.ts
│   ├── FileUpload/
│   │   ├── FileUpload.tsx
│   │   ├── FileUpload.test.tsx
│   │   └── index.ts
│   ├── ProcessingProgress/
│   │   ├── ProcessingProgress.tsx
│   │   ├── ProcessingProgress.test.tsx
│   │   └── index.ts
│   ├── SongCard/
│   │   ├── SongCard.tsx
│   │   ├── SongCard.test.tsx
│   │   └── index.ts
│   └── ui/                    # shadcn/ui primitives (Button, Card, etc.)
│       ├── button.tsx
│       ├── card.tsx
│       ├── progress.tsx
│       ├── badge.tsx
│       └── ...
├── pages/                     # Page-level route components
│   ├── UploadPage/
│   │   ├── UploadPage.tsx
│   │   ├── UploadPage.test.tsx
│   │   └── index.ts
│   ├── SongViewerPage/
│   │   ├── SongViewerPage.tsx
│   │   ├── SongViewerPage.test.tsx
│   │   └── index.ts
│   └── SongLibraryPage/
│       ├── SongLibraryPage.tsx
│       ├── SongLibraryPage.test.tsx
│       └── index.ts
├── services/                  # Business logic (folder-per-service)
│   ├── separation/
│   │   ├── separationService.ts
│   │   ├── separationService.test.ts
│   │   └── index.ts
│   ├── transcription/
│   │   ├── transcriptionService.ts
│   │   ├── transcriptionService.test.ts
│   │   └── index.ts
│   ├── tabConversion/
│   │   ├── tabConversionService.ts
│   │   ├── noteToFretMapper.ts
│   │   ├── alphaTexGenerator.ts
│   │   ├── tabConversionService.test.ts
│   │   ├── noteToFretMapper.test.ts
│   │   ├── alphaTexGenerator.test.ts
│   │   └── index.ts
│   ├── confidence/
│   │   ├── confidenceAnalyzer.ts
│   │   ├── confidenceAnalyzer.test.ts
│   │   └── index.ts
│   ├── storage/
│   │   ├── database.ts
│   │   ├── songRepository.ts
│   │   ├── songRepository.test.ts
│   │   └── index.ts
│   └── processing/
│       ├── processingPipeline.ts
│       ├── processingPipeline.test.ts
│       └── index.ts
├── hooks/                     # Custom React hooks
│   ├── usePlayback.ts
│   ├── usePlayback.test.ts
│   ├── useProcessing.ts
│   ├── useProcessing.test.ts
│   ├── useSongLibrary.ts
│   └── useSongLibrary.test.ts
├── context/                   # React Context providers
│   ├── PlaybackContext.tsx
│   └── ProcessingContext.tsx
├── types/                     # Shared TypeScript types
│   ├── song.ts
│   ├── transcription.ts
│   ├── tab.ts
│   ├── confidence.ts
│   └── playback.ts
├── constants/                 # Named constants and configuration
│   ├── audio.ts
│   ├── guitar.ts
│   └── processing.ts
├── lib/                       # Third-party library wrappers/config
│   └── alphatab.ts
├── App.tsx
├── App.test.tsx
├── main.tsx
└── index.css                  # Tailwind directives + theme tokens

services/                      # Backend services (outside src/)
└── separation/
    ├── main.py                # FastAPI application
    ├── separator.py           # Demucs wrapper
    ├── requirements.txt
    ├── Dockerfile
    └── test_main.py

public/
├── manifest.json              # PWA manifest
└── icons/                     # PWA icons

index.html
vite.config.ts
tailwind.config.ts
tsconfig.json
vitest.config.ts
package.json
```

**Structure Decision**: Single SPA project with a separate lightweight Python service for audio separation. The frontend follows a folder-per-component and folder-per-service pattern as requested by the user, making each module independently exchangeable, extendable, and testable. Each folder has its own `index.ts` barrel export for clean import paths. The separation service is isolated under `services/separation/` at the repository root, clearly separated from the React frontend.
