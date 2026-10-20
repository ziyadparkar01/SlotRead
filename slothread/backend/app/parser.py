"""
SlothRead Document Parser Module
Parses PDF and EPUB files into clean, structured chapter-level segments.
"""

import os
import re
from pathlib import Path
from typing import Dict, List, Any
import pypdf
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup


# Regular expressions for detecting structural headers in dense texts & papers
CHAPTER_HEADER_PATTERNS = [
    re.compile(r"^(?:Chapter|CHAPTER)\s+([0-9IVXLCDM]+|[A-Z])(?:\s*[:.\-—]\s*(.*))?$", re.MULTILINE),
    re.compile(r"^(?:SECTION|Section)\s+([0-9IVXLCDM]+|[A-Z])(?:\s*[:.\-—]\s*(.*))?$", re.MULTILINE),
    re.compile(r"^([0-9]+(?:\.[0-9]+)*)\s+([A-Z][A-Za-z0-9\s,\-–—]{2,60})$", re.MULTILINE),
    re.compile(r"^(ABSTRACT|Abstract|INTRODUCTION|Introduction|BACKGROUND|Background|METHODOLOGY|Methodology|METHODS|Methods|RESULTS|Results|DISCUSSION|Discussion|CONCLUSION|Conclusion|RELATED WORK|Related Work)\b", re.MULTILINE),
]


def clean_text(raw_text: str) -> str:
    """Normalize whitespace and remove non-printable control characters."""
    if not raw_text:
        return ""
    # Remove surrogate characters and null bytes
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]", " ", raw_text)
    # Normalize hyphenated linebreaks (e.g. "com-\nputer" -> "computer")
    cleaned = re.sub(r"(\w+)-\n(\w+)", r"\1\2", cleaned)
    # Replace multiple whitespaces/newlines with unified spacing
    cleaned = re.sub(r"\r\n|\r", "\n", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def parse_pdf(file_path: Path) -> Dict[str, Any]:
    """
    Extracts text from PDF documents using pypdf.
    Attempts chapter/section boundary detection; falls back to adaptive page grouping.
    """
    reader = pypdf.PdfReader(str(file_path))
    total_pages = len(reader.pages)
    
    # Extract metadata if present
    meta = reader.metadata or {}
    doc_title = meta.title if meta.title else file_path.stem.replace("_", " ").title()
    doc_author = meta.author if meta.author else "Unknown Author"

    pages_text: List[Dict[str, Any]] = []
    total_word_count = 0

    for idx, page in enumerate(reader.pages):
        page_num = idx + 1
        try:
            raw = page.extract_text() or ""
        except Exception:
            raw = ""
        text = clean_text(raw)
        words = len(text.split())
        total_word_count += words
        pages_text.append({
            "page_num": page_num,
            "text": text,
            "word_count": words
        })

    # Detect chapters
    chapters = detect_pdf_chapters(pages_text, doc_title)

    return {
        "title": doc_title,
        "author": doc_author,
        "file_type": "pdf",
        "total_pages": total_pages,
        "total_word_count": total_word_count,
        "chapters": chapters,
    }


def detect_pdf_chapters(pages_text: List[Dict[str, Any]], default_title: str) -> List[Dict[str, Any]]:
    """
    Segments pages into logical chapters based on regex headers or page clusters.
    """
    if not pages_text:
        return []

    identified_anchors = []

    for page_info in pages_text:
        text = page_info["text"]
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        
        # Check first 8 lines of each page for chapter headers
        for line in lines[:8]:
            found_title = None
            for pattern in CHAPTER_HEADER_PATTERNS:
                match = pattern.match(line)
                if match:
                    groups = match.groups()
                    if len(groups) == 2 and groups[1]:
                        found_title = f"{groups[0]}. {groups[1]}".strip()
                    elif groups:
                        found_title = line.strip()
                    break
            
            if found_title and len(found_title) > 3:
                identified_anchors.append({
                    "start_page": page_info["page_num"],
                    "title": found_title
                })
                break

    # If no distinctive headers were detected, partition into adaptive 3-to-5 page blocks
    if len(identified_anchors) <= 1:
        total_pages = len(pages_text)
        chunk_size = max(2, min(5, (total_pages // 6) or 3))
        chapters = []
        chap_num = 1
        
        for i in range(0, total_pages, chunk_size):
            slice_pages = pages_text[i : i + chunk_size]
            start_p = slice_pages[0]["page_num"]
            end_p = slice_pages[-1]["page_num"]
            combined_text = "\n\n".join(p["text"] for p in slice_pages if p["text"])
            
            if not combined_text.strip():
                continue

            page_range_str = f"Page {start_p}" if start_p == end_p else f"Pages {start_p} – {end_p}"
            # Pick a representative title from top line or section number
            top_line = next((line for line in combined_text.split("\n") if len(line.strip()) > 5), f"Section {chap_num}")
            if len(top_line) > 60:
                top_line = top_line[:57] + "..."

            chapters.append({
                "chapter_id": chap_num,
                "title": f"Section {chap_num}: {top_line}",
                "page_range": page_range_str,
                "text": combined_text,
                "word_count": len(combined_text.split())
            })
            chap_num += 1
        return chapters

    # Build chapters from identified anchors
    chapters = []
    for idx, anchor in enumerate(identified_anchors):
        start_p = anchor["start_page"]
        end_p = identified_anchors[idx + 1]["start_page"] - 1 if idx + 1 < len(identified_anchors) else pages_text[-1]["page_num"]
        
        relevant_pages = [p for p in pages_text if start_p <= p["page_num"] <= end_p]
        combined_text = "\n\n".join(p["text"] for p in relevant_pages if p["text"])
        
        if not combined_text.strip():
            continue

        page_range_str = f"Page {start_p}" if start_p == end_p else f"Pages {start_p} – {end_p}"
        
        chapters.append({
            "chapter_id": idx + 1,
            "title": anchor["title"],
            "page_range": page_range_str,
            "text": combined_text,
            "word_count": len(combined_text.split())
        })

    return chapters


def parse_epub(file_path: Path) -> Dict[str, Any]:
    """
    Extracts text and chapters from EPUB files using ebooklib and BeautifulSoup.
    """
    book = epub.read_epub(str(file_path))
    
    # Extract title
    title_meta = book.get_metadata("DC", "title")
    doc_title = title_meta[0][0] if title_meta else file_path.stem.replace("_", " ").title()
    
    # Extract creator/author
    creator_meta = book.get_metadata("DC", "creator")
    doc_author = creator_meta[0][0] if creator_meta else "Unknown Author"

    chapters: List[Dict[str, Any]] = []
    chap_idx = 1
    total_word_count = 0

    # Iterate over HTML items in the EPUB spine
    for item in book.get_items_of_type(ebooklib.ITEM_DOCUMENT):
        content = item.get_content()
        soup = BeautifulSoup(content, "html.parser")
        
        # Extract title from h1, h2, or title tag
        header_el = soup.find(["h1", "h2", "title"])
        header_text = header_el.get_text().strip() if header_el else f"Chapter {chap_idx}"
        
        # Clean text
        text_body = clean_text(soup.get_text())
        words = len(text_body.split())
        
        # Skip empty navigational fragments or tiny copyright notes (< 80 words)
        if words < 80 and chap_idx > 1:
            continue

        total_word_count += words
        chapters.append({
            "chapter_id": chap_idx,
            "title": header_text if len(header_text) < 70 else header_text[:67] + "...",
            "page_range": f"Chapter {chap_idx}",
            "text": text_body,
            "word_count": words
        })
        chap_idx += 1

    return {
        "title": doc_title,
        "author": doc_author,
        "file_type": "epub",
        "total_pages": len(chapters),
        "total_word_count": total_word_count,
        "chapters": chapters,
    }


def parse_document(file_path: Path) -> Dict[str, Any]:
    """Unified entry point for document parsing."""
    suffix = file_path.suffix.lower()
    if suffix == ".pdf":
        return parse_pdf(file_path)
    elif suffix == ".epub":
        return parse_epub(file_path)
    else:
        raise ValueError(f"Unsupported file format: {suffix}. Only .pdf and .epub files are accepted.")
