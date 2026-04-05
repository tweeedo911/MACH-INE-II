"""
audio_analyzer.py — vocal melody extractor for MACH:INE II

Pipeline:
  1. Separate input audio into stems using demucs (htdemucs model)
  2. Extract pitch/melody from the vocals stem using basic-pitch
  3. Save the result as vocal_melody.mid

Usage:
  python3 audio_analyzer.py <input_audio> [output_midi]

  input_audio   : any audio file supported by torchaudio (wav, mp3, flac, …)
  output_midi   : path for the output MIDI file  (default: vocal_melody.mid)

Dependencies:
  pip install demucs basic-pitch soundfile numpy
"""

import argparse
import os
import sys
import tempfile
from pathlib import Path


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def generate_dummy_wav(path: Path, duration: float = 4.0, sample_rate: int = 44100) -> None:
    """Write a short sine-wave WAV file (440 Hz + 880 Hz) for testing."""
    import numpy as np
    import soundfile as sf

    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    # Two partials: fundamental A4 + octave A5
    signal = 0.4 * np.sin(2 * np.pi * 440 * t) + 0.2 * np.sin(2 * np.pi * 880 * t)
    # Stereo (demucs expects 2-channel or will convert)
    stereo = np.column_stack([signal, signal]).astype(np.float32)
    sf.write(str(path), stereo, sample_rate)
    print(f"[dummy] Wrote {duration}s test WAV → {path}")


def separate_vocals(input_path: Path, output_dir: Path) -> Path:
    """
    Run demucs to separate stems, return path to vocals.wav.

    demucs writes stems to:
      <output_dir>/htdemucs/<track_stem_name>/vocals.wav
    """
    from demucs.separate import main as demucs_main

    print(f"[demucs] Separating '{input_path.name}' …")
    demucs_main([
        "--name", "htdemucs",
        "--out", str(output_dir),
        "--two-stems", "vocals",   # only extract vocals vs. no_vocals (faster)
        str(input_path),
    ])

    # Locate the vocals file produced by demucs
    track_name = input_path.stem
    vocals_path = output_dir / "htdemucs" / track_name / "vocals.wav"

    if not vocals_path.exists():
        raise FileNotFoundError(
            f"demucs output not found at expected path: {vocals_path}\n"
            f"Contents of {output_dir}: {list(output_dir.rglob('*.wav'))}"
        )

    print(f"[demucs] Vocals stem → {vocals_path}")
    return vocals_path


def extract_melody(vocals_path: Path, midi_output: Path) -> None:
    """
    Run basic-pitch on vocals_path and write MIDI to midi_output.
    """
    # Suppress TF noise
    os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
    os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

    from basic_pitch.inference import predict

    print(f"[basic-pitch] Analysing vocals …")
    _model_output, midi_data, _note_events = predict(str(vocals_path))

    midi_output.parent.mkdir(parents=True, exist_ok=True)
    midi_data.write(str(midi_output))
    note_count = sum(len(inst.notes) for inst in midi_data.instruments)
    print(f"[basic-pitch] {note_count} notes → {midi_output}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Separate vocals with demucs → extract melody with basic-pitch → save MIDI"
    )
    parser.add_argument(
        "input_audio",
        nargs="?",
        help="Path to input audio file. Omit to run self-test with a generated dummy.",
    )
    parser.add_argument(
        "output_midi",
        nargs="?",
        default="vocal_melody.mid",
        help="Destination MIDI file (default: vocal_melody.mid)",
    )
    parser.add_argument(
        "--keep-stems",
        action="store_true",
        help="Keep the demucs stems directory after processing.",
    )
    parser.add_argument(
        "--skip-demucs",
        action="store_true",
        help=(
            "Skip the demucs separation step and treat the input file directly "
            "as the vocals stem. Useful for testing or when the input is already isolated."
        ),
    )
    return parser.parse_args()


def run(input_audio: Path, output_midi: Path,
        keep_stems: bool = False, skip_demucs: bool = False) -> None:

    if skip_demucs:
        print(f"[info] --skip-demucs: using '{input_audio.name}' as vocals stem directly.")
        extract_melody(input_audio, output_midi)
    else:
        with tempfile.TemporaryDirectory(prefix="demucs_out_") as tmp:
            stems_dir = Path(tmp)

            vocals_path = separate_vocals(input_audio, stems_dir)
            extract_melody(vocals_path, output_midi)

            if keep_stems:
                import shutil
                dest = output_midi.parent / "stems"
                shutil.copytree(str(stems_dir), str(dest), dirs_exist_ok=True)
                print(f"[info] Stems kept at {dest}")

    print(f"\nDone. MIDI saved to: {output_midi.resolve()}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    args = parse_args()

    if args.input_audio is None:
        # Self-test: generate a dummy WAV and run basic-pitch directly on it,
        # skipping the demucs model download (requires network on first use).
        print("[test] No input file provided — running self-test with dummy audio.")
        print("[test] Using --skip-demucs so the test works without model download.\n")
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            dummy_path = Path(f.name)
        try:
            generate_dummy_wav(dummy_path)
            run(dummy_path, Path(args.output_midi),
                keep_stems=args.keep_stems, skip_demucs=True)
        finally:
            dummy_path.unlink(missing_ok=True)
    else:
        input_path = Path(args.input_audio)
        if not input_path.exists():
            print(f"Error: file not found: {input_path}", file=sys.stderr)
            sys.exit(1)
        run(input_path, Path(args.output_midi),
            keep_stems=args.keep_stems, skip_demucs=args.skip_demucs)


if __name__ == "__main__":
    main()
