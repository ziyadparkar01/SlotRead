"""
SlothRead FastAPI Backend Server
Provides REST endpoints for document ingestion, Ollama health checks,
asynchronous synthesis pipeline, and Markdown briefing exports.
"""

import asyncio
import json
import logging
import os
import shutil
import uuid
from pathlib import Path
from typing import Dict, Any, Optional

import httpx
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, JSONResponse

from .config import settings, UPLOAD_DIR, SYNTHESIS_DIR
from .parser import parse_document
from .summarizer import summarize_chapter, synthesize_document

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("slothread.api")

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="Privacy-first, 100% offline synthesizer for EPUB books and dense research PDFs via Ollama."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DOCUMENT_STORE: Dict[str, Dict[str, Any]] = {}


def save_synthesis_to_disk(doc_id: str, data: Dict[str, Any]):
    """Saves completed synthesis JSON to persistent storage."""
    target_file = SYNTHESIS_DIR / f"{doc_id}.json"
    with open(target_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_synthesis_from_disk(doc_id: str) -> Optional[Dict[str, Any]]:
    """Loads a previously saved synthesis from disk."""
    target_file = SYNTHESIS_DIR / f"{doc_id}.json"
    if target_file.exists():
        with open(target_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


async def process_document_pipeline(doc_id: str, file_path: Path, model_name: Optional[str] = None):
    """Asynchronous background pipeline for parsing and synthesis."""
    record = DOCUMENT_STORE.get(doc_id)
    if not record:
        return

    try:
        record["status"] = "parsing"
        record["progress_percent"] = 15
        record["stage_label"] = "Parsing document AST and chapter boundaries..."
        logger.info(f"[{doc_id}] Parsing file: {file_path}")

        parsed_doc = await asyncio.to_thread(parse_document, file_path)
        
        chapters = parsed_doc.get("chapters", [])
        total_chapters = len(chapters)
        if total_chapters == 0:
            raise ValueError("No extractable chapters or readable text could be identified in the document.")

        record["title"] = parsed_doc.get("title", file_path.stem)
        record["author"] = parsed_doc.get("author", "Unknown")
        record["total_chapters"] = total_chapters
        record["total_words"] = parsed_doc.get("total_word_count", 0)
        record["file_type"] = parsed_doc.get("file_type", "pdf")

        record["status"] = "synthesizing"
        record["stage_label"] = f"Extracting 3 takeaways and technical glossaries for {total_chapters} chapters..."
        logger.info(f"[{doc_id}] Synthesizing {total_chapters} chapters using model {model_name or settings.default_model}")

        chapter_summaries = []
        for i, chapter in enumerate(chapters):
            current_idx = i + 1
            record["stage_label"] = f"Synthesizing Chapter {current_idx} of {total_chapters}: {chapter['title'][:35]}..."
            progress = int(20 + ((current_idx / total_chapters) * 60))
            record["progress_percent"] = progress
            
            summary = await summarize_chapter(chapter, model=model_name)
            chapter_summaries.append(summary)

        record["stage_label"] = "Compiling global document thesis and reading time metrics..."
        record["progress_percent"] = 88
        logger.info(f"[{doc_id}] Generating global executive synthesis...")

        synthesis = await synthesize_document(parsed_doc, chapter_summaries, model=model_name)

        record["status"] = "completed"
        record["progress_percent"] = 100
        record["stage_label"] = "Synthesis complete. Executive briefing deck ready."
        record["synthesis"] = synthesis
        record["chapters"] = chapter_summaries

        save_synthesis_to_disk(doc_id, record)
        logger.info(f"[{doc_id}] Pipeline completed successfully.")

    except Exception as exc:
        logger.exception(f"[{doc_id}] Pipeline failed: {exc}")
        record["status"] = "failed"
        record["stage_label"] = f"Processing error: {str(exc)}"
        record["error"] = str(exc)


@app.get("/api/health")
async def health_check():
    """Checks the health of the SlothRead backend and queries local Ollama."""
    ollama_online = False
    available_models = []
    ollama_version = "Unknown"

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{settings.ollama_host.rstrip('/')}/api/tags")
            if resp.status_code == 200:
                ollama_online = True
                data = resp.json()
                models = data.get("models", [])
                available_models = [m.get("name") for m in models if "name" in m]
            
            try:
                v_resp = await client.get(f"{settings.ollama_host.rstrip('/')}/api/version")
                if v_resp.status_code == 200:
                    ollama_version = v_resp.json().get("version", "Unknown")
            except Exception:
                pass
    except Exception:
        ollama_online = False

    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.version,
        "ollama": {
            "online": ollama_online,
            "host": settings.ollama_host,
            "version": ollama_version,
            "active_model": settings.default_model,
            "fallback_model": settings.fallback_model,
            "available_models": available_models
        },
        "limits": {
            "max_file_size_mb": settings.max_file_size_bytes // (1024 * 1024),
            "allowed_extensions": list(settings.allowed_extensions)
        }
    }


@app.post("/api/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    model: Optional[str] = Form(None)
):
    """Upload PDF or EPUB document and begin async synthesis pipeline."""
    filename = file.filename or "document.pdf"
    suffix = Path(filename).suffix.lower()

    if suffix not in settings.allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{suffix}'. Allowed formats: {', '.join(settings.allowed_extensions)}"
        )

    doc_id = str(uuid.uuid4())
    stored_file_path = UPLOAD_DIR / f"{doc_id}{suffix}"

    try:
        content_size = 0
        with open(stored_file_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                content_size += len(chunk)
                if content_size > settings.max_file_size_bytes:
                    buffer.close()
                    stored_file_path.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds maximum allowed size of {settings.max_file_size_bytes // (1024*1024)} MB"
                    )
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save upload: {str(e)}")

    DOCUMENT_STORE[doc_id] = {
        "doc_id": doc_id,
        "filename": filename,
        "file_type": suffix.lstrip("."),
        "status": "queued",
        "progress_percent": 5,
        "stage_label": "Document received. Queued for background parsing...",
        "model_used": model or settings.default_model,
        "title": filename,
        "author": "Analyzing...",
        "total_chapters": 0,
        "chapters": [],
        "synthesis": {}
    }

    background_tasks.add_task(process_document_pipeline, doc_id, stored_file_path, model)

    return {
        "doc_id": doc_id,
        "filename": filename,
        "status": "queued",
        "poll_url": f"/api/documents/{doc_id}"
    }


@app.get("/api/documents/{doc_id}")
async def get_document_status(doc_id: str):
    """Poll synthesis status and retrieve completed briefing deck payload."""
    record = DOCUMENT_STORE.get(doc_id)
    if not record:
        saved = load_synthesis_from_disk(doc_id)
        if saved:
            DOCUMENT_STORE[doc_id] = saved
            return saved
        raise HTTPException(status_code=404, detail=f"Document with ID '{doc_id}' not found.")

    return record


@app.get("/api/documents/{doc_id}/export")
async def export_markdown(doc_id: str):
    """Download Markdown summary of executive briefing."""
    record = DOCUMENT_STORE.get(doc_id) or load_synthesis_from_disk(doc_id)
    if not record:
        raise HTTPException(status_code=404, detail="Document not found.")

    if record.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Document synthesis is not yet complete.")

    title = record.get("title", "Executive Briefing")
    author = record.get("author", "Unknown")
    synthesis = record.get("synthesis", {})
    chapters = record.get("chapters", [])

    lines = [
        f"# {title}",
        f"**Author / Source:** {author}  ",
        f"**Synthesized By:** SlothRead (Hacktoberfest Edition — Slow and Steady)  ",
        f"**Standard Reading Time:** ~{synthesis.get('standard_reading_time_minutes', 0)} mins | **Time Saved:** ~{synthesis.get('time_saved_minutes', 0)} mins  ",
        "\n---\n",
        "## Executive Thesis",
        f"> {synthesis.get('thesis', 'N/A')}",
        "\n### Executive Overview",
        synthesis.get("executive_summary", ""),
        "\n### Primary Conclusions",
    ]

    for conc in synthesis.get("primary_conclusions", []):
        lines.append(f"- **{conc}**")

    lines.append("\n---\n")
    lines.append("## Chapter Executive Briefings\n")

    for ch in chapters:
        lines.append(f"### {ch.get('title', 'Chapter')} ({ch.get('page_range', '')})")
        lines.append("\n#### 3 High-Impact Takeaways:")
        for idx, t in enumerate(ch.get("takeaways", []), 1):
            lines.append(f"{idx}. {t}")
        
        glossary = ch.get("glossary", [])
        if glossary:
            lines.append("\n#### Technical Glossary:")
            for item in glossary:
                lines.append(f"- **{item.get('term')}**: {item.get('definition')}")
        
        audio = ch.get("audio_script")
        if audio:
            lines.append("\n#### 60-Second Spoken Audio Script:")
            lines.append(f"*\"{audio}\"*")
        
        lines.append("\n---\n")

    lines.append("\n*Generated locally with 100% offline open-weight intelligence by SlothRead.*")

    markdown_content = "\n".join(lines)
    return PlainTextResponse(
        content=markdown_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{Path(title).stem}_executive_summary.md"'}
    )
