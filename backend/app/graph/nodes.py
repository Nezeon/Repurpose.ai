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
from app.llm.llm_factory import LLMFactory, get_synthesis_prompt
from app.utils.logger import get_logger

logger = get_logger("graph.nodes")


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
        "LiteratureAgent": "pending",
        "ClinicalTrialsAgent": "pending",
        "BioactivityAgent": "pending",
        "PatentAgent": "pending",
        "InternalAgent": "pending"
    }

    # Initialize result containers
    state["agent_results"] = {}
    state["errors"] = []
    state["all_evidence"] = []
    state["ranked_indications"] = []

    # Set timestamp
    state["timestamp"] = datetime.now().isoformat()

    logger.info("Search initialized successfully")
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

    # Instantiate all agents
    agents = {
        "LiteratureAgent": LiteratureAgent(),
        "ClinicalTrialsAgent": ClinicalTrialsAgent(),
        "BioactivityAgent": BioactivityAgent(),
        "PatentAgent": PatentAgent(),
        "InternalAgent": InternalAgent()
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

            # Run the agent
            result = await agent.run(
                drug_name=state["drug_name"],
                context=state.get("search_context", {})
            )

            # Update progress based on result
            state["progress"][name] = result.status
            logger.info(f"{name} {result.status} - found {len(result.evidence)} evidence items")

            return (name, result)

        except Exception as e:
            logger.error(f"{name} failed with exception: {e}", exc_info=True)
            state["progress"][name] = "error"
            state["errors"].append(f"{name}: {str(e)}")

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
    This node requires the evidence_scorer which we'll create in Phase 5.

    Args:
        state: Current workflow state

    Returns:
        Updated state with ranked indications
    """
    logger.info("Scoring and ranking evidence...")

    try:
        # Import scorer (will be created in Phase 5)
        from app.scoring.evidence_scorer import EvidenceScorer

        scorer = EvidenceScorer()
        ranked_indications = scorer.rank_indications(state["all_evidence"])

        state["ranked_indications"] = ranked_indications
        logger.info(f"Identified {len(ranked_indications)} repurposing opportunities")

        # Log top 3
        for i, indication in enumerate(ranked_indications[:3], 1):
            logger.info(
                f"  {i}. {indication.indication} "
                f"(confidence: {indication.confidence_score:.1f}, "
                f"evidence: {indication.evidence_count})"
            )

    except ImportError:
        # Fallback if scorer not yet implemented
        logger.warning("EvidenceScorer not available, skipping scoring")
        state["ranked_indications"] = []

    return state


async def synthesize_results(state: AgentState) -> AgentState:
    """
    Use LLM to synthesize findings into a coherent summary.

    Args:
        state: Current workflow state

    Returns:
        Updated state with synthesis
    """
    logger.info("Synthesizing results with LLM...")

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

        # Create synthesis prompt
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
    logger.info(f"Errors: {len(state['errors'])}")
    logger.info("=" * 60)

    return state
