# Repurpose.AI - Drug Repurposing Platform

> AI-Powered Drug Repurposing Discovery System

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://react.dev)
[![LangGraph](https://img.shields.io/badge/LangGraph-Latest-orange.svg)](https://langchain.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Overview

Repurpose.AI leverages **5 AI agents** working in parallel to discover new therapeutic uses for existing drugs. The platform searches across millions of scientific papers, clinical trials, and molecular databases, then uses AI to synthesize actionable insights.

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface                           │
│  [Search: "Metformin"]                    [Export PDF]      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────┐  │
│   │Literature│ │Clinical │ │Bioactiv.│ │ Patent  │ │Inter│  │
│   │  Agent  │ │ Trials  │ │  Agent  │ │  Agent  │ │Agent│  │
│   │  [45]   │ │  [32]   │ │  [28]   │ │  [15]   │ │ [8] │  │
│   └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └──┬──┘  │
│        └───────────┴───────────┴───────────┴─────────┘      │
│                            │                                 │
│                            ▼                                 │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              AI Analysis (Google Gemini)             │   │
│   │                                                      │   │
│   │  Top Opportunities:                                  │   │
│   │  1. Cancer - 85/100 confidence                       │   │
│   │  2. Cardiovascular - 72/100 confidence               │   │
│   │  3. Neurological - 68/100 confidence                 │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Multi-Agent Architecture** | 5 specialized agents searching in parallel |
| **Real-Time Progress** | WebSocket updates during search |
| **AI Synthesis** | Google Gemini generates comprehensive analysis |
| **Evidence Scoring** | Proprietary algorithm ranks indications 0-100 |
| **Smart Caching** | 7-day cache with force-refresh capability |
| **PDF Export** | Professional report generation |
| **Re-Analyze** | Refresh cached results with latest data |

---

## Data Sources

| Agent | Source | Coverage |
|-------|--------|----------|
| Literature | PubMed (NCBI) | 35M+ scientific articles |
| Clinical Trials | ClinicalTrials.gov | 450K+ clinical studies |
| Bioactivity | ChEMBL (EBI) | 2M+ compound activities |
| Patents | Lens.org | 150M+ patent records |
| Internal | Mock Database | Proprietary insights |

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Gemini API key (free tier available)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Run server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Access Application
Open http://localhost:5173 in your browser

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Frontend                              │
│   React + Vite + Zustand + Tailwind CSS                      │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTP/WebSocket
┌──────────────────────────▼───────────────────────────────────┐
│                         Backend                               │
│   FastAPI + LangGraph + Pydantic                             │
│                                                               │
│   ┌─────────────────────────────────────────────────────┐    │
│   │              LangGraph Workflow                      │    │
│   │                                                      │    │
│   │  Initialize → Agents (5x) → Aggregate → Score → LLM │    │
│   └─────────────────────────────────────────────────────┘    │
│                                                               │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│   │ Cache    │ │ Scorer   │ │ LLM      │ │ PDF Gen  │       │
│   │ Manager  │ │ Engine   │ │ Factory  │ │          │       │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└──────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                    External APIs                              │
│   PubMed | ClinicalTrials.gov | ChEMBL | Lens.org | Gemini   │
└──────────────────────────────────────────────────────────────┘
```

---

## API Reference

### Search Drug
```bash
POST /api/search
{
    "drug_name": "Metformin",
    "force_refresh": false
}
```

### Export PDF
```bash
POST /api/export/pdf
# Returns: PDF blob
```

### Cache Operations
```bash
GET    /api/search/cache/stats     # Get statistics
DELETE /api/search/cache/clear     # Clear all
DELETE /api/search/cache/{drug}    # Clear specific
```

---

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `LENS_API_KEY` | Lens.org API key | No |
| `OLLAMA_BASE_URL` | Local Ollama URL | No |
| `CACHE_TTL_SECONDS` | Cache TTL (default: 604800) | No |

---

## Project Structure

```
drug-repurposing-platform/
├── backend/
│   ├── app/
│   │   ├── agents/          # 5 specialized agents
│   │   ├── api/routes/      # FastAPI endpoints
│   │   ├── cache/           # Caching system
│   │   ├── graph/           # LangGraph workflow
│   │   ├── llm/             # LLM integration
│   │   ├── models/          # Pydantic schemas
│   │   ├── scoring/         # Evidence scorer
│   │   └── utils/           # Utilities
│   ├── data/cache/          # Cached results
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API client
│   │   ├── hooks/           # Custom hooks
│   │   └── store/           # Zustand store
│   └── package.json
│
├── DOCUMENTATION.md         # Full documentation
└── README.md               # This file
```

---

## Screenshots

### Search Interface
- Drug name input with search button
- Real-time agent progress indicators
- EY Healthcare dark theme

### Results Dashboard
- Ranked indications with confidence scores
- AI-generated analysis sections
- Evidence breakdown by source
- PDF export functionality

### AI Analysis
- Structured markdown rendering
- Color-coded sections
- Source citations
- Actionable recommendations

---

## Performance

| Metric | Value |
|--------|-------|
| Average Search Time | 15-30 seconds |
| Evidence Items Processed | 100-200 per search |
| Parallel Agent Execution | 5 concurrent |
| Cache Hit Response | <100ms |

---

## Technology Stack

### Backend
- **FastAPI** - High-performance async web framework
- **LangGraph** - AI workflow orchestration
- **Pydantic** - Data validation
- **httpx/aiohttp** - Async HTTP clients
- **ReportLab** - PDF generation

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide** - Icons

### AI/ML
- **Google Gemini** - Primary LLM
- **Ollama** - Fallback local LLM

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details

---

## Acknowledgments

- Google Gemini for AI synthesis
- NCBI for PubMed access
- EBI for ChEMBL data
- ClinicalTrials.gov for trial data
- Lens.org for patent data

---

*Built with AI for pharmaceutical research acceleration*
