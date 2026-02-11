# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Repurpose.AI v3.1** is an AI-powered conversational pharma planning assistant built for the EY Techathon 6.0. It identifies new therapeutic uses for existing drugs using a **unified 18-agent pipeline** that searches biomedical databases in parallel and scores opportunities across 4 dimensions.

**Key Architecture:**
- **Chat-First Interface**: Primary entry point at `/chat` with Master Agent orchestrator
- **18-Agent Unified Brain**: 15 core agents + 3 EY pipeline wrappers (IQVIA, EXIM, Web Intelligence)
- **7 EY Worker Agent Groups**: IQVIA Insights, EXIM Trade, Patent Landscape, Clinical Trials, Internal Knowledge, Web Intelligence, Report Generator
- **4D Composite Scoring + Refinement**: Base scoring from evidence + enhanced refinement (+/- 20 per dimension)
- **LangGraph Orchestration**: 8-node workflow for search pipeline
- **Conversation Persistence**: Chat sessions auto-saved to filesystem
- **Report Archival**: All PDF/Excel reports auto-archived with metadata

## Development Commands

### Backend (FastAPI + Python 3.10+)

**Windows:**
```bash
cd backend
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Linux/Mac:**
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Install Playwright browsers (required for PDF generation):**
```bash
playwright install chromium
```

### Frontend (React 18 + Vite)

```bash
cd frontend
npm install
npm run dev          # Dev server (port 5173)
npm run build        # Production build
npm run lint         # ESLint check
```

**Note:** There are no test commands configured. To add tests, install testing libraries (e.g., vitest, jest) and add scripts to `package.json`.

### Configuration

1. Copy `backend/.env.example` to `backend/.env`
2. Set `GEMINI_API_KEY` (required - get free key at https://aistudio.google.com/app/apikey)
3. Optional API keys: `LENS_API_KEY`, `PATENTSVIEW_API_KEY` (both free)
4. All other settings have sensible defaults

## Architecture

### Unified Brain: 18-Agent Pipeline

The platform uses **one unified pipeline** for both Search and Chat interfaces:

**15 Core Agents:**
1. Literature (PubMed)
2. Clinical Trials (ClinicalTrials.gov)
3. Bioactivity (ChEMBL)
4. Patent (USPTO PatentsView)
5. Internal (ChromaDB vector store)
6. OpenFDA
7. OpenTargets
8. Semantic Scholar
9. DailyMed
10. KEGG
11. UniProt
12. Orange Book
13. RxNorm
14. WHO
15. DrugBank

**3 EY Pipeline Wrappers** (integrate chat workers into search):
16. IQVIA Pipeline Agent → wraps MarketAnalyzer (scans 14 therapeutic areas)
17. EXIM Pipeline Agent → wraps EXIMAgent (import/export trade data)
18. Web Intelligence Pipeline Agent → wraps WebIntelligenceAgent (web search results)

**Key files:**
- `backend/app/agents/` - All 18 agents
- `backend/app/agents/base_agent.py` - Abstract base class
- `backend/app/agents/iqvia_pipeline_agent.py`, `exim_pipeline_agent.py`, `web_intelligence_pipeline_agent.py`
- `backend/app/graph/nodes.py` - Node implementations (registers all 18 agents)
- `backend/app/graph/workflow.py` - LangGraph workflow definition

### Chat System Architecture

```
User Query → Master Agent (intent classification)
              ↓
      Route to EY Worker Groups:
      - IQVIA Insights
      - EXIM Trade Analysis
      - Patent Landscape
      - Clinical Trials
      - Internal Knowledge (RAG)
      - Web Intelligence
      - Report Generator (triggers full 18-agent pipeline)
              ↓
      Response Formatter
              ↓
      Rich Chat Response (markdown + tables + charts + PDFs + suggestions)
```

**Key files:**
- `backend/app/agents/master_agent.py` - Orchestrator with intent classification
- `backend/app/chat/conversation_manager.py` - Conversation persistence
- `backend/app/api/routes/chat.py` - Chat endpoints
- `frontend/src/pages/Chat.jsx` - Chat UI (default route)

### LangGraph Workflow (8 Nodes)

The drug search pipeline follows this sequence:

1. **initialize_search** - Set up state, initialize 18-agent progress tracking
2. **run_agents_parallel** - Execute all 18 agents concurrently with asyncio.gather()
3. **aggregate_evidence** - Combine evidence items, deduplicate by indication
4. **score_evidence** - Base 4D scoring (Scientific 40%, Market 25%, Competitive 20%, Feasibility 15%)
5. **analyze_comparatives** - Compare vs standard of care, extract scientific details, identify market segments
6. **refine_scores** - Adjust scores using enhanced data (+/- 20 cap per dimension)
7. **synthesize_results** - Generate AI summary with LLM (Gemini or Ollama fallback)
8. **finalize_results** - Add metadata, log execution time

**Key files:**
- `backend/app/graph/workflow.py` - Workflow definition
- `backend/app/graph/nodes.py` - All 8 node implementations
- `backend/app/graph/state.py` - AgentState TypedDict

### 4D Composite Scoring with Refinement

**Phase 1: Base Scoring** (from evidence and market data)
- Scientific Evidence (40%): Evidence quantity, source diversity, clinical phase, quality, mechanistic support
- Market Opportunity (25%): Market size, CAGR, unmet need, pricing potential
- Competitive Landscape (20%): Starts at 80, deductions for competitors/approved drugs/big pharma
- Development Feasibility (15%): Starts at 50, additions for safety data/regulatory/patent/orphan status

**Phase 2: Score Refinement** (+/- 20 cap per dimension)
- Uses enhanced data from `ComparativeAnalyzer`, `ScientificExtractor`, `MarketSegmentAnalyzer`
- Adjusts based on: binding affinity, pathway relevance, publication quality, biomarkers, safety advantages, segment competition
- Can shift overall score by ~20 points when enhanced data is strong

**Key files:**
- `backend/app/scoring/composite_scorer.py` - Base 4D scoring
- `backend/app/scoring/score_refiner.py` - Refinement logic
- `backend/app/scoring/comparative_analyzer.py` - Standard of care comparison
- `backend/app/scoring/scientific_extractor.py` - Mechanism/target extraction
- `backend/app/market/segment_analyzer.py` - Market segment details

### Frontend Architecture

**Primary Interface: Chat (`/chat` - default route)**
- Conversational AI with Master Agent
- 10 pre-loaded welcome suggestions
- Conversation sidebar with history
- Rich responses: tables, charts, PDF downloads, follow-up questions
- File upload for internal knowledge base

**Other Pages:**
- `/dashboard` - Overview, stats, recent searches
- `/search` - Traditional drug search with 7 Worker Agent groups (collapsible to 18 sources)
- `/results/:drug` - Detailed results with 4D scores
- `/history` - Search history + Archived Reports tab
- `/saved` - Saved opportunities
- `/settings` - User preferences, cache management
- `/integrations` - Data source configuration

**State Management (Zustand):**
- `frontend/src/store/index.js` - Global state with conversations, files, agent progress
- Persists to localStorage for offline access

**Key Components:**
- `frontend/src/pages/Chat.jsx` - Chat interface
- `frontend/src/components/chat/MessageBubble.jsx` - User/AI messages
- `frontend/src/components/chat/TableRenderer.jsx`, `ChartRenderer.jsx` - Rich content rendering
- `frontend/src/components/search/SearchProgress.jsx` - 7 EY Worker Agent groups display

## Code Patterns

### Agent Pattern

All agents extend `BaseAgent` abstract class:

```python
from app.agents.base_agent import BaseAgent
from app.models.schemas import EvidenceItem

class MyAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="My Agent",
            description="What this agent does",
            data_sources=["API Name"]
        )

    async def fetch_data(self, drug_name: str, context: dict) -> dict:
        # Fetch from external API
        # Handle rate limits, retries
        return raw_data

    async def process_data(self, raw_data: dict, drug_name: str = "") -> list[EvidenceItem]:
        # Transform to standardized EvidenceItem objects
        # Extract indication, relevance_score, evidence_type
        return [EvidenceItem(...), ...]
```

**EvidenceItem Required Fields:**
- `source` - Agent name
- `indication` - Medical condition (e.g., "Type 2 Diabetes")
- `summary` - Brief description
- `relevance_score` - 0.0 to 1.0
- `url` - Link to source
- `publication_date` - ISO date string
- `evidence_type` - Category (e.g., "clinical_trial", "literature", "bioactivity")

### Pipeline Wrapper Pattern

For integrating chat workers into the search pipeline:

```python
from app.agents.base_agent import BaseAgent
from app.agents.market_data_agent import MarketAnalyzer

class IQVIAPipelineAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="IQVIA Insights", ...)
        self.market_analyzer = MarketAnalyzer()

    async def fetch_data(self, drug_name: str, context: dict) -> dict:
        # Delegate to existing worker agent
        result = await self.market_analyzer.analyze_market_landscape(...)
        return result

    async def process_data(self, raw_data: dict, drug_name: str = "") -> list[EvidenceItem]:
        # Convert worker output to EvidenceItem format
        return [EvidenceItem(source="iqvia", evidence_type="market_data", ...)]
```

### Adding a New Agent

1. Create `backend/app/agents/new_agent.py` extending `BaseAgent`
2. Implement `fetch_data()` and `process_data()` methods
3. Register in `backend/app/graph/nodes.py`:
   - Add to `initialize_search()` agent list
   - Add to `run_agents_parallel()` execution
4. Add rate limit config in `backend/app/config.py` if needed
5. Add to EY Worker Agent Groups mapping in `frontend/src/utils/constants.js` if applicable

### Score Refinement Pattern

Refinement adjustments are applied in `backend/app/scoring/score_refiner.py`:

```python
def refine_dimension(base_score: float, enhanced_data: dict) -> tuple[float, dict]:
    """
    Refine a dimension score using enhanced analysis data.

    Returns:
        (refined_score, factors_dict) where refined_score is capped at base ± 20
    """
    adjustment = 0
    factors = {"_base_score": base_score}

    # Example: Binding affinity refinement
    if binding_affinity_nm < 10:
        adjustment += 8
        factors["_ref_binding_affinity"] = 8

    # Cap adjustment at +/- 20
    adjustment = max(-20, min(20, adjustment))
    factors["_refinement_total"] = adjustment

    refined = base_score + adjustment
    return refined, factors
```

### Chat Response Formatting

Rich responses in chat use the Response Formatter:

```python
# backend/app/utils/response_formatter.py
response = {
    "content": "Markdown text with **bold** and *italic*",
    "tables": [{"columns": [...], "rows": [...]}],
    "charts": [{"type": "bar", "labels": [...], "datasets": [...]}],
    "pdf_url": "/api/reports/123/download",
    "suggestions": ["Follow-up question 1", "Follow-up question 2"]
}
```

## Key File Locations

### Backend

| Category | Files |
|----------|-------|
| **Agents (18 total)** | `backend/app/agents/*.py` |
| **LangGraph** | `backend/app/graph/workflow.py`, `nodes.py`, `state.py` |
| **Scoring** | `backend/app/scoring/composite_scorer.py`, `score_refiner.py`, `comparative_analyzer.py`, `scientific_extractor.py` |
| **Chat** | `backend/app/agents/master_agent.py`, `chat/conversation_manager.py` |
| **Market Analysis** | `backend/app/market/market_analyzer.py`, `competitor_tracker.py`, `segment_analyzer.py` |
| **Report Generation** | `backend/app/utils/html_pdf_generator.py`, `excel_generator.py` |
| **Report Archival** | `backend/app/archive/report_archive_manager.py` |
| **API Routes** | `backend/app/api/routes/*.py` (chat, search, export, reports, files) |
| **Vector Store** | `backend/app/vector_store/chroma_client.py`, `embeddings.py` |
| **Config** | `backend/app/config.py`, `backend/.env` |

### Frontend

| Category | Files |
|----------|-------|
| **Pages** | `frontend/src/pages/*.jsx` (Chat is default) |
| **Chat Components** | `frontend/src/components/chat/*.jsx` |
| **Search Components** | `frontend/src/components/search/*.jsx` |
| **Results Components** | `frontend/src/components/results/*.jsx` |
| **Layout** | `frontend/src/layouts/MainLayout.jsx`, `components/layout/*.jsx` |
| **State Management** | `frontend/src/store/index.js` |
| **API Client** | `frontend/src/services/api.js` |
| **Constants** | `frontend/src/utils/constants.js` (includes EY_AGENT_GROUPS mapping) |

## Critical Workflows

### Search Flow (Traditional Drug Search)

```
User enters drug name in /search
  → POST /api/search (with session_id for WebSocket)
  → LangGraph workflow executes 8 nodes
  → 18 agents run in parallel (asyncio.gather)
  → Evidence aggregated and deduplicated
  → Base 4D scoring
  → Enhanced analysis (comparative, scientific, market segment)
  → Score refinement (+/- 20 per dimension)
  → LLM synthesis (Gemini or Ollama fallback)
  → Results displayed in /results/:drug
  → Export PDF/Excel (auto-archived)
```

### Chat Flow (Conversational Interface)

```
User sends message in /chat
  → POST /api/chat/message
  → Master Agent classifies intent
  → Routes to appropriate EY Worker Group(s):
      - market_query → IQVIA Insights
      - patent_lookup → Patent Landscape
      - exim_data → EXIM Trade
      - clinical_trials → Clinical Trials
      - file_summary → Internal Knowledge (RAG)
      - web_search → Web Intelligence
      - report_generation → Full 18-agent pipeline
  → Response formatted with tables/charts/PDF links
  → Conversation auto-saved to data/conversations/
  → Frontend renders rich content
```

### Report Generation in Chat

```
User: "Generate a report for Metformin"
  → Master Agent intent: "report_generation"
  → Triggers full 18-agent pipeline
  → PDF generated via Playwright (dark theme)
  → Report auto-archived to data/reports/
  → Download URL returned in chat response
```

## Important Notes

### Chat is the Primary Interface

- Default route is `/chat`, not `/search`
- Search interface (`/search`) still available but secondary
- Chat can trigger full pipeline via "Generate report for [drug]" queries

### 7 EY Worker Agent Groups

Frontend displays 7 logical groups (collapsible to show 18 individual sources):
1. IQVIA Insights (MarketDataAgent + IQVIAPipelineAgent)
2. EXIM Trade (EXIMAgent + EXIMPipelineAgent)
3. Patent Landscape (PatentAgent + OrangeBookAgent)
4. Clinical Trials (ClinicalTrialsAgent + OpenFDAAgent + DailyMedAgent + RxNormAgent)
5. Internal Knowledge (InternalAgent + FileUploadAgent)
6. Web Intelligence (WebIntelligenceAgent + LiteratureAgent + SemanticScholarAgent + WebIntelligencePipelineAgent)
7. Report Generator (PDF + Excel generation)

Mapping defined in `frontend/src/utils/constants.js` under `EY_AGENT_GROUPS`.

### Score Refinement Impact

- Base scoring uses evidence counts, market estimates, competitor data
- Refinement adds +/- 20 points per dimension based on:
  - Scientific: Binding affinity, pathway relevance, publication quality, biomarkers
  - Market: Segment-specific unmet need, growth rate, competition
  - Competitive: Differentiation advantages, safety comparisons
  - Feasibility: Safety profile for development, biomarker availability, preclinical models
- Total refinement can shift overall score by ~20 points
- Transparency: All refinement factors stored in `factors` dict with `_ref_` prefix

### Data Persistence

- **Conversations**: Saved to `backend/data/conversations/{id}.json`
- **Reports**: Archived to `backend/data/reports/{id}.pdf` and `{id}.xlsx`
- **Metadata**: `backend/data/reports/reports_metadata.json`
- **Cache**: `backend/data/cache/{drug_name}.json` (7-day TTL)
- **Vector Store**: `backend/data/vector_db/` (ChromaDB)

### Internal Knowledge Base

6 pre-loaded documents in `backend/data/internal_docs/`:
1. Cardiovascular field insights
2. Biosimilar opportunity assessment
3. API sourcing (India/China) report
4. Oncology pipeline analysis (placeholder)
5. Respiratory therapeutics overview (placeholder)
6. CNS drug development report (placeholder)

Users can upload additional PDFs via chat interface, which get chunked and indexed in ChromaDB.

### Free Market Data

Platform works without paid APIs:
- **WHO Global Health Observatory** (free) - Disease burden, DALYs, mortality
- **Wikidata SPARQL** (free) - Global prevalence, patient populations
- **Europe PMC** (free) - Literature-derived epidemiology
- **Built-in estimates** - 50+ therapeutic areas with market size, CAGR, unmet need

Smart indication matching with 60+ medical abbreviations (T2DM → Type 2 Diabetes).

### WebSocket Progress Updates

Real-time agent status during searches:
- Connect to `ws://localhost:8000/ws/{session_id}`
- Receives updates: `agent_progress`, `workflow_status`, `complete`, `error`
- Frontend displays 7 EY Worker Agent groups with live status indicators

### Environment Variables

**Required:**
- `GEMINI_API_KEY` - Google Gemini API key (get free at https://aistudio.google.com/app/apikey)

**Optional:**
- `LENS_API_KEY` - Lens.org for enhanced patent search
- `PATENTSVIEW_API_KEY` - USPTO PatentsView (free, no key needed for basic access)
- `OLLAMA_BASE_URL` - Local Ollama instance for LLM fallback (default: http://localhost:11434)
- `USE_MONGODB` - Set to `true` to use MongoDB instead of JSON cache (default: false)

### Decision Rules Engine

Applies strategic pharma heuristics on top of agent data:
- **Whitespace Detection**: High disease burden + low trial activity
- **Biosimilar Opportunity**: Patent expiry within 2 years
- **Formulation Gap**: Oral drug vs injection-only competitors
- **Geographic Arbitrage**: High import volume + no local manufacturing
- **Unmet Need Alert**: Unmet need >75 + <3 competitors

Located in `backend/app/decision/rules_engine.py`.

## Troubleshooting

### Backend won't start
- Check `.env` file exists with `GEMINI_API_KEY`
- Verify Python 3.10+ installed
- Run `playwright install chromium` for PDF generation
- Check port 8000 is not already in use

### Frontend can't connect to backend
- Verify backend is running on port 8000
- Check `frontend/src/config/api.js` has correct API URL
- Look for CORS errors in browser console

### PDFs not generating
- Ensure Playwright Chromium is installed: `playwright install chromium`
- Check `backend/app/utils/html_pdf_generator.py` for template errors
- Verify sufficient disk space in `data/reports/`

### Agent failures
- Most agents fail gracefully (partial results returned)
- Check `backend/app/config.py` for rate limit settings
- Review logs for specific API errors (PubMed, ChEMBL, etc.)
- Some agents have optional API keys (Lens.org, Semantic Scholar)

### Chat responses are slow
- LLM synthesis can take 5-10 seconds with Gemini
- Full pipeline execution (18 agents) takes 20-40 seconds
- Consider using Ollama local LLM for faster responses (lower quality)

## Version History

- **v1.0.0** (Jan 2026) - Initial release with 5 agents
- **v2.0.0** (Feb 2026) - 15 agents, 4D composite scoring, free market data
- **v3.0.0** (Feb 2026) - Conversational AI transformation, Master Agent, 7 EY Worker Groups, chat-first UI
- **v3.1.0** (Feb 8, 2026) - Unified brain (18 agents), report archival, Excel export, conversation persistence

**Current Version:** 3.1.0
**Built for:** EY Techathon 6.0 Semi-Finals
