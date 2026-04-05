"""
api_server.py — FastAPI wrapper for the audio_analyzer pipeline.

Endpoints
---------
POST /process
    Accept a .wav upload, run demucs + basic-pitch, return vocal_melody.mid.

GET  /health
    Liveness check.

Usage
-----
    uvicorn api_server:app --host 0.0.0.0 --port 8383 --reload

Query params for /process
--------------------------
    skip_demucs=true    Bypass demucs and treat the upload as the vocals stem
                        directly (useful when offline or for testing).
"""

import os
import tempfile
import uuid
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse

# Suppress TensorFlow noise at import time
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

from audio_analyzer import run  # noqa: E402  (must come after env vars)

app = FastAPI(
    title="MACH:INE II — Vocal Melody Extractor",
    description=(
        "Uploads a WAV file, separates vocals with demucs, "
        "extracts melody with basic-pitch, returns a MIDI file."
    ),
    version="1.0.0",
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/process")
async def process(
    file: UploadFile = File(..., description="Audio file to process (.wav recommended)"),
    skip_demucs: bool = Query(
        False,
        description=(
            "Skip demucs separation and treat the upload as an isolated "
            "vocals stem (faster, no model download required)."
        ),
    ),
) -> FileResponse:
    """
    Pipeline:
    1. Save the uploaded file to a temp directory.
    2. Run demucs to extract the vocals stem (unless skip_demucs=true).
    3. Run basic-pitch on the vocals to produce a MIDI file.
    4. Stream the MIDI back as a downloadable attachment.
    """
    # Validate extension
    suffix = Path(file.filename or "upload").suffix.lower()
    if suffix not in {".wav", ".mp3", ".flac", ".ogg", ".m4a", ""}:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{suffix}'. Prefer .wav for best results.",
        )

    job_id = uuid.uuid4().hex[:8]
    work_dir = Path(tempfile.mkdtemp(prefix=f"mach2_{job_id}_"))

    try:
        # --- 1. Persist upload ---
        audio_path = work_dir / f"input{suffix or '.wav'}"
        contents = await file.read()
        audio_path.write_bytes(contents)

        # --- 2 + 3. Run pipeline ---
        midi_path = work_dir / "vocal_melody.mid"
        run(audio_path, midi_path, skip_demucs=skip_demucs)

        if not midi_path.exists():
            raise HTTPException(status_code=500, detail="Pipeline produced no MIDI output.")

        # --- 4. Return file (work_dir cleaned up by background task) ---
        original_stem = Path(file.filename or "audio").stem
        download_name = f"{original_stem}_vocal_melody.mid"

        return FileResponse(
            path=str(midi_path),
            media_type="audio/midi",
            filename=download_name,
            background=_cleanup(work_dir),
        )

    except HTTPException:
        _cleanup(work_dir)()
        raise
    except Exception as exc:
        _cleanup(work_dir)()
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _cleanup(path: Path):
    """Return a callable that deletes a directory tree (used as background task)."""
    import shutil

    def _run():
        shutil.rmtree(path, ignore_errors=True)

    return _run
