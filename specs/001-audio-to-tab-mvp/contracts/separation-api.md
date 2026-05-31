# Separation Service API Contract

**Service**: SongLens Audio Separation Service
**Date**: 2026-05-31
**Transport**: HTTP/REST (local service)

## Base URL

`http://localhost:8000` (configurable via environment variable `SEPARATION_SERVICE_URL`)

## Endpoints

### POST /separate

Accepts an audio file and returns separated vocal and instrumental stems.

**Request**:
- Content-Type: `multipart/form-data`
- Body field: `file` — the audio file (MP3 or WAV)

**Response** (200 OK):
```json
{
  "vocals": "<base64-encoded WAV audio>",
  "instrumental": "<base64-encoded WAV audio>",
  "duration": 243.5,
  "sampleRate": 44100
}
```

**Error Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 400 | `{ "error": "Invalid audio file", "detail": "..." }` | File is not a valid audio format |
| 400 | `{ "error": "File too large", "detail": "Maximum size is 50 MB" }` | File exceeds size limit |
| 422 | `{ "error": "Processing failed", "detail": "..." }` | Demucs processing error |
| 503 | `{ "error": "Service busy", "detail": "..." }` | Service is processing another request |

### GET /health

Health check endpoint.

**Response** (200 OK):
```json
{
  "status": "ok",
  "model": "htdemucs_ft",
  "gpu_available": false
}
```

## Notes

- The service processes one request at a time (no concurrent processing for MVP)
- Response times scale linearly with audio duration (~30s per minute of audio on CPU)
- No authentication required (local-only service)
- Stems are returned as WAV format at the original sample rate
