# CLAUDE.md

## Project Overview

AI-powered drug repurposing platform using LangGraph to orchestrate 15 specialized agents that search biomedical databases in parallel and score opportunities across 4 dimensions.

## Core Principles

1. **Read Before You Act**: Never speculate. Always read relevant files completely before making changes.
2. **Verify Before Major Changes**: Present plan and get user confirmation before significant modifications.
3. **Simplicity Above All**: Every change should impact minimal code. Avoid complex refactors.
4. **Evidence-Based**: Only make claims about code you've directly examined.
5. **Test Incrementally**: Fix one issue, verify it works, then move to the next.

## Commands

### Backend (FastAPI)

- `cd backend && venv\Scripts\activate` - Activate virtual environment (Windows)
- `pip install -r requirements.txt` - Install dependencies
- `uvicorn app.main:app --reload --port 8000` - Run dev server

### Frontend (React/Vite)

- `cd frontend && npm install` - Install dependencies
- `npm run dev` - Dev server (port 5173)
- `npm run build` - Production build
- `npm run lint` - ESLint check

## Architecture

### Backend

- `/app/agents/` - 15 agent implementations extending `BaseAgent`
- `/app/graph/` - LangGraph workflow, state, and node functions
- `/app/scoring/` - `EvidenceScorer`, `CompositeScorer` (4D scoring), `ComparativeAnalyzer`, `ScientificExtractor`
- `/app/market/` - `MarketAnalyzer`, `CompetitorTracker`, `MarketSegmentAnalyzer`
- `/app/api/routes/` - FastAPI endpoints

### Frontend

- `/src/components/common/` - Reusable UI components
- `/src/components/results/` - Opportunity cards, evidence panels, comparative panel, science panel
- `/src/components/search/` - Search box, agent status
- `/src/components/market/` - Market segment cards, competitor lists
- `/src/store/index.js` - Zustand state management
- `/src/pages/` - Dashboard, Search, Results, History, Settings

## Code Patterns

### Adding a New Agent

1. Create `app/agents/new_agent.py` extending `BaseAgent`
2. Implement `fetch_data()` and `process_data()` methods
3. Register in `app/graph/nodes.py` (`initialize_search` and `run_agents_parallel`)
4. Add rate limit config in `app/config.py`

### Agent Pattern

- All agents inherit from `BaseAgent`
- `fetch_data(drug_name, context)` - Fetch from external API
- `process_data(raw_data, drug_name)` - Transform to `EvidenceItem` objects

### EvidenceItem Fields

`source`, `indication`, `summary`, `relevance_score`, `url`, `publication_date`, `evidence_type`

## 4D Scoring Weights

- Scientific Evidence: 40%
- Market Opportunity: 25%
- Competitive Landscape: 20%
- Development Feasibility: 15%

## Enhanced Opportunity Analysis

Each opportunity includes:
- **Comparative Analysis**: Comparison vs standard of care (comparator drugs, advantages, side effect improvements)
- **Market Segment**: Target market segment with patient profile, unmet need, differentiators
- **Scientific Details**: Mechanism of action, target protein/gene, pathways, binding affinity, key publications

## API Endpoints

- `POST /api/search` - Main drug search
- `WS /ws/{session_id}` - Real-time agent progress
- `POST /api/export/pdf` - Generate PDF report
- `GET /health` - Health check

## Important Notes

- Copy `backend/.env.example` to `backend/.env` before running
- `GEMINI_API_KEY` is required; other API keys are optional
- `USE_MONGODB=false` uses JSON file caching (default)
- Frontend connects via WebSocket for real-time agent progress updates
