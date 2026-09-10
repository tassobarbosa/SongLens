"""SongLens Audio Separation Service — FastAPI application."""

import base64
import io
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from separator import separate_audio

app = FastAPI(title="SongLens Separation Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
ALLOWED_TYPES = {"audio/mpeg", "audio/wav", "audio/wave", "audio/x-wav"}

_processing = False


@app.get("/health")
async def health():
    """Health check endpoint."""
    import torch

    return {
        "status": "ok",
        "model": "htdemucs_ft",
        "gpu_available": torch.cuda.is_available(),
    }


@app.post("/separate")
async def separate(file: UploadFile = File(...)):
    """Accept an audio file and return separated vocal and instrumental stems."""
    global _processing

    if _processing:
        raise HTTPException(status_code=503, detail="Service is processing another request")

    # Validate content type
    if file.content_type and file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid audio file type: {file.content_type}")

    # Read file and check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Maximum size is 50 MB")

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    _processing = True
    try:
        # Write to temp file for Demucs
        suffix = Path(file.filename or "audio.mp3").suffix or ".mp3"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        # Run separation
        vocals_data, instrumental_data, duration, sample_rate = separate_audio(tmp_path)

        # Clean up temp file
        Path(tmp_path).unlink(missing_ok=True)

        # Encode results as base64
        return JSONResponse(
            content={
                "vocals": base64.b64encode(vocals_data).decode("ascii"),
                "instrumental": base64.b64encode(instrumental_data).decode("ascii"),
                "duration": duration,
                "sampleRate": sample_rate,
            }
        )

    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Processing failed: {str(e)}")
    finally:
        _processing = False
