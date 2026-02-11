"""
LangGraph Workflow Nodes - Implementation of each workflow step.
Each node processes the state and passes it to the next node.
"""

import asyncio
from datetime import datetime
from typing import Dict, Any
from app.graph.state import AgentState
from app.agents.literature_agent import LiteratureAgent
from app.agents.clinical_trials_agent import ClinicalTrialsAgent
from app.agents.bioactivity_agent import BioactivityAgent
from app.agents.patent_agent import PatentAgent
from app.agents.internal_agent import InternalAgent
# Tier 1 agents (Phase 2)
from app.agents.openfda_agent import OpenFDAAgent
from app.agents.opentargets_agent import OpenTargetsAgent
from app.agents.semantic_scholar_agent import SemanticScholarAgent
# Tier 2 agents (Phase 2)
from app.agents.dailymed_agent import DailyMedAgent
from app.agents.kegg_agent import KEGGAgent
from app.agents.uniprot_agent import UniProtAgent
from app.agents.orange_book_agent import OrangeBookAgent
# Tier 3 agents (Phase 2)
from app.agents.rxnorm_agent import RxNormAgent
from app.agents.who_agent import WHOAgent
from app.agents.drugbank_agent import DrugBankAgent
from app.agents.market_data_agent import MarketDataAgent
# EY Worker Agent wrappers (IQVIA + EXIM Trade + Web Intelligence)
from app.agents.iqvia_pipeline_agent import IQVIAPipelineAgent
from app.agents.exim_pipeline_agent import EXIMPipelineAgent
from app.agents.web_intelligence_pipeline_agent import WebIntelligencePipelineAgent
from app.llm.llm_factory import LLMFactory, get_synthesis_prompt, get_enhanced_synthesis_prompt
from app.scoring.evidence_scorer import EvidenceScorer
from app.scoring.composite_scorer import CompositeScorer
from app.scoring.comparative_analyzer import get_comparative_analyzer
from app.scoring.scientific_extractor import get_scientific_extractor
from app.market.market_analyzer import MarketAnalyzer
from app.market.competitor_tracker import CompetitorTracker
from app.market.segment_analyzer import get_segment_analyzer
from app.models.scoring_models import EnhancedOpportunityData
from app.api.websocket import manager as ws_manager
from app.utils.logger import get_logger

logger = get_logger("graph.nodes")


async def _send_ws_status(state, stage, status="running", message=None):
    """Helper to send workflow status via WebSocket, silently ignoring errors."""
    session_id = state.get("session_id", "")
    if session_id:
        try:
            await ws_manager.send_workflow_status(session_id, stage, status, message)
        except Exception:
            pass


async def initialize_search(state: AgentState) -> AgentState:
    """
    Initialize the search workflow.
    Sets up initial state and progress tracking.

    Args:
        state: Current workflow state

    Returns:
        Updated state with initialization complete
    """
    logger.info(f"Initializing search for drug: {state['drug_name']}")

    # Initialize progress tracking for all agents
    state["progress"] = {
        # Original agents
        "LiteratureAgent": "pending",
        "ClinicalTrialsAgent": "pending",
        "BioactivityAgent": "pending",
        "PatentAgent": "pending",
        "InternalAgent": "pending",
        # Tier 1 agents (Phase 2)
        "OpenFDAAgent": "pending",
        "OpenTargetsAgent": "pending",
        "SemanticScholarAgent": "pending",
        # Tier 2 agents (Phase 2)
        "DailyMedAgent": "pending",
        "KEGGAgent": "pending",
        "UniProtAgent": "pending",
        "OrangeBookAgent": "pending",
        # Tier 3 agents (Phase 2)
        "RxNormAgent": "pending",
        "WHOAgent": "pending",
        "DrugBankAgent": "pending",
        # EY Worker Agent wrappers
        "IQVIAPipelineAgent": "pending",
        "EXIMPipelineAgent": "pending",
        "WebIntelligencePipelineAgent": "pending",
    }

    # Initialize result containers
    state["agent_results"] = {}
    state["errors"] = []
    state["all_evidence"] = []
    state["ranked_indications"] = []
    state["enhanced_indications"] = []  # Composite scoring results

    # Set timestamp
    state["timestamp"] = datetime.now().isoformat()

    logger.info("Search initialized successfully")

    await _send_ws_status(state, "initializing", "running", "Initializing analysis...")

    return state


async def run_agents_parallel(state: AgentState) -> AgentState:
    """
    Execute all agents in parallel for maximum speed.
    Uses asyncio.gather to run agents concurrently.

    Args:
        state: Current workflow state

    Returns:
        Updated state with agent results
    """
    logger.info("Running all agents in parallel...")

    session_id = state.get("session_id", "")
    await _send_ws_status(state, "agents_running", "running", "Master Agent dispatching worker agents...")

    # Instantiate all agents
    agents = {
        # Original agents
        "LiteratureAgent": LiteratureAgent(),
        "ClinicalTrialsAgent": ClinicalTrialsAgent(),
        "BioactivityAgent": BioactivityAgent(),
        "PatentAgent": PatentAgent(),
        "InternalAgent": InternalAgent(),
        # Tier 1 agents (Phase 2)
        "OpenFDAAgent": OpenFDAAgent(),
        "OpenTargetsAgent": OpenTargetsAgent(),
        "SemanticScholarAgent": SemanticScholarAgent(),
        # Tier 2 agents (Phase 2)
        "DailyMedAgent": DailyMedAgent(),
        "KEGGAgent": KEGGAgent(),
        "UniProtAgent": UniProtAgent(),
        "OrangeBookAgent": OrangeBookAgent(),
        # Tier 3 agents (Phase 2)
        "RxNormAgent": RxNormAgent(),
        "WHOAgent": WHOAgent(),
        "DrugBankAgent": DrugBankAgent(),
        # EY Worker Agent wrappers
        "IQVIAPipelineAgent": IQVIAPipelineAgent(),
        "EXIMPipelineAgent": EXIMPipelineAgent(),
        "WebIntelligencePipelineAgent": WebIntelligencePipelineAgent(),
    }

    async def run_single_agent(name: str, agent):
        """
        Run a single agent and update progress.

        Args:
            name: Agent name
            agent: Agent instance

        Returns:
            Tuple of (agent_name, result)
        """
        try:
            # Update progress to running
            state["progress"][name] = "running"
            logger.info(f"{name} started")

            # Send running status via WebSocket
            if session_id:
                try:
                    await ws_manager.send_agent_progress(
                        session_id, name, "running", f"Searching {agent.name}..."
                    )
                except Exception:
                    pass

            # Run the agent
            result = await agent.run(
                drug_name=state["drug_name"],
                context=state.get("search_context", {})
            )

            # Update progress based on result
            state["progress"][name] = result.status
            evidence_count = len(result.evidence)
            logger.info(f"{name} {result.status} - found {evidence_count} evidence items")

            # Send completion status via WebSocket
            if session_id:
                try:
                    await ws_manager.send_agent_progress(
                        session_id, name, result.status,
                        f"Found {evidence_count} evidence items",
                        evidence_count
                    )
                except Exception:
                    pass

            return (name, result)

        except Exception as e:
            logger.error(f"{name} failed with exception: {e}", exc_info=True)
            state["progress"][name] = "error"
            state["errors"].append(f"{name}: {str(e)}")

            # Send error status via WebSocket
            if session_id:
                try:
                    await ws_manager.send_agent_progress(
                        session_id, name, "error", str(e)
                    )
                except Exception:
                    pass

            # Return error response
            from app.models.schemas import AgentResponse
            return (name, AgentResponse(
                agent_name=name,
                status="error",
                evidence=[],
                error=str(e)
            ))

    # Run all agents concurrently
    tasks = [run_single_agent(name, agent) for name, agent in agents.items()]
    results = await asyncio.gather(*tasks, return_exceptions=False)

    # Collect results into state
    for agent_name, agent_result in results:
        state["agent_results"][agent_name] = agent_result

    # Log summary
    total_evidence = sum(len(r.evidence) for r in state["agent_results"].values())
    logger.info(f"All agents complete. Total evidence items: {total_evidence}")

    await _send_ws_status(state, "agents_complete", "running", f"All agents complete. {total_evidence} evidence items collected.")

    return state


async def aggregate_evidence(state: AgentState) -> AgentState:
    """
    Aggregate evidence from all agents into a single list.

    Args:
        state: Current workflow state

    Returns:
        Updated state with aggregated evidence
    """
    logger.info("Aggregating evidence from all agents...")
    await _send_ws_status(state, "aggregating", "running", "Aggregating evidence from all sources...")

    all_evidence = []

    for agent_name, agent_response in state["agent_results"].items():
        if agent_response.status == "success":
            evidence_items = agent_response.evidence
            all_evidence.extend(evidence_items)
            logger.debug(f"Added {len(evidence_items)} items from {agent_name}")

    state["all_evidence"] = all_evidence
    logger.info(f"Aggregated {len(all_evidence)} total evidence items")

    return state


async def score_evidence(state: AgentState) -> AgentState:
    """
    Score and rank evidence to identify top repurposing opportunities.
    Uses both basic scoring (backward compatible) and composite scoring (enhanced).

    Args:
        state: Current workflow state

    Returns:
        Updated state with ranked indications and composite scores
    """
    logger.info("Scoring and ranking evidence...")
    await _send_ws_status(state, "scoring", "running", "Scoring opportunities across 4 dimensions...")

    try:
        # Basic scoring (backward compatible)
        basic_scorer = EvidenceScorer()
        ranked_indications = basic_scorer.rank_indications(state["all_evidence"])

        # Safety filter: remove any "Unknown Indication" that slipped through
        ranked_indications = [
            r for r in ranked_indications
            if r.indication and r.indication.lower() != "unknown indication"
        ]

        state["ranked_indications"] = ranked_indications
        logger.info(f"Basic scoring identified {len(ranked_indications)} opportunities")

        # Enhanced composite scoring with market and competitive data
        logger.info("Running enhanced composite scoring...")

        # Get indications sorted by evidence count (most evidence first)
        # This ensures we analyze competitive landscape for the ACTUAL top indications
        from collections import Counter
        indication_counts = Counter(
            e.indication for e in state["all_evidence"]
            if e.indication and e.indication.lower() != "unknown indication"
        )
        # Sort by count descending, then alphabetically for ties
        sorted_indications = sorted(
            indication_counts.keys(),
            key=lambda x: (-indication_counts[x], x.lower())
        )

        # Fetch market and competitor data for top indications (limit to top 15 for better coverage)
        market_data_map = {}
        competitor_data_map = {}

        if sorted_indications:
            market_analyzer = MarketAnalyzer()
            competitor_tracker = CompetitorTracker()
            free_market_agent = MarketDataAgent()  # Free fallback for market data

            # Log top indications being analyzed
            top_15 = sorted_indications[:15]
            logger.info(f"Analyzing market/competition for top {len(top_15)} indications by evidence count:")
            for i, ind in enumerate(top_15[:5], 1):
                logger.info(f"  {i}. {ind} ({indication_counts[ind]} evidence items)")

            # Analyze market for top indications (sorted by evidence count)
            for indication in top_15:
                try:
                    market_opportunity = await market_analyzer.analyze_market(
                        indication=indication,
                        drug_name=state["drug_name"]
                    )
                    if market_opportunity:
                        from app.models.scoring_models import MarketData
                        market_data_map[indication.lower()] = MarketData(
                            indication=indication,
                            market_size_usd_billions=market_opportunity.estimated_market_size_usd / 1_000_000_000,
                            cagr_percent=market_opportunity.cagr_percent,
                            unmet_need_score=market_opportunity.unmet_need_score
                        )
                except Exception as e:
                    logger.debug(f"Premium market analysis skipped for {indication}: {e}")

            # Fallback to free market data agent for indications without premium data
            indications_needing_free_data = [
                ind for ind in top_15
                if ind.lower() not in market_data_map
            ]

            if indications_needing_free_data:
                logger.info(f"Fetching free market data for {len(indications_needing_free_data)} indications...")
                try:
                    free_market_data = await free_market_agent.batch_fetch(indications_needing_free_data)
                    from app.models.scoring_models import MarketData

                    for indication, data in free_market_data.items():
                        if data and data.get("patient_population_millions"):
                            market_data_map[indication.lower()] = MarketData(
                                indication=indication,
                                market_size_usd_billions=data.get("estimated_market_size_billions"),
                                patient_population_millions=data.get("patient_population_millions"),
                                unmet_need_score=50  # Default moderate unmet need
                            )
                            logger.debug(f"Free market data added for {indication}")
                except Exception as e:
                    logger.warning(f"Free market data fetch failed: {e}")

            # Analyze competition for top indications (sorted by evidence count)
            for indication in top_15:
                try:
                    competitive_landscape = await competitor_tracker.get_competitive_landscape(
                        indication=indication,
                        drug_name=state["drug_name"]
                    )
                    if competitive_landscape:
                        from app.models.scoring_models import CompetitorData, CompetitorInfoDisplay
                        phase_dist = competitive_landscape.phase_distribution

                        # Convert competitor details to display format
                        competitor_list = []
                        for comp in competitive_landscape.competitor_details[:10]:
                            # Normalize phase name for frontend display
                            phase = comp.development_phase
                            if phase:
                                phase = phase.replace("PHASE", "Phase ").replace("_", " ").title()
                            competitor_list.append(CompetitorInfoDisplay(
                                company=comp.company_name,
                                drug=comp.drug_name,
                                phase=phase or "Unknown"
                            ))

                        competitor_data_map[indication.lower()] = CompetitorData(
                            indication=indication,
                            total_competitors=competitive_landscape.total_competitors,
                            phase3_trials_count=phase_dist.get("PHASE3", 0) + phase_dist.get("Phase 3", 0),
                            phase2_trials_count=phase_dist.get("PHASE2", 0) + phase_dist.get("Phase 2", 0),
                            phase1_trials_count=phase_dist.get("PHASE1", 0) + phase_dist.get("Phase 1", 0),
                            competitor_list=competitor_list
                        )
                except Exception as e:
                    logger.debug(f"Competition analysis skipped for {indication}: {e}")

        # Run composite scoring
        composite_scorer = CompositeScorer()
        enhanced_indications = composite_scorer.rank_indications(
            evidence_list=state["all_evidence"],
            market_data_map=market_data_map,
            competitor_data_map=competitor_data_map
        )

        # Safety filter: remove any "Unknown Indication" that slipped through
        enhanced_indications = [
            r for r in enhanced_indications
            if r.indication and r.indication.lower() != "unknown indication"
        ]

        state["enhanced_indications"] = enhanced_indications
        logger.info(f"Composite scoring identified {len(enhanced_indications)} opportunities")

        # Log top 3 with composite details
        for i, indication in enumerate(ranked_indications[:3], 1):
            logger.info(
                f"  {i}. {indication.indication} "
                f"(confidence: {indication.confidence_score:.1f}, "
                f"evidence: {indication.evidence_count})"
            )

        # Log composite scores for top 3
        if enhanced_indications:
            logger.info("Enhanced composite scores:")
            for i, result in enumerate(enhanced_indications[:3], 1):
                cs = result.composite_score
                logger.info(
                    f"  {i}. {result.indication}: {cs.overall_score:.1f} "
                    f"[Sci:{cs.scientific_evidence.score:.0f} "
                    f"Mkt:{cs.market_opportunity.score:.0f} "
                    f"Comp:{cs.competitive_landscape.score:.0f} "
                    f"Feas:{cs.development_feasibility.score:.0f}]"
                )

    except Exception as e:
        logger.error(f"Scoring failed: {e}", exc_info=True)
        state["ranked_indications"] = []
        state["enhanced_indications"] = []
        state["errors"].append(f"Scoring failed: {str(e)}")

    return state


async def analyze_comparatives(state: AgentState) -> AgentState:
    """
    Analyze comparative advantages over existing treatments.
    Enriches top opportunities with comparator drugs, advantages, side effects,
    market segments, and detailed scientific data.

    Args:
        state: Current workflow state

    Returns:
        Updated state with enhanced opportunity data
    """
    logger.info("Analyzing comparative advantages over existing treatments...")
    await _send_ws_status(state, "analyzing_comparatives", "running", "Comparing against standard of care treatments...")

    try:
        # Get analyzers
        comparative_analyzer = get_comparative_analyzer()
        segment_analyzer = get_segment_analyzer()
        scientific_extractor = get_scientific_extractor()

        enhanced_opportunities = {}

        # Process top 10 indications
        top_indications = state.get("enhanced_indications", [])[:10]

        for indication_result in top_indications:
            indication = indication_result.indication

            try:
                logger.debug(f"Analyzing comparative data for: {indication}")

                # 1. Get comparator drugs (standard of care)
                comparators = await comparative_analyzer.get_comparator_drugs(indication)

                # 2. Analyze advantages over comparators
                advantages = []
                if comparators:
                    advantages = await comparative_analyzer.analyze_advantages(
                        state["drug_name"],
                        indication,
                        comparators
                    )

                # 3. Compare side effect profiles
                side_effect_comparison = None
                if comparators:
                    side_effect_comparison = await comparative_analyzer.compare_side_effects(
                        state["drug_name"],
                        comparators[0],  # Compare with primary comparator
                        indication
                    )

                # 4. Identify target market segment
                market_segment = await segment_analyzer.identify_segment(
                    indication,
                    state.get("all_evidence", []),
                    comparative_analyzer.get_candidate_characteristics(state["drug_name"])
                )

                # 5. Extract detailed scientific data
                scientific_details = await scientific_extractor.extract_details(
                    state["drug_name"],
                    indication,
                    [e for e in state.get("all_evidence", [])
                     if getattr(e, "indication", "").lower() == indication.lower()]
                )

                # 6. Generate key benefits summary
                key_benefits = []
                for adv in advantages[:5]:
                    key_benefits.append(f"{adv.advantage_type}: {adv.description[:100]}...")

                if side_effect_comparison and side_effect_comparison.safety_advantage_score > 0:
                    eliminated_count = len(side_effect_comparison.eliminated_effects)
                    if eliminated_count > 0:
                        key_benefits.append(f"Potentially avoids {eliminated_count} side effect(s) associated with current treatments")

                # Build enhanced opportunity data
                enhanced_opportunities[indication] = EnhancedOpportunityData(
                    indication=indication,
                    composite_score=indication_result.composite_score,
                    comparator_drugs=comparators,
                    comparative_advantages=advantages,
                    side_effect_comparison=side_effect_comparison,
                    market_segment=market_segment,
                    scientific_details=scientific_details,
                    key_benefits_summary=key_benefits[:5],
                    positioning_statement=_generate_positioning_statement(
                        state["drug_name"],
                        indication,
                        advantages,
                        market_segment
                    ),
                )

                logger.debug(f"Enhanced data complete for {indication}: "
                            f"{len(comparators)} comparators, {len(advantages)} advantages")

            except Exception as e:
                logger.warning(f"Failed to analyze comparatives for {indication}: {e}")
                # Continue with other indications

        state["enhanced_opportunities"] = enhanced_opportunities
        logger.info(f"Comparative analysis complete for {len(enhanced_opportunities)} indications")

    except Exception as e:
        logger.error(f"Comparative analysis failed: {e}", exc_info=True)
        state["enhanced_opportunities"] = {}
        state["errors"].append(f"Comparative analysis failed: {str(e)}")

    return state


def _generate_positioning_statement(
    drug_name: str,
    indication: str,
    advantages: list,
    market_segment
) -> str:
    """Generate a strategic positioning statement for the opportunity."""
    if not advantages and not market_segment:
        return f"{drug_name} shows potential for repurposing in {indication}."

    parts = [f"{drug_name}"]

    if market_segment and market_segment.segment_name:
        parts.append(f"targets the {market_segment.segment_name} segment")
    else:
        parts.append(f"addresses {indication}")

    if advantages:
        top_advantage = advantages[0]
        parts.append(f"with key differentiation: {top_advantage.advantage_type.lower()}")

    if market_segment and market_segment.unmet_need_level in ["high", "very_high"]:
        parts.append("in a market with significant unmet need")

    return " ".join(parts) + "."


async def refine_scores(state: AgentState) -> AgentState:
    """
    Refine composite scores using enhanced comparative/scientific/market data.
    Applies bounded adjustments (+/-20 per dimension) based on deeper analysis.

    Args:
        state: Current workflow state (must have enhanced_opportunities and enhanced_indications)

    Returns:
        Updated state with refined scores
    """
    logger.info("Refining scores with enhanced analysis data...")
    await _send_ws_status(state, "refining_scores", "running", "Refining scores with comparative & scientific data...")

    enhanced_opportunities = state.get("enhanced_opportunities", {})
    enhanced_indications = state.get("enhanced_indications", [])

    if not enhanced_opportunities or not enhanced_indications:
        logger.info("No enhanced data available, skipping score refinement")
        state["refinement_applied"] = False
        return state

    try:
        from app.scoring.score_refiner import ScoreRefiner
        refiner = ScoreRefiner()

        refined_indications = refiner.refine_scores(
            enhanced_indications, enhanced_opportunities
        )

        state["enhanced_indications"] = refined_indications
        state["refinement_applied"] = True

        # Also update the composite_score reference inside enhanced_opportunities
        for result in refined_indications:
            if result.indication in enhanced_opportunities:
                enhanced_opportunities[result.indication].composite_score = result.composite_score
        state["enhanced_opportunities"] = enhanced_opportunities

        # Log top changes
        for i, result in enumerate(refined_indications[:3], 1):
            cs = result.composite_score
            base_sci = cs.scientific_evidence.factors.get("_base_score", cs.scientific_evidence.score)
            ref_total = cs.scientific_evidence.factors.get("_refinement_total", 0)
            logger.info(
                f"  {i}. {result.indication}: {cs.overall_score:.1f} "
                f"(sci refinement: {ref_total:+.1f})"
            )

        logger.info(f"Score refinement complete for {len(refined_indications)} indications")

    except Exception as e:
        logger.error(f"Score refinement failed: {e}", exc_info=True)
        state["refinement_applied"] = False

    return state


async def synthesize_results(state: AgentState) -> AgentState:
    """
    Use LLM to synthesize findings into a coherent summary.
    Uses enhanced prompt with comparative data when available.

    Args:
        state: Current workflow state

    Returns:
        Updated state with synthesis
    """
    logger.info("Synthesizing results with LLM...")
    await _send_ws_status(state, "synthesizing", "running", "Generating AI-powered analysis...")

    try:
        # Get LLM instance
        llm = LLMFactory.get_llm()

        if llm is None:
            logger.warning("No LLM available, skipping synthesis")
            state["synthesis"] = (
                "LLM synthesis unavailable. Please review the ranked indications "
                "and evidence details for repurposing opportunities."
            )
            return state

        # Use enhanced prompt if comparative data is available
        enhanced_opportunities = state.get("enhanced_opportunities", {})

        if enhanced_opportunities:
            logger.info("Using enhanced synthesis prompt with comparative data")
            prompt = get_enhanced_synthesis_prompt(
                drug_name=state["drug_name"],
                agent_results=state["agent_results"],
                enhanced_opportunities=enhanced_opportunities
            )
        else:
            logger.info("Using basic synthesis prompt (no comparative data)")
            prompt = get_synthesis_prompt(
                drug_name=state["drug_name"],
                agent_results=state["agent_results"]
            )

        # Generate synthesis
        synthesis = await llm.generate(prompt)
        state["synthesis"] = synthesis

        logger.info(f"Generated synthesis ({len(synthesis)} characters)")

    except Exception as e:
        logger.error(f"Synthesis failed: {e}", exc_info=True)
        state["synthesis"] = f"Synthesis error: {str(e)}"
        state["errors"].append(f"LLM synthesis failed: {str(e)}")

    return state


async def finalize_results(state: AgentState) -> AgentState:
    """
    Finalize the workflow by adding metadata and cleaning up.

    Args:
        state: Current workflow state

    Returns:
        Final state with complete results
    """
    logger.info("Finalizing results...")

    # Calculate execution time
    start_time = datetime.fromisoformat(state["timestamp"])
    end_time = datetime.now()
    execution_time = (end_time - start_time).total_seconds()

    state["execution_time"] = execution_time

    # Log final summary
    logger.info("=" * 60)
    logger.info(f"Search Complete: {state['drug_name']}")
    logger.info(f"Execution Time: {execution_time:.2f}s")
    logger.info(f"Total Evidence: {len(state['all_evidence'])} items")
    logger.info(f"Repurposing Opportunities: {len(state['ranked_indications'])}")
    logger.info(f"Enhanced Opportunities: {len(state.get('enhanced_indications', []))}")
    logger.info(f"Errors: {len(state['errors'])}")
    logger.info("=" * 60)

    # Send completion via WebSocket
    session_id = state.get("session_id", "")
    if session_id:
        try:
            await ws_manager.send_complete(session_id, {
                "drug_name": state["drug_name"],
                "execution_time": round(execution_time, 2),
                "total_evidence": len(state["all_evidence"]),
                "opportunities": len(state.get("enhanced_indications", []) or state.get("ranked_indications", [])),
            })
        except Exception:
            pass

    return state
