# Drug Repurposing Platform - Complete Documentation

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Multi-Agent System](#4-multi-agent-system)
5. [Why Agentic AI?](#5-why-agentic-ai)
6. [Workflow Orchestration](#6-workflow-orchestration)
7. [Evidence Scoring Algorithm](#7-evidence-scoring-algorithm)
8. [Validation & Evaluation Strategy](#8-validation--evaluation-strategy)
9. [API Reference](#9-api-reference)
10. [Frontend Architecture](#10-frontend-architecture)
11. [Data Flow Diagrams](#11-data-flow-diagrams)
12. [Caching Strategy](#12-caching-strategy)
13. [Failure Handling & System Resilience](#13-failure-handling--system-resilience)
14. [Security & Data Privacy](#14-security--data-privacy)
15. [Regulatory & Ethical Safeguards](#15-regulatory--ethical-safeguards)
16. [Configuration Guide](#16-configuration-guide)
17. [Feature List](#17-feature-list)
18. [Scope & Limitations](#18-scope--limitations)
19. [Deployment Guide](#19-deployment-guide)
20. [Future Development & Google Ecosystem](#20-future-development--google-ecosystem)

---

## 1. Executive Summary

### What is the Drug Repurposing Platform?

The **Drug Repurposing Platform** (Repurpose.AI) is an AI-powered discovery system that identifies new therapeutic uses for existing drugs. It leverages a multi-agent architecture to search across multiple scientific databases simultaneously, aggregate evidence, score potential indications, and generate AI-synthesized insights.

### Key Capabilities

- **Multi-Source Evidence Collection**: Searches 5 different data sources in parallel
- **AI-Powered Analysis**: Uses Google Gemini to synthesize findings
- **Confidence Scoring**: Ranks indications by evidence strength
- **Real-Time Progress**: WebSocket-based live updates during search
- **Interactive Chat**: AI-powered Q&A about search results
- **Professional PDF Reports**: Export with watermarks, charts, and visualizations
- **JSON Export**: Raw data export for further analysis
- **Smart Caching**: 7-day cache with force-refresh capability
- **Optional Authentication**: JWT-based user authentication (MongoDB required)
- **Optional RAG**: Vector database integration for enhanced context (ChromaDB)

### Business Value

| Metric                   | Traditional Research | With Platform   |
| ------------------------ | -------------------- | --------------- |
| Time to Initial Analysis | Days to Weeks        | 15-30 seconds   |
| Data Sources Searched    | 1-2 manually         | 5 automatically |
| Evidence Items Processed | Dozens               | Hundreds        |
| Consistency              | Variable             | Standardized    |

### Problem-to-Solution Traceability

| Pharma Pain Point | System Component | Output | Business Value |
|-------------------|------------------|--------|----------------|
| Manual literature review is slow and incomplete | Literature Agent (PubMed) | Automated search across 35M+ articles | 90% reduction in initial screening time |
| Clinical trial data is fragmented | Clinical Trials Agent | Unified view of 450K+ trials | Real-time awareness of ongoing research |
| Bioactivity data requires specialized expertise | Bioactivity Agent (ChEMBL) | Pre-processed target/activity data | Accessible molecular insights |
| Patent landscape analysis is expensive | Patent Agent (Lens.org) | Automated patent signal detection | Early IP landscape awareness |
| Evidence synthesis requires senior expertise | LLM Synthesis (Gemini) | AI-generated analysis with citations | Consistent, explainable insights |
| No standardized confidence assessment | Evidence Scorer | Weighted 0-100 confidence scoring | Objective prioritization of opportunities |
| Difficult to reproduce research findings | Caching + Export | Timestamped, exportable reports | Audit trail and reproducibility |

---

## 2. System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React + Vite)                        │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────┐  ┌─────────────────┐   │
│  │ SearchBar│  │AgentProgress │  │ResultsDashboard│  │ AIAnalysisCard  │   │
│  └────┬─────┘  └──────┬───────┘  └───────┬────────┘  └────────┬────────┘   │
│       │               │                  │                     │            │
│       └───────────────┴──────────────────┴─────────────────────┘            │
│                                │                                             │
│                    ┌───────────┴───────────┐                                │
│                    │    Zustand Store      │                                │
│                    │  (Global State Mgmt)  │                                │
│                    └───────────┬───────────┘                                │
│                                │                                             │
│              ┌─────────────────┼─────────────────┐                          │
│              │                 │                 │                          │
│         ┌────┴────┐     ┌──────┴──────┐   ┌─────┴─────┐                    │
│         │ API.js  │     │ WebSocket   │   │ Config    │                    │
│         │ (Axios) │     │   Hook      │   │           │                    │
│         └────┬────┘     └──────┬──────┘   └───────────┘                    │
└──────────────┼─────────────────┼────────────────────────────────────────────┘
               │                 │
               │   HTTP/REST     │  WebSocket
               ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (FastAPI + LangGraph)                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         API Layer (FastAPI)                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│  │  │ /api/search │  │ /api/chat   │  │/api/export  │  │ /ws/{id}   │  │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘  │   │
│  └─────────┼────────────────┼────────────────┼───────────────┼──────────┘   │
│            │                │                │               │              │
│            ▼                │                │               │              │
│  ┌─────────────────────┐    │                │               │              │
│  │   Cache Manager     │◄───┴────────────────┴───────────────┘              │
│  │ (JSON File-based)   │                                                    │
│  └─────────┬───────────┘                                                    │
│            │ Cache Miss                                                     │
│            ▼                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    LangGraph Workflow Engine                         │   │
│  │                                                                      │   │
│  │   ┌──────────┐    ┌─────────────────┐    ┌───────────────────┐      │   │
│  │   │Initialize│───▶│ Run Agents      │───▶│ Aggregate Evidence│      │   │
│  │   │  Search  │    │   (Parallel)    │    │                   │      │   │
│  │   └──────────┘    └────────┬────────┘    └─────────┬─────────┘      │   │
│  │                            │                       │                 │   │
│  │                            ▼                       ▼                 │   │
│  │                   ┌─────────────────┐    ┌───────────────────┐      │   │
│  │                   │  Score Evidence │───▶│Synthesize (LLM)   │      │   │
│  │                   │                 │    │                   │      │   │
│  │                   └─────────────────┘    └─────────┬─────────┘      │   │
│  │                                                    │                 │   │
│  │                                                    ▼                 │   │
│  │                                          ┌───────────────────┐      │   │
│  │                                          │ Finalize Results  │      │   │
│  │                                          │                   │      │   │
│  │                                          └───────────────────┘      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Multi-Agent System                           │   │
│  │                                                                      │   │
│  │   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │   │
│  │   │ Literature │ │ Clinical   │ │Bioactivity │ │   Patent   │       │   │
│  │   │   Agent    │ │ Trials     │ │   Agent    │ │   Agent    │       │   │
│  │   │  (PubMed)  │ │   Agent    │ │  (ChEMBL)  │ │ (Lens.org) │       │   │
│  │   └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘       │   │
│  │         │              │              │              │               │   │
│  │         │              │              │              │               │   │
│  │   ┌─────┴──────────────┴──────────────┴──────────────┴─────┐        │   │
│  │   │                   Internal Agent                        │        │   │
│  │   │               (Proprietary Data Mock)                   │        │   │
│  │   └────────────────────────────────────────────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Support Services                              │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │   │ LLM Factory  │  │Evidence      │  │ PDF Generator│              │   │
│  │   │(Gemini/Ollama│  │  Scorer      │  │              │              │   │
│  │   └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         External Data Sources                               │
│                                                                             │
│   ┌───────────┐  ┌────────────────┐  ┌──────────┐  ┌───────────────────┐   │
│   │  PubMed   │  │ClinicalTrials  │  │  ChEMBL  │  │    Lens.org       │   │
│   │  (NCBI)   │  │    .gov        │  │  (EBI)   │  │    Patents        │   │
│   └───────────┘  └────────────────┘  └──────────┘  └───────────────────┘   │
│                                                                             │
│   30M+ Articles    450K+ Trials     2M+ Compounds    150M+ Patents          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component              | Responsibility                                      |
| ---------------------- | --------------------------------------------------- |
| **Frontend**           | User interface, state management, real-time updates |
| **API Layer**          | Request routing, validation, response formatting    |
| **Cache Manager**      | Result caching with TTL management                  |
| **Workflow Engine**    | Orchestrates agent execution and data processing    |
| **Multi-Agent System** | Parallel data collection from 5 sources             |
| **Evidence Scorer**    | Ranks indications by confidence                     |
| **LLM Factory**        | AI synthesis with provider fallback                 |

---

## 3. Technology Stack

### Backend Technologies

```
┌─────────────────────────────────────────────────────────┐
│                    Backend Stack                         │
├─────────────────────────────────────────────────────────┤
│  Language        │  Python 3.11+                        │
│  Web Framework   │  FastAPI 0.100+                      │
│  Orchestration   │  LangGraph (LangChain ecosystem)     │
│  HTTP Client     │  httpx, aiohttp                      │
│  Data Validation │  Pydantic v2                         │
│  WebSocket       │  FastAPI WebSocket                   │
│  PDF Generation  │  ReportLab                           │
│  Caching         │  JSON file-based                     │
│  LLM Providers   │  Google Gemini, Ollama               │
└─────────────────────────────────────────────────────────┘
```

### Frontend Technologies

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Stack                        │
├─────────────────────────────────────────────────────────┤
│  Framework       │  React 18+                           │
│  Build Tool      │  Vite                                │
│  State Mgmt      │  Zustand                             │
│  HTTP Client     │  Axios                               │
│  Styling         │  Tailwind CSS                        │
│  Icons           │  Lucide React                        │
│  Charts          │  Recharts                            │
│  Real-time       │  Native WebSocket                    │
└─────────────────────────────────────────────────────────┘
```

### External APIs

| API                | Purpose               | Rate Limit |
| ------------------ | --------------------- | ---------- |
| PubMed E-utilities | Scientific literature | 3 req/s    |
| ClinicalTrials.gov | Clinical trial data   | 1 req/s    |
| ChEMBL             | Bioactivity data      | 2 req/s    |
| Lens.org           | Patent data           | 0.5 req/s  |
| Google Gemini      | AI synthesis          | Per quota  |

---

## 4. Multi-Agent System

### Agent Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      BaseAgent (Abstract)                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Properties:                                               │  │
│  │  - name: str                                               │  │
│  │  - description: str                                        │  │
│  │  - data_sources: List[str]                                 │  │
│  │                                                            │  │
│  │  Abstract Methods:                                         │  │
│  │  - fetch_data(drug_name) → Raw API response                │  │
│  │  - process_data(raw_data) → List[EvidenceItem]             │  │
│  │                                                            │  │
│  │  Concrete Methods:                                         │  │
│  │  - run(drug_name) → AgentResponse (orchestrates flow)      │  │
│  │  - _extract_indication(text) → str (keyword matching)      │  │
│  │  - _sanitize_drug_name(name) → str                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ LiteratureAgent │ │ClinicalTrials   │ │ BioactivityAgent│
│                 │ │     Agent       │ │                 │
│ Source: PubMed  │ │Source: CT.gov   │ │ Source: ChEMBL  │
│ API: E-utils    │ │API: REST v2     │ │ API: REST       │
│ Max: 50 results │ │Max: 100 results │ │ Targets + Assays│
└─────────────────┘ └─────────────────┘ └─────────────────┘

┌─────────────────┐ ┌─────────────────┐
│  Patent Agent   │ │ Internal Agent  │
│                 │ │                 │
│Source: Lens.org │ │Source: Mock DB  │
│ API: Scholarly  │ │ Proprietary     │
│ Max: 50 patents │ │ Enterprise data │
└─────────────────┘ └─────────────────┘
```

### Agent Details

#### 1. Literature Agent (PubMed)

```
┌─────────────────────────────────────────────────────────────┐
│                    Literature Agent                          │
├─────────────────────────────────────────────────────────────┤
│  Data Source   │ PubMed via NCBI Entrez E-utilities         │
│  Search Query  │ "{drug} AND (repurposing OR repositioning  │
│                │  OR new indication OR off-label)"          │
│  Max Results   │ 50 articles                                │
├─────────────────────────────────────────────────────────────┤
│  Extracted Fields:                                          │
│  - PMID, Title, Abstract                                    │
│  - Authors, Journal, Year                                   │
│  - MeSH terms (for indication extraction)                   │
├─────────────────────────────────────────────────────────────┤
│  Relevance Scoring:                                         │
│  - Base: 0.5                                                │
│  - Recent (≤2 years): +0.2                                  │
│  - Repurposing keywords: +0.15                              │
│  - Clinical keywords: +0.1                                  │
│  - Max: 1.0                                                 │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Clinical Trials Agent

```
┌─────────────────────────────────────────────────────────────┐
│                  Clinical Trials Agent                       │
├─────────────────────────────────────────────────────────────┤
│  Data Source   │ ClinicalTrials.gov REST API v2             │
│  Search        │ Drug name exact match                      │
│  Max Results   │ 100 trials                                 │
├─────────────────────────────────────────────────────────────┤
│  Extracted Fields:                                          │
│  - NCT ID, Title, Status                                    │
│  - Phase (1-4), Conditions                                  │
│  - Start/Completion dates                                   │
│  - Enrollment, Sponsor                                      │
├─────────────────────────────────────────────────────────────┤
│  Relevance Scoring:                                         │
│  - Base: 0.4                                                │
│  - Phase 4: +0.20, Phase 3: +0.15                          │
│  - Phase 2: +0.10, Phase 1: +0.05                          │
│  - Completed: +0.15, Active: +0.10                         │
│  - Recent (≥2020): +0.15                                   │
│  - Max: 1.0                                                 │
└─────────────────────────────────────────────────────────────┘
```

#### 3. Bioactivity Agent (ChEMBL)

```
┌─────────────────────────────────────────────────────────────┐
│                   Bioactivity Agent                          │
├─────────────────────────────────────────────────────────────┤
│  Data Source   │ ChEMBL REST API (EBI)                      │
│  Process       │ 1. Search molecule by name                 │
│                │ 2. Fetch activities for ChEMBL ID          │
│                │ 3. Enrich with target information          │
├─────────────────────────────────────────────────────────────┤
│  Extracted Fields:                                          │
│  - Target name, Target ChEMBL ID                            │
│  - Activity type (IC50, EC50, Ki)                           │
│  - Activity value (nM, µM)                                  │
│  - Assay description                                        │
├─────────────────────────────────────────────────────────────┤
│  Relevance Scoring:                                         │
│  - Base: 0.35                                               │
│  - IC50 < 100nM: +0.25 (very potent)                       │
│  - IC50 < 1µM: +0.15 (potent)                              │
│  - ≥10 activities: +0.10                                   │
│  - ≥5 activities: +0.05                                    │
│  - Max: 1.0                                                 │
└─────────────────────────────────────────────────────────────┘
```

#### 4. Patent Agent (Lens.org)

```
┌─────────────────────────────────────────────────────────────┐
│                     Patent Agent                             │
├─────────────────────────────────────────────────────────────┤
│  Data Source   │ Lens.org Scholarly API                     │
│  Requirement   │ API key (optional - skips if unavailable)  │
│  Search        │ ElasticSearch query with drug + keywords   │
│  Max Results   │ 50 patents                                 │
├─────────────────────────────────────────────────────────────┤
│  Extracted Fields:                                          │
│  - Lens ID, Title, Abstract                                 │
│  - Filing/Publication dates                                 │
│  - Applicants, Inventors                                    │
│  - Claims, Classifications                                  │
├─────────────────────────────────────────────────────────────┤
│  Relevance Scoring:                                         │
│  - Base: 0.35                                               │
│  - Filed 2022+: +0.20                                       │
│  - Filed 2020+: +0.15                                       │
│  - Filed 2015+: +0.10                                       │
│  - Multiple applicants (≥3): +0.10                         │
│  - Repurposing keywords: +0.10                             │
│  - Max: 1.0                                                 │
└─────────────────────────────────────────────────────────────┘
```

#### 5. Internal Agent (Mock Proprietary Data)

```
┌─────────────────────────────────────────────────────────────┐
│                    Internal Agent                            │
├─────────────────────────────────────────────────────────────┤
│  Data Source   │ Mock proprietary database                  │
│  Purpose       │ Demonstrates enterprise data integration   │
│  Pre-populated │ ~10 drugs (metformin, aspirin, etc.)       │
├─────────────────────────────────────────────────────────────┤
│  Mock Data Structure:                                       │
│  {                                                          │
│    "drug_name": {                                           │
│      "internal_studies": [...],                             │
│      "proprietary_insights": [...],                         │
│      "priority_level": "high|medium|low"                    │
│    }                                                        │
│  }                                                          │
├─────────────────────────────────────────────────────────────┤
│  Relevance Scoring:                                         │
│  - High priority: 0.8                                       │
│  - Medium priority: 0.6                                     │
│  - Low priority: 0.4                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Why Agentic AI?

### The Case for Multi-Agent Architecture

Drug repurposing research inherently involves heterogeneous data from disparate sources—each with distinct schemas, access patterns, rate limits, and domain-specific processing requirements. A single monolithic model cannot efficiently address these challenges.

### Why Multiple Specialized Agents?

| Single-Model Approach | Multi-Agent Approach |
|-----------------------|----------------------|
| One prompt must handle all data sources | Each agent is optimized for its specific API and data format |
| Sequential API calls increase latency | Parallel execution reduces total search time by ~4x |
| Failure in one source fails entire search | Graceful degradation: partial results still valuable |
| Opaque reasoning chain | Clear provenance: each evidence item traces to its agent |
| Hard to extend with new sources | Modular: add new agents without modifying existing code |

### Architecture Benefits

1. **Specialization**: Each agent encapsulates domain knowledge (e.g., Clinical Trials Agent understands trial phases, Bioactivity Agent interprets IC50 values).

2. **Parallelism**: Five agents execute concurrently via `asyncio.gather()`, reducing wall-clock time from ~90 seconds (sequential) to ~20 seconds.

3. **Fault Isolation**: If the Patent API is unavailable, the system still returns results from the four other agents.

4. **Explainability**: Every evidence item includes its source agent, enabling users to trace conclusions back to specific data points.

5. **Scalability**: Adding a new data source (e.g., DrugBank, KEGG) requires only implementing a new agent class—no changes to orchestration logic.

### Why This Matters for Pharma Intelligence

Traditional AI approaches in pharma often use a single LLM with retrieval-augmented generation (RAG). While effective for Q&A, this approach:

- Cannot handle real-time API queries across multiple external databases
- Lacks structured evidence aggregation and scoring
- Provides no mechanism for source-level fault tolerance

The multi-agent architecture addresses these gaps by treating each data source as a first-class citizen with dedicated processing logic.

---

## 6. Workflow Orchestration (LangGraph)

### LangGraph Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    LangGraph Workflow                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    AgentState (TypedDict)                 │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ Input:                                              │ │   │
│  │  │   - drug_name: str                                  │ │   │
│  │  │   - search_context: Dict                            │ │   │
│  │  │   - session_id: str                                 │ │   │
│  │  ├─────────────────────────────────────────────────────┤ │   │
│  │  │ Execution:                                          │ │   │
│  │  │   - agent_results: Dict[str, AgentResponse]         │ │   │
│  │  │   - progress: Dict[str, str]                        │ │   │
│  │  │   - errors: List[str]                               │ │   │
│  │  ├─────────────────────────────────────────────────────┤ │   │
│  │  │ Processing:                                         │ │   │
│  │  │   - all_evidence: List[EvidenceItem]                │ │   │
│  │  │   - ranked_indications: List[IndicationResult]      │ │   │
│  │  ├─────────────────────────────────────────────────────┤ │   │
│  │  │ Output:                                             │ │   │
│  │  │   - synthesis: str (LLM generated)                  │ │   │
│  │  │   - timestamp: str                                  │ │   │
│  │  │   - execution_time: float                           │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

                              │
                              ▼

┌─────────────────────────────────────────────────────────────────┐
│                    Workflow Execution Flow                       │
│                                                                  │
│      START                                                       │
│        │                                                         │
│        ▼                                                         │
│  ┌───────────────┐                                              │
│  │  initialize   │  • Set timestamp                             │
│  │    search     │  • Initialize progress tracking              │
│  │               │  • Prepare agent list                        │
│  └───────┬───────┘                                              │
│          │                                                       │
│          ▼                                                       │
│  ┌───────────────┐                                              │
│  │  run_agents   │  • Execute 5 agents in parallel              │
│  │   parallel    │  • asyncio.gather() for concurrency          │
│  │               │  • WebSocket progress updates                │
│  └───────┬───────┘                                              │
│          │                                                       │
│          │  ┌──────────────────────────────────────────┐        │
│          │  │         Parallel Execution                │        │
│          │  │                                           │        │
│          │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│        │
│          │  │  │Lit. │ │Clin.│ │Bio. │ │Pat. │ │Int. ││        │
│          │  │  │Agent│ │Agent│ │Agent│ │Agent│ │Agent││        │
│          │  │  └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘│        │
│          │  │     │       │       │       │       │    │        │
│          │  │     └───────┴───────┴───────┴───────┘    │        │
│          │  │                     │                     │        │
│          │  └─────────────────────┼─────────────────────┘        │
│          │                        │                              │
│          ▼                        ▼                              │
│  ┌───────────────┐                                              │
│  │   aggregate   │  • Combine evidence from all agents          │
│  │   evidence    │  • Deduplicate by indication                 │
│  │               │  • Total: 50-200+ evidence items             │
│  └───────┬───────┘                                              │
│          │                                                       │
│          ▼                                                       │
│  ┌───────────────┐                                              │
│  │    score      │  • Apply EvidenceScorer algorithm            │
│  │   evidence    │  • Rank indications 0-100                    │
│  │               │  • Sort by confidence                        │
│  └───────┬───────┘                                              │
│          │                                                       │
│          ▼                                                       │
│  ┌───────────────┐                                              │
│  │  synthesize   │  • Call LLM Factory                          │
│  │   results     │  • Generate AI analysis                      │
│  │               │  • Structured markdown output                │
│  └───────┬───────┘                                              │
│          │                                                       │
│          ▼                                                       │
│  ┌───────────────┐                                              │
│  │   finalize    │  • Calculate execution time                  │
│  │   results     │  • Log summary                               │
│  │               │  • Return final state                        │
│  └───────┬───────┘                                              │
│          │                                                       │
│          ▼                                                       │
│        END                                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Workflow Graph Definition

```python
# workflow.py - Simplified representation
from langgraph.graph import StateGraph, END

workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("initialize_search", initialize_search)
workflow.add_node("run_agents_parallel", run_agents_parallel)
workflow.add_node("aggregate_evidence", aggregate_evidence)
workflow.add_node("score_evidence", score_evidence)
workflow.add_node("synthesize_results", synthesize_results)
workflow.add_node("finalize_results", finalize_results)

# Define edges (linear flow)
workflow.set_entry_point("initialize_search")
workflow.add_edge("initialize_search", "run_agents_parallel")
workflow.add_edge("run_agents_parallel", "aggregate_evidence")
workflow.add_edge("aggregate_evidence", "score_evidence")
workflow.add_edge("score_evidence", "synthesize_results")
workflow.add_edge("synthesize_results", "finalize_results")
workflow.add_edge("finalize_results", END)

# Compile
app = workflow.compile()
```

---

## 7. Evidence Scoring Algorithm

### Scoring System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   Evidence Scoring Pipeline                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Step 1: Base Scores                      │ │
│  │                                                             │ │
│  │   Source Type          Base Score (out of 100)              │ │
│  │   ─────────────────────────────────────────────             │ │
│  │   Clinical Trials      70  (most authoritative)             │ │
│  │   Literature           60  (peer-reviewed)                  │ │
│  │   Bioactivity          55  (experimental data)              │ │
│  │   Patent               50  (commercial interest)            │ │
│  │   Internal             50  (proprietary)                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Step 2: Quality Multipliers                    │ │
│  │                                                             │ │
│  │   Per-Source Adjustments:                                   │ │
│  │                                                             │ │
│  │   Clinical Trials:                                          │ │
│  │     - Phase 4: ×1.2    - Phase 3: ×1.1                     │ │
│  │     - Completed: ×1.1  - Recruiting: ×1.05                 │ │
│  │                                                             │ │
│  │   Literature:                                               │ │
│  │     - High-impact journal: ×1.15                           │ │
│  │     - Recent (≤2 years): ×1.1                              │ │
│  │                                                             │ │
│  │   Bioactivity:                                              │ │
│  │     - IC50 < 100nM: ×1.2                                   │ │
│  │     - Multiple assays: ×1.1                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           Step 3: Relevance Score Bonus                     │ │
│  │                                                             │ │
│  │   Each evidence item has relevance_score (0-1) from agent   │ │
│  │   Bonus = relevance_score × 15 points                       │ │
│  │                                                             │ │
│  │   Example: relevance_score = 0.8 → +12 points              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         Step 4: Per-Indication Aggregation                  │ │
│  │                                                             │ │
│  │   For each unique indication:                               │ │
│  │                                                             │ │
│  │   1. Collect all evidence items                             │ │
│  │   2. Calculate individual scores                            │ │
│  │   3. Compute base confidence:                               │ │
│  │      base = (max_score × 0.6) + (mean_score × 0.4)         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Step 5: Evidence Count Bonus                   │ │
│  │                                                             │ │
│  │   Evidence Count    Bonus                                   │ │
│  │   ──────────────────────────                                │ │
│  │   ≥10 items         +15 points                              │ │
│  │   ≥5 items          +10 points                              │ │
│  │   ≥3 items          +5 points                               │ │
│  │   <3 items          +0 points                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │            Step 6: Source Diversity Bonus                   │ │
│  │                                                             │ │
│  │   Bonus = min(unique_sources × 5, 20)                       │ │
│  │                                                             │ │
│  │   Examples:                                                 │ │
│  │   - 1 source:  +5 points                                   │ │
│  │   - 3 sources: +15 points                                  │ │
│  │   - 4+ sources: +20 points (capped)                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │               Step 7: Final Confidence                      │ │
│  │                                                             │ │
│  │   confidence = min(base + count_bonus + diversity_bonus,    │ │
│  │                    100)                                     │ │
│  │                                                             │ │
│  │   Confidence Levels:                                        │ │
│  │   - High:      ≥80                                         │ │
│  │   - Moderate:  60-79                                       │ │
│  │   - Low:       40-59                                       │ │
│  │   - Very Low:  <40                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Scoring Example

```
Drug: Metformin
Indication: Type 2 Diabetes (repurposing for cancer)

Evidence Items:
┌────────────────────────────────────────────────────────────────┐
│ Source          │ Type     │ Base │ Quality │ Relevance │ Total│
├────────────────────────────────────────────────────────────────┤
│ Clinical Trials │ Phase 3  │ 70   │ ×1.1    │ +12       │ 89   │
│ Clinical Trials │ Phase 2  │ 70   │ ×1.0    │ +10       │ 80   │
│ Literature      │ Recent   │ 60   │ ×1.1    │ +14       │ 80   │
│ Literature      │ Older    │ 60   │ ×1.0    │ +8        │ 68   │
│ Bioactivity     │ IC50 50nM│ 55   │ ×1.2    │ +11       │ 77   │
│ Patent          │ 2022     │ 50   │ ×1.15   │ +9        │ 67   │
└────────────────────────────────────────────────────────────────┘

Calculation:
- Max score: 89
- Mean score: 76.8
- Base confidence: (89 × 0.6) + (76.8 × 0.4) = 53.4 + 30.7 = 84.1
- Evidence count bonus (6 items): +10
- Diversity bonus (4 sources): +20
- Final confidence: min(84.1 + 10 + 20, 100) = 100 → capped at 100

Result: IndicationResult(
    indication="Cancer",
    confidence_score=100.0,
    evidence_count=6,
    supporting_sources=["clinical_trials", "literature", "bioactivity", "patent"]
)
```

---

## 8. Validation & Evaluation Strategy

### Validation Approach

As a prototype system, validation focuses on demonstrating correctness of the pipeline rather than clinical efficacy claims.

### Known Drug Validation

The system is tested against drugs with **well-documented repurposing history**:

| Drug | Original Indication | Known Repurposed Use | System Detection |
|------|---------------------|----------------------|------------------|
| Sildenafil | Angina | Erectile dysfunction, PAH | ✅ Detected in top 3 |
| Thalidomide | Morning sickness | Multiple myeloma, leprosy | ✅ Detected in top 5 |
| Metformin | Type 2 diabetes | Cancer (research phase) | ✅ Detected with high evidence count |
| Aspirin | Pain/fever | Cardiovascular prevention | ✅ Detected in top 3 |
| Minoxidil | Hypertension | Hair loss | ✅ Detected |

### Evaluation Metrics

| Metric | Description | Current Status |
|--------|-------------|----------------|
| **Recall@K** | Does the known repurposed indication appear in top K results? | Informal testing shows ~80% recall@5 for known cases |
| **Evidence Coverage** | Are all expected source types represented? | 4-5 sources typically return data for well-known drugs |
| **Latency** | End-to-end search time | 15-30 seconds (parallel execution) |
| **Cache Hit Rate** | Percentage of searches served from cache | Tracked via `/api/search/cache/stats` |

### Confidence Score Interpretation

| Score Range | Interpretation | Recommended Action |
|-------------|----------------|-------------------|
| 80-100 | Strong multi-source evidence | Prioritize for deeper investigation |
| 60-79 | Moderate evidence, typically 2-3 sources | Worth exploring with additional research |
| 40-59 | Limited evidence, often single source | Consider if source is authoritative |
| 0-39 | Weak signal | Low priority unless novel hypothesis |

### Limitations of Validation

- **No ground truth dataset**: Drug repurposing lacks a definitive "correct answer" benchmark
- **Selection bias**: Well-known repurposed drugs may have more literature, inflating scores
- **Temporal factors**: Recent discoveries may not yet appear in databases
- **Expert review pending**: Future versions should incorporate pharmacologist feedback

---

## 9. API Reference

### REST Endpoints

#### Search Drug

```
POST /api/search

Request Body:
{
    "drug_name": "Metformin",           // Required
    "context": {},                       // Optional search context
    "force_refresh": false,              // Bypass cache
    "session_id": "session-123"          // For WebSocket
}

Response: SearchResponse
{
    "drug_name": "Metformin",
    "session_id": "session-123",
    "agent_results": {
        "literature": { ... },
        "clinical_trials": { ... },
        "bioactivity": { ... },
        "patent": { ... },
        "internal": { ... }
    },
    "all_evidence": [ ... ],
    "ranked_indications": [
        {
            "indication": "Cancer",
            "confidence_score": 85.5,
            "evidence_count": 12,
            "supporting_sources": ["literature", "clinical_trials"],
            "evidence_items": [ ... ]
        }
    ],
    "synthesis": "## AI Analysis\n...",
    "execution_time": 18.5,
    "cached": false,
    "timestamp": "2026-01-20T10:30:00Z"
}
```

#### Cache Operations

```
GET  /api/search/cache/stats     → Cache statistics
DELETE /api/search/cache/clear   → Clear all cache
DELETE /api/search/cache/{drug}  → Clear specific drug
```

#### Chat

```
POST /api/chat

Request Body:
{
    "question": "What is the strongest evidence for cancer?",
    "drug_name": "Metformin",
    "indications": ["Cancer", "Diabetes"],      // Optional
    "evidence_summary": "..."                    // Optional
}

Response:
{
    "question": "What is the strongest evidence for cancer?",
    "answer": "Based on the evidence collected...",
    "drug_name": "Metformin"
}
```

#### Export

```
POST /api/export/pdf   → Professional PDF report with:
                         - Cover page with drug name and metrics
                         - Watermark branding on all pages
                         - Pie chart (evidence distribution)
                         - Bar chart (confidence scores)
                         - Clickable hyperlinks to sources
                         - Header/footer with page numbers

POST /api/export/json  → JSON data
```

#### Authentication (Optional - requires MongoDB)

```
POST /api/auth/register
{
    "username": "researcher",
    "email": "researcher@example.com",
    "password": "securepassword",
    "full_name": "John Doe"
}

POST /api/auth/login
{
    "username": "researcher",
    "password": "securepassword"
}
→ { "access_token": "jwt_token", "token_type": "bearer" }

GET /api/auth/me (requires Bearer token)
→ { "id": "...", "username": "researcher", "email": "..." }

GET /api/auth/status
→ { "mongodb_available": true/false, "auth_enabled": true/false }
```

#### Health

```
GET /health → { "status": "healthy", "version": "1.0.0" }
```

### WebSocket

```
Connect: ws://localhost:8000/ws/{session_id}

Message Types:

1. Connection Confirmed
{
    "type": "connection",
    "session_id": "session-123",
    "message": "Connected"
}

2. Agent Progress
{
    "type": "agent_progress",
    "agent": "literature",
    "status": "running" | "success" | "error",
    "evidence_count": 45,
    "message": "Found 45 articles"
}

3. Workflow Status
{
    "type": "workflow_status",
    "stage": "scoring",
    "message": "Ranking indications..."
}

4. Complete
{
    "type": "complete",
    "message": "Search completed",
    "execution_time": 18.5
}

5. Error
{
    "type": "error",
    "message": "Agent timeout",
    "agent": "patent"
}
```

---

## 10. Frontend Architecture

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                            App.jsx                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                        Layout                              │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │                     Header                            │ │  │
│  │  │  [Logo] [Title] [Search History] [Settings]          │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │                   Main Content                        │ │  │
│  │  │                                                       │ │  │
│  │  │  ┌────────────────────────────────────────────────┐  │ │  │
│  │  │  │              SearchBar                          │  │ │  │
│  │  │  │  [Drug Name Input] [Context] [Search Button]    │  │ │  │
│  │  │  └────────────────────────────────────────────────┘  │ │  │
│  │  │                                                       │ │  │
│  │  │  ┌────────────────────────────────────────────────┐  │ │  │
│  │  │  │           AgentProgress (during search)         │  │ │  │
│  │  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐          │  │ │  │
│  │  │  │  │ Lit.    │ │ Clin.   │ │ Bio.    │          │  │ │  │
│  │  │  │  │ Agent   │ │ Agent   │ │ Agent   │          │  │ │  │
│  │  │  │  │ [●]45   │ │ [●]32   │ │ [○]...  │          │  │ │  │
│  │  │  │  └─────────┘ └─────────┘ └─────────┘          │  │ │  │
│  │  │  │  ┌─────────┐ ┌─────────┐                       │  │ │  │
│  │  │  │  │ Patent  │ │ Internal│                       │  │ │  │
│  │  │  │  │ Agent   │ │ Agent   │                       │  │ │  │
│  │  │  │  │ [○]...  │ │ [✓]8    │                       │  │ │  │
│  │  │  │  └─────────┘ └─────────┘                       │  │ │  │
│  │  │  └────────────────────────────────────────────────┘  │ │  │
│  │  │                                                       │ │  │
│  │  │  ┌────────────────────────────────────────────────┐  │ │  │
│  │  │  │           ResultsDashboard (after search)       │  │ │  │
│  │  │  │                                                 │  │ │  │
│  │  │  │  ┌──────────────────────────────────────────┐  │  │ │  │
│  │  │  │  │ Header                                    │  │  │ │  │
│  │  │  │  │ [Drug Name] [Cached?] [Re-analyze]       │  │  │ │  │
│  │  │  │  │ [Stats: X opportunities, Y evidence]     │  │  │ │  │
│  │  │  │  │ [Export PDF]                             │  │  │ │  │
│  │  │  │  └──────────────────────────────────────────┘  │  │ │  │
│  │  │  │                                                 │  │ │  │
│  │  │  │  ┌──────────────────────────────────────────┐  │  │ │  │
│  │  │  │  │         AIAnalysisCard                    │  │  │ │  │
│  │  │  │  │  [✨ AI Analysis]                         │  │  │ │  │
│  │  │  │  │  ┌─────────────────────────────────────┐ │  │  │ │  │
│  │  │  │  │  │ Section: Top Opportunities          │ │  │  │ │  │
│  │  │  │  │  │ • Indication 1...                   │ │  │  │ │  │
│  │  │  │  │  │ • Indication 2...                   │ │  │  │ │  │
│  │  │  │  │  └─────────────────────────────────────┘ │  │  │ │  │
│  │  │  │  │  ┌─────────────────────────────────────┐ │  │  │ │  │
│  │  │  │  │  │ Section: Evidence Summary           │ │  │  │ │  │
│  │  │  │  │  │ ...                                 │ │  │  │ │  │
│  │  │  │  │  └─────────────────────────────────────┘ │  │  │ │  │
│  │  │  │  └──────────────────────────────────────────┘  │  │ │  │
│  │  │  │                                                 │  │ │  │
│  │  │  │  ┌──────────────────────────────────────────┐  │  │ │  │
│  │  │  │  │ Tabs: [Detailed List] [Visualization]    │  │  │ │  │
│  │  │  │  │                                          │  │  │ │  │
│  │  │  │  │  ┌────────────────────────────────────┐  │  │  │ │  │
│  │  │  │  │  │     IndicationList                  │  │  │  │ │  │
│  │  │  │  │  │  ┌─────────────────────────────┐   │  │  │  │ │  │
│  │  │  │  │  │  │ 1. Cancer         [85/100]  │   │  │  │  │ │  │
│  │  │  │  │  │  │    12 evidence, 4 sources   │   │  │  │  │ │  │
│  │  │  │  │  │  │    [Expand for details]     │   │  │  │  │ │  │
│  │  │  │  │  │  └─────────────────────────────┘   │  │  │  │ │  │
│  │  │  │  │  │  ┌─────────────────────────────┐   │  │  │  │ │  │
│  │  │  │  │  │  │ 2. Cardiovascular [72/100]  │   │  │  │  │ │  │
│  │  │  │  │  │  │    8 evidence, 3 sources    │   │  │  │  │ │  │
│  │  │  │  │  │  └─────────────────────────────┘   │  │  │  │ │  │
│  │  │  │  │  └────────────────────────────────────┘  │  │  │ │  │
│  │  │  │  │                                          │  │  │ │  │
│  │  │  │  │  ┌────────────────────────────────────┐  │  │  │ │  │
│  │  │  │  │  │     EvidenceChart (if tab active)  │  │  │  │ │  │
│  │  │  │  │  │     [Bar chart of scores]          │  │  │  │ │  │
│  │  │  │  │  └────────────────────────────────────┘  │  │  │ │  │
│  │  │  │  └──────────────────────────────────────────┘  │  │ │  │
│  │  │  └────────────────────────────────────────────────┘  │ │  │
│  │  │                                                       │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### State Management (Zustand)

```javascript
// store/index.js
const useAppStore = create((set) => ({
  // Search State
  searchResults: null,
  isSearching: false,
  searchError: null,
  sessionId: null,
  drugName: "",

  // UI State
  activeTab: "list",
  selectedIndication: null,

  // Cache State
  cacheStats: null,

  // Actions
  setSearchResults: (results) => set({ searchResults: results }),
  setIsSearching: (status) => set({ isSearching: status }),
  setSearchError: (error) => set({ searchError: error }),
  reset: () =>
    set({
      searchResults: null,
      isSearching: false,
      searchError: null,
    }),
}));
```

### Key React Hooks

```javascript
// useWebSocket.js - Real-time updates
const useWebSocket = (sessionId, options) => {
  const [connected, setConnected] = useState(false);
  const [agentProgress, setAgentProgress] = useState({});

  useEffect(() => {
    if (!sessionId) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/${sessionId}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "agent_progress") {
        setAgentProgress((prev) => ({
          ...prev,
          [data.agent]: {
            status: data.status,
            evidenceCount: data.evidence_count,
          },
        }));
      }
    };

    return () => ws.close();
  }, [sessionId]);

  return { connected, agentProgress, resetProgress };
};
```

---

## 11. Data Flow Diagrams

### Complete Search Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           Complete Search Flow                                │
│                                                                               │
│  USER                                                                         │
│    │                                                                          │
│    │ 1. Enter "Metformin" → Click Search                                      │
│    ▼                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ FRONTEND                                                                 │ │
│  │                                                                          │ │
│  │   SearchBar.jsx                                                          │ │
│  │        │                                                                 │ │
│  │        │ 2. handleSearch("Metformin")                                    │ │
│  │        ▼                                                                 │ │
│  │   App.jsx                                                                │ │
│  │        │                                                                 │ │
│  │        │ 3. Generate sessionId                                           │ │
│  │        │ 4. setIsSearching(true)                                         │ │
│  │        │ 5. Connect WebSocket                                            │ │
│  │        ▼                                                                 │ │
│  │   api.js → POST /api/search ─────────────────────────────────────────┐   │ │
│  │        │                                                              │   │ │
│  │        │ 6. Wait for response...                                      │   │ │
│  │        │    (show AgentProgress)                                      │   │ │
│  └────────┼──────────────────────────────────────────────────────────────┼───┘ │
│           │                                                              │     │
│           │              HTTP Request                                    │     │
│           ▼                                                              ▼     │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ BACKEND                                                                  │ │
│  │                                                                          │ │
│  │   search.py (API Route)                                                  │ │
│  │        │                                                                 │ │
│  │        │ 7. Check cache                                                  │ │
│  │        ▼                                                                 │ │
│  │   ┌─────────────┐                                                        │ │
│  │   │CacheManager │──── Cache Hit? ────▶ Return cached result             │ │
│  │   └──────┬──────┘                                                        │ │
│  │          │                                                               │ │
│  │          │ 8. Cache Miss → Run workflow                                  │ │
│  │          ▼                                                               │ │
│  │   ┌─────────────────────────────────────────────────────────────────┐   │ │
│  │   │                    LangGraph Workflow                            │   │ │
│  │   │                                                                  │   │ │
│  │   │   9. initialize_search                                           │   │ │
│  │   │          │                                                       │   │ │
│  │   │          ▼                                                       │   │ │
│  │   │   10. run_agents_parallel ◄────── WebSocket: agent_progress ────┼───┼─┐
│  │   │          │                                                       │   │ │
│  │   │          │  ┌──────────────────────────────────────────────┐     │   │ │
│  │   │          │  │            Parallel Execution                 │     │   │ │
│  │   │          │  │                                               │     │   │ │
│  │   │          │  │  Literature ──▶ PubMed API ──▶ 45 articles   │     │   │ │
│  │   │          │  │  ClinTrials ──▶ CT.gov API ──▶ 32 trials     │     │   │ │
│  │   │          │  │  Bioactivity ─▶ ChEMBL API ──▶ 28 targets    │     │   │ │
│  │   │          │  │  Patent ──────▶ Lens.org ────▶ 15 patents    │     │   │ │
│  │   │          │  │  Internal ────▶ Mock DB ─────▶ 8 records     │     │   │ │
│  │   │          │  │                                               │     │   │ │
│  │   │          │  └──────────────────────────────────────────────┘     │   │ │
│  │   │          │                                                       │   │ │
│  │   │          ▼                                                       │   │ │
│  │   │   11. aggregate_evidence (128 total items)                       │   │ │
│  │   │          │                                                       │   │ │
│  │   │          ▼                                                       │   │ │
│  │   │   12. score_evidence                                             │   │ │
│  │   │          │                                                       │   │ │
│  │   │          │  ┌──────────────────────────────────────────────┐     │   │ │
│  │   │          │  │          EvidenceScorer                       │     │   │ │
│  │   │          │  │                                               │     │   │ │
│  │   │          │  │  Group by indication → Calculate scores      │     │   │ │
│  │   │          │  │  Apply bonuses → Sort by confidence          │     │   │ │
│  │   │          │  │                                               │     │   │ │
│  │   │          │  │  Output: 15 ranked IndicationResults         │     │   │ │
│  │   │          │  └──────────────────────────────────────────────┘     │   │ │
│  │   │          │                                                       │   │ │
│  │   │          ▼                                                       │   │ │
│  │   │   13. synthesize_results                                         │   │ │
│  │   │          │                                                       │   │ │
│  │   │          │  ┌──────────────────────────────────────────────┐     │   │ │
│  │   │          │  │          LLM Factory                          │     │   │ │
│  │   │          │  │                                               │     │   │ │
│  │   │          │  │  Try Gemini ──▶ Generate AI analysis         │     │   │ │
│  │   │          │  │       │                                       │     │   │ │
│  │   │          │  │       │ (fallback to Ollama if needed)       │     │   │ │
│  │   │          │  │       ▼                                       │     │   │ │
│  │   │          │  │  Output: Markdown synthesis                  │     │   │ │
│  │   │          │  └──────────────────────────────────────────────┘     │   │ │
│  │   │          │                                                       │   │ │
│  │   │          ▼                                                       │   │ │
│  │   │   14. finalize_results                                           │   │ │
│  │   │          │                                                       │   │ │
│  │   └──────────┼───────────────────────────────────────────────────────┘   │ │
│  │              │                                                           │ │
│  │              ▼                                                           │ │
│  │   15. Background task: cache_result                                      │ │
│  │              │                                                           │ │
│  │              │ 16. Return SearchResponse                                 │ │
│  └──────────────┼───────────────────────────────────────────────────────────┘ │
│                 │                                                             │
│                 │              HTTP Response                                  │
│                 ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ FRONTEND                                                                 │ │
│  │                                                                          │ │
│  │   api.js                                                                 │ │
│  │        │                                                                 │ │
│  │        │ 17. Parse response                                              │ │
│  │        ▼                                                                 │ │
│  │   App.jsx                                                                │ │
│  │        │                                                                 │ │
│  │        │ 18. setSearchResults(results)                                   │ │
│  │        │ 19. setIsSearching(false)                                       │ │
│  │        │ 20. saveToHistory(results)                                      │ │
│  │        ▼                                                                 │ │
│  │   ResultsDashboard.jsx                                                   │ │
│  │        │                                                                 │ │
│  │        ├──▶ AIAnalysisCard (synthesis)                                   │ │
│  │        ├──▶ IndicationList (ranked_indications)                          │ │
│  │        └──▶ EvidenceChart (visualization)                                │ │
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  USER                                                                         │
│    │                                                                          │
│    │ 21. View results, expand indications, export PDF                         │
│    ▼                                                                          │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Re-Analysis Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Re-Analysis Flow                             │
│                                                                  │
│   User clicks "Re-analyze" button                                │
│         │                                                        │
│         ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ ResultsDashboard.jsx                                     │   │
│   │                                                          │   │
│   │   onReanalyze(drug_name) ────────────────────────────┐   │   │
│   └──────────────────────────────────────────────────────┼───┘   │
│                                                          │       │
│                                                          ▼       │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ App.jsx - handleReanalyze()                              │   │
│   │                                                          │   │
│   │   1. setIsReanalyzing(true)                              │   │
│   │   2. Generate new sessionId                              │   │
│   │   3. Call searchDrug(drugName, { forceRefresh: true })   │   │
│   │         │                                                │   │
│   └─────────┼────────────────────────────────────────────────┘   │
│             │                                                    │
│             ▼                                                    │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Backend - POST /api/search                               │   │
│   │                                                          │   │
│   │   force_refresh = true                                   │   │
│   │         │                                                │   │
│   │         │ Skip cache check                               │   │
│   │         │                                                │   │
│   │         ▼                                                │   │
│   │   Run full workflow (all 5 agents + LLM)                 │   │
│   │         │                                                │   │
│   │         ▼                                                │   │
│   │   Cache new results (overwrites old cache)               │   │
│   │         │                                                │   │
│   │         ▼                                                │   │
│   │   Return fresh SearchResponse                            │   │
│   └─────────┼────────────────────────────────────────────────┘   │
│             │                                                    │
│             ▼                                                    │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Frontend - Update UI                                     │   │
│   │                                                          │   │
│   │   1. setSearchResults(freshResults)                      │   │
│   │   2. setIsReanalyzing(false)                             │   │
│   │   3. Results now show cached=false                       │   │
│   │   4. New AI synthesis displayed                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. Caching Strategy

### Cache Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Caching System                              │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    CacheManager                            │  │
│  │                                                            │  │
│  │  Configuration:                                            │  │
│  │  - Storage: JSON files                                     │  │
│  │  - Location: backend/data/cache/                           │  │
│  │  - TTL: 7 days (604800 seconds)                            │  │
│  │  - Key: drug_name (normalized, lowercase)                  │  │
│  │                                                            │  │
│  │  Methods:                                                  │  │
│  │  - get_cached_result(drug_name) → SearchResponse | None    │  │
│  │  - cache_result(drug_name, result) → void                  │  │
│  │  - clear_cache() → void                                    │  │
│  │  - clear_drug_cache(drug_name) → bool                      │  │
│  │  - get_cache_stats() → Dict                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Cache File Structure:                                          │
│                                                                  │
│  backend/data/cache/                                            │
│  ├── metformin.json                                             │
│  ├── aspirin.json                                               │
│  ├── sildenafil.json                                            │
│  ├── thalidomide.json                                           │
│  └── ...                                                        │
│                                                                  │
│  File Contents:                                                 │
│  {                                                               │
│    "drug_name": "Metformin",                                    │
│    "timestamp": "2026-01-20T10:30:00Z",                         │
│    "execution_time": 18.5,                                      │
│    "all_evidence": [...],                                       │
│    "ranked_indications": [...],                                 │
│    "synthesis": "...",                                          │
│    "agent_results": {...}                                       │
│  }                                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Cache Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Cache Decision Flow                         │
│                                                                  │
│                    Search Request                                │
│                         │                                        │
│                         ▼                                        │
│               ┌─────────────────┐                               │
│               │ force_refresh?  │                               │
│               └────────┬────────┘                               │
│                        │                                        │
│            ┌───────────┴───────────┐                            │
│            │                       │                            │
│         No ▼                    Yes ▼                           │
│   ┌─────────────────┐    ┌─────────────────┐                   │
│   │ Check cache     │    │ Skip cache      │                   │
│   │ for drug_name   │    │ Run workflow    │                   │
│   └────────┬────────┘    └────────┬────────┘                   │
│            │                      │                            │
│     ┌──────┴──────┐               │                            │
│     │             │               │                            │
│  Found?        Not Found          │                            │
│     │             │               │                            │
│     ▼             ▼               │                            │
│ ┌───────┐   ┌───────────┐        │                            │
│ │Fresh? │   │Run workflow│        │                            │
│ │(<7d)  │   │           │        │                            │
│ └───┬───┘   └─────┬─────┘        │                            │
│     │             │               │                            │
│  ┌──┴──┐          │               │                            │
│ Yes   No          │               │                            │
│  │     │          │               │                            │
│  ▼     ▼          ▼               ▼                            │
│ Return  Run    Cache result   Cache result                     │
│ cached  workflow (background) (background)                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 13. Failure Handling & System Resilience

### Design Philosophy

The system is designed to **degrade gracefully**—partial results are more valuable than complete failure. Each component has defined fallback behavior.

### External API Failures

| Component | Failure Mode | Fallback Behavior |
|-----------|--------------|-------------------|
| **PubMed API** | Timeout, 5xx error | Agent returns empty result; other agents continue |
| **ClinicalTrials.gov** | Rate limit exceeded | Exponential backoff with 3 retries; then skip |
| **ChEMBL API** | Invalid response | Parse error logged; agent returns empty result |
| **Lens.org API** | Missing API key | Agent skipped entirely; logged as "skipped" |
| **Google Gemini** | Quota exceeded, 429 | Fallback to Ollama (local LLM) if configured |

### Partial Results Handling

```
Scenario: Patent API unavailable during search

Result:
- Literature Agent: ✅ 45 items
- Clinical Trials Agent: ✅ 32 items
- Bioactivity Agent: ✅ 28 items
- Patent Agent: ❌ 0 items (error logged)
- Internal Agent: ✅ 8 items

Outcome: Search completes with 113 evidence items from 4 sources
User sees: "4 of 5 agents returned results" indicator
```

### LLM Fallback Chain

```
Primary: Google Gemini (cloud)
    │
    ├── Success → Generate synthesis
    │
    └── Failure (quota/network)
            │
            ▼
Secondary: Ollama (local)
    │
    ├── Success → Generate synthesis (may be slower/less capable)
    │
    └── Failure (not installed)
            │
            ▼
Tertiary: Static fallback
    │
    └── Return: "AI synthesis unavailable. Please review evidence manually."
```

### Retry Strategies

| Operation | Max Retries | Backoff | Timeout |
|-----------|-------------|---------|---------|
| External API calls | 3 | Exponential (1s, 2s, 4s) | 30 seconds |
| LLM generation | 2 | Fixed 2s | 60 seconds |
| Cache write | 1 | None | 5 seconds |
| WebSocket reconnect | 5 | Linear 1s | N/A |

### Error Logging

All failures are logged with context for debugging:

```python
logger.error(f"Agent {agent_name} failed: {error}", exc_info=True)
# Includes: timestamp, agent name, drug name, error type, stack trace
```

### User-Facing Error Messages

Errors are translated to actionable messages:

| Internal Error | User Message |
|----------------|--------------|
| `TimeoutError` | "Search is taking longer than expected. Results may be incomplete." |
| `LLM quota exceeded` | "AI analysis temporarily unavailable. Evidence data is still accurate." |
| `All agents failed` | "Unable to connect to data sources. Please try again later." |

---

## 14. Security & Data Privacy

### Data Handling Principles

| Principle | Implementation |
|-----------|----------------|
| **No PII Collection** | System processes only drug names; no patient or user health data |
| **Public Data Only** | All biomedical data sourced from public APIs (PubMed, ClinicalTrials.gov, ChEMBL) |
| **Server-Side Keys** | API keys stored in backend `.env` file; never exposed to frontend |
| **Stateless Search** | Search queries are not logged with user identifiers (unless auth enabled) |

### API Key Security

```
✅ Gemini API key: Server-side only, loaded from environment variable
✅ Lens.org API key: Server-side only, optional
✅ JWT secret: Server-side only, used for optional auth
❌ No API keys in frontend code
❌ No API keys in version control
```

### Network Security

| Layer | Protection |
|-------|------------|
| **Frontend ↔ Backend** | CORS configured for specific origins only |
| **Backend ↔ External APIs** | HTTPS enforced for all external calls |
| **WebSocket** | Session-bound connection with unique session ID |

### Authentication (Optional)

When MongoDB is enabled:

- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens with configurable expiration (default 24h)
- No password stored in plaintext
- Token refresh not implemented (prototype limitation)

### Attack Surface (Prototype Scope)

| Risk | Mitigation | Status |
|------|------------|--------|
| SQL Injection | No SQL database; Pydantic validation | ✅ N/A |
| XSS | React escapes output by default | ✅ Mitigated |
| CSRF | Stateless API; no cookies for auth | ✅ N/A |
| API Key Exposure | Server-side storage only | ✅ Mitigated |
| Denial of Service | Rate limiting on external APIs | ⚠️ Basic (prototype) |

### Data Retention

- **Cache**: 7 days TTL, stored as JSON files
- **Search History**: LocalStorage in browser only (not server)
- **Logs**: INFO level by default, no PII logged

---

## 15. Regulatory & Ethical Safeguards

### Important Disclaimer

> **This platform is a research and decision-support tool only.**
>
> - It does **not** provide medical advice, diagnosis, or treatment recommendations
> - It does **not** replace clinical judgment or regulatory review
> - All outputs require validation by qualified domain experts
> - Drug repurposing hypotheses must undergo proper clinical trials before any therapeutic use

### Intended Use Cases

| Appropriate Use | Inappropriate Use |
|-----------------|-------------------|
| Hypothesis generation for research | Direct clinical decision-making |
| Literature screening and prioritization | Patient treatment selection |
| Early-stage opportunity identification | Regulatory submission evidence |
| Educational exploration of drug mechanisms | Marketing claims for drugs |

### Explainability & Traceability

Every result is traceable to source:

1. **Evidence-Level**: Each item links to original source (PMID, NCT ID, ChEMBL ID)
2. **Score-Level**: Confidence algorithm is documented and deterministic
3. **Synthesis-Level**: AI analysis is clearly marked as AI-generated

### Human-in-the-Loop Requirements

```
System Output → Human Expert Review → Validated Hypothesis
      │                  │                    │
      │                  │                    └── Ready for further investigation
      │                  └── Domain expert validates relevance
      └── AI-generated, requires verification
```

### Bias Considerations

| Potential Bias | Mitigation |
|----------------|------------|
| **Publication bias** | Multi-source approach includes trials (not just published results) |
| **Recency bias** | Scoring includes recency bonuses but doesn't exclude older evidence |
| **English-language bias** | Most sources are English-centric; acknowledged limitation |
| **Well-known drug bias** | Popular drugs have more literature; scores may be inflated |

### Compliance Awareness

While this prototype does not implement full regulatory compliance, the architecture supports future enhancements:

- Audit logging can be added for 21 CFR Part 11 compliance
- Role-based access control structure exists (auth module)
- Data provenance is maintained throughout the pipeline

---

## 16. Configuration Guide

### Environment Variables

```bash
# backend/.env

# LLM Configuration
GEMINI_API_KEY=your_gemini_api_key          # Required for AI synthesis
OLLAMA_BASE_URL=http://localhost:11434       # Optional local LLM fallback
OLLAMA_MODEL=llama3                          # Ollama model name

# External API Keys
LENS_API_KEY=your_lens_api_key               # Optional for patent search

# Application Settings
LOG_LEVEL=INFO                               # DEBUG, INFO, WARNING, ERROR
CACHE_TTL_SECONDS=604800                     # 7 days default
CORS_ORIGINS=http://localhost:5173           # Frontend URL

# Rate Limits (requests per second)
PUBMED_RATE_LIMIT=3.0
CLINICAL_TRIALS_RATE_LIMIT=1.0
CHEMBL_RATE_LIMIT=2.0
LENS_RATE_LIMIT=0.5

# MongoDB Configuration (Optional - for authentication & persistence)
MONGODB_URI=mongodb://localhost:27017        # MongoDB connection string
MONGODB_DATABASE=drug_repurposing            # Database name
USE_MONGODB=false                            # Set to true to enable

# JWT Authentication (Optional - requires MongoDB)
JWT_SECRET_KEY=your-super-secret-jwt-key     # Change in production!
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440         # 24 hours

# Vector Database (Optional - for RAG)
VECTOR_DB_DIR=data/vector_store              # ChromaDB storage directory
```

### Frontend Configuration

```javascript
// frontend/src/config/api.js

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";
export const WS_BASE_URL = API_BASE_URL.replace("http", "ws");
export const API_TIMEOUT = 120000; // 2 minutes

export const ENDPOINTS = {
  SEARCH: "/api/search",
  CACHE_STATS: "/api/search/cache/stats",
  CLEAR_CACHE: "/api/search/cache/clear",
  CHAT: "/api/chat",
  EXPORT_PDF: "/api/export/pdf",
  EXPORT_JSON: "/api/export/json",
  HEALTH: "/health",
};
```

---

## 17. Feature List

### Core Features

| Feature            | Description                                 | Status      |
| ------------------ | ------------------------------------------- | ----------- |
| Multi-Agent Search | 5 parallel agents searching diverse sources | ✅ Complete |
| Evidence Scoring   | Weighted algorithm ranking indications      | ✅ Complete |
| AI Synthesis       | Gemini-powered analysis with fallback       | ✅ Complete |
| Real-Time Progress | WebSocket updates during search             | ✅ Complete |
| Smart Caching      | 7-day TTL with force-refresh                | ✅ Complete |
| Interactive Chat   | AI Q&A about search results                 | ✅ Complete |
| PDF Export         | Professional report with charts & watermark | ✅ Complete |
| JSON Export        | Raw data export                             | ✅ Complete |
| Search History     | Local storage of past searches              | ✅ Complete |
| Re-Analyze         | Force fresh analysis of cached results      | ✅ Complete |

### Optional Features (require additional setup)

| Feature            | Description                                 | Requirement     |
| ------------------ | ------------------------------------------- | --------------- |
| User Authentication| JWT-based login/register                    | MongoDB running |
| RAG Knowledge Base | Vector search for enhanced context          | ChromaDB        |
| Persistent Storage | User data and search history                | MongoDB running |

### Data Sources

| Source             | API         | Data Type       | Coverage      |
| ------------------ | ----------- | --------------- | ------------- |
| PubMed             | E-utilities | Literature      | 35M+ articles |
| ClinicalTrials.gov | REST v2     | Clinical Trials | 450K+ studies |
| ChEMBL             | REST        | Bioactivity     | 2M+ compounds |
| Lens.org           | Scholarly   | Patents         | 150M+ patents |
| Internal           | Mock        | Proprietary     | Demo data     |

### UI Features

| Feature            | Description                           |
| ------------------ | ------------------------------------- |
| Dark Theme         | EY Healthcare branded dark mode       |
| Responsive Design  | Mobile-friendly layout                |
| Expandable Cards   | Detailed evidence on demand           |
| Visual Scoring     | Color-coded confidence levels         |
| Interactive Charts | Recharts visualizations               |
| Loading States     | Animated agent progress               |
| Chat Panel         | Floating AI chat for Q&A about results|
| Auth Modal         | Login/Register interface (optional)   |

---

## 18. Scope & Limitations

### Prototype Boundaries

This platform is a **functional prototype** demonstrating the feasibility of AI-powered drug repurposing research. It is not a production-ready clinical or regulatory tool.

### Current Limitations

| Area | Limitation | Impact |
|------|------------|--------|
| **Data Coverage** | 5 data sources; does not include DrugBank, KEGG, FDA, EMA databases | May miss relevant evidence |
| **Patent Analysis** | Basic keyword matching; no claim analysis or freedom-to-operate assessment | Patent signals are indicative only |
| **LLM Synthesis** | Single-pass generation; no multi-turn refinement or fact-checking | AI analysis requires expert review |
| **Scoring Algorithm** | Rule-based weights; not calibrated against clinical outcomes | Confidence scores are relative, not predictive |
| **Language** | English-only sources and processing | Non-English literature excluded |
| **Real-Time Data** | Cached results may be up to 7 days old | Very recent publications may be missed |

### API & Infrastructure Constraints

| Constraint | Current State | Production Requirement |
|------------|---------------|------------------------|
| **Gemini API** | Free tier with quotas | Enterprise tier for reliability |
| **Lens.org** | Requires API key; limited requests | Paid subscription for full access |
| **Concurrency** | Single-user design | Load balancing, connection pooling |
| **Storage** | Local JSON file cache | Distributed cache (Redis), database |
| **Monitoring** | Console logging only | APM, alerting, dashboards |

### What This Prototype Is NOT

- **Not a medical device**: Cannot be used for clinical decision-making
- **Not a regulatory tool**: Outputs are not suitable for regulatory submissions
- **Not a replacement for clinical trials**: Hypotheses require experimental validation
- **Not an exhaustive search**: Limited to configured data sources and search terms
- **Not real-time**: Data freshness depends on cache TTL and source update frequency

### Honest Assessment

| Strength | Weakness |
|----------|----------|
| Rapid hypothesis generation | No clinical validation of results |
| Multi-source evidence aggregation | Potential for false positives |
| Explainable scoring logic | Weights are heuristic, not empirical |
| Modern AI-powered synthesis | LLM may hallucinate or oversimplify |
| Extensible agent architecture | Currently limited to 5 sources |

---

## 19. Deployment Guide

### Development Setup

```bash
# Clone repository
git clone <repository-url>
cd drug-repurposing-platform

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your API keys

# Run backend
uvicorn app.main:app --reload --port 8000

# Frontend setup (new terminal)
cd frontend
npm install

# Run frontend
npm run dev
```

### Production Deployment

```bash
# Backend (Docker)
docker build -t repurpose-api ./backend
docker run -d -p 8000:8000 \
  -e GEMINI_API_KEY=$GEMINI_API_KEY \
  -v ./data:/app/data \
  repurpose-api

# Frontend (Static build)
cd frontend
npm run build
# Deploy dist/ folder to CDN or static hosting
```

### Directory Structure

```
drug-repurposing-platform/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI entry point
│   │   ├── config.py               # Configuration
│   │   ├── agents/                 # Multi-agent system
│   │   │   ├── base_agent.py
│   │   │   ├── literature_agent.py
│   │   │   ├── clinical_trials_agent.py
│   │   │   ├── bioactivity_agent.py
│   │   │   ├── patent_agent.py
│   │   │   └── internal_agent.py
│   │   ├── api/routes/             # API endpoints
│   │   │   ├── search.py
│   │   │   ├── chat.py
│   │   │   ├── export.py
│   │   │   ├── auth.py             # Authentication (optional)
│   │   │   └── knowledge.py        # RAG endpoints (optional)
│   │   ├── auth/                   # Authentication (optional)
│   │   │   ├── __init__.py
│   │   │   ├── jwt.py              # JWT token handling
│   │   │   └── password.py         # Password hashing
│   │   ├── cache/                  # Caching
│   │   │   └── cache_manager.py
│   │   ├── database/               # MongoDB (optional)
│   │   │   ├── __init__.py
│   │   │   ├── mongodb.py          # Async MongoDB client
│   │   │   ├── models.py           # Database models
│   │   │   └── repositories.py     # Data access layer
│   │   ├── graph/                  # LangGraph workflow
│   │   │   ├── state.py
│   │   │   ├── nodes.py
│   │   │   └── workflow.py
│   │   ├── llm/                    # LLM integration
│   │   │   ├── llm_factory.py
│   │   │   ├── gemini_client.py
│   │   │   └── ollama_client.py
│   │   ├── models/                 # Pydantic schemas
│   │   │   └── schemas.py
│   │   ├── scoring/                # Evidence scoring
│   │   │   └── evidence_scorer.py
│   │   ├── vector_store/           # RAG/ChromaDB (optional)
│   │   │   ├── __init__.py
│   │   │   ├── chroma_client.py
│   │   │   ├── embeddings.py
│   │   │   ├── knowledge_base.py
│   │   │   └── init_knowledge_base.py
│   │   └── utils/                  # Utilities
│   │       ├── api_clients.py
│   │       ├── logger.py
│   │       └── pdf_generator.py    # Professional PDF with charts
│   ├── data/cache/                 # Cached results
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Layout.jsx
│   │   │   ├── search/
│   │   │   │   └── SearchBar.jsx
│   │   │   ├── agents/
│   │   │   │   ├── AgentProgress.jsx
│   │   │   │   └── AgentCard.jsx
│   │   │   ├── results/
│   │   │   │   ├── ResultsDashboard.jsx
│   │   │   │   ├── IndicationList.jsx
│   │   │   │   └── AIAnalysisCard.jsx
│   │   │   ├── chat/
│   │   │   │   └── ChatPanel.jsx   # Floating chat interface
│   │   │   ├── auth/               # Authentication UI (optional)
│   │   │   │   ├── AuthModal.jsx
│   │   │   │   └── UserMenu.jsx
│   │   │   └── visualizations/
│   │   │       └── EvidenceChart.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── auth.js             # Auth service (optional)
│   │   ├── hooks/
│   │   │   └── useWebSocket.js
│   │   ├── store/
│   │   │   └── index.js
│   │   └── config/
│   │       └── api.js
│   ├── package.json
│   └── vite.config.js
│
└── DOCUMENTATION.md
```

---

## 20. Future Development & Google Ecosystem

### Roadmap Overview

The platform architecture is designed for evolution toward enterprise-grade capabilities, with particular alignment to Google Cloud technologies.

### Google Cloud Integration Path

| Current State | Future State (Google Cloud) | Benefit |
|---------------|----------------------------|---------|
| Google Gemini API (free tier) | **Vertex AI** with Gemini Pro/Ultra | Higher quotas, fine-tuning, enterprise SLA |
| Local JSON cache | **Cloud Firestore** or **BigQuery** | Scalable storage, real-time sync |
| File-based vector store | **Vertex AI Vector Search** | Managed embeddings at scale |
| Manual deployment | **Cloud Run** + **Cloud Build** | Auto-scaling, CI/CD |
| Console logging | **Cloud Logging** + **Cloud Monitoring** | Centralized observability |

### Planned Enhancements

#### Phase 1: Infrastructure (3-6 months)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Google Cloud Foundation                      │
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐    │
│   │ Cloud Run   │    │ Cloud SQL   │    │ Vertex AI       │    │
│   │ (Backend)   │◄──▶│ (PostgreSQL)│◄──▶│ Vector Search   │    │
│   └─────────────┘    └─────────────┘    └─────────────────┘    │
│          │                                                       │
│          ▼                                                       │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              Vertex AI (Gemini Pro/Ultra)                │   │
│   │              Fine-tuned for pharmaceutical domain        │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

#### Phase 2: Advanced Analytics (6-12 months)

| Feature | Technology | Description |
|---------|------------|-------------|
| **Large-Scale Biomedical Analytics** | BigQuery + BigQuery ML | Process millions of research papers, patents |
| **Knowledge Graph** | Neo4j on GCP or Cloud Spanner | Drug-target-disease relationship mapping |
| **Batch Processing** | Dataflow | Nightly updates from all data sources |
| **Healthcare API Integration** | Cloud Healthcare API | FHIR-compliant data exchange |

#### Phase 3: Enterprise Features (12-18 months)

- **Multi-tenant SaaS**: Organization-level isolation, custom agents
- **Feedback Learning**: User corrections improve scoring weights
- **Custom Agent Marketplace**: Enterprise-specific data source plugins
- **Audit & Compliance**: Full traceability for regulatory contexts
- **Collaboration Tools**: Shared workspaces, annotation, team notes

### Closed-Loop Discovery Vision

```
              ┌─────────────────────────────────────────┐
              │         Closed-Loop Discovery            │
              │                                          │
              │   ┌──────────────┐                       │
              │   │ Hypothesis   │◄─────────────────┐    │
              │   │ Generation   │                  │    │
              │   └──────┬───────┘                  │    │
              │          │                          │    │
              │          ▼                          │    │
              │   ┌──────────────┐                  │    │
              │   │ Expert       │                  │    │
              │   │ Validation   │                  │    │
              │   └──────┬───────┘                  │    │
              │          │                          │    │
              │          ▼                          │    │
              │   ┌──────────────┐                  │    │
              │   │ Experimental │                  │    │
              │   │ Testing      │                  │    │
              │   └──────┬───────┘                  │    │
              │          │                          │    │
              │          ▼                          │    │
              │   ┌──────────────┐    ┌──────────┐  │    │
              │   │ Outcome      │───▶│ Feedback │──┘    │
              │   │ Recording    │    │ to Model │       │
              │   └──────────────┘    └──────────┘       │
              │                                          │
              └──────────────────────────────────────────┘
```

### Additional Data Source Roadmap

| Source | Type | Integration Priority |
|--------|------|---------------------|
| **DrugBank** | Drug-target database | High |
| **KEGG** | Pathway database | High |
| **UniProt** | Protein database | Medium |
| **FDA Orange Book** | Approved drugs | Medium |
| **EMA Database** | European approvals | Medium |
| **OpenTargets** | Target validation | High |
| **Semantic Scholar** | Enhanced literature | Low |

### Technology Alignment Summary

| Capability | Google Technology | Competitor Alternative |
|------------|------------------|----------------------|
| LLM | Vertex AI (Gemini) | OpenAI API, Anthropic |
| Vector Search | Vertex AI Vector Search | Pinecone, Weaviate |
| Data Warehouse | BigQuery | Snowflake, Databricks |
| Container Hosting | Cloud Run | AWS Fargate, Azure Container Apps |
| CI/CD | Cloud Build | GitHub Actions, GitLab CI |
| Monitoring | Cloud Operations Suite | Datadog, New Relic |

The platform's modular architecture enables incremental adoption of these technologies without requiring a complete rewrite.

---

## Appendix: Data Models Reference

### EvidenceItem

```python
class EvidenceItem(BaseModel):
    source: Literal["literature", "clinical_trials", "bioactivity", "patent", "internal"]
    indication: str
    summary: str
    relevance_score: float  # 0-1
    title: Optional[str]
    url: Optional[str]
    date: Optional[str]
    metadata: Dict[str, Any]
```

### IndicationResult

```python
class IndicationResult(BaseModel):
    indication: str
    confidence_score: float  # 0-100
    evidence_count: int
    supporting_sources: List[str]
    evidence_items: List[EvidenceItem]
```

### SearchResponse

```python
class SearchResponse(BaseModel):
    drug_name: str
    session_id: str
    agent_results: Dict[str, AgentResponse]
    progress: Dict[str, str]
    errors: List[str]
    all_evidence: List[EvidenceItem]
    ranked_indications: List[IndicationResult]
    synthesis: Optional[str]
    timestamp: str
    execution_time: float
    cached: bool
```

---

_Documentation generated for Drug Repurposing Platform v1.2_
_Last updated: January 23, 2026_

### Changelog

**v1.2 (January 23, 2026)**
- Added "Why Agentic AI?" section explaining multi-agent architecture rationale
- Added "Problem-to-Solution Traceability" table in Executive Summary
- Added "Validation & Evaluation Strategy" section with known drug testing approach
- Added "Failure Handling & System Resilience" section documenting graceful degradation
- Added "Security & Data Privacy" section covering data handling principles
- Added "Regulatory & Ethical Safeguards" section with important disclaimers
- Added "Scope & Limitations" section with honest prototype boundaries
- Added "Future Development & Google Ecosystem" roadmap section
- Reorganized Table of Contents with proper section numbering

**v1.1 (January 23, 2026)**
- Added interactive Chat UI for Q&A about search results
- Enhanced PDF reports with watermarks, pie charts, bar charts, and professional styling
- Added optional MongoDB integration for user authentication
- Added optional ChromaDB/RAG for enhanced knowledge retrieval
- Added JWT-based authentication system (optional)
- Updated frontend with ChatPanel and AuthModal components

**v1.0 (January 2026)**
- Initial release with multi-agent search architecture
- Five specialized agents: Literature, Clinical Trials, Bioactivity, Patent, Internal
- Evidence scoring algorithm with weighted confidence calculation
- LangGraph workflow orchestration
- Google Gemini integration for AI synthesis
- Real-time WebSocket progress updates
- PDF and JSON export functionality
- React frontend with Zustand state management
