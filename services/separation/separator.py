"""Demucs wrapper for audio source separation."""

import io
import struct
import tempfile
from pathlib import Path
from typing import Tuple

import numpy as np
import soundfile as sf
import torch


def separate_audio(input_path: str) -> Tuple[bytes, bytes, float, int]:
    """
    Separate audio file into vocals and instrumental using Demucs htdemucs_ft.

    Args:
        input_path: Path to the input audio file.

    Returns:
        Tuple of (vocals_wav_bytes, instrumental_wav_bytes, duration_seconds, sample_rate).
    """
    from demucs.apply import apply_model
    from demucs.pretrained import get_model

    # Load model
    model = get_model("htdemucs_ft")
    model.eval()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    # Load audio using soundfile (avoids torchcodec dependency)
    # soundfile can't read MP3, so convert to WAV via ffmpeg first if needed
    try:
        data, sample_rate = sf.read(input_path, dtype="float32")
    except sf.LibsndfileError:
        import subprocess
        wav_path = input_path + ".wav"
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "panic", "-i", input_path, wav_path],
            check=True,
        )
        data, sample_rate = sf.read(wav_path, dtype="float32")
        Path(wav_path).unlink(missing_ok=True)
    # soundfile returns (samples, channels) — convert to (channels, samples) tensor
    if data.ndim == 1:
        waveform = torch.from_numpy(data).unsqueeze(0)
    else:
        waveform = torch.from_numpy(data.T)

    # Resample to model's sample rate if needed
    if sample_rate != model.samplerate:
        waveform = _resample(waveform, sample_rate, model.samplerate)
        sample_rate = model.samplerate

    # Ensure stereo
    if waveform.shape[0] == 1:
        waveform = waveform.repeat(2, 1)

    duration = waveform.shape[1] / sample_rate

    # Add batch dimension: (batch, channels, samples)
    ref = waveform.mean(0)
    waveform_batch = waveform.unsqueeze(0).to(device)

    # Apply model
    with torch.no_grad():
        sources = apply_model(model, waveform_batch, device=device)

    # sources shape: (batch, n_sources, channels, samples)
    # htdemucs sources order: drums, bass, other, vocals
    source_names = model.sources
    vocals_idx = source_names.index("vocals")

    vocals = sources[0, vocals_idx].cpu()

    # Instrumental = everything except vocals
    instrumental = sum(
        sources[0, i].cpu() for i in range(len(source_names)) if i != vocals_idx
    )

    # Convert to WAV bytes
    vocals_wav = _tensor_to_wav_bytes(vocals, sample_rate)
    instrumental_wav = _tensor_to_wav_bytes(instrumental, sample_rate)

    return vocals_wav, instrumental_wav, duration, sample_rate


def _resample(waveform: torch.Tensor, orig_sr: int, target_sr: int) -> torch.Tensor:
    """Resample waveform from orig_sr to target_sr using linear interpolation."""
    ratio = target_sr / orig_sr
    new_length = int(waveform.shape[-1] * ratio)
    # interpolate expects (batch, channels, length)
    resampled = torch.nn.functional.interpolate(
        waveform.unsqueeze(0), size=new_length, mode="linear", align_corners=False
    )
    return resampled.squeeze(0)


def _tensor_to_wav_bytes(tensor: torch.Tensor, sample_rate: int) -> bytes:
    """Convert a (channels, samples) tensor to WAV file bytes."""
    buf = io.BytesIO()
    # tensor shape: (channels, samples) → soundfile expects (samples, channels)
    data = tensor.numpy().T
    sf.write(buf, data, sample_rate, format="WAV", subtype="FLOAT")
    buf.seek(0)
    return buf.read()
