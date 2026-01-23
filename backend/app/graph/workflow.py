"""
LangGraph Workflow - Assembles all nodes into a complete workflow.
This is the main orchestrator for the multi-agent drug repurposing system.
"""

from langgraph.graph import StateGraph, END
from app.graph.state import AgentState
from app.graph.nodes import (
    initialize_search,
    run_agents_parallel,
    aggregate_evidence,
    score_evidence,
    synthesize_results,
    finalize_results
)
from app.utils.logger import get_logger

logger = get_logger("graph.workflow")


def create_repurposing_workflow():
    """
    Create the LangGraph workflow for drug repurposing.

    The workflow follows this sequence:
    1. initialize_search - Set up initial state
    2. run_agents_parallel - Execute all 5 agents concurrently
    3. aggregate_evidence - Combine evidence from all agents
    4. score_evidence - Rank repurposing opportunities
    5. synthesize_results - Generate AI summary with LLM
    6. finalize_results - Add metadata and complete

    Returns:
        Compiled LangGraph workflow
    """
    logger.info("Creating drug repurposing workflow...")

    # Create state graph
    workflow = StateGraph(AgentState)

    # Add nodes to the graph
    workflow.add_node("initialize", initialize_search)
    workflow.add_node("run_agents", run_agents_parallel)
    workflow.add_node("aggregate", aggregate_evidence)
    workflow.add_node("score", score_evidence)
    workflow.add_node("synthesize", synthesize_results)
    workflow.add_node("finalize", finalize_results)

    # Define edges (execution flow)
    workflow.set_entry_point("initialize")
    workflow.add_edge("initialize", "run_agents")
    workflow.add_edge("run_agents", "aggregate")
    workflow.add_edge("aggregate", "score")
    workflow.add_edge("score", "synthesize")
    workflow.add_edge("synthesize", "finalize")
    workflow.add_edge("finalize", END)

    # Compile the workflow
    compiled_workflow = workflow.compile()

    logger.info("Workflow created successfully")
    logger.info("Workflow steps: initialize → run_agents → aggregate → score → synthesize → finalize")

    return compiled_workflow


# Create a singleton instance of the workflow
_workflow_instance = None


def get_workflow():
    """
    Get the compiled workflow instance (singleton pattern).

    Returns:
        Compiled LangGraph workflow
    """
    global _workflow_instance

    if _workflow_instance is None:
        _workflow_instance = create_repurposing_workflow()

    return _workflow_instance
