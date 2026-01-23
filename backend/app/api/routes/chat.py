"""
Chat API Routes - Interactive Q&A about search results.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from app.models.schemas import ChatRequest, ChatResponse
from app.llm.llm_factory import LLMFactory
from app.utils.logger import get_logger

logger = get_logger("api.chat")
router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Answer questions about drug repurposing search results.

    Uses LLM to provide contextual answers based on the search results
    and evidence that was previously gathered.

    Args:
        request: Chat request with user question and search context

    Returns:
        ChatResponse with AI-generated answer

    Raises:
        HTTPException: On LLM errors or invalid requests
    """
    try:
        # Validate inputs
        if not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")

        logger.info(f"Chat request: {request.question[:100]}...")

        # Get LLM instance
        llm = LLMFactory.get_llm()

        if llm is None:
            raise HTTPException(
                status_code=503,
                detail="LLM service unavailable. Please check Gemini API key or Ollama installation."
            )

        # Build context-aware prompt
        prompt = _build_chat_prompt(
            question=request.question,
            drug_name=request.drug_name,
            indications=request.indications,
            evidence_summary=request.evidence_summary
        )

        # Generate response
        logger.debug("Generating chat response with LLM...")
        answer = await llm.generate(prompt)

        logger.info(f"Chat response generated ({len(answer)} chars)")

        return ChatResponse(
            question=request.question,
            answer=answer,
            drug_name=request.drug_name
        )

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Chat failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


def _build_chat_prompt(
    question: str,
    drug_name: str,
    indications: list = None,
    evidence_summary: str = None
) -> str:
    """
    Build a context-aware prompt for the chat LLM.

    Args:
        question: User's question
        drug_name: Drug being discussed
        indications: List of indication names
        evidence_summary: Summary of evidence

    Returns:
        Formatted prompt string
    """
    prompt_parts = [
        "You are a pharmaceutical research assistant helping users understand drug repurposing opportunities.",
        f"\n## Context\n",
        f"Drug: {drug_name}",
    ]

    if indications:
        prompt_parts.append(f"\nIdentified Repurposing Opportunities:")
        for i, indication in enumerate(indications[:5], 1):
            prompt_parts.append(f"{i}. {indication}")

    if evidence_summary:
        prompt_parts.append(f"\n## Evidence Summary\n{evidence_summary}")

    prompt_parts.append(f"\n## User Question\n{question}")

    prompt_parts.append(
        "\n## Instructions\n"
        "Provide a clear, accurate answer based on the context above. "
        "If the question asks about information not in the context, say so. "
        "Keep your answer concise (2-4 paragraphs) and scientific. "
        "Cite specific evidence when possible."
    )

    return "\n".join(prompt_parts)


@router.get("/chat/health")
async def chat_health() -> Dict[str, Any]:
    """
    Check if chat service (LLM) is available.

    Returns:
        Health status of LLM service
    """
    try:
        llm = LLMFactory.get_llm()

        if llm is None:
            return {
                "status": "unavailable",
                "message": "No LLM provider available"
            }

        # Try to get LLM info
        if hasattr(llm, 'model'):
            model_name = llm.model
        else:
            model_name = "unknown"

        return {
            "status": "available",
            "provider": llm.__class__.__name__,
            "model": model_name
        }

    except Exception as e:
        logger.error(f"Chat health check failed: {e}")
        return {
            "status": "error",
            "message": str(e)
        }
