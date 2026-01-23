# Drug Repurposing Platform - Backend

Multi-agent AI system for automated drug repurposing discovery using LangGraph, FastAPI, and Google Gemini.

## 🚀 Quick Start

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

## 📁 Project Structure

```
backend/
├── app/
│   ├── agents/          # 5 specialized AI agents
│   ├── api/             # API routes and WebSocket
│   ├── cache/           # Caching layer
│   ├── graph/           # LangGraph workflow
│   ├── llm/             # LLM integrations
│   ├── models/          # Pydantic schemas
│   ├── scoring/         # Evidence scoring algorithms
│   ├── utils/           # Utilities and helpers
│   ├── config.py        # Configuration
│   └── main.py          # FastAPI application
├── data/
│   ├── cache/           # JSON cache for API responses
│   └── vector_db/       # ChromaDB vector store
├── scripts/
│   └── populate_cache.py  # Pre-populate demo data
└── tests/               # Unit and integration tests
```

## 🔧 Development

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

### Environment Variables

Key environment variables (see `.env.example` for full list):

- `GEMINI_API_KEY` - Google Gemini API key (required)
- `LENS_API_KEY` - Lens.org API key (optional, for patents)
- `OLLAMA_BASE_URL` - Ollama server URL (default: http://localhost:11434)
- `ENVIRONMENT` - development or production
- `LOG_LEVEL` - INFO, DEBUG, WARNING, ERROR
- `CACHE_TTL` - Cache time-to-live in seconds (default: 604800 = 7 days)

## 🤖 Multi-Agent System

The platform uses 5 specialized agents orchestrated by LangGraph:

1. **Literature Agent** - Searches PubMed for scientific publications
2. **Clinical Trials Agent** - Queries ClinicalTrials.gov for trial data
3. **Bioactivity Agent** - Fetches molecular data from ChEMBL
4. **Patent Agent** - Searches Lens.org for patent information
5. **Internal Agent** - Accesses mock proprietary data

## 📊 API Endpoints

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

## 🎯 Demo Preparation

Before your hackathon demo, pre-populate the cache with demo drugs:

```bash
python scripts/populate_cache.py
```

This ensures your demo works even if external APIs are slow or down.

## 🐛 Troubleshooting

### Import Errors

If you get import errors, ensure you're running from the backend directory:

```bash
cd backend
python -m uvicorn app.main:app --reload
```

### API Rate Limits

If you hit API rate limits:
- PubMed: Reduce `PUBMED_RATE_LIMIT` in .env
- Use cached data by setting `force_refresh: false` in requests
- Pre-populate cache for demo drugs

### Gemini API Errors

If Gemini API fails:
- Check your API key is valid
- Ensure you're within quota limits
- System will automatically fall back to Ollama if configured

## 📝 License

This project is part of a hackathon submission.

## 🤝 Contributing

This is a hackathon project - contributions welcome after the event!

## 📧 Contact

For questions or issues, please refer to the main project README.
