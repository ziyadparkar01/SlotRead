"""
SlothRead Configuration Module
Handles environment variables, storage paths, Ollama settings, and limits.
"""

import os
from pathlib import Path
from pydantic import BaseModel

# Base directory resolution
APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
STORAGE_DIR = Path(os.getenv("SLOTHREAD_STORAGE_DIR", str(BACKEND_DIR / "storage")))
UPLOAD_DIR = STORAGE_DIR / "uploads"
SYNTHESIS_DIR = STORAGE_DIR / "syntheses"

# Ensure directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
SYNTHESIS_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseModel):
    app_name: str = "SlothRead"
    version: str = "1.0.0"
    ollama_host: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    default_model: str = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
    fallback_model: str = os.getenv("OLLAMA_FALLBACK_MODEL", "gemma2:2b")
    max_file_size_bytes: int = int(os.getenv("MAX_FILE_SIZE_BYTES", 50 * 1024 * 1024))  # 50 MB
    allowed_extensions: tuple = (".pdf", ".epub")
    average_wpm: int = 220  # Average reading speed for reading time saved calculations
    request_timeout_seconds: float = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", 180.0))
    cors_origins: list[str] = ["*"]

settings = Settings()
