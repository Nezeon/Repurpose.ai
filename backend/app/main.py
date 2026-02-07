"""
FastAPI Application - Drug Repurposing Platform
Main entry point for the backend API server.
"""

from fastapi import FastAPI, Request, status, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from datetime import datetime
import traceback

from app.config import settings
from app.utils.logger import get_logger
from app.models.schemas import HealthResponse

# Initialize logger
logger = get_logger("main")

# Create FastAPI application
app = FastAPI(
    title="Drug Repurposing Platform API",
    description="Multi-agent AI system for drug repurposing discovery",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    debug=settings.DEBUG
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception Handlers

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": exc.errors(),
            "message": "Invalid request data"
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors."""
    logger.error(f"Unexpected error: {str(exc)}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "message": str(exc) if settings.DEBUG else "An unexpected error occurred"
        }
    )


# Event Handlers

@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    logger.info("=" * 50)
    logger.info("Drug Repurposing Platform API Starting")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug Mode: {settings.DEBUG}")
    logger.info(f"Log Level: {settings.LOG_LEVEL}")
    logger.info("=" * 50)

    # Connect to MongoDB if enabled
    if settings.USE_MONGODB:
        try:
            from app.database import get_database
            db = await get_database()
            if db and db.is_connected:
                logger.info("Connected to MongoDB")
            else:
                logger.warning("MongoDB connection failed - some features will be unavailable")
        except Exception as e:
            logger.warning(f"MongoDB connection skipped: {e}")

    # Initialize knowledge base if not populated
    try:
        from app.vector_store import get_knowledge_base
        from app.vector_store.init_knowledge_base import populate_knowledge_base

        kb = get_knowledge_base()
        if not kb.is_populated():
            logger.info("Initializing knowledge base with pharmaceutical documents...")
            results = populate_knowledge_base(kb)
            total = sum(results.values())
            logger.info(f"Knowledge base initialized with {total} documents")
        else:
            stats = kb.get_stats()
            total = sum(s.get("document_count", 0) for s in stats.values() if isinstance(s, dict))
            logger.info(f"Knowledge base already populated with {total} documents")
    except Exception as e:
        logger.warning(f"Knowledge base initialization skipped: {e}")

    # Auto-load internal demo documents into ChromaDB
    try:
        import os
        from app.vector_store import get_knowledge_base
        kb = get_knowledge_base()

        docs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "internal_docs")
        if os.path.exists(docs_dir):
            doc_files = [f for f in os.listdir(docs_dir) if f.endswith('.txt')]
            if doc_files:
                docs = []
                metas = []
                ids = []
                for fname in doc_files:
                    fpath = os.path.join(docs_dir, fname)
                    with open(fpath, "r", encoding="utf-8") as f:
                        content = f.read()
                    # Chunk into ~500 word pieces
                    words = content.split()
                    for i in range(0, len(words), 450):
                        chunk = " ".join(words[i:i+500])
                        docs.append(chunk)
                        metas.append({"source": fname, "type": "internal_document"})
                        ids.append(f"internal_{fname}_{i}")

                if docs:
                    kb.add_documents("repurposing_cases", docs, metas, ids)
                    logger.info(f"Loaded {len(docs)} chunks from {len(doc_files)} internal documents")
    except Exception as e:
        logger.warning(f"Internal document loading skipped: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown."""
    # Close MongoDB connection
    if settings.USE_MONGODB:
        try:
            from app.database.mongodb import close_database
            await close_database()
            logger.info("MongoDB connection closed")
        except Exception as e:
            logger.warning(f"Error closing MongoDB: {e}")

    logger.info("Drug Repurposing Platform API Shutting Down")


# Routes

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {
        "message": "Drug Repurposing Platform API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint to verify service is running.
    Returns service status and timestamp.
    """
    return HealthResponse(
        status="ok",
        timestamp=datetime.now().isoformat(),
        version="1.0.0"
    )


# API Routes
from app.api.routes import search, chat, export, knowledge, auth, market, integrations, files
from app.api.websocket import websocket_endpoint

# Include routers
app.include_router(search.router, prefix="/api", tags=["Search"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(export.router, prefix="/api", tags=["Export"])
app.include_router(files.router, prefix="/api", tags=["Files"])
app.include_router(knowledge.router, prefix="/api/knowledge", tags=["Knowledge Base"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(market.router, prefix="/api", tags=["Market Analysis"])
app.include_router(integrations.router, prefix="/api", tags=["Integrations"])


# WebSocket endpoint for real-time agent progress updates
@app.websocket("/ws/{session_id}")
async def websocket_route(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time updates.

    Connect to ws://localhost:8000/ws/{session_id} to receive:
    - Agent progress updates
    - Workflow status changes
    - Error notifications
    - Completion signals
    """
    await websocket_endpoint(websocket, session_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level=settings.LOG_LEVEL.lower()
    )
