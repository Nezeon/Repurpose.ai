# Drug Repurposing Platform - Backend

Multi-agent AI system for automated drug repurposing discovery using LangGraph, FastAPI, and Google Gemini.

## Overview

The backend orchestrates **15 specialized AI agents** that query biomedical databases, score evidence, and generate repurposing insights. It features:

- **Parallel agent execution** for fast data retrieval
- **Composite scoring system** with 4-dimensional analysis
- **Comparative analysis** vs standard of care treatments
- **Market segment identification** with specific therapy targets
- **Scientific deep dive** - mechanism, target proteins, pathways
- **Free market data integration** from WHO, Wikidata, and Europe PMC
- **Smart indication matching** with fuzzy logic and 60+ medical abbreviations
- **Real-time WebSocket** progress updates
- **Automatic LLM fallback** (Gemini → Ollama)

## Quick Start

### Prerequisites

- Python 3.10 or higher
- Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))
- (Optional) Lens.org API Key for patent search
- (Optional) Ollama installed locally for LLM fallback

### Setup Instructions

1. **Create and activate virtual environment:**

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Unix/MacOS
python3 -m venv venv
source venv/bin/activate
```

2. **Install dependencies:**

```bash
pip install -r requirements.txt
```

3. **Configure environment variables:**

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your API keys
# GEMINI_API_KEY=your_actual_key_here
```

4. **Run the server:**

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload

# Production mode
python -m app.main
```

5. **Access the API:**

- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health
- Root Endpoint: http://localhost:8000/

## Project Structure

```
backend/
├── app/
│   ├── agents/              # 15 specialized AI agents
│   │   ├── base_agent.py    # Abstract base class
│   │   ├── literature_agent.py       # PubMed/NCBI
│   │   ├── clinical_trials_agent.py  # ClinicalTrials.gov
│   │   ├── bioactivity_agent.py      # ChEMBL
│   │   ├── patent_agent.py           # Lens.org
│   │   ├── internal_agent.py         # Proprietary data
│   │   ├── openfda_agent.py          # FDA adverse events
│   │   ├── opentargets_agent.py      # Target-disease associations
│   │   ├── semantic_scholar_agent.py # Academic papers
│   │   ├── dailymed_agent.py         # Drug labels
│   │   ├── kegg_agent.py             # Pathways
│   │   ├── uniprot_agent.py          # Protein data
│   │   ├── orange_book_agent.py      # FDA approvals
│   │   ├── rxnorm_agent.py           # Drug nomenclature
│   │   ├── who_agent.py              # Essential medicines
│   │   ├── drugbank_agent.py         # Drug interactions
│   │   └── market_data_agent.py      # Free epidemiology APIs
│   ├── api/                 # API routes and WebSocket
│   │   ├── websocket.py     # Real-time progress
│   │   └── routes/          # REST endpoints
│   ├── cache/               # Caching layer
│   ├── graph/               # LangGraph workflow
│   │   ├── state.py         # State definition
│   │   ├── nodes.py         # Workflow nodes
│   │   └── workflow.py      # Graph assembly
│   ├── llm/                 # LLM integrations
│   │   ├── gemini_client.py # Google Gemini
│   │   ├── ollama_client.py # Local Ollama
│   │   └── llm_factory.py   # Provider fallback
│   ├── market/              # Market analysis
│   │   ├── market_analyzer.py    # Market opportunities
│   │   └── competitor_tracker.py # Competition analysis
│   ├── models/              # Pydantic schemas
│   │   ├── schemas.py       # Core models
│   │   └── scoring_models.py # Scoring models
│   ├── scoring/             # Evidence scoring
│   │   ├── evidence_scorer.py    # Basic scoring
│   │   └── composite_scorer.py   # 4D composite scoring
│   ├── utils/               # Utilities
│   ├── config.py            # Configuration
│   └── main.py              # FastAPI application
├── data/
│   ├── cache/               # JSON cache for API responses
│   └── vector_db/           # ChromaDB vector store
├── scripts/
│   └── populate_cache.py    # Pre-populate demo data
└── tests/                   # Unit and integration tests
```

## Multi-Agent System

The platform orchestrates 15 specialized agents in parallel:

### Tier 1 - Core Agents (Original)
| Agent | Data Source | Description |
|-------|-------------|-------------|
| Literature Agent | PubMed/NCBI | Scientific publications |
| Clinical Trials Agent | ClinicalTrials.gov | Trial data and results |
| Bioactivity Agent | ChEMBL | Molecular activity data |
| Patent Agent | Lens.org | Patent information |
| Internal Agent | Mock DB | Proprietary data |

### Tier 2 - Regulatory & Targets
| Agent | Data Source | Description |
|-------|-------------|-------------|
| OpenFDA Agent | FDA | Adverse events, labels |
| OpenTargets Agent | Open Targets | Target-disease associations |
| Semantic Scholar Agent | Semantic Scholar | Academic literature |

### Tier 3 - Drug Information
| Agent | Data Source | Description |
|-------|-------------|-------------|
| DailyMed Agent | NLM DailyMed | Drug labels & SPL |
| KEGG Agent | KEGG | Pathways & interactions |
| UniProt Agent | UniProt | Protein information |
| Orange Book Agent | FDA Orange Book | Approvals & patents |

### Tier 4 - Nomenclature & Market
| Agent | Data Source | Description |
|-------|-------------|-------------|
| RxNorm Agent | NLM RxNorm | Drug nomenclature |
| WHO Agent | WHO | Essential medicines |
| DrugBank Agent | DrugBank | Drug interactions |
| Market Data Agent | WHO GHO, Wikidata, Europe PMC | Free epidemiology data |

## Composite Scoring System

The platform uses a sophisticated 4-dimensional scoring system with detailed formulas:

### Scoring Dimensions & Weights

| Dimension | Weight | Max Score | Formula |
|-----------|--------|-----------|---------|
| Scientific Evidence | 40% | 100 | Quantity + Diversity + Phase + Quality + Mechanistic |
| Market Opportunity | 25% | 100 | Market Size + CAGR + Unmet Need + Pricing |
| Competitive Landscape | 20% | 100 | 80 - Competitor Deductions (min 10) |
| Development Feasibility | 15% | 100 | 50 + Safety + Regulatory + Patent + Orphan |

### Scientific Evidence Score (40%)

| Factor | Max Points | Scoring |
|--------|------------|---------|
| Evidence Quantity | 25 | ≥20: 25, 10-19: 20, 5-9: 15, <5: count×3 |
| Source Diversity | 20 | 4 pts per source (max 5) |
| Clinical Phase | 25 | P4: 25, P3: 20, P2: 15, P1: 10, None: 0 |
| Evidence Quality | 15 | avg(relevance_score) × 15 |
| Mechanistic Support | 15 | ≥5: 15, 2-4: 10, 1: 5 (ChEMBL, OpenTargets, KEGG, UniProt) |

### Market Opportunity Score (25%)

| Factor | Max Points | Scoring |
|--------|------------|---------|
| Market Size | 30 | ≥$50B: 30, $10-49B: 25, $1-9B: 20, <$1B: 10 |
| CAGR | 20 | ≥10%: 20, 7-9%: 15, 5-6%: 10, <5%: 5 |
| Unmet Need | 30 | (score/100) × 30 |
| Pricing Potential | 20 | Premium: 20, Standard: 15, Generic: 10 |

### Competitive Landscape Score (20%)

| Factor | Deduction | Scoring |
|--------|-----------|---------|
| Competitor Count | -40 max | ≥10: -40, 5-9: -25, 2-4: -15, 0-1: 0 |
| Approved Competition | -30 max | Approved: -30, ≥3 P3: -25, 1-2 P3: -15 |
| Big Pharma | -20 | If involved |

*Starting score: 80, Minimum: 10. Higher = less competition = better.*

### Development Feasibility Score (15%)

| Factor | Points | Source |
|--------|--------|--------|
| Safety Data | +20 | FDA safety data (OpenFDA) |
| Regulatory Pathway | +15 | FDA labeling (505(b)(2) potential) |
| Patent Status | +15 | Expired: +15, Expiring: +10, Active: 0 |
| Orphan Drug | +10 | Meets criteria |

*Starting score: 50, Maximum: 100.*

### Overall Score Formula

```
Overall = (Scientific × 0.40) + (Market × 0.25) + (Competitive × 0.20) + (Feasibility × 0.15)
```

### Confidence Levels

| Level | Score |
|-------|-------|
| Very High | 85-100 |
| High | 70-84 |
| Moderate | 50-69 |
| Low | 30-49 |
| Very Low | 0-29 |

### Market Data Sources

The system uses a 3-tier fallback for market data:

1. **Premium APIs** (if configured) - IQVIA, Evaluate Pharma, etc.
2. **Free Epidemiology APIs** - WHO GHO, Wikidata SPARQL, Europe PMC
3. **Built-in Estimates** - 50+ therapeutic areas with:
   - Market size ($ billions)
   - CAGR (%)
   - Patient population (millions)
   - Unmet need score
   - Pricing potential

### Smart Indication Matching

The system recognizes:

- **60+ medical abbreviations** (T2DM → Type 2 Diabetes, NSCLC → Lung Cancer)
- **Roman numerals** (Type II → Type 2)
- **Fuzzy matching** (Jaccard similarity ≥50%)
- **Category-based fallbacks** (Any "cancer" → Oncology estimates)

## API Endpoints

### Search Drug
```bash
POST /api/search
{
  "drug_name": "Metformin",
  "force_refresh": false
}
```

### WebSocket (Real-time Progress)
```bash
ws://localhost:8000/ws/{session_id}
```

### Chat Interface
```bash
POST /api/chat
{
  "message": "Why is Metformin good for longevity?",
  "session_id": "abc123"
}
```

### Export PDF
```bash
POST /api/export/pdf
{
  "search_result": {...}
}
```

### Clear Cache
```bash
POST /api/search/cache/clear
```

### Integrations Management
```bash
GET /api/integrations          # List all integrations
POST /api/integrations/{id}/enable   # Enable integration
POST /api/integrations/{id}/disable  # Disable integration
PUT /api/integrations/{id}/configure # Configure API key
```

## Environment Variables

Key environment variables (see `.env.example` for full list):

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `LENS_API_KEY` | Lens.org API key | No |
| `OLLAMA_BASE_URL` | Ollama server URL | No |
| `ENVIRONMENT` | development or production | No |
| `LOG_LEVEL` | INFO, DEBUG, WARNING, ERROR | No |
| `CACHE_TTL` | Cache TTL in seconds (default: 604800) | No |

## Development

### Running Tests

```bash
pytest tests/ -v
```

### Linting and Formatting

```bash
# Format code
black app/

# Lint code
pylint app/
```

### Test Workflow

```python
import asyncio
from app.graph.workflow import get_workflow

async def test():
    workflow = get_workflow()
    result = await workflow.ainvoke({
        "drug_name": "Metformin",
        "search_context": {},
        "session_id": "test-123"
    })
    print(f"Evidence: {len(result['all_evidence'])}")
    print(f"Opportunities: {len(result['ranked_indications'])}")

asyncio.run(test())
```

## Demo Drugs

The system has optimized data for these drugs:

1. **Metformin** - Diabetes → Longevity, Cancer, Neuroprotection
2. **Aspirin** - Pain → Colorectal Cancer Prevention, Alzheimer's
3. **Ibuprofen** - Pain → Alzheimer's Prevention, Parkinson's
4. **Sildenafil** - ED → Pulmonary Hypertension, Raynaud's
5. **Thalidomide** - Morning Sickness → Multiple Myeloma, Leprosy
6. **Rapamycin** - Immunosuppressant → Longevity, Age-related Diseases
7. **Hydroxychloroquine** - Malaria → Lupus, Rheumatoid Arthritis
8. **Tamoxifen** - Breast Cancer → Breast Cancer Prevention
9. **Valproic Acid** - Epilepsy → Cancer, HIV Latency
10. **Ketoconazole** - Antifungal → Prostate Cancer, Cushing's

## Troubleshooting

### Import Errors

If you get import errors, ensure you're running from the backend directory:

```bash
cd backend
python -m uvicorn app.main:app --reload
```

### API Rate Limits

- PubMed: 3 req/sec (no key), 10 req/sec (with key)
- Use cached data by setting `force_refresh: false`
- Pre-populate cache for demo drugs

### Gemini API Errors

- Check your API key is valid
- Ensure you're within quota limits (free tier: 60 req/min)
- System will automatically fall back to Ollama if configured

### No Opportunities Returned

If search returns evidence but 0 opportunities:
- Check backend logs for Pydantic validation errors
- Verify agents completed successfully
- Ensure composite scoring didn't fail

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Application                       │
│                      (app/main.py)                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                LangGraph Workflow Orchestrator               │
│                   (app/graph/workflow.py)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              Parallel 15-Agent Execution                     │
│                   (app/graph/nodes.py)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Literature │ Clinical │ Bio │ Patent │ ... │ Market │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                 4D Composite Scoring                         │
│ ┌──────────┬──────────┬──────────────┬─────────────────┐   │
│ │Scientific│  Market  │ Competitive  │  Development    │   │
│ │ Evidence │Opportunity│  Landscape  │  Feasibility    │   │
│ │   40%    │   25%    │     20%      │      15%        │   │
│ └──────────┴──────────┴──────────────┴─────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  LLM Synthesis (Gemini)                      │
│                   (app/llm/llm_factory.py)                  │
└─────────────────────────────────────────────────────────────┘
```

## License

This project is part of a hackathon submission.

## Contributing

Contributions welcome! Please submit issues and pull requests.

## Contact

For questions or issues, please refer to the main project README.
