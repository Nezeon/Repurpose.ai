# Drug Repurposing Platform - Complete Documentation

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Conversational AI Architecture (EY Techathon)](#3-conversational-ai-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Multi-Agent System](#5-multi-agent-system)
6. [4D Composite Scoring System](#6-4d-composite-scoring-system)
7. [Free Market Data Integration](#7-free-market-data-integration)
8. [Smart Indication Matching](#8-smart-indication-matching)
9. [Workflow Orchestration](#9-workflow-orchestration)
10. [Decision Rules Engine](#10-decision-rules-engine)
11. [Validation & Evaluation Strategy](#11-validation--evaluation-strategy)
12. [API Reference](#12-api-reference)
13. [Frontend Architecture](#13-frontend-architecture)
14. [UX Features](#14-ux-features)
15. [Caching Strategy & Additional Sections](#15-21-additional-sections)
16. [EY Techathon Semi-Final Enhancements](#22-ey-techathon-semi-final-enhancements)

---

## 1. Executive Summary

### What is the Drug Repurposing Platform?

**Repurpose.AI** is an AI-powered conversational pharma planning assistant that identifies new therapeutic uses for existing drugs. Built for the **EY Techathon 6.0**, it features a **Master Agent orchestrator** that interprets open-ended strategic questions, routes them to **7 specialized worker agent groups** (backed by 18 unified pipeline agents), and returns rich responses with tables, charts, and downloadable PDF/Excel reports — all within a chat-first interface with drug comparison, regulatory pathway advisory, conversation persistence, and report archival.

### Key Capabilities

- **Conversational AI Interface**: Chat-first design with Master Agent interpreting strategic pharma questions
- **7 EY Worker Agent Groups**: IQVIA Insights, EXIM Trade, Patent Landscape, Clinical Trials, Internal Knowledge, Web Intelligence, Report Generator
- **18-Agent Unified Pipeline**: 15 core agents + 3 EY wrappers (IQVIA, EXIM, Web Intel) — one brain for both Search and Chat
- **4D Composite Scoring**: Scientific Evidence (40%), Market Opportunity (25%), Competitive Landscape (20%), Development Feasibility (15%)
- **Score Refinement**: Enhanced scoring with comparative, scientific, and market segment data (+/-20 per dimension)
- **Decision Rules Engine**: Whitespace detection, biosimilar opportunity flags, geographic arbitrage, unmet need analysis
- **USPTO Patent Landscape**: PatentsView API for patent expiry, FTO risk, competitive filing analysis
- **EXIM Trade Intelligence**: Import/export volume analysis, sourcing insights, geographic opportunity mapping
- **Internal Knowledge RAG**: PDF upload, ChromaDB vector storage, context-aware summarization
- **Free Market Data**: WHO GHO, Wikidata SPARQL, Europe PMC integration (no paid APIs required)
- **Smart Indication Matching**: 60+ medical abbreviations, fuzzy matching, 50+ therapeutic areas
- **Rich Chat Responses**: Inline tables, bar/radar charts, PDF download links, suggested follow-up queries
- **Professional Reports**: Dark-themed PDF + multi-sheet Excel export with comparative analysis, scientific details, and visualizations
- **Report Archival**: All generated reports (PDF/Excel) auto-archived with metadata for later retrieval
- **Conversation Persistence**: Chat sessions saved to filesystem, loadable across browser sessions
- **10 Synthetic Welcome Queries**: Pre-built strategic pharma questions for guided exploration
- **6 Internal Documents**: Pre-loaded cardiovascular, biosimilar, API sourcing, oncology, respiratory, and CNS reports for RAG
- **Real-Time Progress**: WebSocket-based live agent activity indicators with 7 EY Worker Agent groups
- **Drug Comparison**: Compare 2-3 drugs side-by-side with overlapping indications and AI-generated summary
- **Regulatory Pathway Advisor**: FDA pathway recommendations (505(b)(2), Fast Track, Orphan Drug, Breakthrough)
- **Strategic Brief**: Executive GO/INVESTIGATE/NO-GO recommendation with timeline and cost estimates
- **Command Palette (Ctrl+K)**: Global keyboard-driven navigation and search across the platform
- **Keyboard Shortcuts**: 7 global shortcuts for power-user navigation
- **Onboarding Tour**: 5-step interactive walkthrough for first-time users
- **Notification System**: Toast notifications + persistent notification center with bell icon
- **Evidence Graph**: Interactive SVG network visualization of drug-indication-evidence relationships
- **Authentication**: JWT-based user registration and login system
- **Dark/Light Theme**: Toggleable theme with persistent preference

### Business Value

| Metric                   | Traditional Research | With Platform   |
| ------------------------ | -------------------- | --------------- |
| Time to Initial Analysis | Days to Weeks        | 15-30 seconds   |
| Data Sources Searched    | 1-2 manually         | 18 automatically |
| Evidence Items Processed | Dozens               | Hundreds        |
| Market Analysis          | Expensive consultants| Free built-in   |
| Consistency              | Variable             | Standardized    |

### Problem-to-Solution Traceability

| Pharma Pain Point | System Component | Output | Business Value |
|-------------------|------------------|--------|----------------|
| Manual literature review is slow | Literature Agent + Semantic Scholar | Automated search across 35M+ articles | 90% reduction in screening time |
| Clinical trial data is fragmented | Clinical Trials Agent | Unified view of 450K+ trials | Real-time awareness |
| Bioactivity data requires expertise | Bioactivity Agent (ChEMBL) | Pre-processed target/activity data | Accessible insights |
| Market analysis is expensive | Free Market Data Agent | WHO GHO, Wikidata, built-in estimates | No paid API required |
| Competition tracking is manual | OpenTargets + Competition Scoring | Automated landscape analysis | Strategic positioning |
| Evidence synthesis is complex | 4D Composite Scorer + Gemini | AI-generated analysis with scores | Objective prioritization |

---

## 2. System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React + Vite)                         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐│
│  │  Chat  │ │Dashbrd │ │ Search │ │Results │ │History │ │Compare │ │Login ││
│  │(deflt) │ │        │ │        │ │        │ │        │ │        │ │      ││
│  └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └──┬───┘│
│       │             │              │                 │                │       │
│       └─────────────┴──────────────┴─────────────────┴────────────────┘       │
│                                │                                              │
│                    ┌───────────┴───────────┐                                 │
│                    │    Zustand Store      │                                 │
│                    │  (Global State Mgmt)  │                                 │
│                    └───────────┬───────────┘                                 │
│                                │                                              │
│              ┌─────────────────┼─────────────────┐                           │
│              │                 │                 │                           │
│         ┌────┴────┐     ┌──────┴──────┐   ┌─────┴─────┐                     │
│         │ API.js  │     │ WebSocket   │   │ Config    │                     │
│         │ (Axios) │     │   Hook      │   │           │                     │
│         └────┬────┘     └──────┬──────┘   └───────────┘                     │
└──────────────┼─────────────────┼────────────────────────────────────────────┘
               │                 │
               │   HTTP/REST     │  WebSocket
               ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (FastAPI + LangGraph)                      │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         API Layer (FastAPI)                          │    │
│  │  ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌──┐│
│  │  │/api/   ││/api/   ││/api/   ││/api/   ││/api/   ││/api/   ││/api/   ││ws││
│  │  │chat    ││search  ││export  ││reports ││compare ││drug-   ││auth    ││  ││
│  │  │        ││        ││        ││        ││        ││info    ││        ││  ││
│  │  └───┬────┘└───┬────┘└───┬────┘└───┬────┘└───┬────┘└───┬────┘└───┬────┘└┬─┘│
│  └──────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼──────┘  │
│            │                │                │               │               │
│            ▼                │                │               │               │
│  ┌─────────────────────┐    │                │               │               │
│  │   Cache Manager     │◄───┴────────────────┴───────────────┘               │
│  │ (JSON File-based)   │                                                     │
│  └─────────┬───────────┘                                                     │
│            │ Cache Miss                                                      │
│            ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    LangGraph Workflow Engine                         │    │
│  │                                                                      │    │
│  │   ┌──────────┐    ┌─────────────────┐    ┌───────────────────┐      │    │
│  │   │Initialize│───▶│ Run 18 Agents   │───▶│ Aggregate Evidence│      │    │
│  │   │  Search  │    │   (Parallel)    │    │                   │      │    │
│  │   └──────────┘    └────────┬────────┘    └─────────┬─────────┘      │    │
│  │                            │                       │                 │    │
│  │                            ▼                       ▼                 │    │
│  │                   ┌─────────────────┐    ┌───────────────────┐      │    │
│  │                   │ 4D Composite    │───▶│Synthesize (LLM)   │      │    │
│  │                   │    Scoring      │    │                   │      │    │
│  │                   └─────────────────┘    └─────────┬─────────┘      │    │
│  │                                                    │                 │    │
│  │                                                    ▼                 │    │
│  │                                          ┌───────────────────┐      │    │
│  │                                          │ Finalize Results  │      │    │
│  │                                          └───────────────────┘      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    18-Agent Unified Multi-Source System              │    │
│  │                                                                      │    │
│  │  TIER 1 - Core Agents                                               │    │
│  │   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │    │
│  │   │ Literature │ │ Clinical   │ │Bioactivity │ │   Patent   │       │    │
│  │   │   Agent    │ │ Trials     │ │   Agent    │ │   Agent    │       │    │
│  │   │  (PubMed)  │ │   Agent    │ │  (ChEMBL)  │ │  (USPTO)   │       │    │
│  │   └────────────┘ └────────────┘ └────────────┘ └────────────┘       │    │
│  │                                                                      │    │
│  │  TIER 2 - Regulatory & Targets                                      │    │
│  │   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │    │
│  │   │  OpenFDA   │ │ OpenTargets│ │  Semantic  │ │  Internal  │       │    │
│  │   │   Agent    │ │   Agent    │ │  Scholar   │ │   Agent    │       │    │
│  │   └────────────┘ └────────────┘ └────────────┘ └────────────┘       │    │
│  │                                                                      │    │
│  │  TIER 3 - Drug Information                                          │    │
│  │   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │    │
│  │   │  DailyMed  │ │    KEGG    │ │  UniProt   │ │Orange Book │       │    │
│  │   │   Agent    │ │   Agent    │ │   Agent    │ │   Agent    │       │    │
│  │   └────────────┘ └────────────┘ └────────────┘ └────────────┘       │    │
│  │                                                                      │    │
│  │  TIER 4 - Nomenclature & Market                                     │    │
│  │   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │    │
│  │   │   RxNorm   │ │    WHO     │ │  DrugBank  │ │Market Data │       │    │
│  │   │   Agent    │ │   Agent    │ │   Agent    │ │   Agent    │       │    │
│  │   └────────────┘ └────────────┘ └────────────┘ └────────────┘       │    │
│  │                                                                      │    │
│  │  TIER 5 - EY Pipeline Wrappers (Unified Brain)                      │    │
│  │   ┌────────────┐ ┌────────────┐ ┌────────────┐                      │    │
│  │   │   IQVIA    │ │   EXIM     │ │  Web Intel │                      │    │
│  │   │ Pipeline   │ │ Pipeline   │ │  Pipeline  │                      │    │
│  │   │  Agent     │ │  Agent     │ │   Agent    │                      │    │
│  │   └────────────┘ └────────────┘ └────────────┘                      │    │
│  │                                                                      │    │
│  │  CHAT AGENTS (Orchestration Layer)                                   │    │
│  │   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │    │
│  │   │  Master    │ │   EXIM     │ │    Web     │ │   File     │       │    │
│  │   │  Agent     │ │  Trade     │ │Intelligence│ │  Upload    │       │    │
│  │   │(Orchestr.) │ │  Agent     │ │   Agent    │ │  Agent     │       │    │
│  │   └────────────┘ └────────────┘ └────────────┘ └────────────┘       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        Support Services                              │    │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │   │ LLM Factory  │  │ 4D Composite │  │ Market Data  │              │    │
│  │   │(Gemini/Ollama│  │   Scorer     │  │  Analyzer    │              │    │
│  │   └──────────────┘  └──────────────┘  └──────────────┘              │    │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │   │   Report     │  │ Conversation │  │    Excel     │              │    │
│  │   │  Archival    │  │  Persistence │  │  Generator   │              │    │
│  │   └──────────────┘  └──────────────┘  └──────────────┘              │    │
│  │   ┌──────────────┐  ┌──────────────┐                               │    │
│  │   │ Regulatory   │  │    Auth      │                               │    │
│  │   │   Advisor    │  │  (JWT/Users) │                               │    │
│  │   └──────────────┘  └──────────────┘                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         External Data Sources                                │
│                                                                              │
│   ┌───────────┐  ┌────────────────┐  ┌──────────┐  ┌───────────────────┐    │
│   │  PubMed   │  │ClinicalTrials  │  │  ChEMBL  │  │ USPTO PatentsView │    │
│   │  (NCBI)   │  │    .gov        │  │  (EBI)   │  │   (Free, No Key)  │    │
│   └───────────┘  └────────────────┘  └──────────┘  └───────────────────┘    │
│                                                                              │
│   ┌───────────┐  ┌────────────────┐  ┌──────────┐  ┌───────────────────┐    │
│   │  OpenFDA  │  │  OpenTargets   │  │   KEGG   │  │    UniProt        │    │
│   └───────────┘  └────────────────┘  └──────────┘  └───────────────────┘    │
│                                                                              │
│   ┌───────────┐  ┌────────────────┐  ┌──────────┐  ┌───────────────────┐    │
│   │  WHO GHO  │  │    Wikidata    │  │Europe PMC│  │  Semantic Scholar │    │
│   │  (FREE)   │  │   (FREE)       │  │  (FREE)  │  │                   │    │
│   └───────────┘  └────────────────┘  └──────────┘  └───────────────────┘    │
│                                                                              │
│   30M+ Articles    450K+ Trials     2M+ Compounds    12M+ US Patents          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component              | Responsibility                                      |
| ---------------------- | --------------------------------------------------- |
| **Frontend**           | User interface, state management, real-time updates |
| **API Layer**          | Request routing, validation, response formatting    |
| **Cache Manager**      | Result caching with TTL management                  |
| **Workflow Engine**    | Orchestrates agent execution and data processing    |
| **18-Agent System**    | Parallel data collection from biomedical + market + trade sources |
| **4D Composite Scorer**| Ranks indications across 4 dimensions               |
| **Market Data Agent**  | Free epidemiology data from WHO, Wikidata, Europe PMC|
| **LLM Factory**        | AI synthesis with provider fallback                 |
| **Regulatory Advisor** | FDA pathway recommendations (505(b)(2), Fast Track, Orphan) |
| **Auth System**        | JWT authentication, user registration and login     |

---

## 3. Conversational AI Architecture

### Architecture Transformation

```
BEFORE (v2.x):   Drug Name → Fixed 15-Agent Pipeline → Dashboard
AFTER  (v3.0):   Chat Query → Master Agent → Worker Agents → Rich Chat Response
                                           ↘ (can still trigger full pipeline for deep analysis)
AFTER  (v3.1):   Unified Brain — both Search and Chat share same 18-agent pipeline
                  Chat can trigger full pipeline + generate reports inline
```

The platform was transformed from a search-only tool into a **chat-first conversational assistant**. The 18-agent unified workflow becomes one of the tools the Master Agent can invoke. For simple queries (market data, patent lookup), the Master Agent calls individual agents directly. For "analyze drug X", it triggers the full LangGraph pipeline. The **Unified Brain Architecture** ensures both Search and Chat share the same 18-agent pipeline.

### Master Agent (Conversation Orchestrator)

The Master Agent (`backend/app/agents/master_agent.py`) is the central intelligence that interprets user queries, plans agent routing, and synthesizes responses.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Master Agent Flow                              │
│                                                                  │
│   User Query                                                     │
│       │                                                         │
│       ▼                                                         │
│   ┌───────────────┐                                              │
│   │  LLM Intent   │  Classify: drug_analysis, market_query,     │
│   │ Classification│  patent_lookup, exim_data, clinical_trials,  │
│   │  (Gemini)     │  web_search, file_summary, general, clarify │
│   └───────┬───────┘                                              │
│           │                                                      │
│           ▼                                                      │
│   ┌───────────────┐                                              │
│   │ Entity Extract│  Drug names, indications, regions, periods   │
│   └───────┬───────┘                                              │
│           │                                                      │
│           ▼                                                      │
│   ┌───────────────┐                                              │
│   │ Agent Router  │  Select relevant agents (parallel/sequential)│
│   └───────┬───────┘                                              │
│           │                                                      │
│     ┌─────┼─────┬──────┬──────┬──────┬──────┐                   │
│     ▼     ▼     ▼      ▼      ▼      ▼      ▼                   │
│   IQVIA  EXIM  Patent Clinical Internal Web  Pipeline            │
│                                                                  │
│     └─────┴─────┴──────┴──────┴──────┴──────┘                   │
│           │                                                      │
│           ▼                                                      │
│   ┌───────────────┐                                              │
│   │   Response    │  Markdown + Tables + Charts + PDF Links      │
│   │  Formatter    │  + Suggested Follow-up Queries               │
│   └───────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
```

### 7 EY Worker Agent Groups

All 18 agents are organized into 7 logical groups matching EY's required agent taxonomy. Each group now has pipeline-integrated agents that run in both Search and Chat modes:

| EY Agent Group | Internal Agents | Data Sources | Key Outputs |
|----------------|----------------|--------------|-------------|
| **IQVIA Insights** | MarketDataAgent, MarketAnalyzer, MarketSegmentAnalyzer, **IQVIAPipelineAgent** | WHO GHO, Wikidata, built-in estimates | Market size, CAGR, patient populations, unmet need scores |
| **EXIM Trade** | EXIMAgent, **EXIMPipelineAgent** | Mock data (UN Comtrade patterns) | Import/export volumes, top countries, YoY trends, sourcing insights |
| **Patent Landscape** | PatentAgent (USPTO), OrangeBookAgent | USPTO PatentsView API, FDA Orange Book | Patent filings, expiry timelines, FTO risk, competitive filers |
| **Clinical Trials** | ClinicalTrialsAgent, OpenFDAAgent, DailyMedAgent, RxNormAgent | ClinicalTrials.gov, FDA, NLM | Active trials, phase distribution, adverse events, drug labels |
| **Internal Knowledge** | InternalAgent, FileUploadAgent | ChromaDB vector store (6 pre-loaded docs + uploads) | Document summaries, relevant excerpts, context-aware Q&A |
| **Web Intelligence** | WebIntelligenceAgent, LiteratureAgent, SemanticScholarAgent, **WebIntelligencePipelineAgent** | PubMed, Semantic Scholar, web search | Guidelines, news, publications, real-world evidence |
| **Report Generator** | PDF Generator (Playwright), Excel Generator | All agent outputs | Dark-theme PDF reports, 4-sheet Excel exports, auto-archived |

### Response Formatter

The Response Formatter (`backend/app/utils/response_formatter.py`) transforms raw agent outputs into structured chat-friendly content:

| Format | Structure | Frontend Component |
|--------|-----------|-------------------|
| **Markdown** | Headers, bullets, bold/italic | `RichContent.jsx` (react-markdown) |
| **Table** | `{columns: [...], rows: [...]}` | `TableRenderer.jsx` |
| **Chart** | `{type, labels, datasets}` | `ChartRenderer.jsx` (Recharts) |
| **PDF Link** | `{url, title, description}` | `PdfDownloadCard.jsx` |
| **Suggestions** | `["Follow-up question 1", ...]` | `SuggestedQueries.jsx` |

### Decision Rules Engine

The Decision Rules Engine (`backend/app/decision/rules_engine.py`) applies explicit pharma strategy rules on top of agent data:

| Rule | Trigger Condition | Output Flag |
|------|-------------------|-------------|
| **Whitespace Detection** | High disease burden + low trial activity | "Underexplored indication" |
| **Biosimilar Opportunity** | Patent expiry within 2 years | "Biosimilar entry window" |
| **Formulation Gap** | Oral drug with injection-only competitors | "Reformulation opportunity" |
| **Geographic Arbitrage** | High import volume + no local manufacturing | "Local production opportunity" |
| **Unmet Need Alert** | Unmet need score > 75 + <3 competitors | "High unmet need, low competition" |

### Chat-First UI Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Chat-First Frontend Layout                     │
│                                                                  │
│  ┌──────────────┐  ┌──────────────────────────────────────────┐  │
│  │   Sidebar    │  │              Chat Window                 │  │
│  │              │  │  ┌────────────────────────────────────┐  │  │
│  │ • Chat (/)   │  │  │  Message Thread (scrollable)       │  │  │
│  │ • Dashboard  │  │  │                                    │  │  │
│  │ • Search     │  │  │  [User] "What are unmet needs..."  │  │  │
│  │ • Results    │  │  │                                    │  │  │
│  │ • History    │  │  │  [AI] Agent Activity Indicators     │  │  │
│  │ • Saved      │  │  │       ┌─────────────────────┐      │  │  │
│  │ • Settings   │  │  │       │ Table: Indications  │      │  │  │
│  │              │  │  │       └─────────────────────┘      │  │  │
│  │              │  │  │       ┌─────────────────────┐      │  │  │
│  │              │  │  │       │ Chart: Bar Scores   │      │  │  │
│  │              │  │  │       └─────────────────────┘      │  │  │
│  │              │  │  │       [Download PDF Report]         │  │  │
│  │              │  │  │       [Suggested Questions]         │  │  │
│  │              │  │  └────────────────────────────────────┘  │  │
│  │              │  │  ┌────────────────────────────────────┐  │  │
│  │              │  │  │ Chat Input + Send + File Upload    │  │  │
│  │              │  │  └────────────────────────────────────┘  │  │
│  └──────────────┘  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Chat Components

| Component | File | Purpose |
|-----------|------|---------|
| `ChatWindow` | `components/chat/ChatWindow.jsx` | Scrollable message thread |
| `MessageBubble` | `components/chat/MessageBubble.jsx` | User/AI message with timestamp |
| `RichContent` | `components/chat/RichContent.jsx` | Renders markdown, tables, charts, PDF links |
| `ChatInput` | `components/chat/ChatInput.jsx` | Text input + send + file upload button |
| `AgentActivity` | `components/chat/AgentActivity.jsx` | Animated agent working indicators |
| `SuggestedQueries` | `components/chat/SuggestedQueries.jsx` | Clickable follow-up questions |
| `FileUploadZone` | `components/chat/FileUploadZone.jsx` | Drag-and-drop PDF upload |
| `TableRenderer` | `components/chat/TableRenderer.jsx` | Data tables with color-coded values |
| `ChartRenderer` | `components/chat/ChartRenderer.jsx` | Inline Recharts bar/radar charts |
| `PdfDownloadCard` | `components/chat/PdfDownloadCard.jsx` | Styled PDF download button |

---

## 4. Technology Stack

### Backend Technologies

```
┌─────────────────────────────────────────────────────────┐
│                    Backend Stack                         │
├─────────────────────────────────────────────────────────┤
│  Language        │  Python 3.10+                        │
│  Web Framework   │  FastAPI 0.109+                      │
│  Orchestration   │  LangGraph 0.2+ (LangChain)          │
│  HTTP Client     │  httpx, aiohttp                      │
│  Data Validation │  Pydantic v2                         │
│  WebSocket       │  FastAPI WebSocket                   │
│  PDF Generation  │  Jinja2 + Playwright (Chromium)       │
│  Caching         │  JSON file-based                     │
│  Vector DB       │  ChromaDB                            │
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
│  Animations      │  Framer Motion                       │
│  Icons           │  Lucide React                        │
│  Charts          │  Recharts                            │
│  Real-time       │  Native WebSocket                    │
└─────────────────────────────────────────────────────────┘
```

### External APIs

| API                | Purpose               | Rate Limit | Auth Required |
| ------------------ | --------------------- | ---------- | ------------- |
| PubMed E-utilities | Scientific literature | 3 req/s    | No            |
| ClinicalTrials.gov | Clinical trial data   | 1 req/s    | No            |
| ChEMBL             | Bioactivity data      | 2 req/s    | No            |
| USPTO PatentsView  | Patent landscape      | 5 req/s    | No (free)     |
| FDA Orange Book    | Patent/exclusivity    | N/A        | No            |
| OpenFDA            | Adverse events        | 4 req/s    | No            |
| OpenTargets        | Target-disease assoc. | 10 req/s   | No            |
| WHO GHO            | Disease burden        | None       | No            |
| Wikidata SPARQL    | Epidemiology          | None       | No            |
| Europe PMC         | Literature stats      | None       | No            |
| Google Gemini      | AI synthesis + intent | Per quota  | Yes           |

---

## 5. Multi-Agent System

### Agent Architecture

All agents inherit from `BaseAgent` abstract class:

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
```

### Agent Summary Table

| Tier | Agent | Data Source | Max Results | Key Features |
|------|-------|-------------|-------------|--------------|
| 1 | Literature | PubMed/NCBI | 50 articles | MeSH terms, recency scoring |
| 1 | Clinical Trials | ClinicalTrials.gov | 100 trials | Phase scoring, status tracking |
| 1 | Bioactivity | ChEMBL | 100 activities | IC50 scoring, target mapping |
| 1 | Patent | USPTO PatentsView | 50 patents | Expiry timeline, FTO risk, competitive filers |
| 1 | Internal | Mock DB | Unlimited | Proprietary data simulation |
| 2 | OpenFDA | FDA | 100 events | Adverse events, drug labels |
| 2 | OpenTargets | Open Targets | 50 associations | Target-disease scoring |
| 2 | Semantic Scholar | S2 | 50 papers | Citation analysis |
| 3 | DailyMed | NLM | 20 labels | SPL documents |
| 3 | KEGG | KEGG | 50 pathways | Pathway interactions |
| 3 | UniProt | UniProt | 50 proteins | Protein data |
| 3 | Orange Book | FDA | 50 approvals | Patent/exclusivity |
| 4 | RxNorm | NLM | 20 concepts | Drug nomenclature |
| 4 | WHO | WHO | 50 entries | Essential medicines |
| 4 | DrugBank | DrugBank | 50 interactions | Drug interactions |
| 4 | Market Data | WHO GHO/Wikidata/PMC | N/A | Free epidemiology |
| 5 | **IQVIA Pipeline** | MarketAnalyzer | 14 indications | Scans top therapeutic areas for market size, CAGR, unmet need |
| 5 | **EXIM Pipeline** | EXIM DB | Per drug | Import-export trade data as evidence items |
| 5 | **Web Intel Pipeline** | Web search | 6 results | Guidelines, RWE, news, publications as evidence |

### Agent Execution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Parallel Agent Execution                      │
│                                                                  │
│   asyncio.gather() executes all 18 agents concurrently:         │
│                                                                  │
│   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│   │Lit. │ │Clin.│ │Bio. │ │Pat. │ │FDA  │ │OT   │ │S.Sch│      │
│   └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘      │
│      │       │       │       │       │       │       │          │
│   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│   │Daily│ │KEGG │ │Uni  │ │O.Bk │ │Rx   │ │WHO  │ │D.Bk │      │
│   └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘      │
│      │       │       │       │       │       │       │          │
│   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                               │
│   │Mkt  │ │IQVIA│ │EXIM │ │W.Int│  ← EY Pipeline Wrappers       │
│   └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘                               │
│      │       │       │       │                                   │
│      └───────┴───────┴───────┴───────────────────────┘          │
│                              │                                   │
│                              ▼                                   │
│                    ┌─────────────────┐                          │
│                    │ Aggregate All   │                          │
│                    │ Evidence Items  │                          │
│                    │ (150-500 items) │                          │
│                    └─────────────────┘                          │
│                                                                  │
│   Total execution time: 20-40 seconds (vs 120+ sequential)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 4D Composite Scoring System

### Overview

The platform uses a sophisticated 4-dimensional scoring system that evaluates drug repurposing opportunities across multiple strategic dimensions. Scoring happens in **two phases**: a **base scoring** phase using raw evidence and market data, followed by a **refinement phase** that adjusts scores using deeper comparative, scientific, and market segment analysis.

### Scoring Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    4D Composite Scoring                          │
│                                                                  │
│   PHASE 1: BASE SCORING (from raw evidence + market data)       │
│   ┌─────────────────┐  ┌─────────────────┐                      │
│   │   Scientific    │  │     Market      │                      │
│   │   Evidence      │  │  Opportunity    │                      │
│   │    (40%)        │  │    (25%)        │                      │
│   └────────┬────────┘  └────────┬────────┘                      │
│            │                    │                                │
│            ▼                    ▼                                │
│         ┌──────────────────────────────────────┐                │
│         │     Base Score = Σ(Wi × Si)          │                │
│         └──────────────────────────────────────┘                │
│            ▲                    ▲                                │
│            │                    │                                │
│   ┌────────┴────────┐  ┌────────┴────────┐                      │
│   │  Competitive    │  │  Development    │                      │
│   │   Landscape     │  │  Feasibility    │                      │
│   │    (20%)        │  │    (15%)        │                      │
│   └─────────────────┘  └─────────────────┘                      │
│                                                                  │
│   PHASE 2: ENHANCED REFINEMENT (+/- 20 pts per dimension)       │
│   ┌───────────────────────────────────────────────────────┐     │
│   │  Comparative Analysis    → Competitive & Feasibility  │     │
│   │  Market Segment Details  → Market Opportunity         │     │
│   │  Scientific Mechanism    → Scientific Evidence        │     │
│   │  Safety vs Std of Care   → Competitive & Feasibility  │     │
│   └───────────────────────────────────────────────────────┘     │
│                                                                  │
│   Final Score = Σ(Wi × (Base_Si + Refinement_Si))               │
│   Range: 0-100                                                  │
│                                                                  │
│   Confidence Levels:                                            │
│   • Very High: 85-100  • High: 70-84  • Moderate: 50-69        │
│   • Low: 30-49  • Very Low: 0-29                               │
└─────────────────────────────────────────────────────────────────┘
```

---

### 6.1 Scientific Evidence Score (Weight: 40%)

Evaluates the quality and quantity of scientific evidence supporting the drug-indication pair.

#### Base Formula

```
Base Scientific Score = Evidence Quantity + Source Diversity + Clinical Phase
                      + Evidence Quality + Mechanistic Support

Maximum Base Score: 100 points
```

#### Base Factor Breakdown

| Factor | Max Points | Calculation |
|--------|------------|-------------|
| **Evidence Quantity** | 25 | Based on number of evidence items |
| **Source Diversity** | 20 | 4 points per unique source (max 5 sources) |
| **Clinical Phase** | 25 | Based on highest clinical trial phase |
| **Evidence Quality** | 15 | Average relevance score × 15 |
| **Mechanistic Support** | 15 | Based on bioactivity/target data |

#### Evidence Quantity Scoring

| Evidence Count | Points | Classification |
|----------------|--------|----------------|
| ≥ 20 items | 25 | Strong evidence base |
| 10-19 items | 20 | Good evidence base |
| 5-9 items | 15 | Moderate evidence base |
| < 5 items | count × 3 | Limited evidence |

#### Clinical Phase Scoring

| Phase | Points | Description |
|-------|--------|-------------|
| Phase 4 / Post-Market | 25 | Highest confidence - real-world data |
| Phase 3 | 20 | Efficacy validation trials |
| Phase 2 | 15 | Dose-finding studies |
| Phase 1 | 10 | Early safety studies |
| No clinical data | 0 | Pre-clinical only |

#### Mechanistic Support Scoring

| Bioactivity/Target Evidence | Points |
|-----------------------------|--------|
| ≥ 5 mechanistic evidence items | 15 |
| 2-4 mechanistic evidence items | 10 |
| 1 mechanistic evidence item | 5 |
| None | 0 |

*Mechanistic sources: bioactivity (ChEMBL), opentargets, kegg, uniprot*

#### Enhanced Refinement: Scientific Evidence (cap: +/- 20 pts)

After base scoring, the scientific score is refined using detailed mechanism and publication data extracted from the scientific analysis:

| Refinement Factor | Condition | Points | Rationale |
|-------------------|-----------|--------|-----------|
| **Binding Affinity** | < 10 nM | +8 | Sub-10nM = highly potent, druggable target |
| | 10-100 nM | +5 | Good affinity |
| | 100-1000 nM | +2 | Moderate affinity |
| | > 10,000 nM | -3 | Weak binder, less likely effective |
| **Pathway Relevance** | ≥ 4 pathways | +5 | Polypharmacology support |
| | 2-3 pathways | +3 | Some pathway overlap |
| **Publication Quality** | Max citations ≥ 500 | +6 | Landmark paper validates hypothesis |
| | Max citations ≥ 100 | +3 | Well-cited evidence |
| **Mechanistic Rationale** | Contains pathway/mechanism keywords | +4 | Clear mechanistic link to indication |
| **Biomarker Availability** | ≥ 3 biomarkers | +4 | Strong biomarker panel for trial design |
| | 1-2 biomarkers | +2 | Some biomarker guidance |
| | 0 biomarkers | -2 | No biomarkers = harder trial design |

*Data source: `ScientificDetails` from the scientific extractor*

---

### 6.2 Market Opportunity Score (Weight: 25%)

Evaluates the commercial potential and market attractiveness of the indication.

#### Base Formula

```
Base Market Score = Market Size + Growth Rate + Unmet Need + Pricing Potential

Maximum Base Score: 100 points
```

#### Base Factor Breakdown

| Factor | Max Points | Calculation |
|--------|------------|-------------|
| **Market Size** | 30 | Based on market size in USD billions |
| **Growth Rate (CAGR)** | 20 | Based on compound annual growth rate |
| **Unmet Need** | 30 | (unmet_need_score / 100) × 30 |
| **Pricing Potential** | 20 | Based on pricing tier |

#### Market Size Scoring

| Market Size | Points | Classification |
|-------------|--------|----------------|
| ≥ $50 billion | 30 | Mega market |
| $10-49 billion | 25 | Large market |
| $1-9 billion | 20 | Medium market |
| < $1 billion | 10 | Small market |

#### Growth Rate (CAGR) Scoring

| CAGR | Points |
|------|--------|
| ≥ 10% | 20 |
| 7-9% | 15 |
| 5-6% | 10 |
| < 5% | 5 |

#### Pricing Potential Scoring

| Pricing Tier | Points | Description |
|--------------|--------|-------------|
| Premium | 20 | Specialty/orphan drug pricing |
| Standard | 15 | Brand pricing |
| Generic | 10 | Generic drug pricing |

#### Enhanced Refinement: Market Opportunity (cap: +/- 20 pts)

Base market scoring uses broad indication-level estimates. The refinement uses the **target market segment** analysis to adjust with more granular segment-level data:

| Refinement Factor | Condition | Points | Rationale |
|-------------------|-----------|--------|-----------|
| **Segment Unmet Need** | very_high | +8 | Segment-specific unmet need is more precise |
| | high | +4 | |
| | moderate | 0 | Already captured in base |
| | low | -5 | Segment is well-served despite broad indication need |
| **Segment Growth Rate** | ≥ 20% CAGR | +7 | Rapidly growing segment = timing advantage |
| | ≥ 12% CAGR | +4 | Above-average growth |
| | ≥ 8% CAGR | +2 | |
| | < 5% CAGR | -3 | Stagnant segment |
| **Segment Competition** | low | +7 | Blue ocean segment within broader indication |
| | medium | +2 | |
| | high | -4 | Crowded even at segment level |

*Data source: `MarketSegment` from the market segment analyzer*

#### Data Sources for Market Data

```
┌─────────────────────────────────────────────────────────────────┐
│                    Market Data Hierarchy                         │
│                                                                  │
│   1. Real-time APIs (if available)                              │
│      └─ WHO GHO, Wikidata SPARQL, Europe PMC                    │
│                                                                  │
│   2. Built-in Market Estimates (50+ indications)                │
│      └─ Based on GBD 2023, WHO Reports, Public Market Data      │
│                                                                  │
│   3. Smart Indication Matching                                   │
│      └─ Abbreviation mapping (60+ terms)                        │
│      └─ Fuzzy matching with Jaccard similarity                  │
│      └─ Category-based fallback                                 │
│                                                                  │
│   4. Default Estimates (for unknown indications)                │
│      └─ Market size: $5B, CAGR: 6%, Unmet need: 50             │
└─────────────────────────────────────────────────────────────────┘
```

---

### 6.3 Competitive Landscape Score (Weight: 20%)

Evaluates competition level (higher score = less competition = better opportunity).

#### Base Formula

```
Base Competitive Score = Starting Score (80) - Competitor Deductions

Starting Score: 80 points
Minimum Score: 10 points
```

#### Base Deduction Factors

| Factor | Max Deduction | Calculation |
|--------|---------------|-------------|
| **Competitor Count** | -40 | Based on total number of competitors |
| **Approved Competition** | -30 | Based on approved/late-stage drugs |
| **Big Pharma** | -20 | If major pharma companies are involved |

#### Competitor Count Deductions

| Competitors | Deduction | Interpretation |
|-------------|-----------|----------------|
| ≥ 10 competitors | -40 | Crowded space |
| 5-9 competitors | -25 | Competitive space |
| 2-4 competitors | -15 | Moderate competition |
| 0-1 competitors | 0 | Limited competition |

#### Approved Competition Deductions

| Competitive Status | Deduction |
|--------------------|-----------|
| Approved drugs exist | -30 |
| ≥ 3 Phase 3 trials | -25 |
| 1-2 Phase 3 trials | -15 |
| No late-stage competition | 0 |

#### Inferred Competition (when no competitor data)

If detailed competitor data is unavailable, competition is inferred from clinical trial evidence:

| Clinical Trial Evidence | Deduction |
|-------------------------|-----------|
| > 10 clinical trial items | -20 (suggests active interest) |
| ≤ 10 clinical trial items | 0 |

#### Enhanced Refinement: Competitive Landscape (cap: +/- 20 pts)

The base competitive score counts competitors. The refinement evaluates **differentiation quality** - does this drug have real advantages over existing treatments?

| Refinement Factor | Condition | Points | Rationale |
|-------------------|-----------|--------|-----------|
| **High-Impact Advantages** | ≥ 3 high-impact | +8 | Strong differentiation across multiple axes |
| | 2 high-impact | +5 | |
| | 1 high-impact | +3 | |
| **Advantage Breadth** | ≥ 3 categories (dosing, safety, cost, etc.) | +4 | Broad differentiation |
| | 2 categories | +2 | |
| **Safety Advantage Score** | ≥ 0.5 (much safer than SOC) | +8 | Major safety differentiation |
| | 0.2 to 0.49 | +4 | Somewhat safer |
| | -0.2 to 0.19 | 0 | Comparable safety |
| | -0.5 to -0.21 | -5 | Worse safety profile |
| | < -0.5 | -10 | Significantly worse safety |

*Data sources: `ComparativeAdvantage` list and `SideEffectComparison` from comparative analyzer*

---

### 6.4 Development Feasibility Score (Weight: 15%)

Evaluates how practical it is to develop the drug for the new indication.

#### Base Formula

```
Base Feasibility Score = Starting Score (50) + Safety Data + Regulatory Pathway
                       + Patent Status + Orphan Drug Potential

Starting Score: 50 points
Maximum Score: 100 points
```

#### Base Factor Breakdown

| Factor | Max Points | Calculation |
|--------|------------|-------------|
| **Safety Data** | +20 | Based on FDA safety profile |
| **Regulatory Pathway** | +15 | Based on existing labeling |
| **Patent Status** | +15 | Based on patent expiration |
| **Orphan Drug Potential** | +10 | If orphan drug criteria met |

#### Safety Data Scoring

| Safety Evidence | Points | Source |
|-----------------|--------|--------|
| FDA safety data available (OpenFDA) | +20 | Established safety profile |
| No FDA safety data | 0 | Unknown safety profile |

#### Regulatory Pathway Scoring

| Pathway Evidence | Points | Interpretation |
|------------------|--------|----------------|
| Existing FDA labeling (DailyMed/OpenFDA labels) | +15 | 505(b)(2) pathway potential |
| Some regulatory data | +5 | Standard pathway |
| No regulatory data | +5 | Standard pathway expected |

#### Patent Status Scoring

| Patent Status | Points | Interpretation |
|---------------|--------|----------------|
| Expired | +15 | Generic entry possible |
| Expiring soon | +10 | Near-term opportunity |
| Active/Unknown | 0 | Potential IP barriers |

#### Orphan Drug Potential

| Orphan Drug Status | Points |
|--------------------|--------|
| Meets orphan drug criteria | +10 |
| Does not qualify | 0 |

#### Enhanced Refinement: Development Feasibility (cap: +/- 20 pts)

The refinement uses safety comparison data and scientific readiness indicators to adjust how feasible development really is:

| Refinement Factor | Condition | Points | Rationale |
|-------------------|-----------|--------|-----------|
| **Safety for Development** | Safety advantage ≥ 0.3 | +7 | Fewer side effects = easier regulatory path, lower dropout |
| | Safety advantage 0 to 0.29 | +2 | |
| | Safety advantage < 0 | -4 | More side effects than SOC = harder development |
| **Biomarker Trial Design** | ≥ 3 biomarkers | +7 | Enables enrichment strategy, smaller/faster trials |
| | 1-2 biomarkers | +3 | Some enrichment possible |
| **Preclinical Models** | ≥ 3 models | +6 | Strong preclinical package for IND filing |
| | 1-2 models | +3 | |
| | 0 models | -2 | More preclinical work needed |
| **Selectivity Profile** | "selective" drug | +3 | Selective drugs have cleaner safety profiles |
| | "non-selective" drug | -2 | Off-target effects likely |

*Data sources: `SideEffectComparison` and `ScientificDetails`*

---

### 6.5 Overall Score Calculation

The final composite score combines all four dimensions with their respective weights:

```
Final Dimension Score = Base Score + Refinement (capped at +/- 20)
Final Dimension Score = clamp(0, 100)

Overall Score = (Scientific × 0.40) + (Market × 0.25)
             + (Competitive × 0.20) + (Feasibility × 0.15)
```

The refinement cap of +/- 20 per dimension means the maximum overall score shift from refinement is approximately +/- 20 points (when all dimensions shift in the same direction), which is significant enough to change rankings meaningfully but only when the enhanced data strongly supports it.

### Scoring Example (with Refinement)

```
Drug: Sildenafil
Indication: Pulmonary Arterial Hypertension

┌─────────────────────────────────────────────────────────────────────────────┐
│ Dimension                │ Base  │ Refine │ Final │ Weight │ Weighted      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Scientific Evidence      │  72   │  +20   │  92   │  40%   │   36.8       │
│  BASE FACTORS:                                                             │
│  ├─ Evidence Quantity    │  20   │        │       │        │  10+ items    │
│  ├─ Source Diversity     │  16   │        │       │        │  4 sources    │
│  ├─ Clinical Phase       │  20   │        │       │        │  Phase 3      │
│  ├─ Evidence Quality     │   8   │        │       │        │  0.53 avg     │
│  └─ Mechanistic Support  │   8   │        │       │        │  2+ items     │
│  REFINEMENT FACTORS:                                                       │
│  ├─ Binding Affinity     │       │   +8   │       │        │  3.9 nM       │
│  ├─ Pathway Relevance    │       │   +5   │       │        │  4 pathways   │
│  ├─ Publication Quality  │       │   +3   │       │        │  200+ cites   │
│  ├─ Mechanistic Rationale│       │   +4   │       │        │  PDE5→cGMP    │
│  └─ Biomarker Avail.     │       │   +4   │       │        │  3 biomarkers │
│                          │       │(+24→+20 capped)│        │              │
├─────────────────────────────────────────────────────────────────────────────┤
│ Market Opportunity       │  65   │  +19   │  84   │  25%   │   21.0       │
│  BASE: Market Size=20, CAGR=10, Unmet Need=20, Pricing=15                 │
│  REFINEMENT:                                                               │
│  ├─ Segment Unmet Need   │       │   +8   │       │        │  very_high    │
│  ├─ Segment Growth       │       │   +4   │       │        │  12% CAGR     │
│  └─ Segment Competition  │       │   +7   │       │        │  low          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Competitive Landscape    │  35   │  +11   │  46   │  20%   │    9.2       │
│  BASE: 80 - 25(competitors) - 20(big pharma)                              │
│  REFINEMENT:                                                               │
│  ├─ High-Impact Advant.  │       │   +5   │       │        │  2 high       │
│  ├─ Advantage Breadth    │       │   +2   │       │        │  2 categories │
│  └─ Safety Advantage     │       │   +4   │       │        │  score: 0.3   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Development Feasibility  │  70   │  +20   │  90   │  15%   │   13.5       │
│  BASE: 50 + 20(FDA safety) + 0(patent)                                    │
│  REFINEMENT:                                                               │
│  ├─ Safety for Dev.      │       │   +7   │       │        │  score: 0.3   │
│  ├─ Biomarker Trial      │       │   +7   │       │        │  3 biomarkers │
│  ├─ Preclinical Models   │       │   +3   │       │        │  2 models     │
│  └─ Selectivity          │       │   +3   │       │        │  41x selective│
│                          │       │(+20 capped)    │        │              │
├─────────────────────────────────────────────────────────────────────────────┤
│ OVERALL (before refine)  │       │        │       │        │   62.6       │
│ OVERALL (after refine)   │       │        │       │        │   80.5  HIGH │
│ Score improvement: +17.9 from enhanced analysis                            │
└─────────────────────────────────────────────────────────────────────────────┘

Note: Sildenafil (as Revatio) IS an approved PAH drug - the high refined score
correctly reflects this validated opportunity.
```

### Data Completeness

Each dimension also tracks data completeness (0-1 scale). Refinement adds +0.05 to each dimension's completeness:

| Dimension | Full Data | Partial Data | No Data |
|-----------|-----------|--------------|---------|
| Scientific | 1.0 (10+ items) | count/10 | 0 |
| Market | 0.9 (API data) | 0.3 (estimates) | 0.3 |
| Competitive | 0.9 (full data) | 0.3 (inferred) | 0.3 |
| Feasibility | 0.8 (patent data) | 0.5 (partial) | 0.5 |

### Refinement Transparency

All refinement data is stored transparently in each dimension's `factors` dict:
- `_base_score`: The original score before refinement
- `_refinement_total`: The total adjustment applied (capped at +/- 20)
- `_ref_<factor_name>`: Individual refinement factor values (e.g., `_ref_binding_affinity: 8`)

This allows the frontend to show both base and refined scores for full transparency.

---

## 7. Free Market Data Integration

### Overview

The platform provides comprehensive market analysis **without requiring paid data sources**. This is achieved through a 3-tier fallback system.

### Data Source Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    Market Data Fallback Chain                    │
│                                                                  │
│   TIER 1: Premium APIs (if configured)                          │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ IQVIA, Evaluate Pharma, Cortellis, etc.                 │   │
│   │ (Enterprise subscriptions - not required)               │   │
│   └─────────────────────────────────────────────────────────┘   │
│                         │ Not available                         │
│                         ▼                                       │
│   TIER 2: Free Epidemiology APIs                                │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ WHO Global Health Observatory                            │   │
│   │   - Disease burden (DALYs)                               │   │
│   │   - Mortality rates                                      │   │
│   │   - ICD-10 code mapping                                  │   │
│   │                                                          │   │
│   │ Wikidata SPARQL                                          │   │
│   │   - Global prevalence                                    │   │
│   │   - Patient populations                                  │   │
│   │   - Incidence rates                                      │   │
│   │                                                          │   │
│   │ Europe PMC                                               │   │
│   │   - Literature-derived epidemiology                      │   │
│   │   - Prevalence mentions in abstracts                     │   │
│   └─────────────────────────────────────────────────────────┘   │
│                         │ API unavailable                       │
│                         ▼                                       │
│   TIER 3: Built-in Estimates                                    │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ 50+ therapeutic areas with:                              │   │
│   │   - Market size ($ billions)                             │   │
│   │   - CAGR (%)                                             │   │
│   │   - Patient population (millions)                        │   │
│   │   - Unmet need score                                     │   │
│   │   - Pricing potential                                    │   │
│   │                                                          │   │
│   │ Sources: GBD 2023, WHO Reports, Public Market Data       │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Built-in Therapeutic Areas (50+)

| Category | Indications |
|----------|-------------|
| **Oncology** | Cancer, Breast cancer, Lung cancer, Colorectal cancer, Prostate cancer, Liver cancer, Pancreatic cancer, Leukemia, Lymphoma, Melanoma, Brain cancer |
| **Neurology** | Alzheimer's, Parkinson's, Multiple Sclerosis, Epilepsy, Migraine, ALS, Huntington's, Neuropathy, Stroke, Dementia |
| **Psychiatry** | Depression, Anxiety, Schizophrenia, Bipolar disorder, PTSD, ADHD, OCD |
| **Autoimmune** | Rheumatoid Arthritis, Lupus, Crohn's disease, Ulcerative colitis, Psoriasis, Eczema, Ankylosing spondylitis |
| **Cardiovascular** | Hypertension, Heart failure, Atrial fibrillation, Coronary artery disease, DVT, Pulmonary embolism |
| **Respiratory** | Asthma, COPD, Pulmonary fibrosis, Pulmonary hypertension, Cystic fibrosis |
| **Metabolic** | Diabetes (Type 1 & 2), Obesity, Hyperlipidemia, Gout, NAFLD/NASH, Thyroid disorders |
| **Infectious** | HIV, Hepatitis (B & C), Tuberculosis, Malaria, COVID-19, Influenza, Pneumonia |
| **Other** | Chronic kidney disease, Pain, Osteoporosis, Endometriosis, Macular degeneration, Glaucoma |

---

## 8. Smart Indication Matching

### Overview

The platform uses sophisticated matching algorithms to correctly identify market data for medical terms, abbreviations, and compound conditions.

### 6-Step Matching Algorithm

```
┌─────────────────────────────────────────────────────────────────┐
│                    Indication Matching Pipeline                  │
│                                                                  │
│   Input: "T2DM with diabetic nephropathy"                       │
│                                                                  │
│   Step 1: Abbreviation Lookup                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Check ABBREVIATION_MAP (60+ entries)                     │   │
│   │ "T2DM" → "type 2 diabetes"                               │   │
│   │ Result: MATCH FOUND → return diabetes estimates          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                         │ No match                              │
│                         ▼                                       │
│   Step 2: Exact Substring Match                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ for key in MARKET_ESTIMATES:                             │   │
│   │     if key in indication_lower:                          │   │
│   │         return estimates[key]                            │   │
│   └─────────────────────────────────────────────────────────┘   │
│                         │ No match                              │
│                         ▼                                       │
│   Step 3: Reverse Match                                         │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ for key in MARKET_ESTIMATES:                             │   │
│   │     if indication_lower in key:                          │   │
│   │         return estimates[key]                            │   │
│   └─────────────────────────────────────────────────────────┘   │
│                         │ No match                              │
│                         ▼                                       │
│   Step 4: Roman Numeral Normalization                           │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ "Type II" → "Type 2"                                     │   │
│   │ "Phase III" → "Phase 3"                                  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                         │ No match                              │
│                         ▼                                       │
│   Step 5: Word-based Jaccard Similarity                         │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Calculate word overlap between indication and keys       │   │
│   │ similarity = |common_words| / max(|words1|, |words2|)   │   │
│   │ Threshold: 50% overlap required                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                         │ No match                              │
│                         ▼                                       │
│   Step 6: Category-based Fallback                               │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ "tumor" → cancer                                         │   │
│   │ "carcinoma" → cancer                                     │   │
│   │ "hepatic" → hepatitis                                    │   │
│   │ "renal" → chronic kidney disease                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                         │ No match                              │
│                         ▼                                       │
│   Return DEFAULT_ESTIMATES                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Medical Abbreviation Map (60+ entries)

```python
ABBREVIATION_MAP = {
    # Diabetes
    "t2dm": "type 2 diabetes",
    "t1dm": "type 1 diabetes",
    "niddm": "type 2 diabetes",
    "iddm": "type 1 diabetes",

    # Oncology
    "nsclc": "lung cancer",
    "sclc": "lung cancer",
    "hcc": "liver cancer",
    "crc": "colorectal cancer",
    "rcc": "kidney cancer",
    "aml": "leukemia",
    "cml": "leukemia",
    "dlbcl": "lymphoma",
    "gbm": "brain cancer",

    # Autoimmune
    "ra": "rheumatoid arthritis",
    "sle": "lupus",
    "ibd": "inflammatory bowel disease",
    "uc": "ulcerative colitis",
    "cd": "crohn's disease",

    # Neurological
    "ms": "multiple sclerosis",
    "als": "amyotrophic lateral sclerosis",
    "ad": "alzheimer",
    "pd": "parkinson",

    # Cardiovascular
    "chf": "heart failure",
    "af": "atrial fibrillation",
    "cad": "coronary artery disease",
    "pah": "pulmonary hypertension",

    # Respiratory
    "copd": "copd",
    "ipf": "pulmonary fibrosis",
    "cf": "cystic fibrosis",

    # Metabolic
    "nafld": "fatty liver",
    "nash": "fatty liver",
    "ckd": "chronic kidney disease",

    # Infectious
    "hiv": "hiv",
    "hcv": "hepatitis c",
    "hbv": "hepatitis b",
    "tb": "tuberculosis",

    # Psychiatry
    "mdd": "depression",
    "gad": "anxiety",
    "ptsd": "post-traumatic stress",
    "adhd": "attention deficit disorder",
    # ... 60+ total entries
}
```

---

## 9. Workflow Orchestration

### LangGraph Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    LangGraph Workflow                            │
│                                                                  │
│      START                                                       │
│        │                                                         │
│        ▼                                                         │
│  ┌───────────────┐                                              │
│  │  initialize   │  • Set timestamp                             │
│  │    search     │  • Initialize 18-agent progress tracking     │
│  │               │  • Prepare agent list                        │
│  └───────┬───────┘                                              │
│          │                                                       │
│          ▼                                                       │
│  ┌───────────────┐                                              │
│  │  run_agents   │  • Execute 18 agents in parallel             │
│  │   parallel    │  • asyncio.gather() for concurrency          │
│  │               │  • WebSocket progress updates                │
│  └───────┬───────┘                                              │
│          │                                                       │
│          ▼                                                       │
│  ┌───────────────┐                                              │
│  │   aggregate   │  • Combine evidence from all agents          │
│  │   evidence    │  • Deduplicate by indication                 │
│  │               │  • Total: 100-400+ evidence items            │
│  └───────┬───────┘                                              │
│          │                                                       │
│          ▼                                                       │
│  ┌───────────────┐                                              │
│  │ 4D composite  │  • Scientific Evidence scoring               │
│  │   scoring     │  • Market Opportunity scoring                │
│  │  (base pass)  │  • Competitive Landscape scoring             │
│  │               │  • Development Feasibility scoring           │
│  │               │  • Fetch free market data (WHO/Wikidata)     │
│  └───────┬───────┘                                              │
│          │                                                       │
│          ▼                                                       │
│  ┌───────────────┐                                              │
│  │   analyze     │  • Compare vs standard of care treatments    │
│  │ comparatives  │  • Identify advantages (dosing, safety, etc) │
│  │               │  • Target market segment analysis            │
│  │               │  • Scientific mechanism extraction           │
│  └───────┬───────┘                                              │
│          │                                                       │
│          ▼                                                       │
│  ┌───────────────┐                                              │
│  │   refine      │  • Adjust scores with enhanced data          │
│  │   scores      │  • +/-20 cap per dimension                   │
│  │               │  • Re-sort by refined overall score          │
│  │               │  • Graceful fallback if no enhanced data     │
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

---

## 10. Decision Rules Engine

### Overview

The Decision Rules Engine (`backend/app/decision/rules_engine.py`) applies strategic pharma heuristics on top of agent data to automatically flag high-value opportunities. These flags appear in chat responses and PDF reports.

### Rule Categories

```
┌─────────────────────────────────────────────────────────────────┐
│                    Decision Rules Engine                          │
│                                                                  │
│   Input: Enhanced opportunity data (agents + scoring + market)   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Rule 1: WHITESPACE DETECTION                             │   │
│   │   Condition: High disease burden + low clinical trial    │   │
│   │              activity for the drug-indication pair       │   │
│   │   Output: "Underexplored therapeutic opportunity"        │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Rule 2: BIOSIMILAR OPPORTUNITY                           │   │
│   │   Condition: Biologic drug with patent expiry within     │   │
│   │              2 years or already expired                   │   │
│   │   Output: "Biosimilar entry window open"                 │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Rule 3: FORMULATION GAP                                  │   │
│   │   Condition: Drug available orally but competitors are   │   │
│   │              injection-only for this indication           │   │
│   │   Output: "Reformulation opportunity"                    │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Rule 4: GEOGRAPHIC ARBITRAGE                             │   │
│   │   Condition: High import volume for API + no local       │   │
│   │              manufacturing in target region               │   │
│   │   Output: "Local production opportunity"                 │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Rule 5: UNMET NEED ALERT                                 │   │
│   │   Condition: Unmet need score > 75 AND < 3 competitors   │   │
│   │   Output: "High unmet need with low competition"         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   Output: List of opportunity flags appended to synthesis       │
└─────────────────────────────────────────────────────────────────┘
```

### Integration Points

- **Chat responses**: Decision flags appear as a "Decision Intelligence Flags" section in the synthesis
- **PDF reports**: Flags included in the executive summary and opportunity deep dives
- **Full pipeline**: Runs after `analyze_comparatives` and feeds into `synthesize`

### Regulatory Pathway Advisor

The Regulatory Pathway Advisor (`backend/app/decision/regulatory_advisor.py`) is a rules-based system that recommends FDA regulatory pathways for each drug repurposing opportunity.

#### Pathway Recommendations

| Pathway | Criteria | Timeline | Key Benefit |
|---------|----------|----------|-------------|
| **505(b)(2)** | Drug has existing FDA labeling for another indication | 2-3 years | Abbreviated approval, can reference existing safety data |
| **Fast Track** | Targets serious/life-threatening condition (32+ keywords: cancer, HIV, Alzheimer's, heart failure, etc.) | Standard + expedited review | Rolling review, more frequent FDA meetings |
| **Orphan Drug** | Targets rare disease (25+ keywords: rare, orphan, muscular dystrophy, cystic fibrosis, etc.) | Standard | 7-year market exclusivity, tax credits, fee waivers |
| **Breakthrough Therapy** | Substantial improvement over existing treatments + preliminary clinical evidence | Standard + priority review | Intensive FDA guidance, rolling review |
| **Standard NDA/BLA** | Default pathway when no special criteria met | 4-6 years | Full approval pathway |

#### Output Structure

```
{
    "recommended_pathway": "505(b)(2)",
    "timeline_estimate": "2-3 years",
    "cost_estimate": "$50M-$100M",
    "eligibility_flags": {
        "fast_track": true,
        "orphan_drug": false,
        "breakthrough": false
    }
}
```

#### Frontend Integration

- **RegulatoryPathway.jsx** (`components/results/RegulatoryPathway.jsx`): Displays pathway recommendation cards with timeline and cost estimates for each drug-indication pair
- **StrategicBrief.jsx** (`components/results/StrategicBrief.jsx`): Executive-level investment summary with GO / INVESTIGATE / NO-GO recommendation:

| Decision | Score Threshold | Meaning |
|----------|----------------|---------|
| **GO** | Overall score ≥ 70 | Strong opportunity — proceed with development planning |
| **INVESTIGATE** | Score 50-69 | Promising but needs more data — conduct targeted studies |
| **NO-GO** | Score < 50 | Weak opportunity — deprioritize or reconsider |

The Strategic Brief also includes development timeline estimates, cost ranges, top 3 opportunities summary, and key risk factors extracted from the synthesis.

---

## 11. Validation & Evaluation Strategy

### Known Drug Validation

| Drug | Original Indication | Known Repurposed Use | System Detection |
|------|---------------------|----------------------|------------------|
| Sildenafil | Angina | ED, Pulmonary hypertension | Detected in top 3 |
| Thalidomide | Morning sickness | Multiple myeloma, leprosy | Detected in top 5 |
| Metformin | Type 2 diabetes | Cancer (research phase) | Detected with high evidence |
| Aspirin | Pain/fever | Cardiovascular prevention | Detected in top 3 |
| Minoxidil | Hypertension | Hair loss | Detected |

### Performance Metrics

| Metric | Value |
|--------|-------|
| Average Search Time | 15-30 seconds |
| Evidence Items per Search | 100-400 |
| Parallel Agent Execution | 15 concurrent |
| Cache Hit Response | <100ms |
| Market Coverage | 50+ therapeutic areas |
| Abbreviation Recognition | 60+ terms |

---

## 12. API Reference

### REST Endpoints

#### Chat (Primary Interface)
```
POST /api/chat/message
{
    "message": "What are the biggest unmet needs in oncology?",
    "conversation_id": "conv-123",
    "conversation_history": [...],
    "uploaded_file_ids": []
}

Response: ConversationResponse with:
- response_type: "analysis" | "table" | "chart" | "clarification" | "general"
- content: Markdown-formatted text
- tables: [{columns: [...], rows: [...]}]
- charts: [{type, labels, datasets}]
- pdf_url: Download link (if report generated)
- suggestions: ["Follow-up question 1", ...]
- agent_activities: [{agent, status, duration}]
```

#### Search Drug (Pipeline)
```
POST /api/search
{
    "drug_name": "Metformin",
    "context": {},
    "force_refresh": false,
    "session_id": "session-123"
}

Response: SearchResponse with:
- ranked_indications (basic scoring)
- enhanced_indications (4D composite scoring)
- all_evidence
- synthesis (LLM analysis)
- execution_time
```

#### File Upload
```
POST /api/files/upload                    → Upload PDF, returns file_id + summary
GET  /api/files/{file_id}/summary         → Get file summary
GET  /api/files                           → List uploaded files
```

#### Export
```
POST /api/export/pdf                      → Full drug analysis PDF report
POST /api/export/opportunity-pdf          → Single-opportunity mini report
POST /api/export/excel                    → 4-sheet Excel report (Summary, Opportunities, Evidence, Market)
POST /api/export/json                     → JSON data export
```

#### Report Archival
```
GET  /api/reports                         → List all archived reports
GET  /api/reports/drug/{drug_name}        → Reports for specific drug
GET  /api/reports/{report_id}             → Report metadata
GET  /api/reports/{report_id}/download    → Download report file (PDF/Excel)
DELETE /api/reports/{report_id}           → Delete archived report
```

#### Conversation Management
```
GET  /api/chat/conversations              → List all conversations (sidebar)
GET  /api/chat/conversations/{id}         → Full conversation with messages
DELETE /api/chat/conversations/{id}       → Delete conversation
```

#### Integrations
```
GET  /api/integrations                    → List all data sources
POST /api/integrations/{id}/enable        → Enable integration
POST /api/integrations/{id}/disable       → Disable integration
PUT  /api/integrations/{id}/configure     → Set API key
```

#### Drug Comparison
```
POST /api/compare
{
    "drug_names": ["Metformin", "Aspirin"]    // 2-3 drug names (must have cached results)
}

Response: CompareResponse with:
- drugs: [{drug_name, cached, indication_count, evidence_count, scores: {overall, scientific_evidence, market_opportunity, competitive_landscape, development_feasibility}, indications: [...]}]
- overlapping_indications: ["cancer", "diabetes", ...]
- unique_indications: {"Metformin": [...], "Aspirin": [...]}
- comparison_summary: "Compared 2 drugs..."
```

#### Drug Quick Lookup
```
GET /api/drug-info/{drug_name}

Response: DrugInfoResponse with:
- drug_name, generic_name, brand_names[], drug_class
- mechanism, approved_indications[], manufacturer, route
- Uses OpenFDA API with 24hr local cache (data/cache/drug_info/)
```

#### Market Analysis
```
POST /api/market/analyze
{
    "drug_name": "Metformin",
    "indications": ["Diabetes", "Cancer"],
    "include_competitors": true,
    "max_indications": 10
}

Response: MarketAnalysisResponse with per-indication:
- estimated_market_size_usd, patient_population_global, patient_population_us
- cagr_percent, unmet_need_score, existing_treatments_count
- average_treatment_cost_usd, potential_price_premium
- geographic_hotspots[], key_competitors[]
```

#### Authentication
```
POST /api/auth/register                   → User registration (email, password, fullName, username)
POST /api/auth/login                      → JWT login (returns access token)
GET  /api/auth/me                         → Current user profile (requires JWT)
GET  /api/auth/status                     → Auth system status check
POST /api/auth/change-password            → Change password (requires JWT)
```

#### Cache Operations
```
POST /api/search/cache/clear              → Clear all cache
GET  /api/search/cache/stats              → Cache statistics
DELETE /api/search/cache/{drug_name}      → Clear cache for specific drug
```

### WebSocket

```
Connect: ws://localhost:8000/ws/{session_id}

Message Types:
- connection: Session established
- agent_progress: Individual agent status with EY display names
    {agent_name, display_name, status, message, data}
- workflow_status: Current stage
- complete: Search finished
- error: Agent or workflow error
```

---

## 13. Frontend Architecture

### Pages

| Page | Route | Description |
|------|-------|-------------|
| **Chat** | `/chat` (default) | **Primary interface** — conversational AI with rich responses, 10 welcome suggestions, conversation sidebar with persistence |
| Dashboard | `/dashboard` | Overview with recent searches, quick actions |
| Search | `/search` | Drug search with 7 Worker Agent groups (collapsible to 18 individual sources) |
| Results | `/results/:drug` | Detailed results with 4D scores, regulatory pathway, strategic brief |
| History | `/history` | Previous searches + **Archived Reports tab** with download/delete |
| Saved | `/saved` | Saved opportunities |
| **Compare** | `/compare` | Compare 2-3 drugs side-by-side with 4D scores, overlapping/unique indications, AI summary |
| **Login** | `/login` | User authentication — login/register toggle, email + password + profile fields |
| Settings | `/settings` | Account profile, notifications, privacy, data & storage (cache clear, history management) |
| Integrations | `/integrations` | Data source configuration, enable/disable agents, API key management |

### State Management (Zustand)

```javascript
{
  // Persisted state (survives page reload via localStorage)
  user: null,                     // User profile (JWT auth)
  searchHistory: [],              // Last 50 searches with drug names and scores
  savedOpportunities: [],         // Bookmarked drug-indication opportunities
  sidebarCollapsed: false,        // Sidebar visibility toggle
  theme: 'dark',                  // 'dark' or 'light' (theme toggle)

  // Chat state
  conversations: [],              // List of {id, title, created_at, messages[]}
  activeConversationId: null,
  uploadedFiles: [],              // {id, name, status, size}
  agentActivities: [],            // Live agent status during processing

  // Session state (cleared on reload)
  currentSearch: null,
  agentProgress: {},              // 18 agents tracked (7 EY groups)
  activeTab: 'opportunities',     // Current results tab
  selectedIndication: null,       // Currently viewed indication detail

  // Actions
  createConversation: () => {...},
  addMessage: (conversationId, message) => {...},
  setAgentActivity: (activities) => {...},
  addUploadedFile: (file) => {...},
  setUser: (user) => {...},
  addToHistory: (search) => {...},
  deleteFromHistory: (drugName, timestamp) => {...},
  clearHistory: () => {...},
  setAgentProgress: (progress) => {...},
  toggleSidebar: () => {...},
  toggleTheme: () => {...},
}
```

### Frontend Components

#### Common/Shared Components

| Component | File | Purpose |
|-----------|------|---------|
| `Button` | `components/common/Button.jsx` | Styled button with variants |
| `Card` | `components/common/Card.jsx` | Dark-themed card container |
| `Badge` | `components/common/Badge.jsx` | Status/label badge |
| `Modal` | `components/common/Modal.jsx` | Animated modal dialog |
| `Tooltip` | `components/common/Tooltip.jsx` | Hover tooltip |
| `Skeleton` | `components/common/Skeleton.jsx` | Loading skeleton placeholder |
| `ProgressBar` | `components/common/ProgressBar.jsx` | Animated progress indicator |
| `Tabs` | `components/common/Tabs.jsx` | Tab navigation component |
| `SearchInput` | `components/common/SearchInput.jsx` | Styled search input |
| `DataTable` | `components/common/DataTable.jsx` | Sortable, filterable data table |
| `EmptyState` | `components/common/EmptyState.jsx` | Consistent empty state UI |
| `ReportPreviewModal` | `components/common/ReportPreviewModal.jsx` | Report preview before download |
| `CommandPalette` | `components/common/CommandPalette.jsx` | Global Ctrl+K command/search palette |
| `ShortcutsModal` | `components/common/ShortcutsModal.jsx` | Keyboard shortcuts reference modal |
| `OnboardingTour` | `components/common/OnboardingTour.jsx` | 5-step first-time user walkthrough |
| `NotificationCenter` | `components/common/NotificationCenter.jsx` | Toast notifications + notification dropdown |

#### Search Components

| Component | File | Purpose |
|-----------|------|---------|
| `SearchBox` | `components/search/SearchBox.jsx` | Drug name input with recent searches |
| `SearchProgress` | `components/search/SearchProgress.jsx` | 7 EY Worker Agent groups with live status |
| `AgentStatus` | `components/search/AgentStatus.jsx` | Individual agent status indicator |
| `DrugPreviewCard` | `components/search/DrugPreviewCard.jsx` | Drug type-ahead preview (appears at ≥3 chars) |

#### Results Components

| Component | File | Purpose |
|-----------|------|---------|
| `RegulatoryPathway` | `components/results/RegulatoryPathway.jsx` | FDA pathway recommendation cards with timeline/cost |
| `StrategicBrief` | `components/results/StrategicBrief.jsx` | Executive GO/INVESTIGATE/NO-GO recommendation |

#### Visualization Components

| Component | File | Purpose |
|-----------|------|---------|
| `SourceDistribution` | `components/visualizations/SourceDistribution.jsx` | Evidence source distribution chart |
| `RadarChart` | `components/visualizations/RadarChart.jsx` | Multi-dimensional radar/spider chart |
| `EvidenceGraph` | `components/visualizations/EvidenceGraph.jsx` | Interactive evidence network graph (SVG) |

#### Layout Components

| Component | File | Purpose |
|-----------|------|---------|
| `Sidebar` | `components/layout/Sidebar.jsx` | Main navigation sidebar |
| `Header` | `components/layout/Header.jsx` | Top bar with search, notifications, theme toggle |
| `MobileNav` | `components/layout/MobileNav.jsx` | Mobile bottom navigation |
| `Breadcrumbs` | `components/layout/Breadcrumbs.jsx` | Navigation breadcrumbs |

---

## 14. UX Features

### Command Palette (Ctrl+K)

**File:** `components/common/CommandPalette.jsx`

A global keyboard-driven command palette (similar to VS Code's Cmd+K) for fast navigation and search:

- **Navigation commands**: Jump to any page (Chat, Dashboard, Search, History, Saved, Settings, Integrations, Compare)
- **Action commands**: Analyze a Drug, New Conversation
- **Search**: Fuzzy-filters recent searches (last 5) and saved opportunities (last 5)
- **Keyboard navigation**: ↑↓ arrows to navigate, Enter to select, Esc to close
- **Grouped results**: Commands organized by type (Actions, Pages, Recent Searches, Saved Items)

### Keyboard Shortcuts

**Files:** `layouts/MainLayout.jsx`, `components/common/ShortcutsModal.jsx`

Global shortcuts available throughout the application:

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open Command Palette |
| `Ctrl+/` | Focus chat input |
| `Ctrl+Shift+N` | New drug search |
| `Ctrl+Shift+D` | Go to Dashboard |
| `Ctrl+Shift+H` | Go to History |
| `?` | Open keyboard shortcuts help (when not in text input) |
| `Esc` | Close any open modal |

### Onboarding Tour

**File:** `components/common/OnboardingTour.jsx`

A 5-step interactive walkthrough shown on first visit:

| Step | Title | Description |
|------|-------|-------------|
| 1 | Welcome | Introduction to Repurpose.AI |
| 2 | AI Assistant | How to use the chat interface |
| 3 | Drug Search Pipeline | How the 18-agent search works |
| 4 | Command Palette | Ctrl+K for quick navigation |
| 5 | Export & Reports | PDF/Excel export capabilities |

- Appears 1 second after first app load
- Can be skipped or stepped through with progress dots
- Completion persisted to `localStorage['repurpose-ai-tour-seen']`

### Notification & Toast System

**File:** `components/common/NotificationCenter.jsx`

Two-part notification system:

1. **Toast Notifications** (bottom-right corner):
   - Auto-dismissing (default 5 seconds)
   - Maximum 3 visible at once
   - Types: `info`, `success`, `warning`, `error`

2. **Notification Center** (bell icon dropdown in header):
   - Persistent notification history (max 50)
   - Unread count badge
   - Mark all as read functionality

**Global API:**
```javascript
import { notify } from '../components/common/NotificationCenter';

notify({
  title: 'Export Complete',
  message: 'Your PDF report is ready for download',
  type: 'success',
  duration: 5000
});
```

### Drug Preview Card

**File:** `components/search/DrugPreviewCard.jsx`

Appears below the search box when the user types ≥ 3 characters:

- Shows whether the drug was previously searched (from `searchHistory`)
- Displays count of saved opportunities for that drug
- Shows basic drug class information from OpenFDA
- Animated appearance/disappearance

### Evidence Graph Visualization

**File:** `components/visualizations/EvidenceGraph.jsx`

Interactive SVG network graph (700×500) visualizing drug-indication-evidence relationships:

```
                    ┌─── Evidence Items (outer ring) ───┐
                    │                                    │
              ┌─────┼─── Indication Nodes (top 8) ──────┼─────┐
              │     │                                    │     │
              │     └────────── Drug Node ───────────────┘     │
              │              (center)                          │
              └────────────────────────────────────────────────┘
```

- **Central node**: Drug name
- **Middle ring**: Top 8 indications arranged in circle
- **Outer ring**: Evidence items linked to indications
- **Color coding by source**: clinical_trial (blue), patent (yellow), literature (purple), web (green), IQVIA (pink), EXIM (orange), internal (gray)
- **Node size**: Proportional to relevance score
- **Interactivity**: Click to highlight connections, hover for details

### Dark/Light Theme Toggle

- Toggle available in the header
- Theme stored in Zustand state (persisted to localStorage)
- Applied via CSS class `light-theme` on document root
- Default: dark theme matching the platform's brand colors

---

## 15-21. Additional Sections

### Feature List

#### Core Platform Features
- **18-Agent Unified Pipeline** — 15 core agents + 3 EY wrappers, one brain for Search and Chat
- **7 EY Worker Agent Groups** — IQVIA, EXIM, Patent, Clinical Trials, Internal, Web Intelligence, Report Generator
- **4D Composite Scoring + Refinement** — Scientific (40%), Market (25%), Competitive (20%), Feasibility (15%) with +/-20 refinement
- **Conversational AI** — Chat-first interface with Master Agent orchestrating all agents
- **Decision Rules Engine** — Whitespace detection, biosimilar opportunity, formulation gap, geographic arbitrage, unmet need alerts
- **Smart Indication Matching** — 60+ medical abbreviations, fuzzy matching, 50+ therapeutic areas

#### Analysis & Intelligence
- **Drug Comparison** — Compare 2-3 drugs side-by-side with overlapping/unique indications and AI summary
- **Regulatory Pathway Advisor** — FDA pathway recommendations (505(b)(2), Fast Track, Orphan Drug, Breakthrough)
- **Strategic Brief** — Executive GO / INVESTIGATE / NO-GO recommendation with timeline and cost estimates
- **Drug Quick Lookup** — Fast metadata retrieval via OpenFDA (no full pipeline needed)
- **Market Analysis API** — Dedicated market intelligence with competitor tracking and geographic hotspots
- **Evidence Graph** — Interactive SVG network visualization of drug-indication-evidence relationships

#### Export & Archival
- **PDF Reports** — Dark-themed, multi-page professional reports via Playwright
- **Single-Opportunity PDF** — Mini 3-4 page report for individual drug-indication pairs
- **Excel Export** — 4-sheet workbook (Summary, Opportunities, Evidence, Market)
- **Report Archival** — Auto-archived with metadata, searchable via History page
- **JSON Export** — Raw data export for further analysis

#### User Experience
- **Command Palette (Ctrl+K)** — Global search and navigation palette
- **Keyboard Shortcuts** — 7 global shortcuts for fast navigation
- **Onboarding Tour** — 5-step interactive walkthrough for new users
- **Notification/Toast System** — Real-time notifications with persistent history
- **Drug Preview Card** — Type-ahead preview showing drug info while typing
- **Dark/Light Theme Toggle** — Switchable theme with localStorage persistence
- **Real-Time Progress** — WebSocket-based live agent activity during searches

#### Data & Persistence
- **Conversation Persistence** — Chat sessions auto-saved and loadable
- **10 Synthetic Welcome Queries** — Pre-built strategic pharma questions
- **6 Internal Documents** — Pre-loaded RAG knowledge base (cardiovascular, biosimilar, API sourcing, oncology, respiratory, CNS)
- **File Upload** — PDF upload for custom internal knowledge via ChromaDB
- **Authentication System** — JWT-based login/registration

### Caching Strategy
- JSON file-based caching with 7-day TTL (configurable)
- Per-drug cache entries in `data/cache/`
- Drug info cache (24hr TTL) in `data/cache/drug_info/`
- Force refresh option available
- Individual drug cache clearing via API

### Failure Handling
- Per-agent error isolation (one agent failing doesn't break others)
- Graceful degradation (partial results returned)
- Automatic LLM fallback (Gemini → Ollama)
- Retry logic with exponential backoff
- Frontend retry configuration (3 retries, 1s delay, retryable status codes)

### Security
- CORS configuration
- JWT authentication with password hashing
- API key management for integrations
- No PII stored in cache
- Secure file upload with type validation

### Configuration
- Environment variables via `.env`
- API URL configuration
- Rate limit settings per agent
- Cache TTL customization
- WebSocket timeout (10 minutes for long-running searches)

### Deployment
```bash
# Backend
cd backend
pip install -r requirements.txt
playwright install chromium
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm install
npm run build
# Serve dist/ with nginx or similar
```

---

## 22. EY Techathon Semi-Final Enhancements

This section covers the 7 major features added for the EY Techathon 6.0 Semi-Finals (February 8, 2026), transforming the platform from v3.0 to v3.1.

### 22.1 Unified Brain Architecture

**Problem:** The Drug Search pipeline (15 LangGraph agents) and Chat system (7 Master Agent workers) operated as two separate "brains" — the Search pipeline ran 15 real API agents but had no IQVIA/EXIM/WebIntel data, while Chat had access to those workers but couldn't feed their data into the scoring pipeline.

**Solution:** 3 pipeline wrapper agents that adapt Chat worker agents to the `BaseAgent` interface:

| Pipeline Wrapper | Wraps | Data Source | Evidence Type |
|-----------------|-------|-------------|---------------|
| `IQVIAPipelineAgent` | `MarketAnalyzer` | 14 therapeutic area scans | `market_data` — market size, CAGR, unmet need |
| `EXIMPipelineAgent` | `EXIMAgent` | Per-drug trade data | `trade_data` — import/export volumes, top countries |
| `WebIntelligencePipelineAgent` | `WebIntelligenceAgent` | Web search results | `clinical_guideline`, `literature`, `real_world_evidence`, `regulatory_news` |

**How it works:**
```
Before: Search → 15 agents → Score → Results  (no IQVIA/EXIM/WebIntel)
         Chat  → 7 workers → Response         (separate system)

After:  Search → 18 agents (15 + 3 wrappers) → Score → Results
         Chat  → 7 workers → Response (can also trigger same 18-agent pipeline)
```

**Frontend display:** SearchProgress shows 7 grouped Worker Agents (collapsible to see all 18 individual data sources). Uses `EY_AGENT_GROUPS` mapping in `constants.js` with `eyGroup` field on each agent.

**Key files:** `iqvia_pipeline_agent.py`, `exim_pipeline_agent.py`, `web_intelligence_pipeline_agent.py`, `nodes.py`, `websocket.py`

### 22.2 Report Archival System

**Purpose:** Automatically archive every generated report (PDF and Excel) with searchable metadata, enabling users to access historical reports.

**Architecture:**
```
Report Generated → ReportArchiveManager.archive() → Filesystem Storage
                                                    ├── data/reports/{id}.pdf
                                                    ├── data/reports/{id}.xlsx
                                                    └── data/reports/reports_metadata.json
```

**Features:**
- Filesystem-based storage with JSON metadata index
- Auto-archival triggered on every PDF/Excel export
- 5 REST API endpoints (`/api/reports`) for list, get, download, delete
- Frontend "Archived Reports" tab on History page with download and delete actions
- Metadata includes: report ID, drug name, format, file size, timestamp, indication count

**Key files:** `report_archive_manager.py`, `routes/reports.py`

### 22.3 Report Generator in Chat

**Purpose:** Users can generate full analysis reports directly from the chat interface by asking "Generate a report for Metformin."

**Flow:**
```
User: "Generate a report for Metformin"
  → Master Agent intent classification → "report_generation"
  → _run_report_agent() triggers full 18-agent LangGraph pipeline
  → Results scored and synthesized
  → PDF generated via Playwright
  → Report auto-archived
  → Download URL returned in chat response
```

**Key file:** `master_agent.py` (`_run_report_agent` method)

### 22.4 Excel Export

**Purpose:** Multi-sheet Excel reports as an alternative to PDF, useful for data analysis and further processing.

**4-Sheet Structure:**

| Sheet | Content | Styling |
|-------|---------|---------|
| **Summary** | Drug overview, total opportunities, execution time, top indication | Yellow #FFE600 headers |
| **Opportunities** | All ranked indications with 4D scores, confidence levels | Color-coded confidence |
| **Evidence** | Complete evidence items with source, type, relevance score, URL | Grouped by source |
| **Market Data** | Market size, CAGR, patient populations, unmet need scores | Conditional formatting |

**Endpoint:** `POST /api/export/excel` — accepts same data as PDF export, returns `.xlsx` file
**Auto-archived** alongside PDF reports in `data/reports/`

**Key file:** `excel_generator.py`

### 22.5 Conversation Persistence

**Purpose:** Save all chat conversations to disk so users can resume previous discussions.

**Architecture:**
```
Chat Message → ConversationManager → data/conversations/{id}.json
                                     ├── conversation metadata
                                     └── messages[] with timestamps
```

**Features:**
- JSON file-based persistence (one file per conversation)
- 3 API endpoints: list conversations, get full conversation, delete
- Chat sidebar shows conversation history with timestamps
- Auto-saved on every message exchange (both user and AI messages)
- Conversation titles auto-generated from first user message

**Key files:** `conversation_manager.py`, `routes/chat.py`

### 22.6 10 Synthetic Welcome Queries

**Purpose:** Provide diverse, pharma-strategic starter questions on the chat welcome screen to demonstrate platform capabilities and guide new users.

**Coverage areas:**
1. Oncology repurposing opportunities
2. EXIM trade data analysis
3. Patent landscape assessment
4. Biosimilar market evaluation
5. Clinical trial pipeline analysis
6. Market comparison across indications
7. FDA guidance and regulatory pathways
8. Unmet need identification
9. Competitive landscape mapping
10. Drug interaction and safety profiling

**Rendered via:** `SuggestedQueries` component in `Chat.jsx` (`WELCOME_SUGGESTIONS` array)

### 22.7 Internal Knowledge Base (6 Documents)

**Purpose:** Pre-loaded pharmaceutical reference documents that the Internal Agent can search via RAG (Retrieval-Augmented Generation).

**Documents:**

| Document | Focus Area | Chunks |
|----------|-----------|--------|
| Cardiovascular Field Insights | CV drug landscape, market trends | ~7 chunks |
| Biosimilar Assessment Report | Biosimilar market, regulatory pathways | ~7 chunks |
| API Sourcing Report | Active pharmaceutical ingredient supply chain | ~7 chunks |
| Oncology Pipeline Analysis | Cancer drug development trends | ~7 chunks |
| Respiratory Therapeutics Overview | Asthma, COPD treatment landscape | ~7 chunks |
| CNS Drug Development Report | Neurology/psychiatry drug pipeline | ~6 chunks |

**Total:** 6 documents → 41 chunks indexed in ChromaDB at startup
**Users can also upload** their own PDFs via the chat file upload feature, which adds to the same vector store.

**Key files:** `data/internal_docs/*.txt`, `internal_agent.py`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Jan 2026 | Initial release with 5 agents |
| 2.0.0 | Feb 2026 | 15 agents, 4D composite scoring, free market data, 50+ indications, 60+ abbreviations |
| 2.1.0 | Feb 2026 | Added detailed scoring formula documentation for all 4 dimensions |
| 2.2.0 | Feb 2026 | Enhanced scoring with refinement layer (+/-20 per dimension) |
| 3.0.0 | Feb 2026 | **EY Techathon 6.0 - Conversational AI transformation**: Master Agent orchestrator, chat-first UI, 7 EY worker agent groups, USPTO PatentsView integration, EXIM Trade Agent, Web Intelligence Agent, Decision Rules Engine, file upload + RAG, dark-theme PDF reports, response formatter with tables/charts/suggestions |
| 3.1.0 | Feb 8, 2026 | **EY Semi-Final Enhancements**: Unified brain architecture (18 agents), 3 EY pipeline wrappers, report archival system (5 endpoints), report generator in chat, Excel export (4-sheet), conversation persistence, 10 synthetic welcome queries, 6 pre-loaded internal documents (41 ChromaDB chunks) |
| 3.2.0 | Feb 11, 2026 | **Platform Polish & New Features**: Drug comparison feature (2-3 drugs side-by-side with backend API), regulatory pathway advisor (FDA recommendations), strategic brief (GO/INVESTIGATE/NO-GO), command palette (Ctrl+K), keyboard shortcuts (7 global), onboarding tour (5-step), notification/toast system, evidence graph visualization, drug preview card, authentication system (JWT), dark/light theme toggle, drug info API (OpenFDA), market analysis API |

---

**Documentation last updated: February 11, 2026**
**Platform version: 3.2.0**
**Built for: EY Techathon 6.0 Semi-Finals**
