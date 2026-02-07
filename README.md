# Repurpose.AI - Drug Repurposing Discovery Platform

> AI-Powered Drug Repurposing Discovery System with 15 Specialized Agents

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://react.dev)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.2+-orange.svg)](https://langchain.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Overview

Repurpose.AI leverages **15 AI agents** working in parallel to discover new therapeutic uses for existing drugs. The platform searches across scientific papers, clinical trials, molecular databases, regulatory data, and market intelligence, then uses a **4-dimensional composite scoring system** to rank opportunities.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Repurpose.AI                                  │
│  [Search: "Metformin"]                              [Export PDF]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐  │
│   │Literature│ │Clinical │ │OpenFDA │ │ KEGG    │ │  +11 more   │  │
│   │  Agent  │ │ Trials  │ │  Agent │ │  Agent  │ │   agents    │  │
│   │  [45]   │ │  [32]   │ │  [18]  │ │  [12]   │ │   [...]     │  │
│   └────┬────┘ └────┬────┘ └────┬───┘ └────┬────┘ └──────┬──────┘  │
│        └───────────┴───────────┴──────────┴─────────────┘          │
│                               │                                      │
│                               ▼                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │               4D Composite Scoring                           │   │
│   │  ┌──────────┬──────────┬────────────┬─────────────────────┐ │   │
│   │  │Scientific│  Market  │Competitive │    Development      │ │   │
│   │  │ Evidence │Opportunity│ Landscape │    Feasibility      │ │   │
│   │  │   40%    │   25%    │    20%     │        15%          │ │   │
│   │  └──────────┴──────────┴────────────┴─────────────────────┘ │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                               │                                      │
│                               ▼                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              AI Analysis (Google Gemini)                     │   │
│   │                                                              │   │
│   │  Top Opportunities:                                          │   │
│   │  1. Cancer Prevention - 87/100 (Sci:92 Mkt:85 Comp:78 Dev:82)│   │
│   │  2. Cardiovascular - 74/100 (Sci:80 Mkt:70 Comp:68 Dev:75)  │   │
│   │  3. Neuroprotection - 68/100 (Sci:72 Mkt:62 Comp:70 Dev:65) │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Features

| Feature | Description |
|---------|-------------|
| **15-Agent Architecture** | Specialized agents searching biomedical databases in parallel |
| **4D Composite Scoring** | Scientific, Market, Competitive, Feasibility dimensions |
| **Comparative Analysis** | Compare vs standard of care with specific advantages |
| **Market Segment Targeting** | Identify specific therapy segments, not just broad markets |
| **Scientific Deep Dive** | Mechanism, target proteins, pathways, binding affinity |
| **Free Market Data** | WHO GHO, Wikidata, Europe PMC (no paid APIs required) |
| **Smart Indication Matching** | 60+ medical abbreviations, fuzzy matching |
| **Real-Time Progress** | WebSocket updates during search |
| **AI Synthesis** | Google Gemini generates comprehensive analysis |
| **Professional Reports** | PDF with comparative analysis, scientific details |

---

## Data Sources (15 Agents)

| Tier | Agent | Source | Coverage |
|------|-------|--------|----------|
| **1** | Literature | PubMed (NCBI) | 35M+ scientific articles |
| **1** | Clinical Trials | ClinicalTrials.gov | 450K+ clinical studies |
| **1** | Bioactivity | ChEMBL (EBI) | 2M+ compound activities |
| **1** | Patents | Lens.org | 150M+ patent records |
| **1** | Internal | Mock Database | Proprietary insights |
| **2** | OpenFDA | FDA | Adverse events, labels |
| **2** | OpenTargets | Open Targets | Target-disease associations |
| **2** | Semantic Scholar | S2 | Academic papers |
| **3** | DailyMed | NLM | Drug labels & SPL |
| **3** | KEGG | KEGG | Pathways & interactions |
| **3** | UniProt | UniProt | Protein data |
| **3** | Orange Book | FDA | Approvals & patents |
| **4** | RxNorm | NLM | Drug nomenclature |
| **4** | WHO | WHO | Essential medicines |
| **4** | DrugBank | DrugBank | Drug interactions |
| **4** | Market Data | WHO GHO/Wikidata | Epidemiology (FREE) |

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Google Gemini API key ([Get free key](https://aistudio.google.com/app/apikey))

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add: GEMINI_API_KEY=your_api_key_here

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
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                           Frontend                                    │
│   React 18 + Vite + Zustand + Tailwind CSS + Framer Motion          │
│   Dashboard │ Search │ Results │ History │ Settings │ Integrations  │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ HTTP/WebSocket
┌──────────────────────────────▼───────────────────────────────────────┐
│                           Backend                                     │
│   FastAPI + LangGraph + Pydantic                                     │
│                                                                       │
│   ┌───────────────────────────────────────────────────────────────┐  │
│   │                   LangGraph Workflow                           │  │
│   │                                                                │  │
│   │  Initialize → 15 Agents (parallel) → Aggregate → Score → LLM  │  │
│   └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │                 4D Composite Scorer                          │    │
│   │  Scientific (40%) │ Market (25%) │ Competitive (20%) │ Dev (15%)│  │
│   └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│   │  Cache   │ │  Market  │ │   LLM    │ │  PDF     │ │ WebSocket│  │
│   │ Manager  │ │ Analyzer │ │ Factory  │ │  Export  │ │  Handler │  │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────────┐
│                        External APIs                                  │
│  PubMed │ ClinicalTrials │ ChEMBL │ FDA │ WHO │ Wikidata │ Gemini   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Composite Scoring System

The platform evaluates opportunities across 4 dimensions with detailed scoring formulas:

### Dimension Weights

| Dimension | Weight | Formula |
|-----------|--------|---------|
| **Scientific Evidence** | 40% | Sum of: Evidence Quantity (25) + Source Diversity (20) + Clinical Phase (25) + Quality (15) + Mechanistic (15) |
| **Market Opportunity** | 25% | Sum of: Market Size (30) + CAGR (20) + Unmet Need (30) + Pricing (20) |
| **Competitive Landscape** | 20% | Starting (80) - Competitor Count (up to -40) - Approved Drugs (-30) - Big Pharma (-20) |
| **Development Feasibility** | 15% | Starting (50) + Safety Data (+20) + Regulatory (+15) + Patent (+15) + Orphan (+10) |

### Scientific Evidence Score (40% weight)

| Factor | Max Points | Scoring Rules |
|--------|------------|---------------|
| Evidence Quantity | 25 | ≥20 items: 25 • 10-19: 20 • 5-9: 15 • <5: count×3 |
| Source Diversity | 20 | 4 points per unique source (max 5 sources) |
| Clinical Phase | 25 | Phase 4: 25 • Phase 3: 20 • Phase 2: 15 • Phase 1: 10 |
| Evidence Quality | 15 | Average relevance score × 15 |
| Mechanistic Support | 15 | ≥5 items: 15 • 2-4: 10 • 1: 5 (ChEMBL, OpenTargets, KEGG, UniProt) |

### Market Opportunity Score (25% weight)

| Factor | Max Points | Scoring Rules |
|--------|------------|---------------|
| Market Size | 30 | ≥$50B: 30 • $10-49B: 25 • $1-9B: 20 • <$1B: 10 |
| Growth Rate (CAGR) | 20 | ≥10%: 20 • 7-9%: 15 • 5-6%: 10 • <5%: 5 |
| Unmet Need | 30 | (unmet_need_score / 100) × 30 |
| Pricing Potential | 20 | Premium: 20 • Standard: 15 • Generic: 10 |

### Competitive Landscape Score (20% weight)

| Factor | Deduction | Scoring Rules |
|--------|-----------|---------------|
| Competitor Count | up to -40 | ≥10: -40 • 5-9: -25 • 2-4: -15 • 0-1: 0 |
| Approved Competition | up to -30 | Approved drugs: -30 • ≥3 Phase 3: -25 • 1-2 Phase 3: -15 |
| Big Pharma Involved | -20 | If major pharma companies present |

*Note: Score starts at 80, minimum is 10. Higher = less competition = better.*

### Development Feasibility Score (15% weight)

| Factor | Points | Scoring Rules |
|--------|--------|---------------|
| Safety Data | +20 | FDA safety data (OpenFDA) available |
| Regulatory Pathway | +15 | Existing FDA labeling (505(b)(2) potential) |
| Patent Status | +15 | Expired: +15 • Expiring: +10 • Active: 0 |
| Orphan Drug Potential | +10 | Meets orphan drug criteria |

*Note: Score starts at 50, maximum is 100.*

### Overall Score Calculation

```
Overall = (Scientific × 0.40) + (Market × 0.25) + (Competitive × 0.20) + (Feasibility × 0.15)
```

### Confidence Levels

| Level | Score Range |
|-------|-------------|
| Very High | 85-100 |
| High | 70-84 |
| Moderate | 50-69 |
| Low | 30-49 |
| Very Low | 0-29 |

### Free Market Data

Market analysis works without any paid APIs:

1. **Built-in Estimates** - 50+ therapeutic areas with market size, CAGR, patient populations
2. **WHO GHO** - Disease burden, DALYs, mortality data
3. **Wikidata SPARQL** - Global prevalence, epidemiology
4. **Europe PMC** - Literature-derived statistics

### Smart Indication Matching

- **60+ abbreviations**: T2DM, NSCLC, HCC, RA, MS, ALS, COPD, etc.
- **Roman numerals**: Type II → Type 2
- **Fuzzy matching**: Diabetic neuropathy → Diabetes (Jaccard similarity ≥50%)
- **Category fallback**: Any "cancer" → Oncology estimates

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

### WebSocket Progress
```javascript
ws://localhost:8000/ws/{session_id}
// Receives: { "agent": "LiteratureAgent", "status": "success" }
```

### Export PDF
```bash
POST /api/export/pdf
# Returns: PDF blob
```

### Cache Operations
```bash
POST /api/search/cache/clear    # Clear all cache
```

### Integrations
```bash
GET  /api/integrations                    # List all
POST /api/integrations/{id}/enable        # Enable
POST /api/integrations/{id}/disable       # Disable
PUT  /api/integrations/{id}/configure     # Set API key
```

---

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `LENS_API_KEY` | Lens.org API key | No |
| `OLLAMA_BASE_URL` | Local Ollama URL | No |
| `ENVIRONMENT` | development/production | No |
| `LOG_LEVEL` | INFO/DEBUG/WARNING | No |
| `CACHE_TTL` | Cache TTL seconds (default: 604800) | No |

---

## Project Structure

```
drug-repurposing-platform/
├── backend/
│   ├── app/
│   │   ├── agents/           # 15 specialized agents + market_data_agent
│   │   ├── api/routes/       # FastAPI endpoints
│   │   ├── cache/            # Caching system
│   │   ├── graph/            # LangGraph workflow
│   │   ├── llm/              # LLM integration (Gemini/Ollama)
│   │   ├── market/           # Market analysis
│   │   ├── models/           # Pydantic schemas
│   │   ├── scoring/          # Evidence + Composite scorers
│   │   └── utils/            # Utilities
│   ├── data/
│   │   ├── cache/            # Cached results
│   │   └── vector_db/        # ChromaDB
│   ├── requirements.txt
│   ├── README.md
│   └── PROJECT_STATUS.md
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API client
│   │   └── store/            # Zustand store
│   ├── package.json
│   └── README.md
│
└── README.md                 # This file
```

---

## Demo Drugs

Optimized data available for these compounds:

| Drug | Original Use | Repurposing Opportunities |
|------|--------------|---------------------------|
| **Metformin** | Diabetes | Cancer, Longevity, Neuroprotection |
| **Aspirin** | Pain | Colorectal Cancer Prevention |
| **Ibuprofen** | Pain/Inflammation | Alzheimer's, Parkinson's |
| **Sildenafil** | Erectile Dysfunction | Pulmonary Hypertension |
| **Thalidomide** | Morning Sickness | Multiple Myeloma |
| **Rapamycin** | Immunosuppressant | Longevity, Anti-aging |

---

## Performance

| Metric | Value |
|--------|-------|
| Average Search Time | 15-30 seconds |
| Evidence Items | 100-400 per search |
| Parallel Agents | 15 concurrent |
| Cache Hit Response | <100ms |
| Market Coverage | 50+ therapeutic areas |

---

## Technology Stack

### Backend
- **FastAPI** - High-performance async web framework
- **LangGraph** - AI workflow orchestration
- **Pydantic** - Data validation
- **httpx/aiohttp** - Async HTTP clients
- **ChromaDB** - Vector database

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Data visualization

### AI/ML
- **Google Gemini** - Primary LLM
- **Ollama** - Fallback local LLM

---

## Screenshots

### Search Interface
- Drug name input with autocomplete
- Real-time 15-agent progress indicators
- Dark theme with yellow accents

### Results Dashboard
- 4D composite scores with breakdowns
- Ranked indications with confidence levels
- Evidence breakdown by source

### AI Insights
- Strengths, risks, recommendations
- Source citations
- Strategic guidance

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
- WHO for Global Health Observatory
- Wikidata for open epidemiology data
- Europe PMC for literature access

---

**Built with AI for pharmaceutical research acceleration**

Version 2.0.0

---

<p align="center">Made with ❤️</p>
