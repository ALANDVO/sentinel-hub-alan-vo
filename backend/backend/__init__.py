"""Compatibility import path for the application package."""
from pathlib import Path
__path__ = [str(Path(__file__).resolve().parent.parent / "app")]
