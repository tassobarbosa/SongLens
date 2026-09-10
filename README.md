# SongLens

> Upload a song, get an interactive guitar tab. SongLens separates vocals from instrumentals, transcribes the melody, and renders it as playable guitar tablature in the browser.

## Why This Exists

Learning a song by ear is slow. SongLens automates the first pass: it isolates the vocal melody from a song, converts it into notes, and displays it as guitar tablature you can scroll through and play back — so you can start practicing sooner.

## Architecture

The project has two parts that run independently:

| Component | Tech | Purpose |
|---|---|---|
| `/` (frontend) | React 19 + TypeScript + Vite | Upload UI, tab rendering (AlphaTab), playback, local song library (IndexedDB) |
| [services/separation](services/separation) | Python + FastAPI + Demucs | Splits uploaded audio into vocal/instrumental stems |

Pitch-to-note transcription runs client-side using [`@spotify/basic-pitch`](https://github.com/spotify/basic-pitch) — no server round trip required beyond separation.

## Quick Start

**Prerequisites**: Node.js 20+, npm, Python 3.10+ (only needed if running the separation service outside Docker).

```bash
# 1. Install frontend dependencies
npm install

# 2. Start the separation service (in a separate terminal)
cd services/separation
docker build -t songlens-separation .
docker run -p 8000:8000 songlens-separation

# 3. Start the frontend dev server
cd ../..
npm run dev
```

Open `http://localhost:5173`, upload an MP3 or WAV file, and wait for processing (separation → transcription → tab generation).

## Running the Frontend

```bash
npm install        # install dependencies
npm run dev         # start dev server at http://localhost:5173
npm run build       # type-check and build for production
npm run preview     # preview the production build
npm test            # run unit tests once (vitest)
npm run test:watch  # run unit tests in watch mode
npm run lint         # run eslint
npm run check        # type-check + lint + test, all in one
```

## Running the Separation Service

The separation service isolates vocals from instrumentals using [Demucs](https://github.com/facebookresearch/demucs). It must be running before you upload a song, since the frontend calls it during processing.

### Option A: Docker (recommended)

```bash
cd services/separation
docker build -t songlens-separation .
docker run -p 8000:8000 songlens-separation
```

### Option B: Local Python environment

```bash
cd services/separation
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Either way, the service listens on `http://localhost:8000`.

## Environment Variables

Set these in a `.env` file at the project root to override defaults (all are optional):

| Variable | Default | Description |
|---|---|---|
| `VITE_SEPARATION_URL` | `http://localhost:8000` | Base URL of the separation service |
| `VITE_MAX_FILE_SIZE_MB` | `50` | Maximum upload file size in MB |

## Project Structure

```
src/
  components/   Reusable UI components (upload, tab viewer, playback controls, etc.)
  pages/        Route-level pages (upload, song library, song viewer)
  services/     Domain logic: separation, transcription, tab conversion, confidence, storage
  hooks/        React hooks wrapping the above services
  context/      React context providers (playback, processing state)
  lib/          Third-party integration glue (AlphaTab)
  types/        Shared TypeScript types
services/separation/   Python/FastAPI microservice for vocal/instrumental separation
specs/                  Feature specs, plans, and contracts (see specs/001-audio-to-tab-mvp)
```

## Testing

```bash
npm test           # unit tests (vitest)
npx tsc --noEmit   # type checking
npm run lint        # linting
```

## Learn More

Full feature specification, data model, and API contracts live in [specs/001-audio-to-tab-mvp](specs/001-audio-to-tab-mvp/spec.md).
