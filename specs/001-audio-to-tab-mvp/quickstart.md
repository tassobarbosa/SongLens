# Quickstart: Audio-to-Tab MVP

**Feature**: specs/001-audio-to-tab-mvp
**Date**: 2026-05-31

## Prerequisites

- Node.js 20+ and npm
- Python 3.10+ (for separation service)
- Docker (optional, for running separation service in container)

## Frontend (React App)

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

The app runs at `http://localhost:5173` by default.

## Separation Service (Python)

### Option A: Direct Python

```bash
cd services/separation

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Option B: Docker

```bash
cd services/separation

# Build image
docker build -t songlens-separation .

# Run container
docker run -p 8000:8000 songlens-separation
```

The service runs at `http://localhost:8000`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_SEPARATION_URL` | `http://localhost:8000` | Separation service URL |
| `VITE_MAX_FILE_SIZE_MB` | `50` | Maximum upload file size in MB |

## Development Workflow

1. Start the separation service (terminal 1)
2. Start the frontend dev server (terminal 2)
3. Open `http://localhost:5173` in a browser
4. Upload an MP3 or WAV file
5. Wait for processing (separation → transcription → tab generation)
6. View and interact with the generated guitar tab

## Testing

```bash
# Unit tests
npm test

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# All checks (CI equivalent)
npm run check
```

## Key Directories

```
src/
├── components/          # React components (folder-per-component)
│   ├── TabViewer/
│   ├── PlaybackControls/
│   ├── ConfidenceDisplay/
│   └── ...
├── pages/               # Page-level route components
│   ├── UploadPage/
│   ├── SongViewerPage/
│   └── SongLibraryPage/
├── services/            # Business logic services
│   ├── separation/
│   ├── transcription/
│   ├── tabConversion/
│   ├── confidence/
│   └── storage/
├── types/               # Shared TypeScript types
├── hooks/               # Custom React hooks
├── context/             # React Context providers
└── constants/           # Named constants and config

services/
└── separation/          # Python Demucs service
    ├── main.py
    ├── requirements.txt
    └── Dockerfile
```
