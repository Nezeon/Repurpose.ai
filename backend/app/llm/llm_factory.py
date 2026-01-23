"""
LLM Factory - Provides LLM instance with automatic fallback logic.
Tries Gemini first, falls back to Ollama if unavailable.
"""

from typing import Optional, Union
from app.llm.gemini_client import GeminiClient
from app.llm.ollama_client import OllamaClient
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("llm.factory")


class LLMFactory:
    """Factory for creating LLM instances with fallback support."""

    _instance: Optional[Union[GeminiClient, OllamaClient]] = None
    _provider: Optional[str] = None

    @classmethod
    def get_llm(cls, force_provider: Optional[str] = None) -> Optional[Union[GeminiClient, OllamaClient]]:
        """
        Get LLM instance with automatic fallback.

        Tries providers in this order:
        1. Gemini (if API key is configured)
        2. Ollama (if server is available)
        3. None (if all providers unavailable)

        Args:
            force_provider: Force specific provider ("gemini" or "ollama")

        Returns:
            LLM client instance or None if no provider available
        """
        # Return cached instance if already initialized
        if cls._instance is not None and force_provider is None:
            return cls._instance

        # Try forced provider if specified
        if force_provider:
            if force_provider.lower() == "gemini":
                return cls._try_gemini()
            elif force_provider.lower() == "ollama":
                return cls._try_ollama()
            else:
                logger.warning(f"Unknown provider: {force_provider}")

        # Try Gemini first (cloud API)
        llm = cls._try_gemini()
        if llm:
            cls._instance = llm
            cls._provider = "gemini"
            return llm

        # Fall back to Ollama (local server)
        llm = cls._try_ollama()
        if llm:
            cls._instance = llm
            cls._provider = "ollama"
            return llm

        # No LLM available
        logger.warning("No LLM provider available. Synthesis will be skipped.")
        cls._instance = None
        cls._provider = None
        return None

    @classmethod
    def _try_gemini(cls) -> Optional[GeminiClient]:
        """
        Try to initialize Gemini client.

        Returns:
            GeminiClient or None if unavailable
        """
        try:
            # Check if API key is configured
            api_key = settings.GEMINI_API_KEY
            if not api_key or api_key == "your_gemini_api_key_here":
                logger.info("Gemini API key not configured, skipping Gemini")
                return None

            client = GeminiClient()
            logger.info("✓ Successfully initialized Gemini LLM")
            return client

        except Exception as e:
            logger.warning(f"✗ Gemini unavailable: {e}")
            return None

    @classmethod
    def _try_ollama(cls) -> Optional[OllamaClient]:
        """
        Try to initialize Ollama client.

        Returns:
            OllamaClient or None if unavailable
        """
        try:
            client = OllamaClient()

            # Check if server is reachable
            if client.check_availability():
                logger.info("✓ Successfully initialized Ollama LLM")
                return client
            else:
                logger.info("✗ Ollama server not reachable")
                return None

        except Exception as e:
            logger.warning(f"✗ Ollama unavailable: {e}")
            return None

    @classmethod
    def get_provider_name(cls) -> Optional[str]:
        """
        Get name of current LLM provider.

        Returns:
            Provider name ("gemini", "ollama", or None)
        """
        return cls._provider

    @classmethod
    def reset(cls):
        """Reset factory (for testing)."""
        cls._instance = None
        cls._provider = None


# Convenience functions

async def generate_text(prompt: str) -> Optional[str]:
    """
    Generate text using available LLM.

    Args:
        prompt: Input prompt

    Returns:
        Generated text or None if no LLM available
    """
    llm = LLMFactory.get_llm()

    if llm is None:
        logger.warning("No LLM available for text generation")
        return None

    try:
        return await llm.generate(prompt)
    except Exception as e:
        logger.error(f"Text generation failed: {e}")

        # Try fallback provider
        provider = LLMFactory.get_provider_name()
        if provider == "gemini":
            logger.info("Trying Ollama fallback...")
            llm = LLMFactory.get_llm(force_provider="ollama")
            if llm:
                return await llm.generate(prompt)

        return None


def get_rag_context(drug_name: str, indications: list) -> str:
    """
    Get RAG context from the knowledge base.

    Args:
        drug_name: Drug name
        indications: List of potential indications

    Returns:
        Context string from knowledge base
    """
    try:
        from app.vector_store import get_knowledge_base

        kb = get_knowledge_base()

        if not kb.is_populated():
            logger.info("Knowledge base not populated, skipping RAG context")
            return ""

        context = kb.get_context_for_synthesis(drug_name, indications)
        if context:
            logger.info(f"Retrieved RAG context: {len(context)} chars")
        return context

    except Exception as e:
        logger.warning(f"Failed to get RAG context: {e}")
        return ""


def get_synthesis_prompt(drug_name: str, agent_results: dict, include_rag: bool = True) -> str:
    """
    Create synthesis prompt for LLM.

    Args:
        drug_name: Drug name
        agent_results: Dictionary of agent results
        include_rag: Whether to include RAG context from knowledge base

    Returns:
        Formatted prompt string
    """
    # Extract summaries from each agent
    literature_summary = _summarize_agent_results(agent_results.get("LiteratureAgent", {}))
    clinical_summary = _summarize_agent_results(agent_results.get("ClinicalTrialsAgent", {}))
    bioactivity_summary = _summarize_agent_results(agent_results.get("BioactivityAgent", {}))
    patent_summary = _summarize_agent_results(agent_results.get("PatentAgent", {}))
    internal_summary = _summarize_agent_results(agent_results.get("InternalAgent", {}))

    # Get RAG context if enabled
    rag_context = ""
    if include_rag:
        # Extract indications from agent results
        indications = _extract_indications(agent_results)
        rag_context = get_rag_context(drug_name, indications)
        if rag_context:
            rag_context = f"\n**Background Knowledge (from knowledge base):**\n{rag_context}\n"

    prompt = f"""You are a pharmaceutical research analyst. Analyze the following evidence for drug repurposing opportunities for {drug_name}.
{rag_context}
**Literature Evidence:**
{literature_summary}

**Clinical Trials:**
{clinical_summary}

**Bioactivity Data:**
{bioactivity_summary}

**Patent Landscape:**
{patent_summary}

**Internal Research Data:**
{internal_summary}

Based on this evidence and background knowledge, provide a concise analysis (3-4 paragraphs) that:
1. Identifies the top 3 most promising repurposing opportunities with confidence assessment
2. Summarizes the key supporting evidence for each indication
3. Highlights any potential concerns, limitations, or gaps in the data
4. Suggests next steps for further investigation

Write in a professional, scientific tone suitable for pharmaceutical researchers."""

    return prompt


def _extract_indications(agent_results: dict) -> list:
    """
    Extract unique indications from agent results.

    Args:
        agent_results: Dictionary of agent results

    Returns:
        List of indication strings
    """
    indications = set()

    for agent_name, response in agent_results.items():
        if not response:
            continue

        # Handle both dict and Pydantic model
        evidence = response.get("evidence", []) if isinstance(response, dict) else getattr(response, "evidence", [])

        for item in evidence or []:
            indication = item.get("indication") if isinstance(item, dict) else getattr(item, "indication", None)
            if indication:
                indications.add(indication)

    return list(indications)[:10]  # Limit to top 10


def _summarize_agent_results(agent_response) -> str:
    """
    Summarize results from a single agent.

    Args:
        agent_response: Agent response (dict or Pydantic model)

    Returns:
        Summary string
    """
    if not agent_response:
        return "No data available"

    # Handle both dict and Pydantic model
    def get_attr(obj, key, default=None):
        if hasattr(obj, key):
            return getattr(obj, key)
        elif isinstance(obj, dict):
            return obj.get(key, default)
        return default

    status = get_attr(agent_response, "status")
    if status != "success":
        return "No data available"

    evidence = get_attr(agent_response, "evidence", [])

    if not evidence:
        return "No evidence found"

    # Summarize top evidence items
    summaries = []
    for item in evidence[:5]:  # Top 5 items
        indication = get_attr(item, "indication", "Unknown")
        summary = get_attr(item, "summary", "")
        summaries.append(f"- {indication}: {summary}")

    return "\n".join(summaries) if summaries else "No evidence found"
