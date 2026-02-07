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
            logger.info("[OK] Successfully initialized Gemini LLM")
            return client

        except Exception as e:
            logger.warning(f"[X] Gemini unavailable: {e}")
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
                logger.info("[OK] Successfully initialized Ollama LLM")
                return client
            else:
                logger.info("[X] Ollama server not reachable")
                return None

        except Exception as e:
            logger.warning(f"[X] Ollama unavailable: {e}")
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
        logger.warning(f"Failed to get RAG context: {e}", exc_info=True)
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


def get_enhanced_synthesis_prompt(
    drug_name: str,
    agent_results: dict,
    enhanced_opportunities: dict,
    include_rag: bool = True
) -> str:
    """
    Create enhanced synthesis prompt with comparative and market segment data.

    Args:
        drug_name: Drug name
        agent_results: Dictionary of agent results
        enhanced_opportunities: Dictionary of EnhancedOpportunityData by indication
        include_rag: Whether to include RAG context

    Returns:
        Formatted prompt string
    """
    # Get RAG context if enabled
    rag_context = ""
    if include_rag:
        indications = list(enhanced_opportunities.keys())[:10]
        rag_context = get_rag_context(drug_name, indications)
        if rag_context:
            rag_context = f"\n**Background Knowledge:**\n{rag_context}\n"

    # Build opportunity sections
    opportunity_sections = []

    for indication, data in list(enhanced_opportunities.items())[:5]:
        # Format comparator drugs
        comparators_text = "No established standard of care identified."
        if data.comparator_drugs:
            comparator_lines = []
            for comp in data.comparator_drugs[:3]:
                comparator_lines.append(
                    f"  - {comp.drug_name}: {comp.mechanism[:80]}... "
                    f"({comp.administration_route}, {comp.dosing_frequency})"
                )
            comparators_text = "\n".join(comparator_lines)

        # Format advantages
        advantages_text = "Further analysis needed to identify specific advantages."
        if data.comparative_advantages:
            advantage_lines = []
            for adv in data.comparative_advantages[:4]:
                advantage_lines.append(
                    f"  - **{adv.advantage_type or 'General'}** ({adv.impact or 'moderate'} impact): {(adv.description or 'N/A')[:120]}..."
                )
            advantages_text = "\n".join(advantage_lines)

        # Format side effect comparison
        side_effect_text = "Safety comparison data not available."
        if data.side_effect_comparison:
            sec = data.side_effect_comparison
            eliminated = [e.effect_name for e in sec.eliminated_effects[:3]]
            new_concerns = [e.effect_name for e in sec.new_concerns[:3]]

            side_effect_parts = []
            if eliminated:
                side_effect_parts.append(f"Potentially avoids: {', '.join(eliminated)}")
            if new_concerns:
                side_effect_parts.append(f"New considerations: {', '.join(new_concerns)}")
            side_effect_parts.append(f"Safety advantage score: {sec.safety_advantage_score or 0:.2f} (-1 to 1 scale)")

            side_effect_text = "\n  ".join(side_effect_parts)

        # Format market segment
        market_text = "Market segment analysis not available."
        if data.market_segment:
            seg = data.market_segment
            market_text = (
                f"**{seg.segment_name or 'Unknown Segment'}**\n"
                f"  - Segment Size: ${seg.segment_size_billions or 0}B (of ${seg.total_indication_size_billions or 0}B total market)\n"
                f"  - Patient Population: {seg.patient_subpopulation or 0:,} patients\n"
                f"  - Unmet Need: {(seg.unmet_need_level or 'unknown').upper()} - {seg.unmet_need_description or 'N/A'}\n"
                f"  - Target Patient: {seg.target_patient_profile or 'Not specified'}\n"
                f"  - Competitive Intensity: {seg.competitive_intensity or 'Unknown'}"
            )

        # Format scientific details
        science_text = "Mechanistic details under investigation."
        if data.scientific_details:
            sci = data.scientific_details
            moa = sci.mechanism_of_action or 'Under investigation'
            science_text = (
                f"Mechanism: {moa[:200]}...\n"
                f"  - Target: {sci.target_protein or 'Unknown'} ({sci.target_gene or 'N/A'})\n"
                f"  - Pathways: {', '.join(sci.pathways[:4]) if sci.pathways else 'N/A'}\n"
                f"  - Binding Affinity: {f'{sci.binding_affinity_nm} nM' if sci.binding_affinity_nm else 'Not determined'}"
            )
            if sci.key_publications:
                top_pubs = sci.key_publications[:2]
                pub_lines = [f"  - \"{(p.title or 'Untitled')[:60]}...\" ({p.year or 'N/A'})" for p in top_pubs]
                science_text += f"\n  Key Publications:\n" + "\n".join(pub_lines)

        # Get composite score
        score = data.composite_score.overall_score if data.composite_score else 0

        section = f"""
### {indication} (Score: {score:.1f}/100)

**Current Standard of Care:**
{comparators_text}

**Key Advantages Over Existing Treatments:**
{advantages_text}

**Safety Profile Comparison:**
{side_effect_text}

**Target Market Segment:**
{market_text}

**Scientific Mechanism:**
{science_text}

**Positioning:** {data.positioning_statement or 'N/A'}
"""
        opportunity_sections.append(section)

    # Build evidence summary from agents
    evidence_summary = _summarize_agent_results(agent_results.get("LiteratureAgent", {}))
    clinical_summary = _summarize_agent_results(agent_results.get("ClinicalTrialsAgent", {}))

    prompt = f"""You are a senior pharmaceutical strategist specializing in drug repurposing and business development.
Analyze the following comprehensive data for repurposing opportunities for **{drug_name}**.
{rag_context}

## TOP REPURPOSING OPPORTUNITIES
{chr(10).join(opportunity_sections)}

## SUPPORTING EVIDENCE SUMMARY

**Literature Evidence:**
{evidence_summary}

**Clinical Trials:**
{clinical_summary}

---

Based on this comprehensive data, provide a **strategic analysis** (5-6 paragraphs) that addresses:

1. **COMPARATIVE POSITIONING**: For each top opportunity, explain the SPECIFIC advantages {drug_name} offers over current standard-of-care treatments. Focus on concrete differences in dosing, administration route, side effect profile, patient eligibility (age groups, contraindications), and convenience.

2. **SAFETY ADVANTAGES**: Analyze which side effects from current treatments would be eliminated or reduced with {drug_name}. Quantify the improvements where possible and highlight any new safety considerations.

3. **TARGET MARKET SEGMENT**: For each opportunity, identify the SPECIFIC market segment being targeted (e.g., "second-line NSCLC" not just "lung cancer", or "treatment-resistant depression" not just "depression"). Explain the unmet need and target patient profile.

4. **SCIENTIFIC RATIONALE**: Explain the mechanistic basis for why {drug_name} would work in each indication. Include relevant pathway data, target information, and supporting publications.

5. **KEY DIFFERENTIATORS**: Summarize the most compelling specific advantages {drug_name} has over existing solutions (e.g., "oral vs injectable", "once-weekly vs daily", "broader age range 18-80 vs 18-65", "fewer contraindications").

6. **STRATEGIC RECOMMENDATION**: Prioritize the opportunities based on scientific evidence, market opportunity, competitive advantage, and development feasibility. Recommend specific next steps for the top 2-3 opportunities.

Write in a professional, strategic tone suitable for pharmaceutical executives and business development teams. Be specific and data-driven rather than generic."""

    return prompt
