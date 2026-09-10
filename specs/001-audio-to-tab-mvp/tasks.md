# Tasks: Audio-to-Tab MVP

**Input**: Design documents from `specs/001-audio-to-tab-mvp/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, tooling, and basic structure

- [X] T001 Initialize Vite + React + TypeScript project with `npm create vite@latest` and configure `vite.config.ts`
- [X] T002 Install core dependencies: `@coderline/alphatab`, `@spotify/basic-pitch`, `tonal`, `idb`, `react-router-dom` in `package.json`
- [X] T003 Install dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `msw`, `jsdom`, `eslint`, `prettier`, `tailwindcss`, `postcss`, `autoprefixer` in `package.json`
- [X] T004 [P] Configure TypeScript strict mode in `tsconfig.json` (strict: true, no skipLibCheck except third-party)
- [X] T005 [P] Configure Tailwind CSS with design tokens (colors, spacing, typography) in `tailwind.config.ts` and `src/index.css`
- [X] T006 [P] Configure ESLint with strict TypeScript rules and Prettier in `eslint.config.js` and `.prettierrc`
- [X] T007 [P] Configure Vitest with jsdom environment in `vitest.config.ts`
- [X] T008 [P] Configure vite-plugin-pwa with manifest and service worker in `vite.config.ts` and `public/manifest.json`
- [X] T009 Create folder structure per plan.md: `src/components/`, `src/pages/`, `src/services/`, `src/hooks/`, `src/context/`, `src/types/`, `src/constants/`, `src/lib/`, `services/separation/`
- [X] T010 [P] Initialize shadcn/ui with Radix UI primitives: Button, Card, Progress, Badge, Dialog components in `src/components/ui/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, storage layer, and routing that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T011 [P] Define Song, ProcessingStatus types in `src/types/song.ts`
- [X] T012 [P] Define NoteEvent, Transcription types in `src/types/transcription.ts`
- [X] T013 [P] Define TabNote, GuitarTab types in `src/types/tab.ts`
- [X] T014 [P] Define ConfidenceReport, ConfidenceWarning, WarningType types in `src/types/confidence.ts`
- [X] T015 [P] Define PlaybackState, ListeningMode, ProcessingProgress types in `src/types/playback.ts`
- [X] T016 Define audio constants (MAX_FILE_SIZE, SUPPORTED_FORMATS, MAX_DURATION) in `src/constants/audio.ts`
- [X] T017 [P] Define guitar constants (STANDARD_TUNING, MIN_FRET, MAX_FRET, STRING_COUNT) in `src/constants/guitar.ts`
- [X] T018 [P] Define processing constants (STAGE_NAMES, TIMEOUT values) in `src/constants/processing.ts`
- [X] T019 Implement IndexedDB database initialization with all 6 object stores (songs, audio-blobs, stems, transcriptions, tabs, confidence) in `src/services/storage/database.ts`
- [X] T020 Implement songRepository with CRUD operations (save, getById, getAll, delete, updateStatus) in `src/services/storage/songRepository.ts`
- [X] T021 Create barrel export in `src/services/storage/index.ts`
- [X] T022 Set up React Router with routes: `/` (Upload), `/song/:id` (Viewer), `/songs` (Library) in `src/App.tsx`
- [X] T023 [P] Create ProcessingContext provider with useReducer for song processing state in `src/context/ProcessingContext.tsx`
- [X] T024 [P] Create PlaybackContext provider with useReducer for playback state in `src/context/PlaybackContext.tsx`
- [X] T025 Create main entry point wrapping App with context providers in `src/main.tsx`

**Checkpoint**: Foundation ready — types defined, storage operational, routing configured, contexts available

---

## Phase 3: User Story 1 — Upload Song and View Guitar Tab (Priority: P1) 🎯 MVP

**Goal**: A user uploads an MP3/WAV file, the system separates vocals, transcribes pitch, converts to guitar tab, and displays interactive tablature.

**Independent Test**: Upload a known song with a clear vocal melody → verify generated tab shows correct fret numbers on six strings with measures and beat markers.

### Separation Service (Python)

- [X] T026 [US1] Create FastAPI application with `/separate` (POST) and `/health` (GET) endpoints in `services/separation/main.py`
- [X] T027 [US1] Implement Demucs wrapper (`htdemucs_ft` model) with audio file processing and stem extraction in `services/separation/separator.py`
- [X] T028 [P] [US1] Create `services/separation/requirements.txt` with fastapi, uvicorn, demucs, torch dependencies
- [X] T029 [P] [US1] Create `services/separation/Dockerfile` for containerized deployment

### Frontend Services

- [X] T030 [US1] Implement separationService with POST /separate call, file upload, error handling, and response parsing in `src/services/separation/separationService.ts`
- [X] T031 [US1] Create barrel export in `src/services/separation/index.ts`
- [X] T032 [US1] Implement transcriptionService wrapping @spotify/basic-pitch: load model, evaluate audio buffer, return NoteEvent[] in `src/services/transcription/transcriptionService.ts`
- [X] T033 [US1] Create barrel export in `src/services/transcription/index.ts`
- [X] T034 [US1] Implement noteToFretMapper: convert MIDI note numbers to guitar string/fret positions using tonal, prefer positions minimizing hand movement in `src/services/tabConversion/noteToFretMapper.ts`
- [X] T035 [US1] Implement alphaTexGenerator: convert TabNote[] to AlphaTex markup string for alphaTab rendering in `src/services/tabConversion/alphaTexGenerator.ts`
- [X] T036 [US1] Implement tabConversionService orchestrating noteToFretMapper + alphaTexGenerator, accepting Transcription and returning GuitarTab in `src/services/tabConversion/tabConversionService.ts`
- [X] T037 [US1] Create barrel export in `src/services/tabConversion/index.ts`
- [X] T038 [US1] Implement processingPipeline orchestrating the full flow: validate → separate → transcribe → convert → persist, emitting progress events via ProcessingContext in `src/services/processing/processingPipeline.ts`
- [X] T039 [US1] Create barrel export in `src/services/processing/index.ts`

### Frontend Components

- [X] T040 [US1] Implement FileUpload component with drag-and-drop zone, file picker, type/size validation, and error messages in `src/components/FileUpload/FileUpload.tsx`
- [X] T041 [US1] Create barrel export in `src/components/FileUpload/index.ts`
- [X] T042 [US1] Implement ProcessingProgress component showing pipeline stages (separating → transcribing → converting) with progress bar and current stage label in `src/components/ProcessingProgress/ProcessingProgress.tsx`
- [X] T043 [US1] Create barrel export in `src/components/ProcessingProgress/index.ts`
- [X] T044 [US1] Implement alphaTab wrapper: initialize alphaTab API, load AlphaTex, configure guitar tab display settings in `src/lib/alphatab.ts`
- [X] T045 [US1] Implement TabViewer component: render alphaTab instance, responsive sizing, manual scroll support in `src/components/TabViewer/TabViewer.tsx`
- [X] T046 [US1] Create barrel export in `src/components/TabViewer/index.ts`

### Pages

- [X] T047 [US1] Implement UploadPage: render FileUpload, trigger processingPipeline on file select, navigate to `/song/:id` on upload start in `src/pages/UploadPage/UploadPage.tsx`
- [X] T048 [US1] Create barrel export in `src/pages/UploadPage/index.ts`
- [X] T049 [US1] Implement SongViewerPage: load song by ID from IndexedDB, show ProcessingProgress while processing, render TabViewer when complete, handle errors with retry option in `src/pages/SongViewerPage/SongViewerPage.tsx`
- [X] T050 [US1] Create barrel export in `src/pages/SongViewerPage/index.ts`
- [X] T051 [US1] Implement useProcessing hook: subscribe to ProcessingContext, expose current stage/progress/error state in `src/hooks/useProcessing.ts`

**Checkpoint**: User can upload a song → see processing progress → view generated guitar tab. Core MVP is functional.

---

## Phase 4: User Story 2 — Separate and Download Instrumental (Priority: P2)

**Goal**: After processing, users can download the separated instrumental track as an audio file for practice.

**Independent Test**: Upload a song → click Download Instrumental → verify downloaded file plays without vocals.

- [X] T052 [US2] Add instrumental blob retrieval method to songRepository (getInstrumentalBlob by songId) in `src/services/storage/songRepository.ts`
- [X] T053 [US2] Implement DownloadButton component: fetch instrumental blob from IndexedDB, create object URL, trigger browser download with original filename + "_instrumental" suffix in `src/components/DownloadButton/DownloadButton.tsx`
- [X] T054 [US2] Create barrel export in `src/components/DownloadButton/index.ts`
- [X] T055 [US2] Integrate DownloadButton into SongViewerPage, visible only when processing is complete and instrumental stem exists in `src/pages/SongViewerPage/SongViewerPage.tsx`

**Checkpoint**: Users can download instrumental-only audio. Works independently of MIDI playback.

---

## Phase 5: User Story 3 — MIDI Playback with Tab Highlighting (Priority: P3)

**Goal**: Users press Play and hear the tab rendered as MIDI audio with synchronized note highlighting, auto-scrolling, and seek support.

**Independent Test**: Open a completed tab → press Play → verify MIDI audio plays, notes highlight in sync, pause/resume works, click-to-seek jumps playhead.

- [X] T056 [US3] Extend alphaTab wrapper to configure built-in alphaSynth MIDI player (load SoundFont, configure playback API) in `src/lib/alphatab.ts`
- [X] T057 [US3] Implement usePlayback hook: play, pause, seek, subscribe to alphaTab position events, update PlaybackContext in `src/hooks/usePlayback.ts`
- [X] T058 [US3] Implement PlaybackControls component: Play/Pause toggle, seek bar with current time/duration, current measure/beat indicator in `src/components/PlaybackControls/PlaybackControls.tsx`
- [X] T059 [US3] Create barrel export in `src/components/PlaybackControls/index.ts`
- [X] T060 [US3] Extend TabViewer to enable alphaTab animated cursor, auto-scroll during playback, and click-to-seek on measures in `src/components/TabViewer/TabViewer.tsx`
- [X] T061 [US3] Integrate PlaybackControls into SongViewerPage below TabViewer, connect to PlaybackContext in `src/pages/SongViewerPage/SongViewerPage.tsx`

**Checkpoint**: Tab plays as MIDI with synchronized highlighting, auto-scroll, and full playback controls.

---

## Phase 6: User Story 4 — Confidence Scores and Quality Warnings (Priority: P4)

**Goal**: After processing, display confidence scores and warnings for challenging audio (multiple singers, distortion, spoken word).

**Independent Test**: Upload songs with known characteristics (rap track, choir, distorted audio) → verify appropriate confidence level and warnings appear.

- [X] T062 [US4] Implement confidenceAnalyzer: compute overall confidence from Basic Pitch note confidences, detect multiple singers (pitch variance), distortion (spectral flatness), spoken word (zero-crossing rate) in `src/services/confidence/confidenceAnalyzer.ts`
- [X] T063 [US4] Create barrel export in `src/services/confidence/index.ts`
- [X] T064 [US4] Integrate confidenceAnalyzer into processingPipeline after transcription step, persist ConfidenceReport to IndexedDB in `src/services/processing/processingPipeline.ts`
- [X] T065 [US4] Implement ConfidenceDisplay component: colored badge (High=green, Medium=amber, Low=red), collapsible warning list with icons and descriptions in `src/components/ConfidenceDisplay/ConfidenceDisplay.tsx`
- [X] T066 [US4] Create barrel export in `src/components/ConfidenceDisplay/index.ts`
- [X] T067 [US4] Integrate ConfidenceDisplay into SongViewerPage, load ConfidenceReport from IndexedDB, show above TabViewer in `src/pages/SongViewerPage/SongViewerPage.tsx`

**Checkpoint**: Confidence scores and quality warnings display for all processed songs.

---

## Phase 7: User Story 5 — Instrumental + MIDI Listening Mode (Priority: P5)

**Goal**: Users select "Instrumental + MIDI" mode to hear the backing track and MIDI transcription simultaneously, with tab highlighting in sync.

**Independent Test**: Open a completed song → select "Instrumental + MIDI" mode → verify both audio streams play in sync with tab highlighting.

- [X] T068 [US5] Extend usePlayback hook to support ListeningMode switching: "midi" (alphaTab synth only) vs "instrumental-midi" (Web Audio instrumental + alphaTab synth in parallel) in `src/hooks/usePlayback.ts`
- [X] T069 [US5] Implement instrumental audio playback via Web Audio API AudioBufferSourceNode synchronized with alphaTab's player position in `src/hooks/usePlayback.ts`
- [X] T070 [US5] Add listening mode selector (radio group or segmented control) to PlaybackControls component in `src/components/PlaybackControls/PlaybackControls.tsx`
- [X] T071 [US5] Ensure seek/pause/resume keeps instrumental audio and MIDI synth in sync within PlaybackContext in `src/context/PlaybackContext.tsx`

**Checkpoint**: Both listening modes work. Instrumental + MIDI plays in sync with tab cursor.

---

## Phase 8: Song Library & Persistence (Cross-cutting)

**Purpose**: Enable users to return to previously processed songs and manage their library.

- [X] T072 Implement useSongLibrary hook: load all songs from IndexedDB, delete song and all related data, sort by upload date in `src/hooks/useSongLibrary.ts`
- [X] T073 Implement SongCard component: display song name, upload date, status badge, confidence badge, click to navigate in `src/components/SongCard/SongCard.tsx`
- [X] T074 Create barrel export in `src/components/SongCard/index.ts`
- [X] T075 Implement SongLibraryPage: render list of SongCards from useSongLibrary, show empty state, delete confirmation dialog in `src/pages/SongLibraryPage/SongLibraryPage.tsx`
- [X] T076 Create barrel export in `src/pages/SongLibraryPage/index.ts`
- [X] T077 Add navigation links between Upload, Library, and Viewer pages (header/nav component) in `src/App.tsx`

**Checkpoint**: Users can browse, revisit, and delete previously processed songs.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: PWA compliance, error handling, accessibility, and final quality

- [X] T078 [P] Configure PWA icons (192x192, 512x512) in `public/icons/` and reference in `public/manifest.json`
- [X] T079 [P] Add offline fallback handling: show user-friendly message when separation service is unavailable in `src/services/separation/separationService.ts`
- [X] T080 [P] Add global error boundary component wrapping App in `src/components/ErrorBoundary/ErrorBoundary.tsx`
- [X] T081 [P] Verify WCAG 2.1 AA compliance: keyboard navigation, screen reader labels, color contrast across all components
- [X] T082 [P] Add responsive breakpoints: verify all pages work at 320px width and above
- [X] T083 Validate PWA with Lighthouse audit (target 90+ in PWA, Performance, Accessibility, Best Practices)
- [X] T084 Run quickstart.md validation: ensure setup instructions work from a clean clone
- [X] T085 Final code cleanup: remove unused imports, enforce 300-line file limit, verify zero lint warnings

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — core MVP
- **US2 (Phase 4)**: Depends on Phase 2 + T038 (processing pipeline stores stems)
- **US3 (Phase 5)**: Depends on Phase 3 (needs TabViewer + alphaTab initialized)
- **US4 (Phase 6)**: Depends on Phase 2 + T032 (needs transcription service output)
- **US5 (Phase 7)**: Depends on Phase 4 (instrumental audio) + Phase 5 (MIDI playback)
- **Library (Phase 8)**: Depends on Phase 2 (storage layer)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundation) → Phase 3 (US1: Upload & View Tab) 🎯 MVP
                                       → Phase 4 (US2: Download Instrumental)
                                       → Phase 8 (Library & Persistence)
                                Phase 3 → Phase 5 (US3: MIDI Playback)
                                       → Phase 6 (US4: Confidence Warnings)
                          Phase 4 + 5  → Phase 7 (US5: Instrumental + MIDI)
                              All      → Phase 9 (Polish)
```

### Within Each User Story

- Models/types before services
- Services before components
- Components before page integration
- Core implementation before integration with other stories

### Parallel Opportunities

- All Phase 1 tasks marked [P] (T004–T008, T010) can run in parallel
- All Phase 2 type definitions (T011–T015) can run in parallel
- All Phase 2 constants (T016–T018) can run in parallel
- Phase 2 contexts (T023, T024) can run in parallel
- Separation service tasks (T026–T029) can run in parallel with frontend type work
- Phase 4 (US2) can start in parallel with Phase 5 (US3) after Phase 3 completes
- Phase 6 (US4) can start in parallel with Phase 4/5 after Phase 3 completes
- All Phase 9 polish tasks marked [P] can run in parallel

---

## Parallel Example: Phase 2 (Foundational)

```text
# Batch 1 — All type definitions in parallel:
T011: Define Song types in src/types/song.ts
T012: Define Transcription types in src/types/transcription.ts
T013: Define Tab types in src/types/tab.ts
T014: Define Confidence types in src/types/confidence.ts
T015: Define Playback types in src/types/playback.ts

# Batch 2 — Constants and contexts in parallel:
T016: Audio constants in src/constants/audio.ts
T017: Guitar constants in src/constants/guitar.ts
T018: Processing constants in src/constants/processing.ts
T023: ProcessingContext in src/context/ProcessingContext.tsx
T024: PlaybackContext in src/context/PlaybackContext.tsx

# Batch 3 — Storage (sequential, depends on types):
T019: Database initialization in src/services/storage/database.ts
T020: Song repository in src/services/storage/songRepository.ts
T021: Barrel export in src/services/storage/index.ts

# Batch 4 — Routing (depends on storage):
T022: React Router setup in src/App.tsx
T025: Main entry in src/main.tsx
```

---

## Parallel Example: Phase 3 (US1 — MVP)

```text
# Batch 1 — Separation service (independent of frontend):
T026: FastAPI app in services/separation/main.py
T027: Demucs wrapper in services/separation/separator.py
T028: requirements.txt
T029: Dockerfile

# Batch 2 — Frontend services (after types ready):
T030: separationService in src/services/separation/separationService.ts
T032: transcriptionService in src/services/transcription/transcriptionService.ts
T034: noteToFretMapper in src/services/tabConversion/noteToFretMapper.ts
T035: alphaTexGenerator in src/services/tabConversion/alphaTexGenerator.ts

# Batch 3 — Orchestration (after services):
T036: tabConversionService
T038: processingPipeline

# Batch 4 — Components (after services):
T040: FileUpload component
T042: ProcessingProgress component
T044: alphaTab wrapper
T045: TabViewer component

# Batch 5 — Pages (after components):
T047: UploadPage
T049: SongViewerPage
T051: useProcessing hook
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Upload & View Tab)
4. **STOP and VALIDATE**: Upload a test song, verify tab generates and displays correctly
5. This alone delivers the core value proposition

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Upload & View Tab) → **MVP! Test independently** → Demo
3. Add US2 (Download Instrumental) → Test independently → Demo
4. Add US3 (MIDI Playback) → Test independently → Demo
5. Add US4 (Confidence Warnings) → Test independently → Demo
6. Add US5 (Instrumental + MIDI) → Test independently → Demo
7. Add Library (Phase 8) → Test independently → Demo
8. Polish (Phase 9) → Lighthouse audit → Release

### Biggest Risk

Transcription accuracy (US1, tasks T032–T036) is the highest-risk area. Validate early by testing Basic Pitch on isolated vocal tracks before building the full UI pipeline.

---

## Notes

- [P] tasks = different files, no dependencies — can execute in parallel
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The separation service (T026–T029) is the only Python/server-side work; all other tasks are TypeScript/React
- Tests are not explicitly listed as separate tasks since the constitution mandates co-located `.test.ts` files — each implementation task implicitly includes writing its co-located tests
