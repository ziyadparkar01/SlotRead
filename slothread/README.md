# 🦥 SlothRead

> **"Slow and Steady" Offline Research & EPUB Synthesizer**  
> *Built for Hacktoberfest Week 3 & International Sloth Day*

[![Hacktoberfest 2026](https://img.shields.io/badge/Hacktoberfest-Week%203-blueviolet.svg)](#hacktoberfest-2026-week-3-theme)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Ollama](https://img.shields.io/badge/Inference-100%25%20Offline%20(Ollama)-emerald.svg)](https://ollama.ai)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![Three.js](https://img.shields.io/badge/3D-Three.js%20r128-black.svg)](https://threejs.org)

**SlothRead** is a privacy-first, 100% offline synthesizer for dense academic PDFs and EPUB books. Instead of speed-reading skims that lose critical nuance or leaking confidential research to cloud LLM APIs, SlothRead runs open-weight models (such as `qwen2.5:3b` or `gemma2:2b`) entirely on your local machine to distill manuscripts into executive briefing decks.

---

## 🌿 The "Slow and Steady" Sloth Philosophy

In an age of hyperactive notifications and algorithmic firehoses, researchers and engineers suffer from chronic cognitive exhaustion. The typical coping mechanism is **speed-reading skims**: scanning abstracts, glossing over methodologies, and missing negative results.

The **Sloth Philosophy** rejects this frantic illusion of productivity:
- **Depth Over Speed**: Sloths conserve kinetic energy to thrive in complex environments. Similarly, SlothRead automates mechanical reading fatigue so humans can conserve cognitive energy for deep contemplation.
- **The Rule of Three**: Every chapter is strictly constrained to **exactly 3 high-impact takeaways**. Limiting synthesis to three forces ruthless conceptual prioritization.
- **Dual-Coding Retention**: By combining visual takeaway cards with **60-second spoken-word conversational audio recaps** (via the native browser Web Speech API), concepts are stored in both verbal and visual memory buffers.

---

## 🏛️ The Open Innovation Manifesto: Local Sovereign AI

Modern proprietary summarization tools demand monthly subscriptions and require sending intellectual property, proprietary corporate reports, and unreleased academic drafts to remote cloud data centers.

**SlothRead stands for Sovereign Intelligence:**
1. **Zero Cloud Egress**: Every token is inferred on your local GPU/CPU via Ollama. No remote APIs, no telemetry, no leaks.
2. **Zero SaaS Subscriptions**: No per-token charges or monthly fees.
3. **Reproducibility**: Open weights (`qwen2.5:3b`, `gemma2:2b`) mean your analytical pipeline will run identically ten years from today, independent of any corporate API shutdown.

---

## ⚡ Core Features

- **AST-Aware Chunking**: Automatically segments PDFs and EPUBs into coherent chapters and sections using regex header anchors.
- **Tri-Takeaway Briefing**: 3 high-impact takeaways per chapter with specific conceptual depth.
- **Interactive Technical Glossary**: Jargon and mathematical symbols become hoverable chips with instantaneous in-situ definitions.
- **60-Second Studio Voice Recap**: Spoken-word conversational summaries read aloud using ElevenLabs neural voice synthesis (dedicated Voice ID: `XrExE9yKIg1WjnnlVkGX` - Matilda) with intelligent fallback to the browser's native `window.speechSynthesis` API and variable speed controls (1.0x, 1.25x, 0.85x).
- **Master Executive Synthesis**: Calculates total reading time saved against standard reading velocity (~220 WPM) and delivers an overarching document thesis.
- **Interactive 3D Three.js Visualizer**: Meditative, slow-rotating 3D parametric Torus Knot and floating particle lattice reacting smoothly to mouse movement and scroll depth.
- **Markdown Briefing Export**: Download a standalone, publication-ready `summary.md` with one click.

---

## 📁 Project Architecture

SlothRead enforces a strictly decoupled, clean separation of concerns:

```
slothread/
├── backend/                  # Python FastAPI Backend
│   ├── app/
│   │   ├── __init__.py       # Package definition
│   │   ├── config.py         # App settings, paths, Ollama host config
│   │   ├── parser.py         # PDF (pypdf) & EPUB (ebooklib/bs4) parser
│   │   ├── summarizer.py     # Ollama async integration & JSON schemas
│   │   └── main.py           # REST endpoints, CORS, background task pipeline
│   ├── Dockerfile            # Container definition for Render/Railway
│   └── requirements.txt      # Python dependencies
├── frontend/                 # Zero-Build Static Web Client (ES6+)
│   ├── index.html            # Ingestion dashboard, dropzone & Three.js canvas
│   ├── viewer.html           # Interactive executive presentation deck
│   ├── css/
│   │   └── style.css         # Dark editorial design & glassmorphism
│   └── js/
│       ├── three-bg.js       # 3D Torus Knot & particle lattice engine
│       ├── api.js            # Vanilla JS API client & offline presets
│       ├── app.js            # Ingestion, drag-drop, HUD polling loop
│       └── deck.js           # Slide deck, Web Speech API & export
├── vercel.json               # Vercel static routing configuration
├── render.yaml               # Render web service deployment spec
├── .gitignore
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites: Install Ollama & Pull Model

Download and install [Ollama](https://ollama.ai/download), then pull your preferred model:

```bash
# Recommended lightweight model (superb reasoning & speed)
ollama pull qwen2.5:3b

# Or alternative Google Gemma 2
ollama pull gemma2:2b

# Ensure Ollama daemon is running
ollama serve
```

### 2. Backend Setup (FastAPI)

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Verify backend health at: `http://localhost:8000/api/health`

### 3. Frontend Setup (Zero Build Step)

The frontend requires **zero compilation or npm build step**:

```bash
cd frontend

# Run with any static HTTP server:
python -m http.server 3000
# or npx serve -p 3000
```

Open `http://localhost:3000` in any modern web browser.

---

## 🐳 Docker Deployment

To run the backend inside Docker:

```bash
cd backend
docker build -t slothread-backend .
docker run -p 8000:8000 -e OLLAMA_HOST="http://host.docker.internal:11434" slothread-backend
```

---

## ☁️ Production Deployment

### Frontend on Vercel
Deploy the `frontend/` directory directly to Vercel with zero build configuration. `vercel.json` is preconfigured for clean routing.

### Backend on Render / Railway
Deploy using `render.yaml` or connect your GitHub repository and point to `backend/Dockerfile`. Set the environment variable `OLLAMA_HOST` to your private Ollama endpoint or tunnel.

---

## 📡 API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Verifies server and checks local Ollama model connection |
| `/api/upload` | `POST` | Ingests `.pdf` or `.epub` and launches background synthesis |
| `/api/documents/{doc_id}` | `GET` | Polls real-time synthesis progress & returns briefing JSON |
| `/api/documents/{doc_id}/export` | `GET` | Returns formatted `summary.md` executive briefing |

---

## 🎃 Hacktoberfest 2026: Contributing

We welcome community contributions celebrating International Sloth Day and the "Slow and Steady" open-source ethos!

### Good First Issues:
- [ ] Add support for `.mobi` and `.djvu` document formats in `parser.py`
- [ ] Implement additional Three.js geometric shaders (e.g., Klein bottle, Mobius strip)
- [ ] Add custom voice accent selector to the Web Speech API player in `deck.js`
- [ ] Local translation of executive summaries to Spanish, French, and German

---

## 📄 License

Released under the **MIT License**. Crafted with calm, meditative care for Hacktoberfest 2026.
